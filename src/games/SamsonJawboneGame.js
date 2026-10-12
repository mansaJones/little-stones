// ============================================
// SAMSON AND THE JAWBONE - Drag Samson around the field and bonk the Philistines
// Judges 15:14-16  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §14
// Art spec:      docs/Art_Plate_Prompts.md Scene 14
// ============================================

// Art plates live in assets/games/samson/
//   bg.jpg                  — the open hillside at Lehi. Arrived at 2576x1438, aspect 1.791
//                             against the stage's 1.778 — the first backdrop in the roster that
//                             needed no crop at all, only a resize.
//   samson-swing-back/-fwd  — the swing loop, alternated. Drawn in profile facing LEFT.
//   samson-victory          — the win beat.
//   samson-ropes            — the Judges 15:14 intro, before the ropes drop.
//   philistine-a / -b       — mint+mustard and lavender+dusty rose, so the field is not
//                             copy-pasted. Each with a _run and a _bonked pose.
const SJ_ASSET_PATH = 'assets/games/samson/';
const SJ_ASSETS = {
  bg:        { key: 'sj-bg',          file: 'bg.jpg' },
  swingBack: { key: 'sj-swing-back',  file: 'samson-swing-back.png' },
  swingFwd:  { key: 'sj-swing-fwd',   file: 'samson-swing-fwd.png' },
  victory:   { key: 'sj-victory',     file: 'samson-victory.png' },
  ropes:     { key: 'sj-ropes',       file: 'samson-ropes.png' },
  philA:     { key: 'sj-phil-a',      file: 'philistine-a.png' },
  philARun:  { key: 'sj-phil-a-run',  file: 'philistine-a-run.png' },
  philABonk: { key: 'sj-phil-a-bonk', file: 'philistine-a-bonked.png' },
  philB:     { key: 'sj-phil-b',      file: 'philistine-b.png' },
  philBRun:  { key: 'sj-phil-b-run',  file: 'philistine-b-run.png' },
  philBBonk: { key: 'sj-phil-b-bonk', file: 'philistine-b-bonked.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let SJ_ART_PROBED = false;

// ---- The field, MEASURED off bg.jpg rather than chosen ----
// Largest rock-free, grass-covered rectangle on the plate is x 40..622, y 100..346. The art doc
// promised rocks "pushed to the very edges and corners"; this is that promise, checked. The top is
// pulled down to 118 so that a figure standing on the back edge still has its head on grass rather
// than up in the lavender hills — the hill line dips to y=70 in the middle of the frame.
//
// These are FEET positions. If the backdrop is ever redrawn, re-run the measurement.
const SJ_FIELD = { x0: 44, x1: 620, y0: 118, y1: 344 };

// Samson rides ABOVE the finger, exactly as the Fiery Furnace angel does and for the same reason:
// there is no cursor on touch, and at 375px of stage height a sprite under the thumb hides both
// itself and the Philistine it is about to reach.
const SJ_GRAB_DY = -45;

// Held CONSTANT across tiers, per §14 — flee speed is the only difficulty dial. The cap is also
// what makes the 8-second clock mean anything: a Samson who snapped to the finger would clear the
// field in two seconds. Same reasoning as the angel.
const SJ_SAMSON_SPEED = 265;

const SJ_SAMSON_H = 92;          // frame height; the figure inside reads ~70px tall
const SJ_ROPES_SCALE = 0.90;     // the ropes pose has no raised arm, so its frame is tighter
const SJ_PHIL_H = 54;

// Contact circles. §14: "Contact = bonk ... the swing loop is cosmetic. If hits only counted on
// swing frames, kids would visibly touch a Philistine and get nothing, which reads as a bug."
const SJ_SAMSON_R = 26;
const SJ_PHIL_R = 15;

const SJ_FLEE_RADIUS = 115;      // constant across tiers, per §14
const SJ_WANDER_FRAC = 0.35;     // idle wander speed, as a fraction of that tier's flee speed
const SJ_TURN_RATE = 2.2;        // rad/sec of random heading drift while wandering
const SJ_SEPARATION = 34;        // keep them from stacking into one blob a single pass clears
const SJ_SEPARATION_PUSH = 90;

const SJ_FACE_MIN_SPEED = 40;    // facing deadband, px/s — same strobe problem as the angel
const SJ_SWING_MS = 170;         // jawbone swing loop
const SJ_RESPAWN_MS = 500;
const SJ_INTRO_MS = 1000;        // the ropes beat. The clock does NOT run during it.
const SJ_BONK_FLY = 560;         // how fast a bonked Philistine tumbles off the edge

class SamsonJawboneGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.SAMSON_JAWBONE);
  }

  preload() {
    if (SJ_ART_PROBED) return;
    SJ_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[Samson] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(SJ_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, SJ_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;      // STRING: 'easy' | 'medium' | 'hard'

    this.ensureTextures();

    // ---- Round state. All of it reset here, never at declaration: Phaser reuses the Scene
    // instance across restarts, so anything left on `this` survives into the next round as a
    // stale handle to a destroyed GameObject.
    this.phase = 'intro';                   // intro -> play -> over
    this.outcome = null;
    this.timeRemaining = this.config.timeLimit;
    this.bonks = 0;
    this.philistines = [];
    this.facingLeft = true;
    this.swingFwd = false;
    this.targetX = GAME_WIDTH / 2;
    this.targetY = SJ_FIELD.y1 - 40;
    this.variantFlip = Phaser.Math.Between(0, 1);

    this.add.image(0, 0, SJ_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createSamson();
    this.createHUD();
    this.drawHUD();

    this.input.on('pointerdown', this.handlePointer, this);
    this.input.on('pointermove', this.handlePointer, this);

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  // ================================================================
  //  Intro — Judges 15:14, the ropes fall off
  // ================================================================

  runIntro() {
    this.samson.setTexture(SJ_ASSETS.ropes.key);
    this.samson.setScale((SJ_SAMSON_H * SJ_ROPES_SCALE) / this.samson.height);
    this.samson.setFlipX(false);
    this.samson.setPosition(GAME_WIDTH / 2, SJ_FIELD.y1 - 30);

    this.prompt = this.add.text(GAME_WIDTH / 2, 92, 'The ropes fall away!', {
      ...FONTS.TITLE, color: '#C98B2E', fontSize: '20px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(90);

    // Three quick flashes, then control. Tween the tint rather than the alpha so he does not
    // vanish — the beat is the ropes burning off, not Samson blinking out.
    this.tweens.addCounter({
      from: 0, to: 3, duration: SJ_INTRO_MS - 180, ease: 'Linear',
      onUpdate: (tw) => {
        if (!this.samson || !this.samson.active) return;
        this.samson.setTint(Math.floor(tw.getValue() * 2) % 2 ? 0xFFF4C2 : 0xFFFFFF);
      },
    });

    this.time.delayedCall(SJ_INTRO_MS, () => {
      if (this.outcome) return;
      this.samson.clearTint();
      this.samson.setScale(SJ_SAMSON_H / this.samson.height);
      this.setSwingTexture();
      this.targetX = this.samson.x;
      this.targetY = this.samson.y;
      if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
      this.spawnInitialPhilistines();
      this.phase = 'play';
      // Built here rather than in create() so it cannot tick during the intro, but it is a scene
      // timer, so Phaser tears it down with the scene.
      this.swingTimer = this.time.addEvent({
        delay: SJ_SWING_MS, loop: true,
        callback: () => { if (this.phase === 'play') this.setSwingTexture(); },
      });
    });
  }

  setSwingTexture() {
    this.swingFwd = !this.swingFwd;
    this.samson.setTexture(this.swingFwd ? SJ_ASSETS.swingFwd.key : SJ_ASSETS.swingBack.key);
    this.samson.setScale(SJ_SAMSON_H / this.samson.height);
  }

  // ================================================================
  //  Entities
  // ================================================================

  createSamson() {
    this.samson = this.add.image(GAME_WIDTH / 2, SJ_FIELD.y1 - 30, SJ_ASSETS.swingBack.key)
      .setOrigin(0.5, 1);
    this.samson.setScale(SJ_SAMSON_H / this.samson.height);
  }

  // Two variants so the field does not look copy-pasted. Which one spawns alternates rather than
  // being rolled per spawn: a fair coin produces visible runs of four identical Philistines, and
  // on a field of three or four that reads as a bug rather than as chance.
  nextVariant() {
    this.variantFlip = 1 - this.variantFlip;
    return this.variantFlip;
  }

  spawnInitialPhilistines() {
    for (let i = 0; i < this.config.onField; i++) this.spawnPhilistine(i === 0 ? false : true);
  }

  // `atEdge` false places them out in the field for the opening; respawns come in from an edge.
  spawnPhilistine(atEdge) {
    const v = this.nextVariant();
    let x, y;
    if (atEdge) {
      const p = this.edgeAwayFrom(this.samson.x, this.samson.y);
      x = p.x; y = p.y;
    } else {
      x = Phaser.Math.Between(SJ_FIELD.x0 + 60, SJ_FIELD.x1 - 60);
      y = Phaser.Math.Between(SJ_FIELD.y0 + 20, SJ_FIELD.y1 - 20);
    }
    const keys = v === 0
      ? { idle: SJ_ASSETS.philA.key, run: SJ_ASSETS.philARun.key, bonk: SJ_ASSETS.philABonk.key }
      : { idle: SJ_ASSETS.philB.key, run: SJ_ASSETS.philBRun.key, bonk: SJ_ASSETS.philBBonk.key };

    const s = this.add.image(x, y, keys.idle).setOrigin(0.5, 1);
    s.setScale(SJ_PHIL_H / s.height);
    this.philistines.push({
      sprite: s, keys: keys,
      heading: Phaser.Math.FloatBetween(0, Math.PI * 2),
      fleeing: false, bonked: false, facingLeft: true, popped: false,
    });
  }

  // The edge furthest from Samson, so a fresh Philistine never materialises in his lap.
  edgeAwayFrom(sx, sy) {
    const opts = [
      { x: SJ_FIELD.x0 + 6, y: Phaser.Math.Between(SJ_FIELD.y0, SJ_FIELD.y1) },
      { x: SJ_FIELD.x1 - 6, y: Phaser.Math.Between(SJ_FIELD.y0, SJ_FIELD.y1) },
      { x: Phaser.Math.Between(SJ_FIELD.x0, SJ_FIELD.x1), y: SJ_FIELD.y0 + 6 },
      { x: Phaser.Math.Between(SJ_FIELD.x0, SJ_FIELD.x1), y: SJ_FIELD.y1 - 6 },
    ];
    let best = opts[0], bestD = -1;
    opts.forEach(o => {
      const d = Phaser.Math.Distance.Between(o.x, o.y, sx, sy);
      if (d > bestD) { bestD = d; best = o; }
    });
    return best;
  }

  // ================================================================
  //  Input
  // ================================================================

  handlePointer(pointer) {
    if (this.phase !== 'play') return;
    this.targetX = Phaser.Math.Clamp(pointer.x, SJ_FIELD.x0, SJ_FIELD.x1);
    this.targetY = Phaser.Math.Clamp(pointer.y + SJ_GRAB_DY, SJ_FIELD.y0, SJ_FIELD.y1);
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play') return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    this.timeRemaining -= dt;
    this.moveSamson(dt);
    this.movePhilistines(dt);
    this.checkBonks();

    if (this.timeRemaining <= 0) { this.handleLoss(); return; }
    this.drawHUD();
  }

  moveSamson(dt) {
    const beforeX = this.samson.x;
    const dx = this.targetX - this.samson.x;
    const dy = this.targetY - this.samson.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, SJ_SAMSON_SPEED * dt);
      this.samson.x += (dx / dist) * step;
      this.samson.y += (dy / dist) * step;
    }
    // Facing from actual displacement, not from the pointer delta, so the sprite matches what is
    // on screen rather than what the finger wants. Below the deadband he holds his current facing,
    // or he strobes every frame while the player wiggles.
    if (dt > 0) {
      const vx = (this.samson.x - beforeX) / dt;
      if (vx < -SJ_FACE_MIN_SPEED) this.facingLeft = true;
      else if (vx > SJ_FACE_MIN_SPEED) this.facingLeft = false;
    }
    this.samson.setFlipX(!this.facingLeft);
    this.samson.setDepth(this.samson.y);
  }

  movePhilistines(dt) {
    const flee = this.config.fleeSpeed;
    const wander = flee * SJ_WANDER_FRAC;

    this.philistines.forEach(p => {
      if (p.bonked) return;
      const s = p.sprite;
      const toS = Phaser.Math.Distance.Between(s.x, s.y, this.samson.x, this.samson.y);
      const beforeX = s.x;

      let vx, vy;
      if (toS < SJ_FLEE_RADIUS) {
        if (!p.fleeing) {
          p.fleeing = true;
          s.setTexture(p.keys.run);
          s.setScale(SJ_PHIL_H / s.height);
          if (!p.popped) { p.popped = true; this.popAlert(s.x, s.y - SJ_PHIL_H); }
        }
        const away = Math.atan2(s.y - this.samson.y, s.x - this.samson.x);
        vx = Math.cos(away) * flee;
        vy = Math.sin(away) * flee;
      } else {
        if (p.fleeing) {
          p.fleeing = false;
          s.setTexture(p.keys.idle);
          s.setScale(SJ_PHIL_H / s.height);
          p.popped = false;
        }
        p.heading += Phaser.Math.FloatBetween(-SJ_TURN_RATE, SJ_TURN_RATE) * dt;
        vx = Math.cos(p.heading) * wander;
        vy = Math.sin(p.heading) * wander;
      }

      // Separation. Without it they drift into one blob and a single pass bonks the lot, which
      // makes HARD easier than EASY.
      this.philistines.forEach(q => {
        if (q === p || q.bonked) return;
        const d = Phaser.Math.Distance.Between(s.x, s.y, q.sprite.x, q.sprite.y);
        if (d > 0.01 && d < SJ_SEPARATION) {
          const k = (1 - d / SJ_SEPARATION) * SJ_SEPARATION_PUSH;
          vx += ((s.x - q.sprite.x) / d) * k;
          vy += ((s.y - q.sprite.y) / d) * k;
        }
      });

      s.x += vx * dt;
      s.y += vy * dt;

      // Clamped to the field, NOT wrapped and not bounced. §14: the flee vector is clamped "so
      // they get pinned against edges instead of sliding along them forever. Cornering is the
      // skill." A bounce would hand them a free escape past Samson every time they touched a wall.
      s.x = Phaser.Math.Clamp(s.x, SJ_FIELD.x0, SJ_FIELD.x1);
      s.y = Phaser.Math.Clamp(s.y, SJ_FIELD.y0, SJ_FIELD.y1);

      if (dt > 0) {
        const pvx = (s.x - beforeX) / dt;
        if (pvx < -SJ_FACE_MIN_SPEED) p.facingLeft = true;
        else if (pvx > SJ_FACE_MIN_SPEED) p.facingLeft = false;
      }
      s.setFlipX(!p.facingLeft);
      s.setDepth(s.y);
    });

    this.unstack();
  }

  // A hard positional floor, applied AFTER the clamp.
  //
  // The velocity-level separation above is not enough on its own: two Philistines fleeing into the
  // same corner both get clamped to the same corner pixel every frame, which overrides whatever
  // the separation force wanted. They then sit at a distance of exactly zero — and a push computed
  // from the vector between them has no direction to push along, so they stay welded together for
  // the rest of the round and one pass of Samson bonks both. Measured at 0.0px before this existed.
  unstack() {
    const alive = this.philistines.filter(p => !p.bonked);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i].sprite, b = alive[j].sprite;
        let dx = a.x - b.x, dy = a.y - b.y;
        let d = Math.hypot(dx, dy);
        if (d >= SJ_SEPARATION) continue;
        if (d < 0.01) {
          // Exactly co-located. Pick a direction rather than dividing by zero.
          dx = Phaser.Math.FloatBetween(-1, 1);
          dy = Phaser.Math.FloatBetween(-1, 1);
          d = Math.hypot(dx, dy) || 1;
        }
        const push = (SJ_SEPARATION - d) / 2;
        const ux = (dx / d) * push, uy = (dy / d) * push;
        a.x = Phaser.Math.Clamp(a.x + ux, SJ_FIELD.x0, SJ_FIELD.x1);
        a.y = Phaser.Math.Clamp(a.y + uy, SJ_FIELD.y0, SJ_FIELD.y1);
        b.x = Phaser.Math.Clamp(b.x - ux, SJ_FIELD.x0, SJ_FIELD.x1);
        b.y = Phaser.Math.Clamp(b.y - uy, SJ_FIELD.y0, SJ_FIELD.y1);
      }
    }
  }

  // Contact on ANY frame. The swing animation is cosmetic and is deliberately not consulted here.
  checkBonks() {
    const reach = SJ_SAMSON_R + SJ_PHIL_R;
    this.philistines.forEach(p => {
      if (p.bonked) return;
      const s = p.sprite;
      // Both sprites are bottom-anchored, so compare mid-body points rather than feet: feet-only
      // would miss a Philistine standing a few pixels behind Samson that the child can plainly
      // see him touching.
      const d = Phaser.Math.Distance.Between(
        s.x, s.y - SJ_PHIL_H * 0.45,
        this.samson.x, this.samson.y - SJ_SAMSON_H * 0.35);
      if (d < reach) this.bonk(p);
    });
  }

  bonk(p) {
    p.bonked = true;
    const s = p.sprite;
    s.setTexture(p.keys.bonk);
    s.setScale(SJ_PHIL_H / s.height);
    this.bonks++;

    this.puff(s.x, s.y - SJ_PHIL_H * 0.5);
    this.stars(s.x, s.y - SJ_PHIL_H * 0.9);
    this.cameras.main.shake(90, 0.004);

    // Tumbles off the NEAREST edge, so the exit always looks like it came from the hit rather
    // than from a fixed direction.
    const toLeft = s.x - SJ_FIELD.x0, toRight = SJ_FIELD.x1 - s.x;
    const toTop = s.y - SJ_FIELD.y0, toBottom = SJ_FIELD.y1 - s.y;
    const m = Math.min(toLeft, toRight, toTop, toBottom);
    let ex = s.x, ey = s.y;
    if (m === toLeft) ex = -80;
    else if (m === toRight) ex = GAME_WIDTH + 80;
    else if (m === toTop) ey = -80;
    else ey = GAME_HEIGHT + 90;

    this.tweens.add({
      targets: s, x: ex, y: ey, angle: 720, alpha: 0,
      duration: Math.max(260, (Math.hypot(ex - s.x, ey - s.y) / SJ_BONK_FLY) * 1000),
      ease: 'Quad.easeOut',
      onComplete: () => s.destroy(),
    });

    if (this.bonks >= this.config.targetBonks) { this.handleWin(); return; }

    // Keep the field stocked. §14: "The field never empties before the target."
    this.time.delayedCall(SJ_RESPAWN_MS, () => {
      if (this.phase !== 'play') return;
      this.philistines = this.philistines.filter(q => !q.bonked);
      if (this.philistines.length < this.config.onField) this.spawnPhilistine(true);
    });
    this.drawHUD();
  }

  // ================================================================
  //  Effects — Phaser-drawn, never sprites. Puffs and stars keyed off a magenta plate fringe
  //  badly, which is why the art doc leaves them out of the plate list.
  // ================================================================

  popAlert(x, y) {
    const t = this.add.text(x, y, '!', {
      ...FONTS.TITLE, color: '#E8533A', fontSize: '20px',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(800);
    this.tweens.add({
      targets: t, y: y - 16, alpha: 0, duration: 520, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  puff(x, y) {
    const g = this.add.graphics({ x: x, y: y }).setDepth(790);
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillCircle(0, 0, 16);
    this.tweens.add({
      targets: g, scaleX: 2.4, scaleY: 2.4, alpha: 0, duration: 380, ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  stars(x, y) {
    for (let i = 0; i < 3; i++) {
      const a = (-Math.PI / 2) + (i - 1) * 0.7;
      const t = this.add.text(x, y, '★', {
        ...FONTS.TITLE, color: '#FFD93D', fontSize: '15px',
        stroke: '#8A6A10', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(800);
      this.tweens.add({
        targets: t, x: x + Math.cos(a) * 26, y: y + Math.sin(a) * 22,
        angle: 360, alpha: 0, duration: 560, ease: 'Quad.easeOut',
        onComplete: () => t.destroy(),
      });
    }
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily: Phaser reuses the Scene instance, so an
  //  `if (!this.hudTimer)` guard sees a truthy handle to a destroyed object.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 8, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#4A4A3A',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(900);

    this.hudCount = this.add.text(GAME_WIDTH - 14, 12, '', {
      ...FONTS.SMALL, fontSize: '16px', fontStyle: 'bold', color: '#4A4A3A',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(900);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    this.hudCount.setText(this.bonks + '/' + this.config.targetBonks);
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.phase = 'over';
    if (this.swingTimer) { this.swingTimer.remove(); this.swingTimer = null; }
    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.hudTimer.setVisible(false);
    this.hudCount.setVisible(false);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    this.endRound();

    this.samson.setTexture(SJ_ASSETS.victory.key);
    this.samson.setScale(SJ_SAMSON_H / this.samson.height);
    this.samson.setFlipX(false);

    // The survivors clear off. §14: "The remaining Philistines run off-screen."
    this.philistines.forEach(p => {
      if (p.bonked) return;
      const away = Math.atan2(p.sprite.y - this.samson.y, p.sprite.x - this.samson.x);
      p.sprite.setTexture(p.keys.run);
      p.sprite.setScale(SJ_PHIL_H / p.sprite.height);
      this.tweens.add({
        targets: p.sprite,
        x: p.sprite.x + Math.cos(away) * 500, y: p.sprite.y + Math.sin(away) * 500,
        alpha: 0, duration: 900, ease: 'Quad.easeIn',
      });
    });

    this.add.text(GAME_WIDTH / 2, 348, 'God gave Samson strength!', {
      ...FONTS.TITLE, color: '#1E9E55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    const fast = elapsed < (this.config.timeLimit + SJ_INTRO_MS / 1000) * 0.65;
    const perfect = elapsed < (this.config.timeLimit + SJ_INTRO_MS / 1000) * 0.45;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.SAMSON_JAWBONE,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();

    // §14: "Philistines dance just out of reach." They keep their poses and bob, rather than
    // freezing — nothing bad has happened to Samson, he just ran out of clock.
    this.philistines.forEach(p => {
      if (p.bonked) return;
      this.tweens.add({
        targets: p.sprite, y: p.sprite.y - 8,
        duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    this.add.text(GAME_WIDTH / 2, 348, 'Keep chasing!', {
      ...FONTS.TITLE, color: '#C2731A', fontSize: '22px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.SAMSON_JAWBONE,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/samson/ is missing or incomplete. The real plates shipped, so
  //  this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(SJ_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFBDFB4, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xB7BEDC, 1);
      g.fillRect(0, 40, GAME_WIDTH, 40);
      g.fillStyle(0xD6DEC4, 1);
      g.fillRect(0, 76, GAME_WIDTH, GAME_HEIGHT - 76);
      g.generateTexture(SJ_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }

    const figure = (key, skin, tunic, bone, spiral) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(skin, 1);
      g.fillCircle(70, 42, 32);
      g.fillRect(52, 124, 14, 40);
      g.fillRect(82, 124, 14, 40);
      g.fillStyle(tunic, 1);
      g.fillRect(42, 70, 56, 58);
      g.lineStyle(5, ink, 1);
      g.strokeCircle(70, 42, 32);
      g.strokeRect(42, 70, 56, 58);
      if (bone) {
        g.lineStyle(9, 0xF2E4C0, 1);
        g.lineBetween(26, 20, 62, 44);
      }
      if (spiral) {
        g.lineStyle(3, ink, 1);
        g.strokeCircle(58, 40, 9);
        g.strokeCircle(84, 40, 9);
      }
      g.generateTexture(key, 140, 172);
      g.destroy();
    };
    figure(SJ_ASSETS.swingBack.key, 0xA9B0E8, 0xD8B882, true, false);
    figure(SJ_ASSETS.swingFwd.key, 0xA9B0E8, 0xD8B882, true, false);
    figure(SJ_ASSETS.victory.key, 0xA9B0E8, 0xD8B882, true, false);
    figure(SJ_ASSETS.ropes.key, 0xA9B0E8, 0xC9A878, false, false);
    figure(SJ_ASSETS.philA.key, 0xA8DCC0, 0xE8C04A, false, false);
    figure(SJ_ASSETS.philARun.key, 0xA8DCC0, 0xE8C04A, false, false);
    figure(SJ_ASSETS.philABonk.key, 0xA8DCC0, 0xE8C04A, false, true);
    figure(SJ_ASSETS.philB.key, 0xC8B4E0, 0xD08A86, false, false);
    figure(SJ_ASSETS.philBRun.key, 0xC8B4E0, 0xD08A86, false, false);
    figure(SJ_ASSETS.philBBonk.key, 0xC8B4E0, 0xD08A86, false, true);
  }
}
