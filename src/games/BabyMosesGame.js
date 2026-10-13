// ============================================
// BABY MOSES IN THE BASKET - Tilt to steer the basket down the river
// Exodus 2:1-10  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §15
// Art spec:      docs/Art_Plate_Prompts.md Scene 15
// ============================================

// Art plates live in assets/games/baby-moses/
//   bg.jpg           — the still river, for the story / instruction / result pages only.
//   river-tile.jpg   — the SCROLLING water. 1200x750, built at asset time as [band | mirrored
//                      band] cropped from the middle of the plate, exactly as Scene 15 asks.
//                      Mirroring makes the texture's first and last columns identical, so a
//                      TileSprite wraps it with a measured seam of 0.00/255. Displayed at
//                      tileScale 0.5, so one period is 600px and the banks land where measured.
//   basket-moses     — the player. Top-down.
//   reed-clump       — obstacle. Top-down.
//   river-rock       — obstacle. Top-down.
//   hippo            — obstacle, MEDIUM and HARD. Top-down, surfaces mid-run.
//   pharaoh-daughter — the end of the run. SIDE view, which Scene 15 flags as intentional.
const BM_ASSET_PATH = 'assets/games/baby-moses/';
const BM_ASSETS = {
  bg:       { key: 'bm-bg',       file: 'bg.jpg' },
  tile:     { key: 'bm-tile',     file: 'river-tile.jpg' },
  basket:   { key: 'bm-basket',   file: 'basket-moses.png' },
  reeds:    { key: 'bm-reeds',    file: 'reed-clump.png' },
  rock:     { key: 'bm-rock',     file: 'river-rock.png' },
  hippo:    { key: 'bm-hippo',    file: 'hippo.png' },
  princess: { key: 'bm-princess', file: 'pharaoh-daughter.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let BM_ART_PROBED = false;

// ---- The river, MEASURED off the plate rather than chosen ----
// Classified by colour and scanned per column: the water body runs rows 192..1260 of 1438, and
// the top edge varies by ONE pixel across the whole 2576px plate. Deliberately NOT "wherever the
// grass stops": between grass and water there is a dusty-rose mud edge that belongs to the bank,
// and grass tufts poke down into it by up to 150px, so the grass edge is useless as a boundary.
//
// If the plate is ever redrawn, re-run the measurement in key_moses.py. Do not nudge these by eye.
const BM_RIVER = { top: 50, bottom: 329 };     // 279px of open water
const BM_TILE_PERIOD = 600;                    // display px per wrap, after tileScale 0.5

// ---- The basket ----
// It holds station in the left third (§15) and only ever moves up and down; the river moves past
// it. Everything downstream of here is authored against BM_BASKET_X.
const BM_BASKET_X = 150;
const BM_BASKET_W = 42;
const BM_BASKET_R = 18;                        // bump radius, inset from the sprite
const BM_EDGE_PAD = 4;                         // keeps the hull off the mud

// ---- The run ----
// §15: "the river run takes 7 seconds with zero bumps at every tier, and the round is 10 seconds.
// Each bump stalls the basket for 0.6s, so the timer is really a bump budget." Run length and
// stall are module constants because §15 holds them constant across tiers on purpose; only
// timeLimit is config, so adaptive difficulty can scale it. (10 - 7) / 0.6 = a budget of exactly
// five bumps at the stock timeLimit.
const BM_RUN_TIME = 7.0;
const BM_BUMP_STALL = 0.6;
const BM_SCROLL = 170;                         // px/s of river travel
const BM_STEER_SPEED = 200;                    // px/s of basket travel at full tilt
const BM_INTRO_MS = 900;
const BM_PRINCESS_AT = 0.86;                   // progress at which she slides onto the bank

// ---- Tilt, per §15 ----
const BM_TILT_DEAD = 3;                        // degrees of dead zone, for a child's unsteady hand
const BM_TILT_FULL = 25;                       // degrees for full steering speed
const BM_TILT_SMOOTH = 0.25;                   // low-pass factor per frame, ~60ms constant at 60fps
// Which way a tilt steers. The marble reading: the basket runs toward the edge of the device that
// is tipped DOWN. THIS IS THE ONE NUMBER IN THE FILE THAT A REAL PHONE HAS TO CONFIRM — a headless
// browser has no accelerometer, so the harness can prove the axis maths, the calibration, the dead
// zone and the scaling, but not the physical sign. Flip to -1 if it steers backwards on a device.
const BM_TILT_SIGN = 1;

// ---- Obstacles ----
const BM_LANES = 4;
const BM_OBSTACLE = {
  reeds: { key: 'bm-reeds', size: 58, r: 24 },
  rock:  { key: 'bm-rock',  size: 46, r: 19 },
  hippo: { key: 'bm-hippo', size: 68, r: 28 },
};

function bmLaneY(i) {
  return BM_RIVER.top + (BM_RIVER.bottom - BM_RIVER.top) * (i + 0.5) / BM_LANES;
}

// ---- Hand-authored patterns, NOT random spawns ----
// §15: "Random placement can produce a wall with no gap. Every pattern keeps a channel at least
// 1.5x the basket's width." That is 63px. With four lanes on a 279px river the widest obstacle
// (reeds, 58) still leaves 81px between two occupied lanes with one free between them, and 75px
// against a bank — so the rule that actually has to hold is simply that no column fills all four
// lanes. The harness checks every column of every pattern against the real sprite sizes rather
// than trusting that paragraph.
//
// `t` is WHEN THE OBSTACLE REACHES THE BASKET, in seconds of un-stalled run time. Authoring in
// arrival time rather than spawn x is what makes the free lane walk legible below, and it stays
// correct when a bump freezes the river.
//
// The free lane is listed per column because it is the actual design: consecutive columns never
// demand more travel than BM_STEER_SPEED can deliver in the gap between them.
const BM_PATTERNS = {
  // EASY — one obstacle at a time, 1.1s apart. Three lanes always open.
  easy: [
    { t: 1.3, lane: 2, type: 'reeds' },
    { t: 2.4, lane: 0, type: 'rock'  },
    { t: 3.5, lane: 3, type: 'reeds' },
    { t: 4.6, lane: 1, type: 'rock'  },
    { t: 5.7, lane: 3, type: 'reeds' },
  ],
  // MEDIUM — denser, columns of one and two, 0.9s apart. Plus the surfacing hippo.
  medium: [
    { t: 1.1, lane: 2, type: 'reeds' },
    { t: 2.0, lane: 0, type: 'rock'  },
    { t: 2.9, lane: 3, type: 'reeds' },
    { t: 3.8, lane: 1, type: 'rock'  }, { t: 3.8, lane: 2, type: 'reeds' },
    { t: 4.7, lane: 0, type: 'reeds' },
    { t: 5.6, lane: 2, type: 'rock'  }, { t: 5.6, lane: 3, type: 'reeds' },
    { t: 6.3, lane: 1, type: 'rock'  },
  ],
  // HARD — columns of up to three, 0.9s apart, so the single free lane has to be found and held.
  // free lane walks: {2,3} -> {0,1,2} -> {3} -> {0,1} -> {2} -> {0,3} -> {0,1,2}
  // The worst demanded move is two lanes (140px) in 0.9s = 156px/s, inside the 200px/s cap.
  hard: [
    { t: 0.9, lane: 0, type: 'reeds' }, { t: 0.9, lane: 1, type: 'rock'  },
    { t: 1.8, lane: 3, type: 'reeds' },
    { t: 2.7, lane: 0, type: 'rock'  }, { t: 2.7, lane: 1, type: 'reeds' }, { t: 2.7, lane: 2, type: 'rock' },
    { t: 3.6, lane: 2, type: 'reeds' }, { t: 3.6, lane: 3, type: 'rock'  },
    { t: 4.5, lane: 0, type: 'rock'  }, { t: 4.5, lane: 1, type: 'reeds' }, { t: 4.5, lane: 3, type: 'rock' },
    { t: 5.4, lane: 1, type: 'reeds' }, { t: 5.4, lane: 2, type: 'rock'  },
    { t: 6.2, lane: 3, type: 'reeds' },
  ],
};

// ================================================================
//  Device motion
//
//  Module-level and shared, because iOS grants the permission to the PAGE, not to a scene, and a
//  round restart must not ask again.
//
//  §15: "iOS Safari only delivers device motion after requestPermission() is called from a user
//  gesture... Never call it on page load: it fails silently and the game looks broken." So the
//  gated path is only ever entered from a real tap (InstructionScene's "tap to skip", or this
//  game's own intro beat), and the ungated platforms attach straight away so a child who never
//  taps still gets tilt.
// ================================================================
const BMMotion = {
  state: 'idle',        // idle | asked | live | denied | unsupported
  gotReading: false,    // the event firing is NOT the same as a sensor being behind it
  _raw: null,
  _attached: false,

  supported() {
    return typeof window !== 'undefined' && !!window.DeviceOrientationEvent;
  },

  gated() {
    return this.supported() && typeof window.DeviceOrientationEvent.requestPermission === 'function';
  },

  // Safe to call at any time: on iOS it does nothing and waits for a gesture.
  attachIfUngated() {
    if (!this.supported()) { this.state = 'unsupported'; return; }
    if (!this.gated()) this.attach();
  },

  // MUST be called from inside a user gesture.
  request() {
    if (this.state === 'live' || this.state === 'asked') return;
    if (!this.supported()) { this.state = 'unsupported'; return; }
    if (!this.gated()) { this.attach(); return; }
    this.state = 'asked';
    window.DeviceOrientationEvent.requestPermission()
      .then((r) => { if (r === 'granted') this.attach(); else this.state = 'denied'; })
      .catch(() => { this.state = 'denied'; });
  },

  attach() {
    this.state = 'live';
    if (this._attached) return;
    this._attached = true;
    window.addEventListener('deviceorientation', (e) => {
      // Desktop Chrome fires this with nulls. A null reading is not a reading, and treating it as
      // zero would hold the basket dead centre while the player drags.
      if (e.beta === null && e.gamma === null) return;
      this._raw = { beta: e.beta || 0, gamma: e.gamma || 0 };
      this.gotReading = true;
    });
  },

  // §15: "The orientation axes do not rotate with the screen. Read screen.orientation.angle and
  // pick the axis and sign from it, so landscape-left and landscape-right both steer the same way."
  screenAngle() {
    const o = (typeof window !== 'undefined') && window.screen && window.screen.orientation;
    if (o && typeof o.angle === 'number') return o.angle;
    if (typeof window !== 'undefined' && typeof window.orientation === 'number') return window.orientation;
    return 0;
  },

  // beta and gamma live in the DEVICE frame. Rotating that pair by the screen angle gives the tilt
  // along the screen's own vertical axis: beta in portrait, -gamma at 90, +gamma at 270. Degrees,
  // so §15's +/-3 and +/-25 thresholds mean what they say.
  tiltDegrees() {
    if (!this.gotReading || !this._raw) return null;
    const th = this.screenAngle() * Math.PI / 180;
    return this._raw.beta * Math.cos(th) - this._raw.gamma * Math.sin(th);
  },
};

class BabyMosesGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.BABY_MOSES);
  }

  preload() {
    if (BM_ART_PROBED) return;
    BM_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[BabyMoses] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(BM_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, BM_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;        // STRING: 'easy' | 'medium' | 'hard'

    this.ensureTextures();

    // ---- Round state. All of it reset here, never at declaration: Phaser reuses the Scene
    // instance across restarts, so anything left on `this` survives into the next round as a
    // stale handle to a destroyed GameObject.
    this.phase = 'intro';                     // intro -> play -> over
    this.outcome = null;
    this.timeRemaining = this.config.timeLimit;
    this.runClock = 0;                        // un-stalled seconds of travel, 0 .. BM_RUN_TIME
    this.progress = 0;
    this.stall = 0;                           // seconds of bump stall left
    this.bumps = 0;
    this.obstacles = [];
    this.spawned = 0;                         // how far into the pattern we have spawned
    this.hippo = null;
    this.princessIn = false;
    this.tiltNeutral = null;
    this.tiltFiltered = 0;
    this.dragActive = false;
    this.dragY = 0;

    // The visible stage edges in stage coordinates. On a 2.17 phone the canvas is wider than the
    // 667 stage, so obstacles must enter from the real screen edge rather than from x=667, or
    // they pop into existence in front of the player.
    this.viewLeft = -STAGE_X;
    this.viewRight = GAME_WIDTH + STAGE_X;
    this.spawnX = this.viewRight + 50;

    // The tier dials live in gameConfig.js with every other difficulty number; only the lane
    // geometry is here, because it is authored level data rather than something to tune.
    this.pattern = (BM_PATTERNS[this.config.obstacles] || BM_PATTERNS.easy).slice()
      .sort((a, b) => a.t - b.t);
    this.hippoAt = this.config.hippoAt || 0;

    this.createRiver();
    this.createBasket();
    this.createHUD();
    this.drawHUD();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Android and desktop have no permission gate, so tilt is live without anyone tapping.
    BMMotion.attachIfUngated();

    // Lay out the river BEFORE the intro rather than on the first play frame. At 170px/s an
    // obstacle takes 3.3s to cross from the right edge to the basket, but the patterns start
    // arriving at 0.9s -- so the opening stretch of every pattern is, correctly, already on the
    // water when the round begins. Spawning it here means the player watches the basket drift into
    // a river that already has reeds downstream, instead of watching five of them blink into
    // existence in the first frame of play.
    this.spawnDue();

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  // ================================================================
  //  Intro — Exodus 2:3, the basket is set afloat
  //
  //  Also the gated platforms' second chance at motion permission. InstructionScene asks on its
  //  "tap to skip", but that screen auto-advances after two seconds, so most rounds reach here
  //  without anyone having tapped. A tap during this beat is a genuine user gesture; after it,
  //  nothing in this scene ever asks again, so no permission dialog can appear mid-round.
  // ================================================================

  runIntro() {
    this.basket.setPosition(this.viewLeft - 40, bmLaneY(1));

    this.prompt = this.add.text(GAME_WIDTH / 2, 92,
      BMMotion.gated() && BMMotion.state === 'idle' ? 'Tap, then tilt to steer!' : 'Tilt to steer — or drag',
      { ...FONTS.TITLE, color: '#2F6690', fontSize: '19px', stroke: '#FFFFFF', strokeThickness: 5 }
    ).setOrigin(0.5).setDepth(900);

    if (BMMotion.gated() && BMMotion.state === 'idle') {
      this.introTap = () => BMMotion.request();
      this.input.once('pointerdown', this.introTap, this);
    }

    this.tweens.add({
      targets: this.basket, x: BM_BASKET_X, duration: BM_INTRO_MS, ease: 'Sine.easeOut',
    });

    this.time.delayedCall(BM_INTRO_MS, () => {
      if (this.outcome) return;
      if (this.introTap) { this.input.off('pointerdown', this.introTap, this); this.introTap = null; }
      if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
      this.basket.setPosition(BM_BASKET_X, bmLaneY(1));
      this.phase = 'play';
    });
  }

  // ================================================================
  //  Scene
  // ================================================================

  createRiver() {
    // Spans the CANVAS horizontally so the water runs edge to edge on a wide phone, but keeps the
    // stage's own height, because the bank lines were measured against a 375px stage. The vertical
    // bleed on a 4:3 tablet is covered by the dimmed still plate that main.js lays down.
    this.river = this.add.tileSprite(this.viewLeft, 0, CANVAS_WIDTH, GAME_HEIGHT, BM_ASSETS.tile.key)
      .setOrigin(0, 0).setDepth(0);
    const src = this.textures.get(BM_ASSETS.tile.key).getSourceImage();
    // The texture is exported at 2x so it stays crisp when a tablet scales the canvas up 1.8x.
    this.river.setTileScale(src && src.height ? GAME_HEIGHT / src.height : 0.5);
  }

  createBasket() {
    this.basket = this.add.image(BM_BASKET_X, bmLaneY(1), BM_ASSETS.basket.key).setDepth(20);
    this.basket.setScale(BM_BASKET_W / this.basket.width);
    this.ripple = this.add.graphics().setDepth(19);
  }

  laneTop() { return BM_RIVER.top + BM_BASKET_R + BM_EDGE_PAD; }
  laneBottom() { return BM_RIVER.bottom - BM_BASKET_R - BM_EDGE_PAD; }

  // ================================================================
  //  Input
  //
  //  Drag always wins while a finger is down. §15 makes it the fallback for "desktop, or a parent
  //  who taps Don't Allow", but a child who has started dragging should not then be fought by the
  //  accelerometer, so it takes over on contact and hands back on release.
  // ================================================================

  onPointerDown(pointer) {
    if (this.phase !== 'play') return;
    this.dragActive = true;
    this.dragY = pointer.worldY;
  }

  onPointerMove(pointer) {
    if (this.phase !== 'play' || !this.dragActive) return;
    this.dragY = pointer.worldY;
  }

  onPointerUp() {
    this.dragActive = false;
    // Re-calibrate on release: a child who put the phone down to drag is holding it differently
    // now, and §15's neutral capture is only meaningful against the current grip.
    this.tiltNeutral = null;
  }

  // -1 (toward the top bank) .. +1 (toward the bottom bank), or null when a drag owns the basket.
  readSteer() {
    const deg = BMMotion.tiltDegrees();
    if (deg === null) return 0;

    // §15: "Capture the current tilt as zero, because kids hold phones at every angle."
    //
    // SEED the filter with the first reading before capturing the neutral, rather than letting it
    // ramp up to it from zero. Filtering first and calibrating on the result captures a quarter of
    // the real angle -- so a child holding the phone at 18 degrees starts the round already at half
    // deflection and the basket bolts for the bank. Measured at 0.48 of full steer before this
    // line moved; 0.00 after.
    if (this.tiltNeutral === null) {
      this.tiltFiltered = deg;
      this.tiltNeutral = deg;
      return 0;
    }
    // From here the filter runs every frame, dead zone or not, so it has settled by the time a
    // tilt leaves the dead zone rather than ramping up from wherever it was parked.
    this.tiltFiltered += (deg - this.tiltFiltered) * BM_TILT_SMOOTH;
    let d = (this.tiltFiltered - this.tiltNeutral) * BM_TILT_SIGN;
    if (Math.abs(d) < BM_TILT_DEAD) return 0;
    d = d > 0 ? d - BM_TILT_DEAD : d + BM_TILT_DEAD;
    return Phaser.Math.Clamp(d / (BM_TILT_FULL - BM_TILT_DEAD), -1, 1);
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play') return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    // The clock never stops. That is the whole design: a stall costs time, and the timer is a
    // bump budget rather than a deadline.
    this.timeRemaining -= dt;

    this.steerBasket(dt);

    if (this.stall > 0) {
      this.stall = Math.max(0, this.stall - dt);
    } else {
      this.runClock += dt;
      this.progress = Math.min(1, this.runClock / BM_RUN_TIME);
      this.scrollRiver(dt);
    }

    this.spawnDue();
    this.moveObstacles(dt);
    this.checkBumps();
    this.drawRipple();

    if (this.progress >= 1) { this.handleWin(); return; }
    if (this.timeRemaining <= 0) { this.handleLoss(); return; }
    if (!this.princessIn && this.progress >= BM_PRINCESS_AT) this.bringPrincess();
    this.drawHUD();
  }

  steerBasket(dt) {
    let vy;
    if (this.dragActive) {
      // Moved at the same speed as a full tilt rather than pinned to the finger, so the two input
      // models feel the same and neither can teleport past an obstacle in one frame.
      const d = this.dragY - this.basket.y;
      vy = Phaser.Math.Clamp(d / Math.max(dt, 0.0001), -BM_STEER_SPEED, BM_STEER_SPEED);
    } else {
      vy = this.readSteer() * BM_STEER_SPEED;
    }

    // HARD's sideways current (§15). Zero elsewhere. It reverses, so it is a thing to lean against
    // rather than a constant offset the player can simply hold out.
    if (this.config.current) {
      vy += Math.sin((this.runClock / 3.2) * Math.PI * 2) * this.config.current;
    }

    this.basket.y = Phaser.Math.Clamp(this.basket.y + vy * dt, this.laneTop(), this.laneBottom());
  }

  scrollRiver(dt) {
    this.river.tilePositionX += (BM_SCROLL * dt) / this.river.tileScaleX;
  }

  // An obstacle's arrival time is authored; its x follows from how far the run still has to go.
  spawnDue() {
    const lead = (this.spawnX - BM_BASKET_X) / BM_SCROLL;
    while (this.spawned < this.pattern.length && this.runClock >= this.pattern[this.spawned].t - lead) {
      const p = this.pattern[this.spawned++];
      const spec = BM_OBSTACLE[p.type];
      const img = this.add.image(BM_BASKET_X + (p.t - this.runClock) * BM_SCROLL,
                                 bmLaneY(p.lane), spec.key).setDepth(10);
      img.setScale(spec.size / Math.max(img.width, img.height));
      this.obstacles.push({ sprite: img, r: spec.r, bumped: false, hippo: false });
    }
    if (this.hippoAt && !this.hippo && this.runClock >= this.hippoAt - lead) this.spawnHippo();
  }

  // §15, MEDIUM: "a hippo that surfaces mid-run". He is a moving obstacle rather than a placed
  // one — he rises out of the water and drifts across two lanes — which is what makes him worth
  // more than another rock.
  spawnHippo() {
    const img = this.add.image(BM_BASKET_X + (this.hippoAt - this.runClock) * BM_SCROLL,
                               bmLaneY(1.5), BM_ASSETS.hippo.key).setDepth(12);
    const full = BM_OBSTACLE.hippo.size / Math.max(img.width, img.height);
    img.setScale(full * 0.35).setAlpha(0.45);
    this.tweens.add({ targets: img, scale: full, alpha: 1, duration: 650, ease: 'Sine.easeOut' });
    this.hippo = { sprite: img, r: BM_OBSTACLE.hippo.r, bumped: false, hippo: true,
                   baseY: img.y, phase: 0 };
    this.obstacles.push(this.hippo);
  }

  moveObstacles(dt) {
    const step = this.stall > 0 ? 0 : BM_SCROLL * dt;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.sprite.x -= step;
      if (o.hippo && this.stall <= 0) {
        o.phase += dt;
        const span = (BM_RIVER.bottom - BM_RIVER.top) / 2 - o.r - 6;
        o.sprite.y = Phaser.Math.Clamp(o.baseY + Math.sin(o.phase * 1.1) * span * 0.55,
                                       BM_RIVER.top + o.r, BM_RIVER.bottom - o.r);
      }
      if (o.sprite.x < this.viewLeft - 80) {
        o.sprite.destroy();
        this.obstacles.splice(i, 1);
        if (o === this.hippo) this.hippo = null;
      }
    }
  }

  // One bump per obstacle, forever. Without the latch the basket stalls, the river freezes with
  // the obstacle still touching it, and the next frame stalls it again — a soft lock that looks
  // exactly like the game hanging.
  checkBumps() {
    if (this.stall > 0) return;
    for (const o of this.obstacles) {
      if (o.bumped) continue;
      const d = Phaser.Math.Distance.Between(this.basket.x, this.basket.y, o.sprite.x, o.sprite.y);
      if (d < BM_BASKET_R + o.r) { o.bumped = true; this.bump(o); return; }
    }
  }

  // §15: "the basket never tips and never sinks, and the baby is never in danger. A bump makes the
  // basket spin gently and the baby giggles."
  bump(o) {
    this.stall = BM_BUMP_STALL;
    this.bumps++;
    this.tweens.add({
      targets: this.basket, angle: this.basket.angle + 360,
      duration: BM_BUMP_STALL * 1000, ease: 'Sine.easeInOut',
      onComplete: () => { if (this.basket && this.basket.active) this.basket.setAngle(0); },
    });
    const t = this.add.text(this.basket.x, this.basket.y - 28, 'hee hee!', {
      ...FONTS.SMALL, fontSize: '14px', fontStyle: 'bold', color: '#D4596B',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(800);
    this.tweens.add({
      targets: t, y: t.y - 18, alpha: 0, duration: 700, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
    this.splash(o.sprite.x, o.sprite.y);
  }

  splash(x, y) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const g = this.add.circle(x, y, 4, 0xFFFFFF, 0.8).setDepth(810);
      this.tweens.add({
        targets: g, x: x + Math.cos(a) * 22, y: y + Math.sin(a) * 18,
        alpha: 0, scale: 0.3, duration: 480, ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      });
    }
  }

  drawRipple() {
    this.ripple.clear();
    if (this.stall > 0) return;
    this.ripple.lineStyle(2, 0xFFFFFF, 0.35);
    for (let i = 1; i <= 3; i++) {
      const x = this.basket.x - 16 - i * 13;
      const w = 7 + i * 3;
      this.ripple.beginPath();
      this.ripple.arc(x, this.basket.y, w, Math.PI * 0.62, Math.PI * 1.38);
      this.ripple.strokePath();
    }
  }

  bringPrincess() {
    this.princessIn = true;
    // Side view at the near bank, knees on the grass, arms reaching out over the water toward the
    // incoming basket. Scene 15 flags the mixed view as intentional.
    const p = this.add.image(this.viewRight + 60, BM_RIVER.bottom + 14, BM_ASSETS.princess.key)
      .setOrigin(0.5, 1).setDepth(30);
    p.setScale(112 / p.height);
    this.princess = p;
    this.tweens.add({ targets: p, x: GAME_WIDTH - 86, duration: 700, ease: 'Sine.easeOut' });
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily: Phaser reuses the Scene instance, so an
  //  `if (!this.hudTimer)` guard sees a truthy handle to a destroyed object.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 6, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#3C5A52',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(900);

    // §15: "Progress strip in the HUD: basket icon sliding toward a princess icon."
    this.hudTrack = this.add.graphics().setDepth(898);
    this.hudPrincess = this.add.image(GAME_WIDTH - 24, 22, BM_ASSETS.princess.key).setDepth(900);
    this.hudPrincess.setScale(26 / this.hudPrincess.height);
    this.hudBasket = this.add.image(0, 22, BM_ASSETS.basket.key).setDepth(901);
    this.hudBasket.setScale(17 / this.hudBasket.width);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    const x0 = GAME_WIDTH - 170;
    const x1 = GAME_WIDTH - 40;
    this.hudTrack.clear();
    this.hudTrack.fillStyle(0xFFFFFF, 0.45);
    this.hudTrack.fillRoundedRect(x0, 19, x1 - x0, 6, 3);
    this.hudTrack.fillStyle(0x7FB8A4, 0.95);
    this.hudTrack.fillRoundedRect(x0, 19, Math.max(6, (x1 - x0) * this.progress), 6, 3);
    this.hudBasket.setPosition(x0 + (x1 - x0) * this.progress, 22);
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
    this.hudTrack.setVisible(false);
    this.hudBasket.setVisible(false);
    this.hudPrincess.setVisible(false);
    this.ripple.clear();
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    this.endRound();
    if (!this.princessIn) this.bringPrincess();

    // §15: "Pharaoh's daughter lifts the basket from the reeds."
    this.tweens.add({
      targets: this.basket, x: GAME_WIDTH - 118, y: BM_RIVER.bottom - 52,
      duration: 650, ease: 'Sine.easeInOut',
    });

    this.add.text(GAME_WIDTH / 2, 348, 'God kept baby Moses safe!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    // A clean run is 7.0s of travel plus the intro. Every bump adds 0.6s, so "perfect" is literally
    // "never touched anything" and "fast" is "at most one bump", rather than an arbitrary fraction.
    const perfect = this.bumps === 0;
    const fast = this.bumps <= 1;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.BABY_MOSES,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();

    // §15: "Basket still bobbing peacefully downstream." Nothing bad has happened to the baby —
    // the run simply ran out of clock.
    this.tweens.add({
      targets: this.basket, y: this.basket.y - 7,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(GAME_WIDTH / 2, 348, 'Keep steering!', {
      ...FONTS.TITLE, color: '#2F6690', fontSize: '22px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.BABY_MOSES,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/baby-moses/ is missing or incomplete. The real plates shipped,
  //  so this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(BM_ASSETS.tile.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xBCD9C4, 1); g.fillRect(0, 0, BM_TILE_PERIOD, GAME_HEIGHT);
      g.fillStyle(0xC9E4EE, 1);
      g.fillRect(0, BM_RIVER.top, BM_TILE_PERIOD, BM_RIVER.bottom - BM_RIVER.top);
      g.lineStyle(3, ink, 1);
      g.lineBetween(0, BM_RIVER.top, BM_TILE_PERIOD, BM_RIVER.top);
      g.lineBetween(0, BM_RIVER.bottom, BM_TILE_PERIOD, BM_RIVER.bottom);
      g.generateTexture(BM_ASSETS.tile.key, BM_TILE_PERIOD, GAME_HEIGHT);
      g.destroy();
    }
    if (!this.textures.exists(BM_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xBCD9C4, 1); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xC9E4EE, 1);
      g.fillRect(0, BM_RIVER.top, GAME_WIDTH, BM_RIVER.bottom - BM_RIVER.top);
      g.generateTexture(BM_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }

    const blob = (key, w, h, fill) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(fill, 1); g.lineStyle(4, ink, 1);
      g.fillEllipse(w / 2, h / 2, w - 8, h - 8);
      g.strokeEllipse(w / 2, h / 2, w - 8, h - 8);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    blob(BM_ASSETS.basket.key, 96, 96, 0xD8B88A);
    blob(BM_ASSETS.reeds.key, 128, 121, 0x8FA98B);
    blob(BM_ASSETS.rock.key, 102, 102, 0xB89C9C);
    blob(BM_ASSETS.hippo.key, 139, 150, 0xA9A3BC);
    blob(BM_ASSETS.princess.key, 182, 246, 0xF2F2F2);
  }
}
