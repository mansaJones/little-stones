// ============================================
// NEHEMIAH REBUILDS THE WALL - Tap to drop swinging stones into the gap
// Nehemiah 2:17-18; 4:6; 6:15  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §19
// Art spec:      docs/Art_Plate_Prompts.md Scene 19
// ============================================

// Art plates live in assets/games/nehemiah-wall/
//   bg.jpg            — Jerusalem's wall with the gap. Cropped to stage aspect, never squeezed.
//   wall-stone        — one block. ONE SIZE, every tier (see NW_SLOTS below).
//   crane-arm         — the beam and its pulley. The ROPE IS NOT IN THE PLATE: a baked rope
//                       cannot swing, so it is drawn as a Phaser line from the pulley each frame.
//   nehemiah-point    — directing, on the left.
//   nehemiah-cheer    — the win pose.
const NW_ASSET_PATH = 'assets/games/nehemiah-wall/';
const NW_ASSETS = {
  bg:    { key: 'nw-bg',    file: 'bg.jpg' },
  stone: { key: 'nw-stone', file: 'wall-stone.png' },
  arm:   { key: 'nw-arm',   file: 'crane-arm.png' },
  point: { key: 'nw-point', file: 'nehemiah-point.png' },
  cheer: { key: 'nw-cheer', file: 'nehemiah-cheer.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let NW_ART_PROBED = false;

// ---- The gap, measured off the plate (key_nehemiah.py prints these) ----
// Scene 19: "The gap's size is a hard constraint. It must be exactly one stone wide and eight
// stones tall at the shared display scale."
//
// The delivered plate does not meet it. At FULL gap width the gap holds 6.86 stones, not 8. The
// gap is 52.6 x 216.0 on the stage (aspect 4.104) and the stone's own aspect is 0.5987, so eight
// of them only fit if the stone is seated at 85.7% of the gap's width -- 45.1 wide instead of
// 52.6, leaving 3.8px of sky down each side. That is the trade taken here, because the alternative
// is re-cutting §19's counts from 4/6/8 to 3/5/7, and a 3.8px sliver is cheaper than rewriting the
// spec. Resizing the stone per tier is NOT an option: §19 is explicit that it would stretch the
// outlines, which is the whole reason the lower tiers pre-place stones instead.
const NW_GAP = { left: 307.2, right: 359.8, top: 106.8, bottom: 322.9 };
const NW_GAP_CX = 333.5;
const NW_SLOTS = 8;               // §19: "the gap holds 8 stones at every tier"
const NW_STONE_W = 45.1;
const NW_STONE_H = 27.01;         // = (bottom - top) / NW_SLOTS, exactly

// ---- The crane ----
// The pulley's position inside the arm plate, measured: it is the part of the sprite that hangs
// lowest, centred at 0.923 of the width and 0.767 of the height. The rope hangs from there, so
// these two fractions are what keep the rope attached to the wheel rather than to thin air.
const NW_ARM_W = 190;
const NW_PULLEY_FX = 0.923;
const NW_PULLEY_FY = 0.767;
const NW_PIVOT_X = NW_GAP_CX;     // the stone must be able to reach the gap's centre line
const NW_PIVOT_Y = 30;
const NW_ROPE_LEN = 58;
const NW_SWING_AMP = 1.134;       // 65 degrees. Travel is +/-52.6px -- one gap width either side.

// The swing has to live in the 107px of sky above the wall, because a stone hanging BELOW the wall
// top could not be knocked off it by a miss, and "it hit the wall and tumbled" is the only reading
// of a miss that makes sense to a child. At the bottom of the arc the stone's underside sits at
// y=101.5, five pixels clear of the wall top.
const NW_DROP_SPEED = 760;        // px/s. Straight down: §19 forbids horizontal carry.
const NW_SEAT_MS = 90;            // the snap-to-centre once it lands
const NW_HIT_GAP_MS = 140;        // before the next stone swings in after a hit
const NW_MISS_GAP_MS = 800;       // §19: "the next one swings in after 0.8s"
const NW_INTRO_MS = 900;
const NW_NEHEMIAH_X = 74;
const NW_NEHEMIAH_H = 128;
const NW_NEHEMIAH_FEET = 360;
const NW_PERFECT_FRAC = 0.28;     // of tolerance: §19's "sparkle for a near-perfect centre drop"

class NehemiahWallGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.NEHEMIAH_WALL);
  }

  preload() {
    if (NW_ART_PROBED) return;
    NW_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[NehemiahWall] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(NW_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, NW_ASSET_PATH + a.file);
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

    // §19 pre-places the lower tiers rather than resizing the stone: "EASY: 4 stones already
    // placed, place 4 more". The count is derived, not configured -- the gap always holds 8, so
    // the number already in it is whatever is not left to place. Adding a `prePlaced` key would
    // let the two drift apart and leave a gap that is 9 stones deep on one tier.
    this.toPlace = Math.min(this.config.stonesToPlace, NW_SLOTS);
    this.placed = NW_SLOTS - this.toPlace;
    this.dropped = 0;                       // stones released this round, hit or miss
    this.misses = 0;

    this.stones = [];                       // the seated column, bottom-first
    this.stone = null;                      // the live one on the rope
    this.stoneState = null;                 // 'swing' | 'fall'
    this.swingT = 0;                        // seconds on the GAME clock, not wall time
    this.respawnT = 0;

    this.add.image(0, 0, NW_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createWall();
    this.createCrane();
    this.createNehemiah();
    this.createHUD();
    this.drawHUD();

    // §19: "Tap anywhere to release the swinging stone." Anywhere means the whole stage, so the
    // listener goes on the input plugin rather than on a hit area -- a child aiming at the stone
    // would be aiming at a 45px target moving at 300px/s, which is the opposite of the point.
    this.input.on('pointerdown', this.onTap, this);

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  // ================================================================
  //  Scene
  // ================================================================

  // Slot i counts from the GROUND up, so the pre-placed stones fill the bottom of the gap and the
  // player's first stone lands on top of them -- Nehemiah 4:6, the wall joined "to half its height".
  slotY(i) {
    return NW_GAP.bottom - (i + 0.5) * NW_STONE_H;
  }

  makeStone(x, y) {
    const s = this.add.image(x, y, NW_ASSETS.stone.key).setDepth(12);
    s.setDisplaySize(NW_STONE_W, NW_STONE_H);
    return s;
  }

  createWall() {
    for (let i = 0; i < this.placed; i++) {
      this.stones.push(this.makeStone(NW_GAP_CX, this.slotY(i)));
    }
  }

  createCrane() {
    const arm = this.add.image(0, 0, NW_ASSETS.arm.key).setOrigin(0, 0).setDepth(30);
    arm.setScale(NW_ARM_W / arm.width);
    arm.x = NW_PIVOT_X - NW_ARM_W * NW_PULLEY_FX;
    arm.y = NW_PIVOT_Y - arm.displayHeight * NW_PULLEY_FY;
    this.arm = arm;

    // Scene 19: "Draw the rope as a Phaser line from the pulley to the stone; a baked rope can't
    // swing." Redrawn every frame in update().
    this.rope = this.add.graphics().setDepth(11);
  }

  createNehemiah() {
    const n = this.add.image(NW_NEHEMIAH_X, NW_NEHEMIAH_FEET, NW_ASSETS.point.key)
      .setOrigin(0.5, 1).setDepth(20);
    n.setScale(NW_NEHEMIAH_H / n.height);
    this.nehemiah = n;
  }

  runIntro() {
    this.prompt = this.add.text(GAME_WIDTH / 2, 86, 'Tap to drop the stones!', {
      ...FONTS.TITLE, color: '#7A4A22', fontSize: '19px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(900);

    this.time.delayedCall(NW_INTRO_MS, () => {
      if (this.outcome) return;
      this.phase = 'play';
      this.spawnStone();
      this.tweens.add({ targets: this.prompt, alpha: 0, duration: 400,
                        onComplete: () => { if (this.prompt) { this.prompt.destroy(); this.prompt = null; } } });
    });
  }

  // ================================================================
  //  The swing
  // ================================================================

  // The stone swings IN from one side, alternating, rather than appearing at the bottom of the arc.
  // Starting it dead centre looks tidy and plays badly: the one moment it is aimed correctly is the
  // moment it arrives, before a child could possibly react, so every stone costs a full half-period
  // of waiting. Measured, that alone dropped MEDIUM to a 63% win rate for a player with a very
  // generous 60ms of timing scatter. Entering at an extreme halves the wait to a quarter period and
  // reads better besides -- the crane swings the block over.
  spawnStone() {
    if (this.outcome || this.placed >= NW_SLOTS) return;
    const quarter = 0.25 / this.config.swingSpeed;
    this.swingT = (this.dropped % 2 === 0) ? quarter : quarter * 3;
    this.stone = this.makeStone(NW_PIVOT_X, NW_PIVOT_Y + NW_ROPE_LEN);
    this.stoneState = 'swing';
    this.stepSwing(0);
  }

  // A sine pendulum on the clamped game clock, exactly as §19 asks. Driven from update()'s dt and
  // not from a tween, for the same reason the rest of this build does it: a backgrounded tab slows
  // the swing and the countdown together, so the stone a child sees is the stone the game thinks
  // it has.
  stepSwing(dt) {
    if (!this.stone) return;     // between stones, or poked from outside the loop
    this.swingT += dt;
    const theta = NW_SWING_AMP * Math.sin(2 * Math.PI * this.config.swingSpeed * this.swingT);
    this.stone.x = NW_PIVOT_X + NW_ROPE_LEN * Math.sin(theta);
    this.stone.y = NW_PIVOT_Y + NW_ROPE_LEN * Math.cos(theta);
  }

  drawRope() {
    this.rope.clear();
    if (!this.stone || this.stoneState !== 'swing') return;
    this.rope.lineStyle(3, 0x6B4A2A, 1);
    this.rope.lineBetween(NW_PIVOT_X, NW_PIVOT_Y, this.stone.x, this.stone.y - NW_STONE_H / 2);
  }

  // ================================================================
  //  Input
  // ================================================================

  onTap() {
    if (this.phase !== 'play' || this.outcome) return;
    if (!this.stone || this.stoneState !== 'swing') return;   // already falling, or between stones

    // §19: "Landing is a deterministic check: if |stone x − gap centre| ≤ tolerance, snap to
    // centre and stack." Decided HERE, at the release, not on arrival -- the drop is straight down
    // so the two are the same number, and deciding at the tap is what makes the tap the thing the
    // child is judged on.
    const dx = this.stone.x - NW_GAP_CX;
    this.stoneState = 'fall';
    this.dropped++;
    this.drawRope();

    if (Math.abs(dx) <= this.config.tolerance) {
      this.fallTo = this.slotY(this.placed);
      this.fallHit = true;
      this.fallPerfect = Math.abs(dx) <= this.config.tolerance * NW_PERFECT_FRAC;
    } else {
      // A miss cannot fall past the wall it just hit. It drops the few pixels onto the wall top
      // and tumbles off from there, which is the only reading of a miss that makes sense when the
      // stone hangs above a solid wall.
      this.fallTo = NW_GAP.top - NW_STONE_H / 2;
      this.fallHit = false;
      this.fallPerfect = false;
    }
  }

  stepFall(dt) {
    this.stone.y += NW_DROP_SPEED * dt;         // x untouched: no horizontal carry, per §19
    if (this.stone.y < this.fallTo) return;
    this.stone.y = this.fallTo;
    if (this.fallHit) this.seat(); else this.tumble();
  }

  seat() {
    const s = this.stone;
    this.stone = null;
    this.stoneState = null;
    this.stones.push(s);
    this.placed++;

    this.tweens.add({ targets: s, x: NW_GAP_CX, duration: NW_SEAT_MS, ease: 'Quad.easeOut' });
    this.puff(s.x, s.y + NW_STONE_H / 2);
    this.cameras.main.shake(90, 0.0035);
    if (this.fallPerfect) this.sparkle(NW_GAP_CX, s.y);
    this.cheerOnce();
    this.drawHUD();

    if (this.placed >= NW_SLOTS) { this.handleWin(); return; }
    this.respawnT = NW_HIT_GAP_MS / 1000;
  }

  tumble() {
    const s = this.stone;
    this.stone = null;
    this.stoneState = null;
    this.misses++;

    const side = s.x < NW_GAP_CX ? -1 : 1;
    this.tweens.add({
      targets: s, x: s.x + side * 54, y: NW_NEHEMIAH_FEET - 12, angle: side * 220,
      duration: 520, ease: 'Quad.easeIn',
      onComplete: () => {
        this.puff(s.x, s.y + NW_STONE_H / 2);
        this.tweens.add({ targets: s, alpha: 0, duration: 260, onComplete: () => s.destroy() });
      },
    });

    const t = this.add.text(s.x, s.y - 18, 'oops!', {
      ...FONTS.SMALL, fontSize: '16px', fontStyle: 'bold', color: '#B5533A',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(905);
    this.tweens.add({ targets: t, y: t.y - 22, alpha: 0, duration: 760,
                      onComplete: () => t.destroy() });

    this.respawnT = NW_MISS_GAP_MS / 1000;
  }

  // ================================================================
  //  Trimmings
  //
  //  §19 asks for a dust puff, a sparkle and cheering workers. The first two are Phaser effects.
  //  THE WORKERS ARE NOT: Scene 19's layer table has four layers and none of them is a worker, so
  //  there is no plate to put on the wall. Nehemiah himself does the cheering instead -- he bobs on
  //  every seated stone and switches to the cheer plate on the win.
  // ================================================================

  puff(x, y) {
    for (let i = 0; i < 7; i++) {
      const d = this.add.circle(x + Phaser.Math.Between(-14, 14), y,
                                Phaser.Math.Between(2, 5), 0xD9C3A5, 0.85).setDepth(14);
      this.tweens.add({
        targets: d, x: d.x + Phaser.Math.Between(-26, 26), y: d.y - Phaser.Math.Between(6, 22),
        alpha: 0, scale: 0.4, duration: Phaser.Math.Between(320, 560), ease: 'Quad.easeOut',
        onComplete: () => d.destroy(),
      });
    }
  }

  sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const st = this.add.star(x, y, 4, 2, 6, 0xFFE9A3, 1).setDepth(16);
      this.tweens.add({
        targets: st, x: x + Math.cos(a) * 34, y: y + Math.sin(a) * 34,
        alpha: 0, scale: 0.3, duration: 480, ease: 'Quad.easeOut',
        onComplete: () => st.destroy(),
      });
    }
  }

  cheerOnce() {
    if (!this.nehemiah) return;
    this.tweens.killTweensOf(this.nehemiah);
    this.nehemiah.y = NW_NEHEMIAH_FEET;
    this.tweens.add({ targets: this.nehemiah, y: NW_NEHEMIAH_FEET - 11,
                      duration: 150, yoyo: true, ease: 'Quad.easeOut' });
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play' || this.outcome) return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) { this.handleLoss(); return; }

    if (this.stone && this.stoneState === 'swing') this.stepSwing(dt);
    else if (this.stone && this.stoneState === 'fall') this.stepFall(dt);
    else if (this.respawnT > 0) {
      this.respawnT -= dt;
      if (this.respawnT <= 0) { this.respawnT = 0; this.spawnStone(); }
    }

    this.drawRope();
    this.drawHUD();
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily: Phaser reuses the Scene instance, so an
  //  `if (!this.hudTimer)` guard sees a truthy handle to a destroyed object.
  //
  //  Both readouts sit top-RIGHT rather than centred, because the crane beam owns the middle of
  //  the sky from x=158 to x=348 and a centred timer draws straight through it.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH - 14, 6, '', {
      ...FONTS.TIMER, fontSize: '24px', color: '#7A4A22',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(1, 0).setDepth(900);

    this.hudCount = this.add.text(GAME_WIDTH - 14, 36, '', {
      ...FONTS.SMALL, fontSize: '16px', fontStyle: 'bold', color: '#7A4A22',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(900);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    this.hudCount.setText(this.placed + '/' + NW_SLOTS);
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.phase = 'over';
    this.input.off('pointerdown', this.onTap, this);
    this.rope.clear();
    this.hudTimer.setVisible(false);
    this.hudCount.setVisible(false);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    const spent = this.config.timeLimit - this.timeRemaining;
    this.endRound();

    if (this.stone) { this.stone.destroy(); this.stone = null; }
    this.nehemiah.setTexture(NW_ASSETS.cheer.key);
    this.nehemiah.setScale(NW_NEHEMIAH_H / this.nehemiah.height);
    this.tweens.add({ targets: this.nehemiah, y: NW_NEHEMIAH_FEET - 16,
                      duration: 260, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });

    // The whole column lifts and settles once, so the eye reads the gap as one piece of wall
    // rather than as eight separate blocks that happen to be touching.
    this.stones.forEach((s, i) => this.tweens.add({
      targets: s, y: s.y - 7, duration: 180, delay: i * 45, yoyo: true, ease: 'Quad.easeOut',
    }));

    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.add.text(GAME_WIDTH / 2, 64, 'The wall is finished!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    const perfect = spent < this.config.timeLimit * 0.4;
    const fast = spent < this.config.timeLimit * 0.65;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.NEHEMIAH_WALL,
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

    if (this.stone) {
      this.tweens.add({ targets: this.stone, alpha: 0, duration: 360,
                        onComplete: () => { if (this.stone) { this.stone.destroy(); this.stone = null; } } });
    }

    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.add.text(GAME_WIDTH / 2, 64, 'Keep building!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.NEHEMIAH_WALL,
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

    if (!this.textures.exists(NW_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xF6D9B0, 1); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xD9B892, 1);
      g.fillRect(0, NW_GAP.top, NW_GAP.left, NW_GAP.bottom - NW_GAP.top);
      g.fillRect(NW_GAP.right, NW_GAP.top, GAME_WIDTH - NW_GAP.right, NW_GAP.bottom - NW_GAP.top);
      g.fillStyle(0xC8A882, 1); g.fillRect(0, NW_GAP.bottom, GAME_WIDTH, GAME_HEIGHT - NW_GAP.bottom);
      g.generateTexture(NW_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }
    if (!this.textures.exists(NW_ASSETS.stone.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xCBA67E, 1); g.lineStyle(5, ink, 1);
      g.fillRoundedRect(3, 3, 93, 54, 10); g.strokeRoundedRect(3, 3, 93, 54, 10);
      g.generateTexture(NW_ASSETS.stone.key, 99, 60);
      g.destroy();
    }
    if (!this.textures.exists(NW_ASSETS.arm.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x8A6442, 1); g.lineStyle(5, ink, 1);
      g.fillRect(4, 10, 640, 52); g.strokeRect(4, 10, 640, 52);
      g.fillStyle(0xA8815C, 1); g.fillCircle(609, 90, 24); g.strokeCircle(609, 90, 24);
      g.generateTexture(NW_ASSETS.arm.key, 660, 118);
      g.destroy();
    }
    [['point', 0x8FD6B4], ['cheer', 0x8FD6B4]].forEach(([n, skin]) => {
      if (this.textures.exists(NW_ASSETS[n].key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(skin, 1); g.fillCircle(80, 56, 44);
      g.fillStyle(0xF2E7CE, 1); g.lineStyle(4, ink, 1);
      g.fillRect(36, 96, 88, 140); g.strokeRect(36, 96, 88, 140);
      g.generateTexture(NW_ASSETS[n].key, 160, 240);
      g.destroy();
    });
  }
}
