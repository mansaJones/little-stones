// ============================================
// MOSES PARTS THE RED SEA - Spread two fingers to open the path, hold it while they cross
// Exodus 14:21-22  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §20
// Art spec:      docs/Art_Plate_Prompts.md Scene 20
// ============================================

// Art plates live in assets/games/red-sea/
//   bg.jpg          — the seabed and both shores. NO WATER: the sea has to open, so it cannot be
//                     in the backdrop. Scene 20's layer 0.
//   water-top       — the upper wall. Its wave curls run along its BOTTOM edge.
//   water-bottom    — the lower wall. Curls along its TOP edge.
//   moses           — near shore, left, drawn ON TOP of the water (Scene 20's layer 3).
//   crosser-a/b/c   — bundle carrier, mother and child, goat herder. Scene 20's layer 1.
const RS_ASSET_PATH = 'assets/games/red-sea/';
const RS_ASSETS = {
  bg:     { key: 'rs-bg',     file: 'bg.jpg' },
  wtop:   { key: 'rs-wtop',   file: 'water-top.png' },
  wbot:   { key: 'rs-wbot',   file: 'water-bottom.png' },
  moses:  { key: 'rs-moses',  file: 'moses.png' },
  crossA: { key: 'rs-cross-a', file: 'crosser-a.png' },
  crossB: { key: 'rs-cross-b', file: 'crosser-b.png' },
  crossC: { key: 'rs-cross-c', file: 'crosser-c.png' },
};
const RS_CROSSER_KEYS = ['crossA', 'crossB', 'crossC'];

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let RS_ART_PROBED = false;

// ---- Layout, measured off the plate (key_redsea.py prints these) ----
//
// The horizon is the whole story of this game's geometry. Scene 20 asked for a seabed "across the
// whole middle of the frame"; the delivered plate puts the horizon 59% of the way down, so the dry
// sand is only the bottom 41.3%. The path has to live entirely on that sand -- open it any wider
// and the top wall's edge climbs above the horizon, leaving a band of SKY between the water and the
// ground, which reads as water floating in mid-air.
//
// So the path is centred on the seabed, not on the screen, and its widest half is whatever keeps
// both walls on screen: 77.5px either side, a 154.9px path.
const RS_HORIZON = 220.1;
const RS_PATH_CY = 297.5;
const RS_MAX_HALF = 77.5;

// §20 states the thresholds as "the path needs to be at least 30% of the screen height", which the
// plate cannot deliver on HARD -- 50% of 375 is 187.5px against a 154.9px ceiling. So
// `requiredSpread` is read as the FINGER SPREAD rather than the drawn path, and the path follows at
// this gain. Every number in §20 survives: HARD still demands a 187.5px stretch, which §20 rightly
// calls "a real stretch" on a phone, and it draws a 131px path with room to spare.
//
//      finger spread        drawn path
//      30%  112.5px    ->    78.8px
//      40%  150.0px    ->   105.0px
//      50%  187.5px    ->   131.3px        (the seabed caps it at 154.9)
const RS_SPREAD_GAIN = 0.70;

// §20: "The water walls follow the fingers with slight lag, so they feel heavy." A time constant,
// not a per-frame fraction -- a fraction makes the weight of the sea depend on the frame rate.
const RS_WALL_TAU = 0.11;

const RS_CROSSER_H = 46;
const RS_FEET = RS_PATH_CY + RS_CROSSER_H / 2;   // walk the middle of the corridor
// The crossing has to FIT. §20 asks for 8 people across in 10 seconds, and the clock is set by the
// LAST of them, not the first: with the queue strung out behind the near shore, the tail walks
// (RS_END_X - RS_START_X) + (n-1) * RS_QUEUE_GAP. At 62px/s and a 30px gap that was 658px = 10.6s
// before the intro had even finished, and HARD measured 6/8 at the buzzer with a perfect hold.
// 92px/s over 626px is 6.8s, which leaves about two seconds for the player to find the spread and
// still rewards holding it -- people stop the moment it narrows, and that is where the time goes.
const RS_START_X = 118;
const RS_END_X = 548;
const RS_QUEUE_GAP = 34;
const RS_WALK_SPEED = 92;        // px/s
// The crossers are 38-48px wide, so a queue spaced tighter than that overlaps into one smear --
// eight of them at a 28px gap were a single lump of elbows. They also walk in two ranks, alternating
// this far above and below the walking line, which separates them and reads as a crowd leaving
// together rather than a conga line.
const RS_RANK_DY = 9;
const RS_MOSES_X = 78;
const RS_MOSES_H = 112;
const RS_MOSES_FEET = 352;
const RS_SINGLE_MS = 300;        // §20: the one-finger fallback waits this long first
const RS_INTRO_MS = 900;

class RedSeaGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.RED_SEA);
  }

  preload() {
    if (RS_ART_PROBED) return;
    RS_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[RedSea] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(RS_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, RS_ASSET_PATH + a.file);
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
    this.half = 0;                          // the drawn half-path, lagging behind the fingers
    this.targetHalf = 0;
    this.spread = 0;                        // the raw finger spread, in stage px
    this.open = false;
    this.arrived = 0;
    this.crossers = [];
    this.onePointerSince = 0;

    // §20, and it is the difference between a game and a brick: "Phaser tracks one touch pointer by
    // default. Call this.input.addPointer(1) in create() to track a second, or the second finger is
    // ignored and the game is unplayable on touch."
    this.input.addPointer(1);
    this.worldPoint = new Phaser.Math.Vector2();

    this.add.image(0, 0, RS_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.glow = this.add.graphics().setDepth(5);
    this.createCrossers();
    this.createWater();
    // Scene 20's layer 3: Moses sits ABOVE the water, so he stands in front of the wall rather than
    // being swallowed by it when the sea closes.
    this.moses = this.add.image(RS_MOSES_X, RS_MOSES_FEET, RS_ASSETS.moses.key)
      .setOrigin(0.5, 1).setDepth(40);
    this.moses.setScale(RS_MOSES_H / this.moses.height);

    this.createHUD();
    this.drawHUD();
    this.layout();

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  // ================================================================
  //  Scene
  // ================================================================

  createWater() {
    // Scene 20: "The water walls are two sprites that move apart, not scale. Scaling would stretch
    // the outlines." Each is scaled ONCE here to the canvas width and then only ever translated.
    // The canvas, not the stage: on a widened phone the stage is a 667px window on a wider canvas,
    // and a wall only as wide as the stage would leave the sea with visible ends.
    const w = CANVAS_WIDTH;
    this.wallTop = this.add.image(-STAGE_X, 0, RS_ASSETS.wtop.key).setOrigin(0, 1).setDepth(20);
    this.wallTop.setScale(w / this.wallTop.width);
    this.wallBot = this.add.image(-STAGE_X, 0, RS_ASSETS.wbot.key).setOrigin(0, 0).setDepth(20);
    this.wallBot.setScale(w / this.wallBot.width);
  }

  createCrossers() {
    const n = this.config.crossers;
    for (let i = 0; i < n; i++) {
      const key = RS_ASSETS[RS_CROSSER_KEYS[i % RS_CROSSER_KEYS.length]].key;
      const dy = (i % 2 === 0) ? -RS_RANK_DY : RS_RANK_DY;
      const img = this.add.image(RS_START_X - i * RS_QUEUE_GAP, RS_FEET + dy, key)
        .setOrigin(0.5, 1).setDepth(10 + (i % 2));
      img.setScale(RS_CROSSER_H / img.height);
      this.crossers.push({ img: img, x: img.x, dy: dy, done: false, walking: false });
    }
  }

  runIntro() {
    this.prompt = this.add.text(GAME_WIDTH / 2, 36, 'Spread two fingers to part the sea!', {
      ...FONTS.TITLE, color: '#2B4A6B', fontSize: '18px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(900);

    this.time.delayedCall(RS_INTRO_MS, () => {
      if (this.outcome) return;
      this.phase = 'play';
      this.tweens.add({ targets: this.prompt, alpha: 0, duration: 400,
                        onComplete: () => { if (this.prompt) { this.prompt.destroy(); this.prompt = null; } } });
    });
  }

  // ================================================================
  //  Input
  //
  //  §20: "Two-finger vertical spread. The width of the dry path follows the vertical distance
  //  between the fingers... With a single finger, the path width follows that finger's distance
  //  from the centre line, doubled." And: "Use only the y-distance between the two pointers;
  //  ignore x."
  // ================================================================

  // pointer.worldY is a CACHE that Phaser refreshes when its input plugin runs a hit test -- that
  // is, on input EVENTS. This game POLLS, so the cache goes stale and worldY stays equal to the raw
  // canvas y. On a widened canvas that is the stage offset out, every frame. (Peter Walks on Water
  // shipped that bug and was unplayable on a 2.17 phone until it was measured.) getWorldPoint is
  // computed on demand, so it is always right.
  stageY(p) {
    this.cameras.main.getWorldPoint(p.x, p.y, this.worldPoint);
    return this.worldPoint.y;
  }

  readSpread(dt) {
    const down = [];
    for (let i = 0; i < this.input.manager.pointers.length; i++) {
      const p = this.input.manager.pointers[i];
      if (p && p.isDown) down.push(p);
    }

    if (down.length >= 2) {
      this.onePointerSince = 0;
      return Math.abs(this.stageY(down[0]) - this.stageY(down[1]));
    }
    if (down.length === 1) {
      // §20: "Single-pointer fallback kicks in when only one pointer has been down for more than
      // 300ms." The wait is what stops a two-finger gesture whose fingers land a frame apart from
      // being read as one finger and snapping the sea open.
      this.onePointerSince += dt;
      if (this.onePointerSince * 1000 < RS_SINGLE_MS) return this.spread;
      return Math.abs(this.stageY(down[0]) - RS_PATH_CY) * 2;
    }
    this.onePointerSince = 0;
    return 0;
  }

  // ================================================================
  //  The sea
  // ================================================================

  // §20: "nobody is ever in the water... The water walls can't close on anyone." So whatever the
  // fingers ask for, the walls stop at whatever clears the people currently out on the sand. They
  // still STOP WALKING when the path is under the required width -- that is the pressure -- but the
  // sea never shuts over a child's head.
  clearanceHalf() {
    let need = 0;
    for (let i = 0; i < this.crossers.length; i++) {
      const c = this.crossers[i];
      if (c.done || c.x <= RS_START_X) continue;
      need = RS_CROSSER_H / 2 + RS_RANK_DY + 3;
      break;
    }
    return need;
  }

  layout() {
    const top = RS_PATH_CY - this.half;
    const bot = RS_PATH_CY + this.half;
    this.wallTop.y = top;        // origin (0,1): its bottom edge, where the curls are
    this.wallBot.y = bot;        // origin (0,0): its top edge

    // §20: "The path glows gold when it's wide enough to walk."
    this.glow.clear();
    if (this.open) {
      const x0 = -STAGE_X, w = CANVAS_WIDTH;
      this.glow.fillStyle(0xFFD98A, 0.20);
      this.glow.fillRect(x0, top, w, bot - top);
      this.glow.lineStyle(2, 0xFFC24D, 0.75);
      this.glow.lineBetween(x0, top + 1, x0 + w, top + 1);
      this.glow.lineBetween(x0, bot - 1, x0 + w, bot - 1);
    }
  }

  stepCrossers(dt) {
    let lead = Infinity;
    for (let i = 0; i < this.crossers.length; i++) {
      const c = this.crossers[i];
      if (c.done) continue;
      // Nobody walks unless the sea is open wide enough, and nobody walks through the person in
      // front. §20: "anyone mid-path pauses if it narrows."
      const blocked = (lead - c.x) < RS_QUEUE_GAP;
      c.walking = this.open && !blocked;
      if (c.walking) c.x += RS_WALK_SPEED * dt;
      if (c.x >= RS_END_X) {
        c.done = true;
        this.arrived++;
        c.img.x = RS_END_X + (this.arrived % 3) * 16;
        this.cheer(c);
        this.drawHUD();
        continue;
      }
      c.img.x = c.x;
      lead = c.x;
    }
    if (this.arrived >= this.crossers.length) this.handleWin();
  }

  cheer(c) {
    this.tweens.add({ targets: c.img, y: RS_FEET + c.dy - 10, duration: 170,
                      yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play' || this.outcome) return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) { this.handleLoss(); return; }

    this.spread = this.readSpread(dt);
    this.open = this.spread >= this.config.requiredSpread * GAME_HEIGHT;

    const want = Phaser.Math.Clamp(this.spread * RS_SPREAD_GAIN / 2, 0, RS_MAX_HALF);
    this.targetHalf = Math.max(want, this.clearanceHalf());
    // An exponential approach on a time constant, so the sea feels equally heavy at any frame rate.
    this.half += (this.targetHalf - this.half) * (1 - Math.exp(-dt / RS_WALL_TAU));

    this.stepCrossers(dt);
    this.layout();
    this.drawHUD();
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily: Phaser reuses the Scene instance, so an
  //  `if (!this.hudTimer)` guard sees a truthy handle to a destroyed object.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 6, '', {
      ...FONTS.TIMER, fontSize: '24px', color: '#2B4A6B',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(900);

    this.hudCount = this.add.text(GAME_WIDTH - 14, 10, '', {
      ...FONTS.SMALL, fontSize: '16px', fontStyle: 'bold', color: '#2B4A6B',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(900);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    this.hudCount.setText(this.arrived + '/' + this.crossers.length);
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.phase = 'over';
    this.hudTimer.setVisible(false);
    this.hudCount.setVisible(false);
    this.glow.clear();
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    const spent = this.config.timeLimit - this.timeRemaining;
    this.endRound();

    // §20: "the water gently closes behind them over an empty path". It is only gentle, and only
    // decent, because everyone is already on the far shore by the time this runs.
    this.tweens.add({
      targets: this, half: 0, duration: 1100, ease: 'Sine.easeInOut',
      onUpdate: () => this.layout(),
    });
    this.crossers.forEach((c, i) => this.tweens.add({
      targets: c.img, y: RS_FEET + c.dy - 12, duration: 190, delay: i * 70,
      yoyo: true, repeat: 1, ease: 'Quad.easeOut',
    }));

    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.add.text(GAME_WIDTH / 2, 62, 'God made a way!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '22px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    const perfect = spent < this.config.timeLimit * 0.4;
    const fast = spent < this.config.timeLimit * 0.65;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.RED_SEA,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    if (this.outcome) return;
    this.outcome = 'loss';
    const elapsed = this.elapsedSeconds();
    this.endRound();

    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.add.text(GAME_WIDTH / 2, 62, 'Hold the water open!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.RED_SEA,
        points: 0,
        timeElapsed: elapsed,
      });
    });
  }

  // ================================================================
  //  Placeholders, so the game is playable before the art lands
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(RS_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xE7D8EE, 1); g.fillRect(0, 0, GAME_WIDTH, RS_HORIZON);
      g.fillStyle(0xC9B08C, 1); g.fillRect(0, RS_HORIZON, GAME_WIDTH, GAME_HEIGHT - RS_HORIZON);
      g.generateTexture(RS_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }
    [['wtop', false], ['wbot', true]].forEach(([n, flip]) => {
      if (this.textures.exists(RS_ASSETS[n].key)) return;
      const W = 1334, H = 556;
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x8FA9D6, 1); g.fillRect(0, 0, W, H);
      g.fillStyle(0xA9C7DE, 1); g.fillRect(0, flip ? H - 60 : 0, W, 60);
      g.lineStyle(6, ink, 1);
      const edge = flip ? 8 : H - 8;
      g.beginPath(); g.moveTo(0, edge); g.lineTo(W, edge); g.strokePath();
      g.generateTexture(RS_ASSETS[n].key, W, H);
      g.destroy();
    });
    if (!this.textures.exists(RS_ASSETS.moses.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x8FD6B4, 1); g.fillCircle(109, 58, 46);
      g.fillStyle(0xF4EBD6, 1); g.lineStyle(5, ink, 1);
      g.fillRect(62, 100, 94, 146); g.strokeRect(62, 100, 94, 146);
      g.generateTexture(RS_ASSETS.moses.key, 218, 246);
      g.destroy();
    }
    [['crossA', 0x8FD6B4], ['crossB', 0xC4B2E8], ['crossC', 0xD4A8C4]].forEach(([n, skin]) => {
      if (this.textures.exists(RS_ASSETS[n].key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(skin, 1); g.fillCircle(50, 26, 22);
      g.fillStyle(0xF4EBD6, 1); g.lineStyle(4, ink, 1);
      g.fillRect(30, 46, 40, 54); g.strokeRect(30, 46, 40, 54);
      g.generateTexture(RS_ASSETS[n].key, 101, 102);
      g.destroy();
    });
  }
}
