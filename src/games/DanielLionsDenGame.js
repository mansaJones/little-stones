// ============================================
// DANIEL IN THE LIONS' DEN - Drag Daniel around the pit, don't get caught
// Daniel 6  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §5
// ============================================

// Art plates live in assets/games/lions-den/
//   bg.jpg    — the den interior: curved brick wall above, a sand floor below. The floor is an
//               ELLIPSE, not a rectangle, and that ellipse is the arena (see LD_FLOOR). The plate
//               as delivered put the floor in the bottom 20% of the frame, which is a 75px band —
//               unplayable with four lions. It is cropped to its lower 55%, which keeps the wall
//               reading as a round pit while making the arena about three times as deep.
//   daniel.png— praying, facing the viewer. He never changes pose: he was never afraid, which is
//               the point of the story. Do not add a panic state.
//   lion.png  — drawn FACING LEFT (head left, tail right), so flipX is set when moving right.
//
// The angel on the win beat is borrowed from assets/games/fiery-furnace/angel.png. Daniel 6:22 is
// the same angel errand as Daniel 3:25 and it is the same artist and style lock, so rather than
// commission a second one this scene loads that file by its own path. It is optional: if it is
// missing the win beat just plays without it.
const LD_ASSET_PATH = 'assets/games/lions-den/';
const LD_ASSETS = {
  bg:     { key: 'ld-bg',     file: 'bg.jpg' },
  daniel: { key: 'ld-daniel', file: 'daniel.png' },
  lion:   { key: 'ld-lion',   file: 'lion.png' },
};
const LD_ANGEL = { key: 'ld-angel', path: 'assets/games/fiery-furnace/angel.png' };

// Attempted once per page load. Without this, every missing file is re-requested on every single
// round, because textures.exists() stays false after a 404.
let LD_ART_PROBED = false;

// ---- The arena ----
// MEASURED off the cropped bg.jpg: classify the plate into sand / not-sand (sand is the only
// warm-orange region; the wall is dusty rose and periwinkle), then fit an ellipse to it. A 6px
// inset lands entirely on sand at every angle. If the backdrop is replaced or re-cropped, re-run
// that measurement — these are a fit to one plate, not a design choice.
//
// Everything on the floor is positioned by its FEET and clamped so its feet stay inside this
// ellipse. Clamping a bounding box instead would let a lion stand on the wall in the corners.
const LD_FLOOR = { cx: 333, cy: 254, rx: 329, ry: 116 };
const LD_FLOOR_INSET = 8;

// Sprite size is a BALANCE dial here, not just taste: what decides this game is how many
// body-widths of gap there are to slip through, so shrinking the cast is the same lever as
// enlarging the pit. Measured with a near-optimal dodging bot, 12 rounds per tier:
//
//   arena ry 96, Daniel 72 / lion 70   easy  9/14   medium 4/14
//   arena ry 116, Daniel 72 / lion 70  easy  9/12   medium 3/12
//   arena ry 116, Daniel 58 / lion 56  easy 12/14   medium 5/14   <- shipped
//
// 58px of Daniel on a 375px stage is still a seventh of the screen height, and he is easier to
// keep track of against smaller lions than he was at 72 against big ones.
const LD_DANIEL_H = 58;        // display height; width follows the frame
const LD_LION_W = 56;          // display width; height follows the frame

// Collision is an ELLIPSE overlap, not a circle. In this view the floor is foreshortened, so a
// 30px vertical gap is much more room than a 30px horizontal one; circles would have the lions
// catching Daniel from "above" while the sprites are still clearly apart on screen. These radii
// are the sprite footprints, not the frames.
//
// Daniel's are deliberately a little smaller than he draws — a player-generous hitbox is the
// normal way round, and never the reverse.
const LD_DANIEL_RX = 9, LD_DANIEL_RY = 10;
const LD_LION_RX = 21,   LD_LION_RY = 12;

const LD_GRAB_DY = -34;        // Daniel rides above the finger; there is no cursor on touch and a
                               // thumb on a 375px-tall stage covers the thing you are dodging with
const LD_FOLLOW_K = 11;        // exponential follow rate, per second — framerate-independent.
                               // `x += (target-x) * 0.15` every frame, which this replaces, runs
                               // twice as fast on a 120Hz screen as on a 60Hz one.
const LD_ARRIVE = 14;          // how close a lion gets to its patrol target before picking another
const LD_CHARGE_TELL = 450;    // ms of wind-up before a charge. A charge with no tell is not a
                               // difficulty increase, it is an ambush.
const LD_CHARGE_TIME = 1200;   // ms a charge lasts
const LD_CHARGE_MULT = 2.0;    // speed multiplier while charging
const LD_DANGER_R = 72;        // distance at which the danger vignette starts to come up

class DanielLionsDenGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.DANIEL_LIONS_DEN);
  }

  preload() {
    if (LD_ART_PROBED) return;
    LD_ART_PROBED = true;

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[LionsDen] no art for "' + file.key + '" — using a generated placeholder.');
    });

    Object.values(LD_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, LD_ASSET_PATH + a.file);
    });
    if (!this.textures.exists(LD_ANGEL.key)) this.load.image(LD_ANGEL.key, LD_ANGEL.path);
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;      // STRING: 'easy' | 'medium' | 'hard'

    this.ensureTextures();

    // ---- Round state. All of it reset here. Phaser reuses the Scene instance across restarts, so
    // anything left on `this` from the last round survives into this one.
    this.gameActive = false;
    this.outcome = null;                    // null | 'win' | 'loss'
    this.timeRemaining = this.config.surviveTime;
    this.chargeAccum = 0;
    this.lions = [];

    this.add.image(0, 0, LD_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    // Red vignette for the danger cue. A frame rather than a full-screen wash: washing a pastel
    // kids' scene in red every time a lion wanders past is a lot of alarm for a story whose whole
    // point is that Daniel was never in danger.
    this.danger = this.add.graphics().setDepth(900).setAlpha(0);
    this.danger.fillStyle(0xC0392B, 1);
    const t = 26;
    this.danger.fillRect(0, 0, GAME_WIDTH, t);
    this.danger.fillRect(0, GAME_HEIGHT - t, GAME_WIDTH, t);
    this.danger.fillRect(0, 0, t, GAME_HEIGHT);
    this.danger.fillRect(GAME_WIDTH - t, 0, t, GAME_HEIGHT);

    this.createDaniel();
    this.createLions();
    this.createHUD();
    this.drawHUD();

    // Daniel IS the cursor while this scene owns the canvas.
    this.prevCursor = this.input.manager.defaultCursor;
    this.input.setDefaultCursor('none');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.setDefaultCursor(this.prevCursor);
    });

    this.input.on('pointermove', this.handlePointer, this);
    this.input.on('pointerdown', this.handlePointer, this);

    this.gameStartTime = this.time.now;
    this.time.delayedCall(500, () => { this.gameActive = true; });
  }

  // ================================================================
  //  The floor ellipse
  // ================================================================

  // Pull a feet-point back onto the floor. `pad` is the sprite's own half-width, so a lion's
  // flank cannot hang off the sand even when its feet are exactly on the boundary.
  clampToFloor(p, pad) {
    const rx = Math.max(LD_FLOOR.rx - LD_FLOOR_INSET - pad, 10);
    const ry = Math.max(LD_FLOOR.ry - LD_FLOOR_INSET, 10);
    const dx = p.x - LD_FLOOR.cx;
    const dy = p.y - LD_FLOOR.cy;
    const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (d <= 1) return p;
    const s = Math.sqrt(d);
    p.x = LD_FLOOR.cx + dx / s;
    p.y = LD_FLOOR.cy + dy / s;
    return p;
  }

  randomOnFloor(pad) {
    // Uniform over the ellipse: sqrt on the radius, or everything bunches in the middle and the
    // lions never patrol the edges.
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    return {
      x: LD_FLOOR.cx + (LD_FLOOR.rx - LD_FLOOR_INSET - pad) * r * Math.cos(a),
      y: LD_FLOOR.cy + (LD_FLOOR.ry - LD_FLOOR_INSET) * r * Math.sin(a),
    };
  }

  // Nearer things draw in front. Feet-y IS the depth order in a floor view.
  sortDepth() {
    this.daniel.setDepth(100 + this.daniel.y);
    this.lions.forEach(l => l.sprite.setDepth(100 + l.y));
  }

  // ================================================================
  //  Entities
  // ================================================================

  createDaniel() {
    this.daniel = this.add.image(LD_FLOOR.cx, LD_FLOOR.cy + 20, LD_ASSETS.daniel.key)
      .setOrigin(0.5, 1);
    this.daniel.setScale(LD_DANIEL_H / this.daniel.height);
    this.danielHalfW = this.daniel.displayWidth / 2;
    this.target = { x: this.daniel.x, y: this.daniel.y };
  }

  createLions() {
    for (let i = 0; i < this.config.lionCount; i++) {
      const sprite = this.add.image(0, 0, LD_ASSETS.lion.key).setOrigin(0.5, 1);
      sprite.setScale(LD_LION_W / sprite.width);
      const halfW = sprite.displayWidth / 2;

      // Spread the starting positions around the rim so no lion opens the round on top of Daniel.
      const a = (i / this.config.lionCount) * Math.PI * 2 + Math.random() * 0.6;
      const start = this.clampToFloor({
        x: LD_FLOOR.cx + (LD_FLOOR.rx - 30) * Math.cos(a),
        y: LD_FLOOR.cy + (LD_FLOOR.ry - 14) * Math.sin(a),
      }, halfW);

      const lion = {
        sprite, halfW,
        x: start.x, y: start.y,
        target: this.randomOnFloor(halfW),
        charging: false,
        chargeDir: { x: 0, y: 0 },
        facingLeft: true,
      };
      sprite.setPosition(lion.x, lion.y);
      this.lions.push(lion);
    }
  }

  // ================================================================
  //  Input
  // ================================================================

  handlePointer(pointer) {
    if (!this.gameActive) return;
    this.target = this.clampToFloor(
      { x: pointer.x, y: pointer.y + LD_GRAB_DY }, this.danielHalfW);
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (!this.gameActive) return;
    const dt = delta / 1000;

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.handleWin();
      return;
    }

    this.moveDaniel(dt);
    this.maybeCharge(dt);
    this.moveLions(dt);
    this.sortDepth();

    if (this.checkCaught()) return;

    this.updateDanger();
    this.drawHUD();
  }

  moveDaniel(dt) {
    // Exponential follow, corrected for frame time. The spec asks for responsive controls with no
    // lag, so there is no hard speed cap here — unlike the Fiery Furnace angel, where the cap is
    // the whole game.
    const k = 1 - Math.exp(-LD_FOLLOW_K * dt);
    this.daniel.x += (this.target.x - this.daniel.x) * k;
    this.daniel.y += (this.target.y - this.daniel.y) * k;
  }

  maybeCharge(dt) {
    if (!this.config.chargeInterval) return;      // 0 = lions never charge
    this.chargeAccum += dt;
    if (this.chargeAccum < this.config.chargeInterval) return;
    this.chargeAccum = 0;

    const free = this.lions.filter(l => !l.charging);
    if (free.length === 0) return;
    const lion = Phaser.Utils.Array.GetRandom(free);

    // Wind-up first: the lion rears slightly and flushes red, THEN launches. The charge locks in
    // Daniel's position at launch, not at the tell, so the tell is genuinely dodgeable.
    lion.charging = true;
    lion.chargeDir = { x: 0, y: 0 };
    this.tweens.add({
      targets: lion.sprite, scaleX: lion.sprite.scaleX * 1.12, scaleY: lion.sprite.scaleY * 1.12,
      duration: LD_CHARGE_TELL, yoyo: true, ease: 'Quad.easeOut',
    });
    lion.sprite.setTint(0xFFB0A0);

    this.time.delayedCall(LD_CHARGE_TELL, () => {
      if (!this.gameActive) { lion.charging = false; lion.sprite.clearTint(); return; }
      const dx = this.daniel.x - lion.x;
      const dy = this.daniel.y - lion.y;
      const d = Math.hypot(dx, dy) || 1;
      lion.chargeDir = { x: dx / d, y: dy / d };
      this.time.delayedCall(LD_CHARGE_TIME, () => {
        lion.charging = false;
        lion.sprite.clearTint();
        lion.target = this.randomOnFloor(lion.halfW);
      });
    });
  }

  moveLions(dt) {
    for (const lion of this.lions) {
      const before = lion.x;

      if (lion.charging && (lion.chargeDir.x || lion.chargeDir.y)) {
        const step = this.config.lionSpeed * LD_CHARGE_MULT * dt;
        lion.x += lion.chargeDir.x * step;
        lion.y += lion.chargeDir.y * step;
      } else if (!lion.charging) {
        const dx = lion.target.x - lion.x;
        const dy = lion.target.y - lion.y;
        const d = Math.hypot(dx, dy);
        if (d < LD_ARRIVE) {
          lion.target = this.randomOnFloor(lion.halfW);
        } else {
          const step = Math.min(d, this.config.lionSpeed * dt);
          lion.x += (dx / d) * step;
          lion.y += (dy / d) * step;
        }
      }

      this.clampToFloor(lion, lion.halfW);

      // Face the way it is MOVING, measured from actual displacement. A deadband stops the sprite
      // strobing when a lion is basically parked: sub-pixel drift alternates sign every frame.
      const vx = (lion.x - before) / dt;
      if (vx < -30) lion.facingLeft = true;
      else if (vx > 30) lion.facingLeft = false;
      lion.sprite.setFlipX(!lion.facingLeft);   // the art faces LEFT

      lion.sprite.setPosition(lion.x, lion.y);
    }
  }

  // Ellipse-vs-ellipse overlap on the sprite footprints. Returns true if the round ended, so the
  // caller stops — without that, a second lion overlapping on the same frame fires handleLoss
  // again and the scene queues two transitions.
  checkCaught() {
    for (const lion of this.lions) {
      const dx = lion.x - this.daniel.x;
      const dy = lion.y - this.daniel.y;
      const sx = LD_LION_RX + LD_DANIEL_RX;
      const sy = LD_LION_RY + LD_DANIEL_RY;
      if ((dx * dx) / (sx * sx) + (dy * dy) / (sy * sy) < 1) {
        this.handleLoss();
        return true;
      }
    }
    return false;
  }

  updateDanger() {
    let nearest = Infinity;
    for (const lion of this.lions) {
      const dx = lion.x - this.daniel.x;
      const dy = (lion.y - this.daniel.y) / 0.6;   // the floor is foreshortened; vertical gaps are
      nearest = Math.min(nearest, Math.hypot(dx, dy));   // more room than they look
    }
    const a = nearest >= LD_DANGER_R ? 0
            : Phaser.Math.Clamp(1 - nearest / LD_DANGER_R, 0, 1) * 0.42;
    this.danger.setAlpha(a);
  }

  // ================================================================
  //  HUD
  // ================================================================

  // Built once per scene START. The version this replaced rebuilt four Text objects every frame
  // and destroyed the old ones by scanning children for a name prefix — about 240 object
  // creations a second — and three of the four showed fields (score, hearts, combo) that this
  // scene never updated. The live values for those live on `session` and are shown by
  // GameLoopScene between rounds.
  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 12, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#FFFFFF',
      stroke: '#4A3A52', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(950);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.gameActive = false;
    this.danger.setAlpha(0);
    this.lions.forEach(l => {
      this.tweens.killTweensOf(l.sprite);
      l.sprite.clearTint();
      l.charging = false;
    });
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    this.endRound();
    this.hudTimer.setVisible(false);

    // The lions lie down. One pose is all the art there is, so "lying down" is a squash and a
    // settle rather than a second drawing — it reads at this size and it is honest about what
    // shipped. A proper lying pose would be a better asset.
    this.lions.forEach((l, i) => {
      this.tweens.add({
        targets: l.sprite,
        scaleY: l.sprite.scaleY * 0.74,
        scaleX: l.sprite.scaleX * 1.05,
        duration: 520, delay: i * 90, ease: 'Quad.easeOut',
      });
      this.time.delayedCall(560 + i * 90, () => {
        const z = this.add.text(l.x + 16, l.y - 42, '💤', { fontSize: '15px' })
          .setOrigin(0.5).setDepth(960);
        this.tweens.add({ targets: z, y: z.y - 16, alpha: 0, duration: 1400, ease: 'Sine.easeOut' });
      });
    });

    // The angel God sent to shut the lions' mouths (Daniel 6:22). Borrowed from the Fiery Furnace
    // plate; optional, so a missing file costs the beat nothing.
    if (this.textures.exists(LD_ANGEL.key)) {
      const angel = this.add.image(this.daniel.x + 74, this.daniel.y - 6, LD_ANGEL.key)
        .setOrigin(0.5, 1).setDepth(970).setAlpha(0);
      angel.setScale(76 / angel.height);
      // The Fiery Furnace plate is drawn in profile FACING LEFT, and he stands to Daniel's right,
      // so he is already looking at him. Flipping turns him away.
      this.tweens.add({ targets: angel, alpha: 1, y: angel.y - 4, duration: 600, ease: 'Sine.easeOut' });
    }

    this.add.text(GAME_WIDTH / 2, 46, 'God shut the lions’ mouths!', {
      ...FONTS.TITLE, color: '#2E8B57', fontSize: '22px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(980);

    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(300 + i * 60, () => {
        const sparkle = this.add.text(
          this.daniel.x + Phaser.Math.Between(-60, 90),
          this.daniel.y - Phaser.Math.Between(10, 80),
          '✨', { fontSize: '17px' }).setOrigin(0.5).setDepth(981);
        this.tweens.add({ targets: sparkle, y: sparkle.y - 30, alpha: 0, duration: 620, ease: 'Quad.easeOut' });
      });
    }

    const fast = elapsed < this.config.surviveTime * 1.05;
    const perfect = this.difficulty === DIFFICULTY.HARD;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(2100, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.DANIEL_LIONS_DEN,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();
    this.hudTimer.setVisible(false);

    this.cameras.main.shake(300, 0.018);

    // Darken rather than flash red. The spec asks for the screen to darken; a red strobe on a
    // pastel plate aimed at six-year-olds is a different thing.
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1024, 0)
      .setDepth(940);
    this.tweens.add({ targets: dim, alpha: 0.42, duration: 420 });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'Caught!', {
      ...FONTS.TITLE, color: '#FFD93D', fontSize: '28px',
      stroke: '#3A1420', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(980);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.DANIEL_LIONS_DEN,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/lions-den/ is missing or incomplete. The real plates shipped,
  //  so this exists to keep a broken checkout playable rather than to be looked at. The angel is
  //  deliberately absent: it is optional, and a stand-in angel is worse than no angel.
  // ================================================================

  ensureTextures() {
    if (!this.textures.exists(LD_ASSETS.bg.key)) this.genDen();
    if (!this.textures.exists(LD_ASSETS.daniel.key)) this.genDaniel();
    if (!this.textures.exists(LD_ASSETS.lion.key)) this.genLion();
  }

  face(g, cx, cy, r, ink) {
    g.fillStyle(0xFFFFFF, 1);
    g.fillEllipse(cx - r * 0.5, cy, r * 0.5, r * 0.66);
    g.fillEllipse(cx + r * 0.5, cy, r * 0.5, r * 0.66);
    g.fillStyle(ink, 1);
    g.fillCircle(cx - r * 0.5, cy + r * 0.05, r * 0.2);
    g.fillCircle(cx + r * 0.5, cy + r * 0.05, r * 0.2);
    g.fillStyle(0xF5B5C8, 1);
    g.fillEllipse(cx - r * 1.1, cy + r * 0.5, r * 0.5, r * 0.3);
    g.fillEllipse(cx + r * 1.1, cy + r * 0.5, r * 0.5, r * 0.3);
  }

  genDen() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x6E6C8C, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // brick courses
    for (let row = 0; row < 6; row++) {
      const y = row * 30;
      for (let col = -1; col < 12; col++) {
        const x = col * 62 + (row % 2 ? 31 : 0);
        g.fillStyle(((row + col) % 2) ? 0xC89090 : 0xB8BCDC, 1);
        g.fillRoundedRect(x + 3, y + 3, 56, 24, 7);
        g.lineStyle(2, 0x1A1A1A, 0.8);
        g.strokeRoundedRect(x + 3, y + 3, 56, 24, 7);
      }
    }
    g.fillStyle(0xF0B878, 1);
    g.fillEllipse(LD_FLOOR.cx, LD_FLOOR.cy, LD_FLOOR.rx * 2, LD_FLOOR.ry * 2);
    g.fillStyle(0xF8CE94, 1);
    g.fillEllipse(LD_FLOOR.cx, LD_FLOOR.cy + 14, LD_FLOOR.rx * 1.5, LD_FLOOR.ry * 1.3);
    g.generateTexture(LD_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
    g.destroy();
  }

  genDaniel() {
    const g = this.make.graphics({ add: false });
    const W = 70, H = 170, cx = 35, ink = 0x1A1A1A;
    g.fillStyle(0xF6EFD8, 1);                     // robe
    g.fillTriangle(cx - 24, 166, cx + 24, 166, cx, 66);
    g.lineStyle(4, ink, 1);
    g.strokeTriangle(cx - 24, 166, cx + 24, 166, cx, 66);
    g.fillStyle(0xE8C87A, 1);                     // sash
    g.fillRect(cx - 22, 112, 44, 11);
    g.fillStyle(0xC9B6E4, 1);                     // lavender skin
    g.fillCircle(cx, 44, 24);
    g.lineStyle(4, ink, 1);
    g.strokeCircle(cx, 44, 24);
    g.fillStyle(0xC9B6E4, 1);
    g.fillCircle(cx, 44, 21);
    this.face(g, cx, 42, 8, ink);
    g.fillStyle(0xC9B6E4, 1);                     // praying hands
    g.fillEllipse(cx, 84, 15, 28);
    g.lineStyle(3, ink, 1);
    g.strokeEllipse(cx, 84, 15, 28);
    g.generateTexture(LD_ASSETS.daniel.key, W, H);
    g.destroy();
  }

  genLion() {
    const g = this.make.graphics({ add: false });
    const W = 150, H = 128, ink = 0x1A1A1A;
    g.fillStyle(0xF3DFA6, 1);                     // body, head to the LEFT like the real plate
    g.fillEllipse(88, 76, 92, 52);
    g.lineStyle(4, ink, 1);
    g.strokeEllipse(88, 76, 92, 52);
    g.fillStyle(0xF3DFA6, 1);
    [52, 74, 100, 122].forEach(x => { g.fillRect(x - 5, 92, 10, 26); g.lineStyle(3, ink, 1); g.strokeRect(x - 5, 92, 10, 26); });
    g.fillStyle(0xDE9A66, 1);                     // mane
    g.fillCircle(46, 58, 38);
    g.lineStyle(4, ink, 1);
    g.strokeCircle(46, 58, 38);
    g.fillStyle(0xF3DFA6, 1);
    g.fillCircle(46, 58, 26);
    g.lineStyle(3, ink, 1);
    g.strokeCircle(46, 58, 26);
    this.face(g, 46, 54, 9, ink);
    g.generateTexture(LD_ASSETS.lion.key, W, H);
    g.destroy();
  }
}
