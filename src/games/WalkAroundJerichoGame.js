// ============================================
// WALK AROUND JERICHO - March the city seven times, then blow the horn
// Joshua 6:15-20  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: biblical_game_design_doc.md §11 (redesigned 2026-10-05)
// ============================================

// Art plates live in assets/games/jericho/
//   bg.jpg        — sand with the dusty oval path. The path IS the arena; LJ_PATH is measured
//                   off this plate, so re-measure if it is ever redrawn.
//   cracked.png / crumbling-1.png / crumbling-2.png / fallen.png
//                 — the city in four states. The march starts on `cracked`: six days of marching
//                   have already happened before the round opens. Joshua 6 is day seven.
//   phalanx.png   — four soldiers as ONE sprite, drawn in profile FACING LEFT; flipX when moving
//                   right. They are a unit, not four actors, so there is no formation to break.
//   rock.png      — the HARD obstacle, sitting on the path.
//   horn-ready.png / horn-blow.png — the horn-blower, phase two.
const LJ_ASSET_PATH = 'assets/games/jericho/';
const LJ_ASSETS = {
  bg:        { key: 'lj-bg',         file: 'bg.jpg' },
  cracked:   { key: 'lj-cracked',    file: 'cracked.png' },
  crumb1:    { key: 'lj-crumb1',     file: 'crumbling-1.png' },
  crumb2:    { key: 'lj-crumb2',     file: 'crumbling-2.png' },
  fallen:    { key: 'lj-fallen',     file: 'fallen.png' },
  phalanx:   { key: 'lj-phalanx',    file: 'phalanx.png' },
  rock:      { key: 'lj-rock',       file: 'rock.png' },
  hornReady: { key: 'lj-horn-ready', file: 'horn-ready.png' },
  hornBlow:  { key: 'lj-horn-blow',  file: 'horn-blow.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let LJ_ART_PROBED = false;

// ---- The march path ----
// MEASURED off bg.jpg: classify the plate into path / sand (the path is the only dusty-rose
// region), keep the largest blob so the palms and bushes do not count, then take the ellipse
// midway between the ring's inner and outer edges. All 240 sampled points land on the path. If
// the backdrop is ever replaced, re-run that measurement rather than nudging these by eye.
const LJ_PATH = { cx: 332, cy: 176, rx: 262, ry: 118 };

// The city must stay clear of the path, or the phalanx vanishes behind the walls at the top of
// every lap. Its top edge is LJ_CITY_BOTTOM minus its height; at this width that is y=76, and the
// top of the march is y=58, so the phalanx passes above it. Widening the city past about 270
// breaks that, and the spec with it.
const LJ_CITY_W = 250;
const LJ_CITY_BOTTOM = 282;

// Phalanx height at the NEAR side of the ring, scaled down toward LJ_PHALANX_FAR at the far side.
// The perspective scale is the design doc's optional depth cue, but here it also earns its keep:
// the top of the march is y=58, so anything taller than 58px drawn at full size has its spear tips
// clipped off the top of the stage. Shrinking on the far side buys a bigger, more readable phalanx
// on the near side — which matters, because it is the thing the child is actually steering.
const LJ_PHALANX_H = 76;
const LJ_PHALANX_FAR = 0.76;
const LJ_HORN_H = 86;
const LJ_ROCK_W = 26;

// One lap per second, hard cap. Without it a child who spins the screen finishes seven laps in
// two seconds and the march timer means nothing — the same reason the Fiery Furnace angel has a
// speed cap. The fastest legal march is therefore 7s, which is what the tier times are set
// against: 12 / 10 / 9 leaves 5 / 3 / 2 seconds of slack.
const LJ_MAX_ANGULAR = Math.PI * 2;

// Facing deadband, px/sec. At the left and right ends of the ellipse horizontal velocity passes
// through zero, so a bare sign test strobes the sprite every frame there. Below this speed the
// phalanx holds whatever way it was already facing.
const LJ_FACE_MIN_SPEED = 26;

const LJ_ROCK_ANGLES = [Math.PI * 0.30, Math.PI * 1.35];  // where rocks sit, in path angle
const LJ_ROCK_ARC = 0.20;        // radians of contact either side
const LJ_STALL_MS = 500;         // how long a rock holds the phalanx

const LJ_TAP_MIN_GAP = 40;       // ms. Anything faster is an autoclicker, not a child.

class WalkAroundJerichoGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.WALK_AROUND_JERICHO);
  }

  preload() {
    if (LJ_ART_PROBED) return;
    LJ_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[Jericho] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(LJ_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, LJ_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;      // STRING: 'easy' | 'medium' | 'hard'

    this.ensureTextures();

    // ---- Round state. All of it reset here, never at declaration: Phaser reuses the Scene
    // instance across restarts, so anything left on `this` survives into the next round.
    this.phase = 'intro';                   // intro -> march -> horn -> over
    this.outcome = null;
    this.timeRemaining = this.config.timeLimit;
    this.angle = Math.PI / 2;               // start at the bottom of the path, nearest the viewer
    this.targetAngle = undefined;           // UNWRAPPED pointer angle; see handlePointer
    this.lastPointerAngle = undefined;
    this.progress = 0;                      // unwrapped radians marched; 2π = one lap
    this.facingLeft = true;
    this.stallUntil = 0;
    this.stalled = false;
    this.hornMeter = 0;
    this.lastTapAt = -Infinity;
    this.marchElapsed = 0;
    this.wallKey = null;
    this.rocks = [];
    this.prompt = null;

    this.add.image(0, 0, LJ_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createCity();
    this.createRocks();
    this.createPhalanx();
    this.createHorn();
    this.createHUD();
    this.drawHUD();

    this.input.on('pointermove', this.handlePointer, this);
    this.input.on('pointerdown', this.handlePointerDown, this);

    this.gameStartTime = this.time.now;
    this.time.delayedCall(500, () => { if (!this.outcome) this.phase = 'march'; });
  }

  // ================================================================
  //  The path
  // ================================================================

  pointOnPath(a) {
    return {
      x: LJ_PATH.cx + LJ_PATH.rx * Math.cos(a),
      y: LJ_PATH.cy + LJ_PATH.ry * Math.sin(a),
    };
  }

  // The pointer's angle in the ellipse's OWN parameter space. A plain atan2 on raw pixels gives a
  // different angle from the one that puts the phalanx under the finger, because the ellipse is
  // more than twice as wide as it is tall — the phalanx would lag the finger badly at the sides.
  pointerAngle(px, py) {
    return Math.atan2((py - LJ_PATH.cy) / LJ_PATH.ry, (px - LJ_PATH.cx) / LJ_PATH.rx);
  }

  // ================================================================
  //  Entities
  // ================================================================

  createCity() {
    this.city = this.add.image(LJ_PATH.cx, LJ_CITY_BOTTOM, LJ_ASSETS.cracked.key)
      .setOrigin(0.5, 1);
    this.city.setScale(LJ_CITY_W / this.city.width);
    this.city.setDepth(LJ_CITY_BOTTOM);
    this.wallKey = LJ_ASSETS.cracked.key;
  }

  createRocks() {
    if (!this.config.obstacles) return;
    LJ_ROCK_ANGLES.forEach(a => {
      const p = this.pointOnPath(a);
      const s = this.add.image(p.x, p.y, LJ_ASSETS.rock.key).setOrigin(0.5, 1);
      s.setScale(LJ_ROCK_W / s.width);
      s.setDepth(p.y - 1);
      this.rocks.push({ angle: a, sprite: s });
    });
  }

  // In front of the city on the near half of the ring, behind it on the far half. Sorting by
  // feet-y instead looks right until the lower arc, where the phalanx's feet are still above the
  // city's base line and it slides behind the walls while clearly walking in front of them.
  phalanxDepth() {
    return Math.sin(this.angle) > 0 ? LJ_CITY_BOTTOM + 50 : LJ_CITY_BOTTOM - 50;
  }

  // 1.0 at the bottom of the ring, LJ_PHALANX_FAR at the top.
  phalanxScale() {
    const t = (Math.sin(this.angle) + 1) / 2;        // 0 at the far side, 1 at the near side
    return (LJ_PHALANX_H / this.phalanxFrameH) * (LJ_PHALANX_FAR + (1 - LJ_PHALANX_FAR) * t);
  }

  createPhalanx() {
    const p = this.pointOnPath(this.angle);
    this.phalanx = this.add.image(p.x, p.y, LJ_ASSETS.phalanx.key).setOrigin(0.5, 1);
    this.phalanxFrameH = this.phalanx.height;
    this.phalanx.setScale(this.phalanxScale());
    this.phalanx.setDepth(this.phalanxDepth());
  }

  createHorn() {
    // Parked off the left edge until phase two, then slid in. Built in create(), not when the horn
    // phase starts, so there is no lazily-made object to go stale across a scene restart.
    this.horn = this.add.image(-70, 352, LJ_ASSETS.hornReady.key)
      .setOrigin(0.5, 1).setDepth(900).setVisible(false);
    this.horn.setScale(LJ_HORN_H / this.horn.height);
  }

  // ================================================================
  //  Input
  // ================================================================

  // The pointer's angle is UNWRAPPED as it moves, and the phalanx chases that running total.
  //
  // Following the raw (-pi, pi] angle instead looks identical until the player spins faster than
  // the one-lap-per-second cap. Then the finger laps the phalanx, gets more than pi ahead, and
  // the shortest-path difference flips sign: the phalanx marches BACKWARDS. Spin hard enough and
  // net progress is zero, which reads as the controls being broken. Against a running total the
  // finger instead builds a queue the phalanx works through at its top speed — capped, but every
  // bit of the child's input still counts, and always in the direction they dragged.
  handlePointer(pointer) {
    if (this.phase !== 'march') return;
    if (!pointer.isDown) return;            // the march is a DRAG, not a hover
    this.trackPointer(pointer.x, pointer.y);
  }

  trackPointer(px, py) {
    const a = this.pointerAngle(px, py);
    if (this.lastPointerAngle === undefined || this.targetAngle === undefined) {
      this.lastPointerAngle = a;
      this.targetAngle = this.angle;        // re-touching elsewhere must not teleport progress
      return;
    }
    this.targetAngle += Phaser.Math.Angle.Wrap(a - this.lastPointerAngle);
    this.lastPointerAngle = a;
  }

  handlePointerDown(pointer) {
    if (this.phase === 'march') {
      // Re-anchor on every fresh touch: the gap between lifting a finger and putting it down
      // somewhere else is not a drag and must not count as distance marched.
      this.lastPointerAngle = undefined;
      this.trackPointer(pointer.x, pointer.y);
      return;
    }
    if (this.phase !== 'horn') return;

    // Reject anything faster than a human thumb, the same guard as Wrestle the Angel.
    if (this.time.now - this.lastTapAt < LJ_TAP_MIN_GAP) return;
    this.lastTapAt = this.time.now;

    this.hornMeter += 1;
    this.horn.setTexture(LJ_ASSETS.hornBlow.key);
    this.time.delayedCall(110, () => {
      if (this.phase === 'horn') this.horn.setTexture(LJ_ASSETS.hornReady.key);
    });
    this.cameras.main.shake(70, 0.004);

    if (this.hornMeter >= this.config.targetTaps) this.handleWin();
    else this.drawHUD();
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    const dt = delta / 1000;
    if (this.phase === 'march') this.updateMarch(dt);
    else if (this.phase === 'horn') this.updateHorn(dt);
  }

  updateMarch(dt) {
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) { this.handleLoss('march'); return; }

    if (this.targetAngle !== undefined && this.time.now >= this.stallUntil) {
      // No wrap here: targetAngle is already an unwrapped running total, so the difference is the
      // real outstanding distance, however many laps it is. Wrapping it would reintroduce exactly
      // the backwards-march bug the running total exists to avoid.
      const d = this.targetAngle - this.angle;
      const cap = LJ_MAX_ANGULAR * dt;
      const step = Phaser.Math.Clamp(d, -cap, cap);

      const before = this.phalanx.x;
      this.angle += step;
      // Progress is UNWRAPPED and signed: it accumulates past 2π rather than resetting, and
      // dragging backwards walks it back. Wrapping it here is what loses or double-counts a lap.
      this.progress = Math.max(0, this.progress + step);

      const p = this.pointOnPath(this.angle);
      this.phalanx.setPosition(p.x, p.y).setDepth(this.phalanxDepth());
      this.phalanx.setScale(this.phalanxScale());

      if (dt > 0) {
        const vx = (this.phalanx.x - before) / dt;
        if (vx < -LJ_FACE_MIN_SPEED) this.facingLeft = true;
        else if (vx > LJ_FACE_MIN_SPEED) this.facingLeft = false;
      }
      this.phalanx.setFlipX(!this.facingLeft);

      this.checkRocks();
    }

    this.updateWallState();

    if (this.progress >= Math.PI * 2 * this.config.laps) { this.startHornPhase(); return; }
    this.drawHUD();
  }

  checkRocks() {
    const a = Phaser.Math.Angle.Wrap(this.angle);
    for (const rock of this.rocks) {
      if (Math.abs(Phaser.Math.Angle.Wrap(a - rock.angle)) < LJ_ROCK_ARC) {
        this.stallUntil = this.time.now + LJ_STALL_MS;
        this.stalled = true;
        this.tweens.killTweensOf(rock.sprite);
        this.tweens.add({
          targets: rock.sprite, angle: { from: -12, to: 12 },
          duration: 70, yoyo: true, repeat: 2,
          onComplete: () => rock.sprite.setAngle(0),
        });
        return;
      }
    }
  }

  lapsDone() {
    return Math.floor(this.progress / (Math.PI * 2));
  }

  updateWallState() {
    const laps = this.lapsDone();
    const want = laps >= 6 ? LJ_ASSETS.crumb2.key
               : laps >= 3 ? LJ_ASSETS.crumb1.key
               :             LJ_ASSETS.cracked.key;
    if (want === this.wallKey) return;
    this.wallKey = want;

    // The four city plates are separate generations and are not pixel-aligned, so the swap pops.
    // Hide it under a shake — the city is supposed to be shuddering at that moment anyway.
    this.city.setTexture(want);
    this.city.setScale(LJ_CITY_W / this.city.width);
    this.cameras.main.shake(220, 0.006);
  }

  startHornPhase() {
    this.phase = 'horn';
    // A FRESH timer. Scraping through lap seven with 0.1s left must not doom the horn.
    this.timeRemaining = this.config.hornTime;
    this.marchElapsed = this.elapsedSeconds();

    this.horn.setVisible(true);
    this.tweens.add({ targets: this.horn, x: 92, duration: 420, ease: 'Back.easeOut' });

    this.prompt = this.add.text(GAME_WIDTH / 2, 112, 'Blow the horn!', {
      ...FONTS.TITLE, color: '#C2731A', fontSize: '24px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);
    this.tweens.add({
      targets: this.prompt, scaleX: 1.08, scaleY: 1.08,
      duration: 420, yoyo: true, repeat: -1,
    });

    this.drawHUD();
  }

  updateHorn(dt) {
    this.timeRemaining -= dt;
    if (this.config.hornDrain) {
      this.hornMeter = Math.max(0, this.hornMeter - this.config.hornDrain * dt);
    }
    if (this.timeRemaining <= 0) { this.handleLoss('horn'); return; }
    this.drawHUD();
  }

  // ================================================================
  //  HUD
  // ================================================================

  // Built once per scene START. The version this replaced called drawHUD() from update() and
  // destroyed and recreated its Text object every single frame, and three of the five fields it
  // showed — hearts, score, combo — were never updated by this scene. Those live on `session`,
  // and GameLoopScene shows them between rounds.
  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 10, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#4A3A2A',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(960);

    this.hudLabel = this.add.text(GAME_WIDTH - 14, 14, '', {
      ...FONTS.SMALL, fontSize: '15px', fontStyle: 'bold', color: '#4A3A2A',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(960);

    this.hudMeter = this.add.graphics().setDepth(960).setVisible(false);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');

    if (this.phase === 'horn') {
      this.hudLabel.setText('');
      const w = 220, h = 15, x = GAME_WIDTH / 2 - w / 2, y = 344;
      const f = Phaser.Math.Clamp(this.hornMeter / this.config.targetTaps, 0, 1);
      this.hudMeter.setVisible(true).clear();
      this.hudMeter.fillStyle(0xFFFFFF, 0.75);
      this.hudMeter.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 9);
      this.hudMeter.fillStyle(0xC9A227, 1);
      if (f > 0) this.hudMeter.fillRoundedRect(x, y, Math.max(w * f, 8), h, 7);
      this.hudMeter.lineStyle(2, 0x4A3A2A, 1);
      this.hudMeter.strokeRoundedRect(x, y, w, h, 7);
    } else {
      this.hudLabel.setText(
        'Lap ' + Math.min(this.lapsDone() + 1, this.config.laps) + '/' + this.config.laps);
    }
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.phase = 'over';
    if (this.prompt) {
      this.tweens.killTweensOf(this.prompt);
      this.prompt.destroy();
      this.prompt = null;
    }
    this.hudTimer.setVisible(false);
    this.hudLabel.setVisible(false);
    this.hudMeter.setVisible(false);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    const marchTime = this.marchElapsed || elapsed;
    const stalled = this.stalled;
    this.endRound();

    this.city.setTexture(LJ_ASSETS.fallen.key);
    this.city.setScale(LJ_CITY_W / this.city.width);
    this.cameras.main.shake(520, 0.022);

    for (let i = 0; i < 16; i++) {
      this.time.delayedCall(i * 45, () => {
        const puff = this.add.text(
          LJ_PATH.cx + Phaser.Math.Between(-130, 130),
          LJ_CITY_BOTTOM - Phaser.Math.Between(0, 90),
          '💨', { fontSize: '22px' }).setOrigin(0.5).setDepth(940).setAlpha(0.85);
        this.tweens.add({
          targets: puff, y: puff.y - 34, alpha: 0, duration: 720, ease: 'Quad.easeOut',
          onComplete: () => puff.destroy(),
        });
      });
    }

    // Bottom, not top. The phalanx stops wherever the lap ended, and the top of the ring is
    // exactly where a banner at y=38 lands on top of it.
    this.add.text(GAME_WIDTH / 2, 342, 'The walls came tumbling down!', {
      ...FONTS.TITLE, color: '#1E9E55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(980);

    // Phase one's clock is the skill test; the horn is a formality once you are there. Score the
    // MARCH, not the total, or a dawdled horn drags down a fast march and the reverse.
    const fast = marchTime < this.config.timeLimit * 0.75;
    const perfect = this.rocks.length > 0 && !stalled;   // HARD only: cleared it without a stall
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(2200, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.WALK_AROUND_JERICHO,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss(which) {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();

    // The walls stand. No collapse, no rubble, no state change — the city being unchanged is the
    // whole difference between this and the win.
    this.add.text(GAME_WIDTH / 2, 342, which === 'horn' ? 'Blow louder!' : 'Keep marching!', {
      ...FONTS.TITLE, color: '#C2731A', fontSize: '24px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(980);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.WALK_AROUND_JERICHO,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/jericho/ is missing or incomplete. The real plates shipped, so
  //  this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(LJ_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xF3DFBA, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xB58A86, 1);
      g.fillEllipse(LJ_PATH.cx, LJ_PATH.cy, (LJ_PATH.rx + 34) * 2, (LJ_PATH.ry + 20) * 2);
      g.fillStyle(0xF3DFBA, 1);
      g.fillEllipse(LJ_PATH.cx, LJ_PATH.cy, (LJ_PATH.rx - 34) * 2, (LJ_PATH.ry - 20) * 2);
      g.generateTexture(LJ_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }

    const city = (key, breaks, fallen) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xC89090, 1);
      g.fillEllipse(150, fallen ? 190 : 150, 280, fallen ? 90 : 150);
      g.lineStyle(4, ink, 1);
      g.strokeEllipse(150, fallen ? 190 : 150, 280, fallen ? 90 : 150);
      if (!fallen) {
        [[110, 140], [160, 150], [205, 138]].forEach(([x, y]) => {
          g.fillStyle(0xF0E0BC, 1);
          g.fillRect(x - 22, y - 22, 44, 44);
          g.lineStyle(3, ink, 1);
          g.strokeRect(x - 22, y - 22, 44, 44);
        });
        g.lineStyle(5, ink, 1);
        for (let i = 0; i < breaks; i++) g.lineBetween(60 + i * 60, 90, 70 + i * 60, 215);
      }
      g.generateTexture(key, 300, 250);
      g.destroy();
    };
    city(LJ_ASSETS.cracked.key, 1, false);
    city(LJ_ASSETS.crumb1.key, 3, false);
    city(LJ_ASSETS.crumb2.key, 5, false);
    city(LJ_ASSETS.fallen.key, 0, true);

    if (!this.textures.exists(LJ_ASSETS.phalanx.key)) {
      const g = this.make.graphics({ add: false });
      [26, 46, 66, 86].forEach(x => {
        g.fillStyle(0xB8B6E4, 1);
        g.fillCircle(x, 44, 16);
        g.fillRect(x - 13, 52, 26, 50);
        g.lineStyle(4, ink, 1);
        g.strokeCircle(x, 44, 16);
        g.lineBetween(x - 6, 14, x - 6, 44);
      });
      g.generateTexture(LJ_ASSETS.phalanx.key, 112, 110);
      g.destroy();
    }

    if (!this.textures.exists(LJ_ASSETS.rock.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xC79C92, 1);
      g.fillRoundedRect(4, 8, 44, 32, 12);
      g.lineStyle(4, ink, 1);
      g.strokeRoundedRect(4, 8, 44, 32, 12);
      g.generateTexture(LJ_ASSETS.rock.key, 52, 46);
      g.destroy();
    }

    [[LJ_ASSETS.hornReady.key, false], [LJ_ASSETS.hornBlow.key, true]].forEach(([key, blowing]) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xB8B6E4, 1);
      g.fillCircle(40, 40, 22);
      g.fillRect(22, 58, 36, 62);
      g.lineStyle(4, ink, 1);
      g.strokeCircle(40, 40, 22);
      g.lineStyle(10, 0xD8B882, 1);
      if (blowing) g.lineBetween(56, 34, 86, 12);
      else g.lineBetween(58, 52, 86, 44);
      g.generateTexture(key, 100, 126);
      g.destroy();
    });
  }
}
