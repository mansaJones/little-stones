// ============================================
// DAVID vs GOLIATH - Pull the sling back and release
// 1 Samuel 17  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §10
// Art spec:      docs/Art_Plate_Prompts.md Scene 12
// ============================================

// Art plates live in assets/games/david-goliath/
//   bg.jpg          — the canyon. Empty: both characters are sprites, not painted in.
//   david-idle      — empty-handed, waiting.
//   david-aim       — sling drawn back.
//   david-release   — sling released, mid-follow-through.
//   goliath         — the giant, facing left.
//   sling           — the sling alone. Scene 12 generated it so it could be rotated on the drag,
//                     but the three David poses already carry a drawn sling and two slings on
//                     screen reads as a bug. It was then tried as the attempts icon and does not
//                     work there either: at 2.1:1 it is a squiggle at any size that fits three in
//                     a corner. The stone took that job. The plate ships unused rather than being
//                     forced somewhere it does not belong.
//   stone           — the stone in flight.
const DVG_ASSET_PATH = 'assets/games/david-goliath/';
const DVG_ASSETS = {
  bg:      { key: 'dvg-bg',      file: 'bg.jpg' },
  idle:    { key: 'dvg-idle',    file: 'david-idle.png' },
  aim:     { key: 'dvg-aim',     file: 'david-aim.png' },
  release: { key: 'dvg-release', file: 'david-release.png' },
  goliath: { key: 'dvg-goliath', file: 'goliath.png' },
  sling:   { key: 'dvg-sling',   file: 'sling.png' },
  stone:   { key: 'dvg-stone',   file: 'stone.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let DVG_ART_PROBED = false;

// ---- Layout, measured off the plates (ground.py and key_david.py print all of it) ----
//
// The canyon floor is not where it looks. A first pass classified "warm" pixels as sand and put
// the ground at 47% of frame height; the dusty-rose rock formations are warm too, so it had found
// rock. Walking UP from the bottom of each column instead -- the bottom edge is unambiguously
// floor -- puts the open floor's top edge at stage y 290.8..293.4 across the middle third.
const DVG_GROUND_Y = 292;

// §10: David is "roughly half of GOLIATH's height". Enforced here, not left to the plates: each
// sprite was drawn to fill its own 2048 frame, so their plate heights say nothing about scale.
const DVG_GOLIATH_H = 200;
const DVG_DAVID_H = 100;

const DVG_DAVID_X = 110;        // left third, per Scene 12's composition
const DVG_GOLIATH_X0 = 480;     // right half

// David's three poses share ONE scale factor, so he cannot change size between frames. The aiming
// plate is genuinely 4px shorter than the idle plate at that scale, so anchoring at the FEET makes
// him crouch by exactly the amount the artist drew him crouching. Anchoring at the centre instead
// would have made him hover.
const DVG_HAND = { x: 26, y: -58 };   // sling hand, relative to David's feet, measured off the aim plate

// Goliath's hitboxes, as fractions of his sprite box. Measured from his silhouette and from where
// the white of his eyes actually is, not from a guess about where a forehead goes:
//
//   top of helmet          sprite y   0.00
//   helmet becomes solid              0.07
//   EYES (most white px)              0.27
//   tusks / jaw                       0.38
//   shoulders take over               0.43
//
// so the forehead is the helmet band above the eyes, and the head ends where the shoulders start.
// The x range is the helmet's own, measured before the pauldron enters the row at y 0.17 -- taking
// the full row width would have made his shoulder count as his head.
// Horizontal BANDS, not rectangles. The silhouette already says which x values are him at each
// height, so a separate x range adds nothing and actively breaks things: the forehead rectangle's
// left edge was x 0.110 while his helmet already starts at 0.093, so a stone arriving from David's
// side -- which is every stone -- clipped the silhouette one pixel outside the rectangle, scored
// as a plain head hit, and ended the round. The forehead was unreachable from the only direction
// anyone can shoot from. Depth of band is the whole definition:
//
//   y 0.065   helmet is solid
//   y 0.100   FOREHEAD starts
//   y 0.240   FOREHEAD ends
//   y 0.270   eyes
//   y 0.425   shoulders take over, head ends
// Bounded on the RIGHT only. Goliath is hunched, so his pauldron and raised shoulder sit level
// with his helmet -- a pure depth band cannot tell them apart, and the 48-band silhouette shows
// the row at forehead height running all the way out to 0.83 of his width. But bounding the LEFT
// edge is what made the forehead unreachable: every stone arrives from David's side, so it touches
// the silhouette's leading edge first, and if that edge sits outside the box the shot is scored as
// something else a pixel before it can land. Left edge = wherever he starts; right edge excludes
// the shoulder.
//
// The forehead runs from the top of the helmet down to just above the eyes. 1 Samuel 17:49 has the
// stone sinking into his forehead, and a slung stone arriving on a falling arc strikes the crown
// of the helmet first, so the band starts there rather than below it.
//
//   y 0.065  helmet is solid          y 0.240  just above the eyes
//   y 0.270  eyes                     y 0.330  jaw / tusks, head ends
const DVG_HEAD     = { y0: 0.065, y1: 0.330, xMax: 0.58 };
const DVG_FOREHEAD = { y0: 0.065, y1: 0.240, xMax: 0.55 };

// His actual silhouette, 24 bands measured off goliath.png: the x span that is really him in each
// horizontal slice, as fractions of his sprite box.
//
// Testing the bounding RECTANGLE instead was a real bug, not a rounding error. The box is 146x200
// but he only fills 78% of its width on average -- and in the top band, where it is just the
// helmet spike, 6.5%. So a stone sailing clear over his shoulder, visibly missing, registered as a
// body hit. On EASY that handed out wins for near misses; on HARD it ate good forehead shots
// before they arrived, because his advancing bounding box swept into them first. The harness found
// it by tracing a led shot that was on course and still lost.
const DVG_SILHOUETTE = [
  [0.240, 0.280], [0.234, 0.299], [0.202, 0.430], [0.150, 0.470],
  [0.118, 0.495], [0.093, 0.514], [0.078, 0.523], [0.069, 0.670],
  [0.065, 0.738], [0.062, 0.794], [0.053, 0.832], [0.053, 0.844],
  [0.072, 0.847], [0.075, 0.872], [0.078, 0.891], [0.065, 0.910],
  [0.059, 0.925], [0.062, 0.941], [0.065, 0.953], [0.065, 0.966],
  [0.053, 0.975], [0.044, 0.984], [0.034, 0.991], [0.025, 0.994],
  [0.019, 0.997], [0.016, 0.997], [0.012, 0.997], [0.012, 1.000],
  [0.000, 1.000], [0.000, 0.991], [0.009, 0.981], [0.012, 0.972],
  [0.016, 0.963], [0.019, 0.960], [0.028, 0.953], [0.025, 0.953],
  [0.025, 0.950], [0.028, 0.944], [0.034, 0.931], [0.072, 0.897],
  [0.212, 0.816], [0.218, 0.829], [0.196, 0.838], [0.134, 0.854],
  [0.121, 0.863], [0.121, 0.866], [0.121, 0.863], [0.209, 0.813],
];

// ---- Projectile constants, derived from the layout rather than tuned by feel ----
//
// The first derivation used the flat-range formula, v^2/g, and was wrong: that formula assumes the
// target is at the same height as the launch, and Goliath's forehead is 108px ABOVE David's hand.
// Climbing costs energy the flat formula never charges for. The honest minimum launch speed to
// reach a point dx across and h up is
//
//     v_min^2 = g * (h + sqrt(dx^2 + h^2))
//
// which for the forehead (dx 315, h 108) is 630px/s, not the 566 the flat formula claimed. At the
// original MAX_PULL x POWER of 665px/s that put the forehead at 95% of the entire envelope -- and
// only at the one minimum-energy angle, which a child would have to hit exactly. The harness
// caught it: solved forehead shots came back "out of range".
//
// 855px/s puts the forehead at 74% of full stretch, so there is room to pull harder or softer and
// still connect, while the flat range of 812px stays wider than the 667px stage -- overshooting
// off the top of the screen is still a real way to miss.
//
//     forehead  dx 315  up 108   v_min 630   74% of max pull
//     head      dx 307  up  89   v_min 606   71%
//     body      dx 344  up  -8   v_min 550   64%
const DVG_GRAVITY = 900;
const DVG_MAX_PULL = 95;
const DVG_POWER = 9.0;
const DVG_MIN_PULL = 12;        // below this it is a tap, not a shot; ignore it rather than dribble

const DVG_STONE_STEP = 1 / 240; // fixed integration step, so the arc does not change with framerate

class DavidVsGoliathGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.DAVID_VS_GOLIATH);
  }

  preload() {
    if (DVG_ART_PROBED) return;
    DVG_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[DavidVsGoliath] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(DVG_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, DVG_ASSET_PATH + a.file);
    });
  }

  // ================================================================
  // Setup
  // ================================================================

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;      // STRING: 'easy' | 'medium' | 'hard'

    this.ensureTextures();

    // Round state, all reset here and never at declaration: Phaser reuses the Scene instance
    // across restarts, so anything left on `this` survives into the next round as a stale handle
    // to a destroyed GameObject.
    this.phase = 'play';                    // play -> over
    this.outcome = null;
    this.timeRemaining = this.config.timeLimit;
    this.attemptsLeft = this.config.attempts;
    this.aiming = false;
    this.stone = null;
    this.stoneVel = null;
    this.stoneAcc = 0;
    this.goliathX = DVG_GOLIATH_X0;

    this.add.image(0, 0, DVG_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.goliath = this.add.image(this.goliathX, DVG_GROUND_Y, DVG_ASSETS.goliath.key)
      .setOrigin(0.5, 1).setDepth(20);
    this.goliath.setScale(DVG_GOLIATH_H / this.goliath.height);

    this.david = this.add.image(DVG_DAVID_X, DVG_GROUND_Y, DVG_ASSETS.idle.key)
      .setOrigin(0.5, 1).setDepth(30);
    this.davidScale = DVG_DAVID_H / this.david.height;
    this.david.setScale(this.davidScale);

    this.aimGfx = this.add.graphics().setDepth(40);
    this.pullGfx = this.add.graphics().setDepth(41);

    this.worldPoint = new Phaser.Math.Vector2();
    this.createHUD();
    this.drawHUD();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.gameStartTime = this.time.now;
  }

  // A missing plate must not take the whole scene down with it, so every sprite gets a generated
  // stand-in of the right measured size. The game stays playable and the placeholder is obviously
  // a placeholder rather than an invisible object you cannot hit.
  ensureTextures() {
    const mk = (key, w, h, colour, draw) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(colour, 1);
      if (draw) draw(g);
      else g.fillRoundedRect(0, 0, w, h, Math.min(w, h) * 0.2);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    mk(DVG_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT, 0xF6D9A8, (g) => {
      g.fillStyle(0xBFE6E8, 1); g.fillRect(0, 0, GAME_WIDTH, DVG_GROUND_Y);
      g.fillStyle(0xF6D9A8, 1); g.fillRect(0, DVG_GROUND_Y, GAME_WIDTH, GAME_HEIGHT - DVG_GROUND_Y);
    });
    mk(DVG_ASSETS.idle.key, 49, 100, 0x8E9BE0);
    mk(DVG_ASSETS.aim.key, 69, 96, 0x8E9BE0);
    mk(DVG_ASSETS.release.key, 69, 96, 0x8E9BE0);
    mk(DVG_ASSETS.goliath.key, 146, 200, 0x9FDDBC);
    mk(DVG_ASSETS.sling.key, 26, 12, 0xB98A5E);
    mk(DVG_ASSETS.stone.key, 14, 11, 0xB8B2A4);
  }

  createHUD() {
    this.hudTimer = this.add.text(10, 8, '', { ...FONTS.BODY, fontSize: '16px', color: '#FFFFFF',
                                               stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0, 0).setDepth(900);

    // One sling icon per attempt remaining. Scene 12 generated the sling as its own sprite so it
    // could rotate with the aim; the pose plates made that redundant, and this is a better job
    // for it than sitting unused in the folder.
    // Stones, not slings. The sling plate is 2.1:1, and at any size that fits three of them in a
    // corner it reads as a squiggle rather than as a sling -- tried at 26px and again at 38px, and
    // it was a smudge both times. A pebble is round, reads instantly at 18px, and "stones left" is
    // what the player actually has: 1 Samuel 17:40 has David choosing five smooth stones.
    this.hudSlings = [];
    for (let i = 0; i < this.config.attempts; i++) {
      const s = this.add.image(GAME_WIDTH - 14 - i * 26, 18, DVG_ASSETS.stone.key)
        .setOrigin(1, 0.5).setDepth(900);
      s.setScale(18 / s.width);
      this.hudSlings.push(s);
    }

    // 14px -> 20px. At 20px, centred on y 44, it spans 34..54 and still clears the stone icons
    // above it, whose lowest pixel is 27.
    this.prompt = this.add.text(GAME_WIDTH / 2, 44, 'Pull back and let go!', {
      ...FONTS.BODY, fontSize: '20px', color: '#FFFFFF', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(900);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    this.hudSlings.forEach((s, i) => s.setAlpha(i < this.attemptsLeft ? 1 : 0.22));
  }

  // ================================================================
  // Aiming — pull back from David, release to fire
  // ================================================================

  // Every pointer handler reads pointer.worldX/worldY, which is CORRECT here and only here:
  // that pair is a cache refreshed when an input EVENT arrives. Reading it from update() returns
  // whatever the last event left behind, which is the bug that made Peter unplayable.
  onPointerDown(pointer) {
    if (this.phase !== 'play' || this.stone || this.attemptsLeft <= 0) return;
    this.aiming = true;
    this.david.setTexture(DVG_ASSETS.aim.key).setScale(this.davidScale);
    this.updateAim(pointer.worldX, pointer.worldY);
  }

  onPointerMove(pointer) {
    if (!this.aiming) return;
    this.updateAim(pointer.worldX, pointer.worldY);
  }

  onPointerUp(pointer) {
    if (!this.aiming) return;
    this.aiming = false;
    this.aimGfx.clear();
    this.pullGfx.clear();

    const v = this.launchVelocity(pointer.worldX, pointer.worldY);
    if (!v) {                                   // too small a drag to count as a shot
      this.david.setTexture(DVG_ASSETS.idle.key).setScale(this.davidScale);
      return;
    }
    this.fireStone(v);
  }

  handPos() {
    return { x: this.david.x + DVG_HAND.x, y: this.david.y + DVG_HAND.y };
  }

  // Angry-Birds sense: you drag AWAY from the target and the stone goes the other way.
  launchVelocity(px, py) {
    const hand = this.handPos();
    let dx = hand.x - px;
    let dy = hand.y - py;
    const len = Math.hypot(dx, dy);
    if (len < DVG_MIN_PULL) return null;
    const clamped = Math.min(len, DVG_MAX_PULL);
    return { x: (dx / len) * clamped * DVG_POWER, y: (dy / len) * clamped * DVG_POWER, pull: clamped };
  }

  updateAim(px, py) {
    const hand = this.handPos();
    const v = this.launchVelocity(px, py);

    // The pull band: hand back to the pointer, so the gesture has something to hold on to even
    // when the trajectory preview is switched off on HARD.
    this.pullGfx.clear();
    this.pullGfx.lineStyle(3, 0x6B4A2F, 0.75);
    this.pullGfx.lineBetween(hand.x, hand.y, px, py);

    this.aimGfx.clear();
    if (!v || !this.config.aimLineVisible) return;

    // §10: "Trajectory line shows aim (fades in HARD mode)". Drawn by stepping the SAME
    // integration the stone will use, so the preview is the real path rather than a decoration
    // that happens to look similar. Dot spacing carries the pull: a hard pull spaces them out.
    // Dot SPACING carries the pull: a hard pull throws them far apart, a soft one strings them
    // close together, so the gesture reads even before the arc does. Each dot gets a dark core
    // under a white cap -- plain white vanished against the cream sky near the horizon, which is
    // exactly where the interesting part of every arc is.
    const strength = v.pull / DVG_MAX_PULL;
    const every = Math.round(5 + strength * 9);
    let x = hand.x, y = hand.y, vx = v.x, vy = v.y;
    for (let i = 1; i <= 200; i++) {
      vy += DVG_GRAVITY * DVG_STONE_STEP * 4;
      x += vx * DVG_STONE_STEP * 4;
      y += vy * DVG_STONE_STEP * 4;
      if (y > DVG_GROUND_Y || x > GAME_WIDTH || x < 0) break;
      if (i % every === 0) {
        const r = 3.0 - 1.5 * (i / 200);
        this.aimGfx.fillStyle(0x2B2B3A, 0.45);
        this.aimGfx.fillCircle(x, y, r + 1);
        this.aimGfx.fillStyle(0xFFFFFF, 0.95);
        this.aimGfx.fillCircle(x, y, r);
      }
    }
  }

  fireStone(v) {
    const hand = this.handPos();
    this.attemptsLeft--;
    this.drawHUD();

    this.david.setTexture(DVG_ASSETS.release.key).setScale(this.davidScale);
    this.time.delayedCall(260, () => {
      if (this.phase === 'play' && !this.stone) {
        this.david.setTexture(DVG_ASSETS.idle.key).setScale(this.davidScale);
      }
    });

    this.stone = this.add.image(hand.x, hand.y, DVG_ASSETS.stone.key).setDepth(35);
    this.stone.setScale(14 / this.stone.width);
    this.stoneVel = { x: v.x, y: v.y };
    this.stoneAcc = 0;
  }

  // ================================================================
  // Flight and collision
  // ================================================================

  // Fixed-step integration. Phaser's clock advances with FRAMES, and an emulated mobile page runs
  // at roughly half speed, so a per-frame step would give the stone a different arc on a phone
  // than on a desktop. Stepping at a fixed 1/240 makes the trajectory a property of the physics
  // rather than of the device.
  stepStone(dtSeconds) {
    this.stoneAcc += dtSeconds;
    while (this.stoneAcc >= DVG_STONE_STEP) {
      this.stoneAcc -= DVG_STONE_STEP;
      this.stoneVel.y += DVG_GRAVITY * DVG_STONE_STEP;
      this.stone.x += this.stoneVel.x * DVG_STONE_STEP;
      this.stone.y += this.stoneVel.y * DVG_STONE_STEP;

      const hit = this.hitTest(this.stone.x, this.stone.y);
      if (hit) { this.resolveHit(hit); return; }

      if (this.stone.y >= DVG_GROUND_Y || this.stone.x > GAME_WIDTH + 30 ||
          this.stone.x < -30 || this.stone.y > GAME_HEIGHT + 30) {
        this.resolveHit('miss');
        return;
      }
    }
    this.stone.rotation += 9 * dtSeconds;
  }

  goliathBox() {
    const w = this.goliath.displayWidth;
    const h = this.goliath.displayHeight;
    return { left: this.goliath.x - w / 2, top: this.goliath.y - h, w: w, h: h };
  }

  band(frac) {
    const b = this.goliathBox();
    return { y0: b.top + frac.y0 * b.h, y1: b.top + frac.y1 * b.h };
  }

  // True when (x,y) is inside his drawn silhouette, not merely inside his bounding box.
  onGoliath(x, y) {
    const b = this.goliathBox();
    if (y < b.top || y > b.top + b.h) return false;
    const i = Math.min(DVG_SILHOUETTE.length - 1,
                       Math.max(0, Math.floor(((y - b.top) / b.h) * DVG_SILHOUETTE.length)));
    const span = DVG_SILHOUETTE[i];
    return x >= b.left + span[0] * b.w && x <= b.left + span[1] * b.w;
  }

  // The silhouette gates EVERY hit; the bands only decide which part was struck.
  //
  // Checking the bands first was wrong for the same reason checking the bounding box was wrong:
  // the head band is a rectangle 49% of his sprite wide, and at helmet height he is only 32% wide,
  // so a stone clearing his helmet by a comfortable margin scored as a head hit -- which on HARD
  // is a miss that ends the round. A led shot that was genuinely on course for the forehead kept
  // dying 46px short of it.
  // The x extent of his silhouette across the forehead band -- what you are actually aiming at.
  foreheadSpan() {
    const b = this.goliathBox();
    const f = this.band(DVG_FOREHEAD);
    let lo = 1, hi = 0;
    const i0 = Math.floor(DVG_FOREHEAD.y0 * DVG_SILHOUETTE.length);
    const i1 = Math.min(DVG_SILHOUETTE.length - 1,
                        Math.ceil(DVG_FOREHEAD.y1 * DVG_SILHOUETTE.length) - 1);
    for (let i = i0; i <= i1; i++) {
      lo = Math.min(lo, DVG_SILHOUETTE[i][0]);
      hi = Math.max(hi, Math.min(DVG_SILHOUETTE[i][1], DVG_FOREHEAD.xMax));
    }
    return { x0: b.left + lo * b.w, x1: b.left + hi * b.w, y0: f.y0, y1: f.y1 };
  }

  hitTest(x, y) {
    if (!this.onGoliath(x, y)) return null;
    const b = this.goliathBox();
    const within = (f) => {
      const r = this.band(f);
      return y >= r.y0 && y <= r.y1 && x <= b.left + f.xMax * b.w;
    };
    if (within(DVG_FOREHEAD)) return 'forehead';
    if (within(DVG_HEAD)) return 'head';
    return 'body';
  }

  // §10's win conditions, which differ by tier in WHAT counts rather than only in how many tries:
  //   EASY    anywhere on Goliath wins
  //   MEDIUM  anywhere wins; the head is an instant win worth more
  //   HARD    the forehead and nothing else
  resolveHit(where) {
    if (this.stone) { this.stone.destroy(); this.stone = null; }

    if (where === 'miss') { this.afterMiss(false); return; }

    const headshot = (where === 'forehead' || where === 'head');
    if (this.difficulty === DIFFICULTY.HARD) {
      if (where === 'forehead') this.handleWin(true);
      else this.afterMiss(true);
      return;
    }
    this.handleWin(headshot);
  }

  afterMiss(glanced) {
    this.puff(glanced);
    if (this.attemptsLeft <= 0) { this.handleLoss(); return; }
    if (this.prompt) {
      this.prompt.setText(glanced ? 'Aim for his forehead!' : 'Try again, David!');
    }
    this.david.setTexture(DVG_ASSETS.idle.key).setScale(this.davidScale);
  }

  puff(onGoliath) {
    const x = onGoliath ? this.goliath.x - 20 : this.stoneLastX || this.goliath.x;
    const g = this.add.graphics().setDepth(45);
    g.fillStyle(0xFFFFFF, 0.8);
    for (let i = 0; i < 6; i++) {
      g.fillCircle(x + Phaser.Math.Between(-14, 14), DVG_GROUND_Y - Phaser.Math.Between(0, 20),
                   Phaser.Math.Between(2, 5));
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 420, onComplete: () => g.destroy() });
  }

  // ================================================================
  // Round flow
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play') return;
    const dt = delta / 1000;

    this.timeRemaining -= dt;
    this.drawHUD();
    if (this.timeRemaining <= 0) { this.handleLoss(); return; }

    // §10 HARD: "Moving target" and "Goliath reaches David (charges forward)".
    if (this.config.goliathSpeed > 0) {
      this.goliathX -= this.config.goliathSpeed * dt;
      this.goliath.x = this.goliathX;
      if (this.goliathX - this.goliath.displayWidth / 2 <= DVG_DAVID_X + 18) {
        this.handleLoss();
        return;
      }
    }

    if (this.stone) this.stepStone(dt);
  }

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.phase = 'over';
    this.aiming = false;
    this.aimGfx.clear();
    this.pullGfx.clear();
    this.hudTimer.setVisible(false);
    if (this.stone) { this.stone.destroy(); this.stone = null; }
  }

  handleWin(headshot) {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    const spent = this.config.timeLimit - this.timeRemaining;
    this.endRound();

    this.tweens.add({ targets: this.goliath, angle: -82, y: DVG_GROUND_Y + 26,
                      duration: 760, ease: 'Quad.easeIn' });

    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.add.text(GAME_WIDTH / 2, 110, headshot ? 'Right on target!' : 'The giant falls!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '22px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    const perfect = headshot && this.attemptsLeft === this.config.attempts - 1;
    const fast = spent < this.config.timeLimit * 0.6;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.DAVID_VS_GOLIATH,
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
    this.add.text(GAME_WIDTH / 2, 110, 'Try again, David!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.DAVID_VS_GOLIATH,
        points: 0,
        timeElapsed: elapsed,
      });
    });
  }

  shutdown() {
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
  }
}
