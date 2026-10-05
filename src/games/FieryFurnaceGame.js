// ============================================
// THE FIERY FURNACE - Deflect fireballs with the angel
// Daniel 3:25  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// ============================================

// Art plates live in assets/games/fiery-furnace/
//   bg.jpg        — furnace interior, pre-cropped to 16:9 at 2x stage (1334x750). Flames sit on
//                   the floor and the two side edges; the centre and a full-width middle band
//                   are kept clear because gameplay is drawn over them.
//   angel.png     — the player's cursor, keyed off magenta. Drawn in PROFILE FACING LEFT and
//                   mirrored on the right half of the stage (see ANGEL_FLIP_* below).
//   boys.png      — the three friends as one sprite: periwinkle, lavender, mauve. They never
//                   flinch and have no hurt state — they were never in danger, which is the
//                   whole point of the story. Do not add a damage reaction.
//   fireball.png  — head on the LEFT, tail streaming RIGHT, so the art's forward vector is 180°.
//                   Rotated to match velocity; never flipped (see spawnFireball).
//   burst.png     — the deflect pop.
const FF_ASSET_PATH = 'assets/games/fiery-furnace/';
const FF_ASSETS = {
  bg:       { key: 'ff-bg',       file: 'bg.jpg' },
  angel:    { key: 'ff-angel',    file: 'angel.png' },
  boys:     { key: 'ff-boys',     file: 'boys.png' },
  fireball: { key: 'ff-fireball', file: 'fireball.png' },
  burst:    { key: 'ff-burst',    file: 'burst.png' },
};

// ---- Layout — measured off bg.jpg and the sprite frames ----
const FF_BOYS_X = 333;          // the trio stands on the furnace floor, centred under the arch
const FF_BOYS_BOTTOM = 302;     // their feet; the floor flames read just behind them
const FF_BOYS_SCALE = 0.175;    // 881x873 frame -> 154x153 on stage
const FF_BOYS_HIT_R = 52;       // the cluster is ONE target, not three

const FF_ANGEL_SCALE = 0.125;   // 748x924 frame -> 94x116 on stage
const FF_ANGEL_GRAB_DY = -45;   // the angel rides ABOVE the finger so the thumb never covers the
                                // impact point. There is no cursor on touch, and at 375px of
                                // stage height a sprite under the finger hides the action.

// The angel faces the way it is MOVING. The strobe risk moves with it: a bare `moved < 0` test
// flips every frame while the angel is basically still, because sub-pixel drift alternates sign.
// So facing only changes when horizontal speed clears this threshold (px/sec, framerate-independent);
// below it the angel holds whatever way it was already facing.
const FF_FACE_MIN_SPEED = 40;

// The fireball's head sits left-of-centre in its frame. Anchoring there means rotation pivots
// on the head and the collision point is the head, not a spot out in the tail.
const FF_FIREBALL_SCALE = 0.07;   // 820x591 frame -> 57x41 on stage
const FF_FIREBALL_ORIGIN_X = 0.34;
const FF_FIREBALL_R = 18;         // collision radius, sized to the head not the whole frame
const FF_BURST_SCALE = 0.10;      // 728x730 frame -> 73x73 on stage

const FF_SPAWN_X_PAD = 46;      // fireballs start this far outside the stage
const FF_SPAWN_Y_MIN = 70;      // spawn band: clear of the HUD, clear of the floor flames
const FF_SPAWN_Y_MAX = 320;
const FF_AIM_SCATTER = 12;      // degrees of aim jitter, so lanes are never identical
const FF_DEFLECT_SPEED = 300;   // how fast a blocked fireball leaves

class FieryFurnaceGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.FIERY_FURNACE);
  }

  preload() {
    // Textures persist in the global TextureManager, so only fetch on first visit.
    Object.values(FF_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, FF_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;

    this.gameActive = false;
    this.timeRemaining = this.config.surviveTime;
    this.hitsTaken = 0;
    this.deflected = 0;
    this.fireballs = [];
    this.spawnAccum = 0;
    this.facingLeft = true;
    this.angelLocked = false;

    // ---- Scene, back to front ----
    this.add.image(0, 0, FF_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.boys = this.add.image(FF_BOYS_X, FF_BOYS_BOTTOM, FF_ASSETS.boys.key)
      .setOrigin(0.5, 1).setScale(FF_BOYS_SCALE).setDepth(5);
    this.boysY = FF_BOYS_BOTTOM - (this.boys.displayHeight * 0.55);

    // Start the angel clear of the trio. Spawning it at FF_BOYS_X buries the player's own
    // cursor inside the boys sprite on frame one, so nobody can see what they are controlling
    // until they move. Offset left, mid-height, in open floor.
    this.angel = this.add.image(FF_BOYS_X - 150, this.boysY - 10, FF_ASSETS.angel.key)
      .setOrigin(0.5).setScale(FF_ANGEL_SCALE).setDepth(20);
    this.angelTargetX = this.angel.x;
    this.angelTargetY = this.angel.y;

    // The angel IS the cursor — hide the OS one while this scene owns the canvas.
    this.prevCursor = this.input.manager.defaultCursor;
    this.input.setDefaultCursor('none');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.setDefaultCursor(this.prevCursor);
    });

    this.input.on('pointermove', this.handlePointer, this);
    this.input.on('pointerdown', this.handlePointer, this);

    this.createHUD();
    this.drawHUD();

    this.gameStartTime = this.time.now;
    this.time.delayedCall(600, () => { this.gameActive = true; });
  }

  // ================================================================
  //  Input — offset drag
  // ================================================================

  handlePointer(pointer) {
    if (!this.gameActive) return;
    this.angelTargetX = Phaser.Math.Clamp(pointer.x, 20, GAME_WIDTH - 20);
    this.angelTargetY = Phaser.Math.Clamp(pointer.y + FF_ANGEL_GRAB_DY, 40, GAME_HEIGHT - 20);
  }

  // ================================================================
  //  Fireballs
  // ================================================================

  liveCount() {
    // A deflected fireball is still on screen but can no longer hit, so it does not occupy a slot.
    return this.fireballs.filter(f => !f.dead && !f.spent).length;
  }

  spawnFireball() {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -FF_SPAWN_X_PAD : GAME_WIDTH + FF_SPAWN_X_PAD;
    const y = Phaser.Math.Between(FF_SPAWN_Y_MIN, FF_SPAWN_Y_MAX);

    // Aim at the cluster, with scatter so two fireballs never share a lane.
    const base = Phaser.Math.Angle.Between(x, y, FF_BOYS_X, this.boysY);
    const angle = base + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-FF_AIM_SCATTER, FF_AIM_SCATTER));

    const sprite = this.add.image(x, y, FF_ASSETS.fireball.key)
      .setOrigin(FF_FIREBALL_ORIGIN_X, 0.5)
      .setScale(FF_FIREBALL_SCALE)
      .setDepth(12)
      .setRotation(angle + Math.PI);   // the art points LEFT, so forward is 180° off

    this.fireballs.push({
      sprite,
      vx: Math.cos(angle) * this.config.fireballSpeed,
      vy: Math.sin(angle) * this.config.fireballSpeed,
      spent: false,
      dead: false,
    });
  }

  deflect(fb) {
    fb.spent = true;
    fb.dead = true;
    this.deflected++;

    // Push it away from the boys, along the angel-to-fireball line.
    const away = Phaser.Math.Angle.Between(this.angel.x, this.angel.y, fb.sprite.x, fb.sprite.y);

    const burst = this.add.image(fb.sprite.x, fb.sprite.y, FF_ASSETS.burst.key)
      .setOrigin(0.5).setDepth(25).setScale(FF_BURST_SCALE * 0.45);
    this.tweens.add({
      targets: burst, scale: FF_BURST_SCALE * 1.15, alpha: 0, duration: 300,
      ease: 'Quad.easeOut', onComplete: () => burst.destroy(),
    });

    // Let the deflected ball fly clear under its own tween, outside the live list.
    fb.sprite.setRotation(away + Math.PI);
    this.tweens.add({
      targets: fb.sprite,
      x: fb.sprite.x + Math.cos(away) * FF_DEFLECT_SPEED,
      y: fb.sprite.y + Math.sin(away) * FF_DEFLECT_SPEED,
      alpha: 0, duration: 520, ease: 'Quad.easeOut',
      onComplete: () => fb.sprite.destroy(),
    });
  }

  takeHit(fb) {
    fb.spent = true;
    fb.dead = true;

    const burst = this.add.image(fb.sprite.x, fb.sprite.y, FF_ASSETS.burst.key)
      .setOrigin(0.5).setDepth(25).setScale(FF_BURST_SCALE * 0.5).setTint(0xE07070);
    this.tweens.add({
      targets: burst, scale: FF_BURST_SCALE * 1.35, alpha: 0, duration: 340,
      ease: 'Quad.easeOut', onComplete: () => burst.destroy(),
    });
    fb.sprite.destroy();

    this.cameras.main.shake(180, 0.012);
    this.hitsTaken++;

    // The boys are never harmed — no flinch, no hurt state. Only the player pays.
    if (this.hitsTaken > this.config.allowedHits) {
      this.handleLoss();
    }
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    const dt = delta / 1000;

    // The angel keeps following the pointer during the win/lose beat, but nothing else runs.
    this.moveAngel(dt);
    if (!this.gameActive) return;

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.handleWin();
      return;
    }

    // Hold the field at maxActive. The accumulator is NOT reset when the cap is full, so a
    // freed slot refills on the next frame instead of waiting out another whole interval —
    // that is what makes maxActive the binding constraint rather than spawnInterval.
    this.spawnAccum += dt;
    if (this.spawnAccum >= this.config.spawnInterval && this.liveCount() < this.config.maxActive) {
      this.spawnFireball();
      this.spawnAccum = 0;
    }

    this.updateFireballs(dt);
    this.drawHUD();
  }

  moveAngel(dt) {
    // Once the round is decided the win tween owns the sprite; pointer-following here would
    // fight it for x/y every frame.
    if (this.angelLocked) return;

    // Lerp with a hard speed cap. If the angel snapped to the finger, interception would be
    // free and there would be no game — the cap is what makes crowding hurt.
    const beforeX = this.angel.x;
    const dx = this.angelTargetX - this.angel.x;
    const dy = this.angelTargetY - this.angel.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, this.config.angelSpeed * dt);
      this.angel.x += (dx / dist) * step;
      this.angel.y += (dy / dist) * step;
    }

    // Face the direction of travel. Measured from actual displacement rather than the pointer
    // delta, so the sprite matches what the angel is doing on screen, not what the finger wants.
    if (dt > 0) {
      const vx = (this.angel.x - beforeX) / dt;
      if (vx < -FF_FACE_MIN_SPEED) this.facingLeft = true;
      else if (vx > FF_FACE_MIN_SPEED) this.facingLeft = false;
    }
    this.angel.setFlipX(!this.facingLeft);
  }

  updateFireballs(dt) {
    for (const fb of this.fireballs) {
      if (fb.dead) continue;

      fb.sprite.x += fb.vx * dt;
      fb.sprite.y += fb.vy * dt;

      // Angel first — a block beats a hit on the same frame.
      if (Phaser.Math.Distance.Between(fb.sprite.x, fb.sprite.y, this.angel.x, this.angel.y)
          < this.config.angelRadius + FF_FIREBALL_R) {
        this.deflect(fb);
        continue;
      }
      if (Phaser.Math.Distance.Between(fb.sprite.x, fb.sprite.y, FF_BOYS_X, this.boysY)
          < FF_BOYS_HIT_R + FF_FIREBALL_R) {
        this.takeHit(fb);
        continue;
      }

      // Cull anything that sails past without connecting.
      if (fb.sprite.x < -120 || fb.sprite.x > GAME_WIDTH + 120 ||
          fb.sprite.y < -120 || fb.sprite.y > GAME_HEIGHT + 120) {
        fb.dead = true;
        fb.sprite.destroy();
      }
    }
    this.fireballs = this.fireballs.filter(f => !f.dead);
  }

  // ================================================================
  //  HUD
  // ================================================================

  // Built once per scene START, never lazily. Phaser reuses the Scene instance across restarts,
  // so `this.hudTimer` survives as a stale handle to a DESTROYED Text object — a lazy
  // `if (!this.hudTimer)` guard sees a truthy corpse, skips creation, and setText() throws on
  // the second play of the session. Creating from create() guarantees a live object every time.
  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 14, '', {
      ...FONTS.TIMER, fontSize: '26px', stroke: '#2A1620', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(40);

    this.hudShield = this.add.text(GAME_WIDTH - 14, 16, '', {
      ...FONTS.SMALL, color: '#F7E3A8', stroke: '#2A1620', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(40);
  }

  drawHUD() {
    const remaining = Math.max(0, this.config.allowedHits - this.hitsTaken);
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    this.hudShield.setText(
      this.config.allowedHits === 0 ? 'No hits allowed!' : `Hits left: ${remaining}`
    );
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  handleWin() {
    this.gameActive = false;
    const elapsed = this.elapsedSeconds();

    // Clear the field so the miracle reads cleanly.
    this.fireballs.forEach(fb => { if (!fb.dead) fb.sprite.destroy(); });
    this.fireballs = [];

    const fast = this.hitsTaken === 0;
    const perfect = this.hitsTaken === 0 && this.difficulty !== DIFFICULTY.EASY;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // The angel settles beside the boys — the fourth figure in the fire.
    this.tweens.add({
      targets: this.angel,
      x: FF_BOYS_X + 92, y: this.boysY - 14,
      duration: 700, ease: 'Quad.easeInOut',
    });
    // Hand the sprite to the tween and pin the final pose: it settles to the RIGHT of the boys,
    // so it should be looking left, at them.
    this.angelLocked = true;
    this.facingLeft = true;
    this.angel.setFlipX(false);

    const winText = this.add.text(GAME_WIDTH / 2, 62, 'Not one of them was harmed!', {
      ...FONTS.TITLE, color: '#FFD93D', fontSize: '22px',
      stroke: '#2A1620', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(40);
    this.tweens.add({ targets: winText, alpha: 1, delay: 250, duration: 400 });

    for (let i = 0; i < 14; i++) {
      this.time.delayedCall(i * 45, () => {
        const sparkle = this.add.text(
          FF_BOYS_X + Phaser.Math.Between(-90, 90),
          this.boysY + Phaser.Math.Between(-60, 50),
          '✨', { fontSize: '20px' }).setOrigin(0.5).setDepth(41);
        this.tweens.add({ targets: sparkle, y: sparkle.y - 40, alpha: 0, duration: 600, ease: 'Quad.easeOut' });
      });
    }

    this.time.delayedCall(1800, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.FIERY_FURNACE,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    this.gameActive = false;
    this.cameras.main.shake(280, 0.02);

    this.add.text(GAME_WIDTH / 2, 62, 'A fireball got through!', {
      ...FONTS.TITLE, color: '#E74C3C', fontSize: '22px',
      stroke: '#2A1620', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(40);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.FIERY_FURNACE,
        points: 0,
      });
    });
  }
}
