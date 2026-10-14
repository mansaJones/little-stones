// ============================================
// ZACCHAEUS CLIMBS THE TREE - Alternate left and right taps to climb
// Luke 19:1-10  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §17
// Art spec:      docs/Art_Plate_Prompts.md Scene 17
// ============================================

// Art plates live in assets/games/zacchaeus/
//   bg.jpg              — the Jericho street. The tree is in the plate because it never changes.
//   zacchaeus-climb-l   — climbing, left arm up, right knee raised.
//   zacchaeus-climb-r   — SAME POSE as climb-l; see ZT_MIRROR_R.
//   zacchaeus-slip      — both arms flailing, "whoa!".
//   zacchaeus-wave      — sitting on a branch waving. The plate includes the branch he sits on.
//   jesus-walk          — profile facing RIGHT, mid-stride. The diegetic timer.
//   jesus-lookup        — stopped, head up, waving at someone above.
//   crowd-strip         — seven people from behind. Tiled across the road; see ZT_CROWD_H.
const ZT_ASSET_PATH = 'assets/games/zacchaeus/';
const ZT_ASSETS = {
  bg:      { key: 'zt-bg',      file: 'bg.jpg' },
  climbL:  { key: 'zt-climb-l', file: 'zacchaeus-climb-l.png' },
  climbR:  { key: 'zt-climb-r', file: 'zacchaeus-climb-r.png' },
  slip:    { key: 'zt-slip',    file: 'zacchaeus-slip.png' },
  wave:    { key: 'zt-wave',    file: 'zacchaeus-wave.png' },
  jesus:   { key: 'zt-jesus',   file: 'jesus-walk.png' },
  lookup:  { key: 'zt-lookup',  file: 'jesus-lookup.png' },
  crowd:   { key: 'zt-crowd',   file: 'crowd-strip.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let ZT_ART_PROBED = false;

// Scene 17 asks for climb_r to be climb_l with "the limbs mirrored". The two delivered plates are
// the SAME pose -- measured at 0.999 silhouette match as drawn against 0.697 mirrored, so this is
// not a close call. Drawn as-is they would animate by standing perfectly still, so climb_r is
// flipped on X, which produces exactly the mirrored limbs the art doc asked for.
// If the plate is ever redrawn properly, set this to false.
const ZT_MIRROR_R = true;

// ---- The tree, MEASURED off the plate rather than chosen ----
// Bark is isolated by colour in the right half of the plate, then the widest run per row in the
// lower half is the trunk, and the highest row whose leftmost run starts well left of the trunk is
// the fork that sticks out over the street.
//
//   trunk      x 1969..2465 of 2576  ->  stage x 510..638, centre 574
//   trunk base y 1320 of 1438        ->  stage y 344
//
// If the plate is ever redrawn, re-run the measurement in key_zacc.py.
const ZT_CLIMB_X = 574;
// He STARTS down among the crowd, mostly hidden by it, which is the whole point of Luke 19:3 --
// he is too short to see over them. The climb lifts him out of the heads.
const ZT_GROUND = 358;
const ZT_BRANCH = 176;        // the lookout fork he climbs to
const ZT_Z_H = 72;            // short and round, per Scene 17

const ZT_JESUS_H = 92;
const ZT_JESUS_Y = 350;
const ZT_JESUS_START = -40;
const ZT_JESUS_END = 462;     // under the tree. §17: "Jesus never walks past him."

const ZT_CROWD_H = 104;       // scaled by HEIGHT and tiled; see ASSETS.md
const ZT_CROWD_BASE = 392;    // below the stage, so the row is cropped by the bottom edge

// §17 asks for two input guards, and they collapse into one honest rule: "if both halves register
// within 40ms, count one tap, not two" (two thumbs resting on the glass), plus an auto-clicker
// floor on tap timestamps. Any tap inside this window is dropped whichever side it is on, which
// covers both cases. Keeping them as a 40ms opposite-side rule AND a separate 50ms global floor
// would make the first one dead code, because the global floor always fires first.
//
// 40ms is a ceiling of 25 taps/second. HARD asks for 22 taps in 6 seconds, which is 3.7/second.
const ZT_TAP_MIN_MS = 40;

const ZT_SLIP_MS = 340;
const ZT_INTRO_MS = 900;

class ZacchaeusTreeGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.ZACCHAEUS);
  }

  preload() {
    if (ZT_ART_PROBED) return;
    ZT_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[Zacchaeus] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(ZT_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, ZT_ASSET_PATH + a.file);
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
    this.elapsed = 0;
    this.steps = 0;
    this.lastSide = null;                   // 'L' | 'R' | null — null means either side starts
    this.lastTapAt = -1e9;
    this.slipFor = 0;
    this.footLeft = true;                   // which climb pose is showing
    this.crowd = [];
    this.worldPoint = new Phaser.Math.Vector2();   // reused by onTap

    this.viewLeft = -STAGE_X;
    this.viewRight = GAME_WIDTH + STAGE_X;
    // The split is the middle of what the player can SEE. On a stage-sized canvas that is the
    // stage centre; on a wider one the stage is centred inside the canvas, so it is still the
    // stage centre -- but deriving it keeps it true if the canvas model ever changes.
    this.splitX = (this.viewLeft + this.viewRight) / 2;

    this.add.image(0, 0, ZT_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createZacchaeus();
    this.createJesus();
    this.createCrowd();
    this.createHUD();
    this.drawHUD();

    // One handler, on the scene. The side is decided from the world x, so it keeps meaning the
    // same thing on a canvas that is wider than the stage.
    this.input.on('pointerdown', this.onTap, this);

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  // ================================================================
  //  Intro — Luke 19:3, he cannot see over the crowd
  // ================================================================

  runIntro() {
    this.prompt = this.add.text(GAME_WIDTH / 2, 70, 'Tap left and right to climb!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '20px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(900);

    // Two hands pulsing in the bottom corners, the same cue §17 puts on the instruction screen.
    this.hands = [
      this.add.text(70, 318, '👈', { fontSize: '34px' }).setOrigin(0.5).setDepth(901),
      this.add.text(GAME_WIDTH - 70, 318, '👉', { fontSize: '34px' }).setOrigin(0.5).setDepth(901),
    ];
    this.hands.forEach((h, i) => this.tweens.add({
      targets: h, scale: 1.25, duration: 300, yoyo: true, repeat: -1, delay: i * 300,
    }));

    this.time.delayedCall(ZT_INTRO_MS, () => {
      if (this.outcome) return;
      if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
      // The hands are a cue for the first second, not scenery. Left up they sit over the crowd for
      // the whole round and over the lower trunk, which is exactly where a child is tapping.
      if (this.hands) {
        this.hands.forEach(h => this.tweens.add({
          targets: h, alpha: 0, duration: 260, ease: 'Quad.easeOut',
          onComplete: () => h.destroy(),
        }));
        this.hands = null;
      }
      this.phase = 'play';
    });
  }

  // ================================================================
  //  Scene
  // ================================================================

  createZacchaeus() {
    const z = this.add.image(ZT_CLIMB_X, ZT_GROUND, ZT_ASSETS.climbL.key)
      .setOrigin(0.5, 1).setDepth(30);
    z.setScale(ZT_Z_H / z.height);
    this.zac = z;
  }

  createJesus() {
    const j = this.add.image(ZT_JESUS_START, ZT_JESUS_Y, ZT_ASSETS.jesus.key)
      .setOrigin(0.5, 1).setDepth(20);
    j.setScale(ZT_JESUS_H / j.height);
    this.jesus = j;
  }

  // The strip is seven people wide and nearly square, so one copy at a readable height covers only
  // a third of the road. It is tiled across with every other copy flipped -- the same trick the
  // river uses, and for the same reason: a repeat the eye can follow reads as a bug, a mirrored
  // one reads as a crowd.
  createCrowd() {
    const src = this.textures.get(ZT_ASSETS.crowd.key).getSourceImage();
    const scale = ZT_CROWD_H / (src && src.height ? src.height : ZT_CROWD_H);
    const w = (src && src.width ? src.width : 200) * scale;
    let x = this.viewLeft - 20;
    let i = 0;
    while (x < this.viewRight + 20) {
      const c = this.add.image(x, ZT_CROWD_BASE, ZT_ASSETS.crowd.key)
        .setOrigin(0, 1).setDepth(25);
      c.setScale(scale);
      c.setFlipX(i % 2 === 1);
      this.crowd.push({ img: c, baseY: ZT_CROWD_BASE, centre: x + w / 2 });
      x += w - 8;
      i++;
    }
  }

  // ================================================================
  //  Input
  // ================================================================

  onTap(pointer) {
    if (this.phase !== 'play') return;

    const now = this.time.now;
    if (now - this.lastTapAt < ZT_TAP_MIN_MS) return;   // two thumbs, or an auto-clicker
    this.lastTapAt = now;

    // World x, not canvas x: on a phone whose canvas is wider than the stage these differ by the
    // stage offset, and the halfway line would sit off-centre on the glass.
    const wx = this.cameras.main.getWorldPoint(pointer.x, pointer.y, this.worldPoint).x;
    const side = wx < this.splitX ? 'L' : 'R';

    if (this.lastSide === side) { this.slip(); return; }
    this.lastSide = side;
    this.step();
  }

  step() {
    this.steps = Math.min(this.config.targetTaps, this.steps + 1);
    this.footLeft = !this.footLeft;
    this.slipFor = 0;
    this.leaves();
    this.layoutZac();
    if (this.steps >= this.config.targetTaps) { this.handleWin(); return; }
    this.drawHUD();
  }

  // §17: "A same-side tap does nothing" on EASY, slips 1 step on MEDIUM, 2 on HARD. Zero means the
  // tap is simply ignored, matching windForce / relocateAfter elsewhere.
  slip() {
    const n = this.config.slipSteps || 0;
    if (n > 0) this.steps = Math.max(0, this.steps - n);
    this.slipFor = ZT_SLIP_MS / 1000;
    this.layoutZac();
    if (n > 0) {
      const t = this.add.text(ZT_CLIMB_X, this.zac.y - ZT_Z_H - 14, 'whoops!', {
        ...FONTS.SMALL, fontSize: '14px', fontStyle: 'bold', color: '#C4572B',
        stroke: '#FFFFFF', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(800);
      this.tweens.add({
        targets: t, y: t.y - 14, alpha: 0, duration: 650, ease: 'Quad.easeOut',
        onComplete: () => t.destroy(),
      });
      this.cameras.main.shake(120, 0.004);
    }
    this.drawHUD();
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play') return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    this.elapsed += dt;
    if (this.slipFor > 0) this.slipFor = Math.max(0, this.slipFor - dt);

    this.moveJesus();
    this.bobCrowd();
    this.layoutZac();

    if (this.elapsed >= this.config.timeLimit) { this.handleLoss(); return; }
    this.drawHUD();
  }

  // §17: "Jesus' walk is a tween from the left edge to the tree's x over timeLimit, driven by the
  // same clamped clock as the loss timeout." Deliberately NOT a Phaser tween: a tween runs on its
  // own clock and would drift from the timer that actually ends the round, so he would arrive
  // early or late and the diegetic timer would be a lie.
  moveJesus() {
    const t = Phaser.Math.Clamp(this.elapsed / this.config.timeLimit, 0, 1);
    this.jesus.x = ZT_JESUS_START + (ZT_JESUS_END - ZT_JESUS_START) * t;
  }

  // §17: "Crowd heads bob as Jesus passes." The bob follows him rather than running everywhere,
  // so it reads as a reaction instead of as idle animation.
  bobCrowd() {
    this.crowd.forEach((c, i) => {
      const d = Math.abs(c.centre - this.jesus.x);
      const near = Math.max(0, 1 - d / 150);
      c.img.y = c.baseY - Math.sin(this.elapsed * 7 + i * 1.3) * 5 * near;
    });
  }

  // Climb height is CONTINUOUS progress, not snapped to drawn branches -- §17 is explicit, and it
  // is what lets the tap target change per tier while the tree art does not.
  climbY() {
    const t = this.config.targetTaps > 0 ? this.steps / this.config.targetTaps : 0;
    return ZT_GROUND + (ZT_BRANCH - ZT_GROUND) * Phaser.Math.Clamp(t, 0, 1);
  }

  layoutZac() {
    if (this.outcome) return;
    const key = this.slipFor > 0 ? ZT_ASSETS.slip.key
      : (this.footLeft ? ZT_ASSETS.climbL.key : ZT_ASSETS.climbR.key);
    if (this.zac.texture.key !== key) {
      this.zac.setTexture(key);
      this.zac.setScale(ZT_Z_H / this.zac.height);
    }
    // The mirror that makes the two climb frames different. The slip plate is its own pose and
    // must never be flipped, or he flails the wrong way round.
    this.zac.setFlipX(ZT_MIRROR_R && key === ZT_ASSETS.climbR.key);
    this.zac.y = this.climbY();
  }

  leaves() {
    for (let i = 0; i < 3; i++) {
      const lf = this.add.ellipse(
        ZT_CLIMB_X + Phaser.Math.Between(-26, 26), this.zac.y - ZT_Z_H + Phaser.Math.Between(-8, 8),
        7, 4, 0x8FB890, 0.95).setDepth(28);
      lf.setAngle(Phaser.Math.Between(0, 180));
      this.tweens.add({
        targets: lf,
        y: lf.y + Phaser.Math.Between(40, 80),
        x: lf.x + Phaser.Math.Between(-24, 24),
        angle: lf.angle + Phaser.Math.Between(120, 300),
        alpha: 0, duration: Phaser.Math.Between(650, 950), ease: 'Sine.easeIn',
        onComplete: () => lf.destroy(),
      });
    }
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily: Phaser reuses the Scene instance, so an
  //  `if (!this.hudTimer)` guard sees a truthy handle to a destroyed object.
  //
  //  §17: "Keep the HUD timer too; not every kid reads the diegetic one."
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 6, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#7A4A22',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(900);

    this.hudCount = this.add.text(GAME_WIDTH - 14, 12, '', {
      ...FONTS.SMALL, fontSize: '16px', fontStyle: 'bold', color: '#7A4A22',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(900);
  }

  drawHUD() {
    const left = Math.max(0, this.config.timeLimit - this.elapsed);
    this.hudTimer.setText(left.toFixed(1) + 's');
    this.hudCount.setText(this.steps + '/' + this.config.targetTaps);
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
    if (this.hands) { this.hands.forEach(h => h.destroy()); this.hands = null; }
    this.hudTimer.setVisible(false);
    this.hudCount.setVisible(false);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    this.endRound();

    this.zac.setTexture(ZT_ASSETS.wave.key);
    this.zac.setScale(128 / this.zac.width);     // the plate includes the branch; size by WIDTH
    this.zac.setFlipX(false);
    this.zac.setPosition(ZT_CLIMB_X - 26, ZT_BRANCH);

    this.jesus.setTexture(ZT_ASSETS.lookup.key);
    this.jesus.setScale(ZT_JESUS_H / this.jesus.height);
    this.jesus.x = ZT_JESUS_END;

    this.add.text(GAME_WIDTH / 2, 348, 'Zacchaeus, come down!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    const perfect = this.elapsed < this.config.timeLimit * 0.55;
    const fast = this.elapsed < this.config.timeLimit * 0.75;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.ZACCHAEUS,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();

    // §17: "Jesus never walks past him. In the fail state, Jesus stops under the tree and looks
    // around while Zacchaeus peeks from a low branch. Jesus came looking for him; the game
    // shouldn't say otherwise." So he still arrives, and he still looks up.
    this.jesus.x = ZT_JESUS_END;
    this.jesus.setTexture(ZT_ASSETS.lookup.key);
    this.jesus.setScale(ZT_JESUS_H / this.jesus.height);

    this.zac.setTexture(ZT_ASSETS.climbL.key);
    this.zac.setScale(ZT_Z_H / this.zac.height);
    this.zac.setFlipX(false);
    this.tweens.add({
      targets: this.zac, y: this.zac.y - 6, duration: 700,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(GAME_WIDTH / 2, 348, 'Climb higher!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '22px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.ZACCHAEUS,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/zacchaeus/ is missing or incomplete. The real plates shipped,
  //  so this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(ZT_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xF7D9A8, 1); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xE0C49A, 1); g.fillRect(0, 300, GAME_WIDTH, GAME_HEIGHT - 300);
      g.fillStyle(0x9A7A5E, 1); g.fillRect(510, 40, 128, 320);
      g.lineStyle(4, ink, 1); g.strokeRect(510, 40, 128, 320);
      g.generateTexture(ZT_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
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
    fig(ZT_ASSETS.climbL.key, 98, 160, 0xD8A93C);
    fig(ZT_ASSETS.climbR.key, 98, 160, 0xD8A93C);
    fig(ZT_ASSETS.slip.key, 160, 153, 0xD8A93C);
    fig(ZT_ASSETS.wave.key, 230, 219, 0xD8A93C);
    fig(ZT_ASSETS.jesus.key, 113, 205, 0xF4F4F4);
    fig(ZT_ASSETS.lookup.key, 103, 205, 0xF4F4F4);
    fig(ZT_ASSETS.crowd.key, 620, 297, 0xC9BCA8);
  }
}
