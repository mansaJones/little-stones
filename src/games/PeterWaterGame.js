// ============================================
// PETER WALKS ON WATER - Hold your finger on Jesus to keep Peter walking
// Matthew 14:22-33  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §16
// Art spec:      docs/Art_Plate_Prompts.md Scene 16
// ============================================

// Art plates live in assets/games/peter-water/
//   bg.jpg          — the Sea of Galilee at twilight. 2576x1438, aspect 1.791, resized not cropped.
//   peter-walk      — profile facing RIGHT. The default pose.
//   peter-sink      — one arm up, "oh!". Shown whenever he is not being held up.
//   peter-rescued   — hands clasped with someone off-frame right. BOTH endings use this: §16 is
//                     explicit that the fail state is a rescue, not a drowning.
//   jesus-water     — standing, hand out. Drawn FLIPPED, see PW_JESUS_FLIP below.
//   jesus-reach     — leaning down to lift someone. Also flipped.
//   fishing-boat    — left edge, static, two disciples watching.
//   wave-sweep      — HARD only. Wider than tall, so it covers Jesus completely.
const PW_ASSET_PATH = 'assets/games/peter-water/';
const PW_ASSETS = {
  bg:       { key: 'pw-bg',       file: 'bg.jpg' },
  walk:     { key: 'pw-walk',     file: 'peter-walk.png' },
  sink:     { key: 'pw-sink',     file: 'peter-sink.png' },
  rescued:  { key: 'pw-rescued',  file: 'peter-rescued.png' },
  jesus:    { key: 'pw-jesus',    file: 'jesus-water.png' },
  reach:    { key: 'pw-reach',    file: 'jesus-reach.png' },
  boat:     { key: 'pw-boat',     file: 'fishing-boat.png' },
  wave:     { key: 'pw-wave',     file: 'wave-sweep.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let PW_ART_PROBED = false;

// ---- The sea, MEASURED off the plate rather than chosen ----
// Scene 16 asked for "a clear horizontal band across the middle of the frame... where figures will
// walk on top of the water". What arrived has wave crests running from the middle all the way to
// the bottom edge and no clear band at all, so the lane is measured off the crests themselves:
// count the long horizontal outlines per row and take the bands that run the full plate width.
//
// Crest rows land at stage y 196, 225, 253, 283, 315, 340, 353. The first is the horizon.
// The walking lane is the THIRD crest: at 253 a figure's feet are among the waves while his head
// and shoulders are up against the sky, which is what reads as standing ON the water. Put him on
// the horizon instead and he looks like he is behind the sea.
//
// If the plate is ever redrawn, re-run the measurement in key_peter.py.
const PW_HORIZON = 196;
const PW_LANE = 253;

// ---- Figures ----
const PW_PETER_H = 84;
const PW_JESUS_H = 96;
const PW_BOAT_W = 150;
const PW_WAVE_W = 240;

const PW_BOAT_X = 78;
const PW_START_X = 118;     // Peter steps off the boat's right side
const PW_JESUS_X = 585;
const PW_END_X = 540;       // close enough to take a hand; he never walks THROUGH Jesus

// The delivered Jesus plates both reach toward the viewer's RIGHT, and §16 puts him on the right
// of the lane facing LEFT down it. So both are drawn flipped, and his reaching hand points at the
// incoming Peter instead of off the edge of the screen.
const PW_JESUS_FLIP = true;

// ---- The hold ----
// §16: "Press and hold on Jesus. The hit zone is about 1.5x his sprite."
const PW_ZONE = 1.5;
// §16: "150ms grace before sinking starts, so a finger twitch doesn't punish."
const PW_GRACE = 0.15;
const PW_RISE_RATE = 0.9;   // how fast the hold pulls him back up, per second
const PW_DRIFT_AMP = 30;    // how far Jesus bobs; the SPEED is the difficulty dial, not this

const PW_INTRO_MS = 900;
const PW_SINK_DEPTH = 0.5;  // sink = 1 hides half of him. §16: "waist-deep", never under.

class PeterWaterGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.PETER_WATER);
  }

  preload() {
    if (PW_ART_PROBED) return;
    PW_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[PeterWater] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(PW_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, PW_ASSET_PATH + a.file);
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
    this.walked = 0;                        // seconds of held walking, 0 .. walkTime
    this.sink = 0;                          // 0 = dry, 1 = waist-deep and rescued
    this.holding = false;
    this.offFor = 0;                        // seconds since the finger left, for the grace window
    this.driftT = 0;
    this.waveT = 0;
    this.waves = [];
    this.touchCancelled = false;
    this.stepT = 0;
    this.worldPoint = new Phaser.Math.Vector2();   // reused by readHold every frame

    this.viewLeft = -STAGE_X;
    this.viewRight = GAME_WIDTH + STAGE_X;

    this.add.image(0, 0, PW_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createBoat();
    this.createJesus();
    this.createPeter();
    this.createHUD();
    this.drawHUD();

    // §16: "Treat touchcancel (a system gesture, a notification pulling focus) as a lift, not an
    // error." Phaser usually turns it into a pointerup, but "usually" is not good enough when the
    // failure mode is a round that keeps walking with nobody touching the screen. The flag clears
    // on the next genuine pointerdown.
    this.onTouchCancel = () => { this.touchCancelled = true; };
    this.game.canvas.addEventListener('touchcancel', this.onTouchCancel);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.canvas.removeEventListener('touchcancel', this.onTouchCancel);
    });
    this.input.on('pointerdown', () => { this.touchCancelled = false; });

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  // ================================================================
  //  Intro — Matthew 14:29, "Come"
  // ================================================================

  runIntro() {
    this.prompt = this.add.text(GAME_WIDTH / 2, 86, 'Hold on Jesus!', {
      ...FONTS.TITLE, color: '#2B4C7E', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(900);

    this.tweens.add({
      targets: this.glow, alpha: { from: 0.15, to: 0.6 },
      duration: 420, yoyo: true, repeat: 1, ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(PW_INTRO_MS, () => {
      if (this.outcome) return;
      if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
      this.phase = 'play';
    });
  }

  // ================================================================
  //  Scene
  // ================================================================

  createBoat() {
    const b = this.add.image(PW_BOAT_X, PW_LANE + 10, PW_ASSETS.boat.key).setOrigin(0.5, 1).setDepth(10);
    b.setScale(PW_BOAT_W / b.width);
    this.boat = b;
  }

  createJesus() {
    // The glow is its own Graphics POSITIONED at Jesus and drawn at (0,0). Drawing the circle at
    // his coordinates on a graphics parked at the origin looks identical until something scales or
    // tweens it, at which point it scales about the stage corner and flies off screen.
    this.glow = this.add.graphics({ x: PW_JESUS_X, y: PW_LANE - PW_JESUS_H / 2 }).setDepth(19);
    this.glow.fillStyle(0xFFF6CF, 0.75);
    this.glow.fillCircle(0, 0, 54);
    this.glow.setAlpha(0);

    const j = this.add.image(PW_JESUS_X, PW_LANE, PW_ASSETS.jesus.key).setOrigin(0.5, 1).setDepth(20);
    j.setScale(PW_JESUS_H / j.height);
    j.setFlipX(PW_JESUS_FLIP);
    this.jesus = j;
  }

  createPeter() {
    const p = this.add.image(PW_START_X, PW_LANE, PW_ASSETS.walk.key).setOrigin(0.5, 1).setDepth(22);
    p.setScale(PW_PETER_H / p.height);
    this.peter = p;
    this.peterBaseH = p.height;            // unscaled, for setCrop maths
    this.waterline = this.add.graphics().setDepth(23);
  }

  // The zone §16 asks for: 1.5x the sprite, centred on wherever Jesus is this frame. Exposed as a
  // method rather than inlined so the harness can ask the game what it thinks the zone is instead
  // of recomputing it and testing its own arithmetic.
  jesusZone() {
    const w = this.jesus.displayWidth * PW_ZONE;
    const h = this.jesus.displayHeight * PW_ZONE;
    return new Phaser.Geom.Rectangle(this.jesus.x - w / 2,
                                     this.jesus.y - this.jesus.displayHeight - (h - this.jesus.displayHeight) / 2,
                                     w, h);
  }

  // §16: "Don't rely on pointerout for touch. It's unreliable on touch input. Each frame, check
  // pointer.isDown and the pointer's distance to Jesus' current position." Which is this, and it
  // is called from update() rather than from an event, deliberately.
  //
  // The sting in that tail: pointer.worldX is a CACHE, refreshed only when the scene's input
  // plugin runs a hit test, which is something EVENTS trigger. A game that polls the pointer
  // instead -- which is what §16 just asked for -- never refreshes it, so worldX sits equal to the
  // raw canvas x. On a stage-sized canvas those are the same number and nothing looks wrong; on a
  // 2.17 phone, where the canvas is 73px wider than the stage, every press lands 73px to the left
  // of where the child put their finger. So the transform is done here, explicitly, against the
  // camera this scene actually renders with.
  readHold() {
    if (this.touchCancelled) return false;
    const p = this.input.activePointer;
    if (!p || !p.isDown) return false;
    this.cameras.main.getWorldPoint(p.x, p.y, this.worldPoint);
    return Phaser.Geom.Rectangle.Contains(this.jesusZone(), this.worldPoint.x, this.worldPoint.y);
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play') return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    this.timeRemaining -= dt;
    this.moveJesus(dt);
    this.updateWaves(dt);

    const held = this.readHold();
    this.holding = held;

    if (held) {
      this.offFor = 0;
      this.walked = Math.min(this.config.walkTime, this.walked + dt);
      this.sink = Math.max(0, this.sink - PW_RISE_RATE * dt);
      this.splashSteps(dt);
    } else {
      // The grace window. Below it nothing happens at all -- not a slower sink, nothing -- so a
      // twitch that crosses the zone edge for one frame is free.
      this.offFor += dt;
      if (this.offFor > PW_GRACE) this.sink = Math.min(1, this.sink + this.config.sinkRate * dt);
    }

    this.layoutPeter();
    this.glow.setAlpha(held ? 0.55 : 0);

    if (this.walked >= this.config.walkTime) { this.handleWin(); return; }
    if (this.sink >= 1) { this.handleRescue('sank'); return; }
    if (this.timeRemaining <= 0) { this.handleRescue('clock'); return; }
    this.drawHUD();
  }

  moveJesus(dt) {
    this.driftT += dt * (this.config.driftSpeed || 0);
    const y = PW_LANE + (this.config.driftSpeed ? Math.sin(this.driftT) * PW_DRIFT_AMP : 0);
    this.jesus.y = y;
    this.glow.y = y - PW_JESUS_H / 2;
  }

  // §16, HARD: "big waves sweep across and hide him for a moment... The child has to keep their
  // finger where Jesus IS, not where they can see him. That is the lesson, delivered as a mechanic."
  // So the wave is drawn ABOVE Jesus and nothing about the hold changes while it passes.
  updateWaves(dt) {
    if (this.config.waveEvery) {
      this.waveT += dt;
      if (this.waveT >= this.config.waveEvery) {
        this.waveT = 0;
        const w = this.add.image(this.viewLeft - PW_WAVE_W, PW_LANE + 16, PW_ASSETS.wave.key)
          .setOrigin(0.5, 1).setDepth(40);
        w.setScale(PW_WAVE_W / w.width);
        this.waves.push(w);
      }
    }
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.x += 330 * dt;
      if (w.x > this.viewRight + PW_WAVE_W) { w.destroy(); this.waves.splice(i, 1); }
    }
  }

  // §16: "Pose is a pure function of (holding, sink level)". Not a state machine that something
  // can forget to leave -- recomputed every frame from the two numbers that matter.
  poseKey() {
    if (this.outcome) return PW_ASSETS.rescued.key;
    return this.sink > 0.02 && !this.holding ? PW_ASSETS.sink.key : PW_ASSETS.walk.key;
  }

  layoutPeter() {
    const t = this.config.walkTime > 0 ? this.walked / this.config.walkTime : 0;
    this.peter.x = PW_START_X + (PW_END_X - PW_START_X) * t;

    const key = this.poseKey();
    if (this.peter.texture.key !== key) {
      this.peter.setTexture(key);
      this.peter.setScale(PW_PETER_H / this.peter.height);
    }

    // §16: "Sinking is a setCrop on Peter's sprite plus a waterline overlay, not extra sink
    // sprites. Cheaper, and continuous." The crop is in SOURCE pixels, so it is taken against the
    // texture's own height rather than the 84px it displays at.
    const srcH = this.peter.frame.realHeight;
    const keep = 1 - this.sink * PW_SINK_DEPTH;
    this.peter.setCrop(0, 0, this.peter.frame.realWidth, srcH * keep);
    // setCrop keeps the sprite's origin, so with origin (0.5, 1) the visible part would hang from
    // where his feet used to be. Pull him down by exactly the cropped amount and the waterline
    // stays put while he sinks through it.
    this.peter.y = PW_LANE + (PW_PETER_H * (1 - keep));

    this.waterline.clear();
    if (this.sink > 0.02) {
      const y = PW_LANE - 2;
      const halfW = this.peter.displayWidth * 0.62;
      this.waterline.lineStyle(3, 0xFFFFFF, 0.75);
      this.waterline.beginPath();
      this.waterline.arc(this.peter.x, y, halfW, Math.PI * 0.08, Math.PI * 0.92);
      this.waterline.strokePath();
      if (Math.random() < 0.18) this.bubble(this.peter.x + Phaser.Math.Between(-10, 10), y);
    }
  }

  splashSteps(dt) {
    this.stepT += dt;
    if (this.stepT < 0.26) return;
    this.stepT = 0;
    const g = this.add.circle(this.peter.x - 6, PW_LANE - 2, 4, 0xFFFFFF, 0.85).setDepth(21);
    this.tweens.add({
      targets: g, scale: 2.1, alpha: 0, duration: 420, ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  bubble(x, y) {
    const b = this.add.circle(x, y, Phaser.Math.Between(2, 4), 0xFFFFFF, 0.8).setDepth(24);
    this.tweens.add({
      targets: b, y: y - 18, alpha: 0, duration: 620, ease: 'Sine.easeOut',
      onComplete: () => b.destroy(),
    });
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily: Phaser reuses the Scene instance, so an
  //  `if (!this.hudTimer)` guard sees a truthy handle to a destroyed object.
  //
  //  There is no sink meter in the chrome on purpose. §16 makes the meter diegetic -- "the
  //  waterline rises up Peter's body" -- and a bar in the corner would only compete with it.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 6, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#2B4C7E',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(900);
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
    this.phase = 'over';
    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.hudTimer.setVisible(false);
    this.glow.setAlpha(0);
    this.waterline.clear();
    this.waves.forEach(w => w.destroy());
    this.waves = [];
    this.peter.setCrop();
    this.peter.y = PW_LANE;
  }

  // Both endings land here. §16: "Peter never goes under. When the sink meter fills, Jesus reaches
  // out and pulls him up. That is exactly what Matthew 14:31 says happens, so the fail state is a
  // rescue." The only difference between winning and losing is where on the lane it happens and
  // what the caption says.
  clasp() {
    this.jesus.setTexture(PW_ASSETS.reach.key);
    this.jesus.setScale(PW_JESUS_H / this.jesus.height);
    this.jesus.setFlipX(PW_JESUS_FLIP);
    this.jesus.y = PW_LANE;
    this.peter.setTexture(PW_ASSETS.rescued.key);
    this.peter.setScale(PW_PETER_H / this.peter.height);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    this.endRound();
    this.clasp();
    this.peter.x = PW_END_X;

    this.add.text(GAME_WIDTH / 2, 348, 'Peter walked on water!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    // The walk is a fixed 5 seconds of holding, so the only thing elapsed time measures is how
    // much of the slack was spent not holding. Never letting go at all is perfect.
    const slack = this.config.timeLimit - this.config.walkTime;
    const spent = Math.max(0, elapsed - PW_INTRO_MS / 1000 - this.config.walkTime);
    const perfect = spent < slack * 0.1;
    const fast = spent < slack * 0.45;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.PETER_WATER,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleRescue(why) {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();

    // Jesus comes to him rather than Peter teleporting to Jesus — he is the one doing the saving.
    this.clasp();
    this.tweens.add({
      targets: this.jesus, x: Math.min(PW_JESUS_X, this.peter.x + 58),
      duration: 420, ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: this.peter, y: PW_LANE, duration: 420, ease: 'Sine.easeOut',
    });

    this.add.text(GAME_WIDTH / 2, 348, 'Keep your eyes on Jesus!', {
      ...FONTS.TITLE, color: '#2B4C7E', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.lossReason = why;
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.PETER_WATER,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/peter-water/ is missing or incomplete. The real plates shipped,
  //  so this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(PW_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xD9CCE8, 1); g.fillRect(0, 0, GAME_WIDTH, PW_HORIZON);
      g.fillStyle(0x9FB6DC, 1); g.fillRect(0, PW_HORIZON, GAME_WIDTH, GAME_HEIGHT - PW_HORIZON);
      g.lineStyle(2, ink, 0.5);
      [PW_LANE, 283, 315, 340].forEach(y => g.lineBetween(0, y, GAME_WIDTH, y));
      g.generateTexture(PW_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }

    const fig = (key, w, h, fill) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(fill, 1); g.lineStyle(4, ink, 1);
      g.fillRoundedRect(4, 4, w - 8, h - 8, 10);
      g.strokeRoundedRect(4, 4, w - 8, h - 8, 10);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    fig(PW_ASSETS.walk.key, 131, 185, 0xC98FA0);
    fig(PW_ASSETS.sink.key, 153, 185, 0xC98FA0);
    fig(PW_ASSETS.rescued.key, 171, 185, 0xC98FA0);
    fig(PW_ASSETS.jesus.key, 119, 212, 0xF4F4F4);
    fig(PW_ASSETS.reach.key, 116, 212, 0xF4F4F4);
    fig(PW_ASSETS.boat.key, 330, 269, 0xC9AE86);
    fig(PW_ASSETS.wave.key, 530, 287, 0x8C9AD6);
  }
}
