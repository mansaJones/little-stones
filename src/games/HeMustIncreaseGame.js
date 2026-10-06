// ============================================
// HE MUST INCREASE - Swipe to give God more room than yourself
// John 3:30  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: biblical_game_design_doc.md §12
// Art spec:      Art_Plate_Prompts.md Scene 11
// ============================================

// Art plates live in assets/games/he-must-increase/
//   bg.jpg        — the river Jordan bank. The delivered panel is nearly SQUARE (507x522), so it
//                   is cropped to 16:9 keeping the bottom, less a 45px lift. That lift is what
//                   buys the ~100px band of flat peach sky this game's HUD sits in; flush-bottom
//                   left only 48px. If the plate is ever redrawn, re-run that crop.
//   john.png      — John the Baptist, one pose, hand raised and open. Faces the tiles.
//   tile-god.png  — the gold tile. BLANK by design.
//   tile-me.png   — the periwinkle tile. BLANK by design.
//
// The tiles ship blank because GOD and ME are runtime text that rescales with the tile. Bake the
// words into the art and they stretch into garbage the first time the tile resizes.
const LI_ASSET_PATH = 'assets/games/he-must-increase/';
const LI_ASSETS = {
  bg:   { key: 'li-bg',       file: 'bg.jpg' },
  john: { key: 'li-john',     file: 'john.png' },
  god:  { key: 'li-tile-god', file: 'tile-god.png' },
  me:   { key: 'li-tile-me',  file: 'tile-me.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let LI_ART_PROBED = false;

// ---- Layout, measured off bg.jpg rather than chosen ----
// John stands on the sand bank, whose top edge runs along y≈205 between x=90 and x=350.
const LI_JOHN = { x: 135, feet: 338, h: 152 };

// Both tiles stand on one waterline — the art calls them "river stones standing on end", and a
// shared baseline is what makes one tile towering over the other legible at a glance. Centre-
// anchoring them instead reads as two things drifting apart rather than one gaining on the other.
const LI_BASELINE = 258;
const LI_GOD_X = 360;
const LI_ME_X = 505;

// The tiles are the only moving parts, so their size range is the whole visual argument: 46 to 164
// is a 3.5x swing, which reads instantly. The ceiling is set by the backdrop, not by taste — at
// 164 tall the taller tile's top edge lands on the horizon at y=94, and the ME tile at its widest
// reaches x=572, just short of the reeds at x=590. Raising either number puts a tile into the
// foliage.
const LI_TILE_MIN_H = 46;
const LI_TILE_MAX_H = 164;

// Vertical drag, in px, for the full 0 -> 100 sweep. At 320 a 5-point band is 16px of travel:
// tight enough that HARD's 90-95 window is a real test, loose enough that a six-year-old's thumb
// can sit inside MEDIUM's 80-90. Dropping to 260 made HARD a coin flip.
const LI_SWIPE_SPAN = 320;

const LI_DWELL = 0.35;      // s inside the band before the round is won
const LI_INTRO_MS = 600;    // the clock does NOT run during this; HARD only gets 3s as it is
const LI_START_GOD = 50;    // "I must decrease" has to start from even

class HeMustIncreaseGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.HE_MUST_INCREASE);
  }

  preload() {
    if (LI_ART_PROBED) return;
    LI_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[HeMustIncrease] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(LI_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, LI_ASSET_PATH + a.file);
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
    this.godPercent = LI_START_GOD;
    this.inBandFor = 0;
    this.lastPointerY = undefined;
    this.wobbled = false;                   // did the player ever swipe the wrong way
    this.overshot = false;                  // did GOD ever go past the top of the band
    this.wasInBand = false;
    this.prompt = null;

    this.add.image(0, 0, LI_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createJohn();
    this.createTiles();
    this.createBand();
    this.createHUD();

    this.applyPercent();
    this.drawHUD();

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    // Dragging off the canvas and back must not land as one giant jump from the last position
    // inside it. Dropping the anchor here makes the next move re-anchor instead.
    this.input.on('pointerup', () => { this.lastPointerY = undefined; });

    this.showPrompt(this.difficulty === DIFFICULTY.HARD
      ? 'Swipe up — and hold it!'
      : 'Swipe up to grow GOD!');

    this.gameStartTime = this.time.now;
    this.time.delayedCall(LI_INTRO_MS, () => { if (!this.outcome) this.phase = 'play'; });
  }

  // ================================================================
  //  Entities
  // ================================================================

  createJohn() {
    this.john = this.add.image(LI_JOHN.x, LI_JOHN.feet, LI_ASSETS.john.key)
      .setOrigin(0.5, 1).setDepth(10);
    this.john.setScale(LI_JOHN.h / this.john.height);
  }

  createTiles() {
    // Both tiles keep their OWN aspect ratio. The two plates came out at 0.807 and 0.810 w/h, near
    // enough identical that scaling by height alone keeps them a matched pair.
    this.godTile = this.add.image(LI_GOD_X, LI_BASELINE, LI_ASSETS.god.key)
      .setOrigin(0.5, 1).setDepth(20);
    this.meTile = this.add.image(LI_ME_X, LI_BASELINE, LI_ASSETS.me.key)
      .setOrigin(0.5, 1).setDepth(20);
    this.godAspect = this.godTile.width / this.godTile.height;
    this.meAspect = this.meTile.width / this.meTile.height;

    // Names ride INSIDE their tile and rescale with it, clamped so "GOD" is still readable when the
    // tile is down to 46px. Percentages sit below the shared baseline at a fixed size, because a
    // number that shrinks as it matters more is a number nobody reads.
    this.godName = this.add.text(LI_GOD_X, 0, 'GOD', {
      ...FONTS.TITLE, color: '#7A5A12', fontSize: '22px',
      stroke: '#FFF6DC', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(30);
    this.meName = this.add.text(LI_ME_X, 0, 'ME', {
      ...FONTS.TITLE, color: '#4A4A7A', fontSize: '22px',
      stroke: '#F0F0FF', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(30);

    this.godPct = this.add.text(LI_GOD_X, LI_BASELINE + 8, '', {
      ...FONTS.HUD, fontSize: '17px', color: '#7A5A12',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(30);
    this.mePct = this.add.text(LI_ME_X, LI_BASELINE + 8, '', {
      ...FONTS.HUD, fontSize: '17px', color: '#4A4A7A',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(30);
  }

  // The target band is drawn OVER the GOD tile, not behind it. Behind, the tile covers the band at
  // exactly the moment the player needs to see where its top edge has to land.
  createBand() {
    this.band = this.add.graphics().setDepth(25);
    this.drawBand();
  }

  drawBand() {
    const yMax = this.topY(this.config.targetGodMax);   // higher on screen
    const yMin = this.topY(this.config.targetGodMin);
    const w = LI_TILE_MAX_H * this.godAspect + 26;
    const x = LI_GOD_X - w / 2;

    // HARD's band is 90-95, which is six pixels of travel. Drawn honestly it is invisible, so the
    // fill is floored at 10px while the two edge lines stay on the true values — the lines are the
    // target, the fill is only there to say which side of them you want to be on.
    const h = Math.max(yMin - yMax, 10);
    const top = yMax - (h - (yMin - yMax)) / 2;

    this.band.clear();
    this.band.fillStyle(0xFFD93D, this.wasInBand ? 0.42 : 0.2);
    this.band.fillRect(x, top, w, h);
    this.band.lineStyle(2, this.wasInBand ? 0x1E9E55 : 0xC2731A, 0.9);
    this.band.lineBetween(x, yMax, x + w, yMax);
    if (this.config.targetGodMin !== this.config.targetGodMax) {
      this.band.lineBetween(x, yMin, x + w, yMin);
    }
  }

  // ================================================================
  //  The one number this game is about
  // ================================================================

  tileHeight(p) {
    return LI_TILE_MIN_H + (p / 100) * (LI_TILE_MAX_H - LI_TILE_MIN_H);
  }

  topY(p) {
    return LI_BASELINE - this.tileHeight(p);
  }

  inBand() {
    return this.godPercent >= this.config.targetGodMin
        && this.godPercent <= this.config.targetGodMax;
  }

  setPercent(p) {
    this.godPercent = Phaser.Math.Clamp(p, 0, 100);
    this.applyPercent();
  }

  // GOD at p, ME at 100 - p. One grows exactly as much as the other shrinks, which is the whole
  // point of the verse and the reason the two tiles share a baseline.
  applyPercent() {
    const gh = this.tileHeight(this.godPercent);
    const mh = this.tileHeight(100 - this.godPercent);

    this.godTile.setDisplaySize(gh * this.godAspect, gh);
    this.meTile.setDisplaySize(mh * this.meAspect, mh);

    this.godName.setPosition(LI_GOD_X, LI_BASELINE - gh / 2);
    this.meName.setPosition(LI_ME_X, LI_BASELINE - mh / 2);
    // Guarded, unlike setText: Phaser re-rasterizes the glyphs on every setFontSize call whether
    // the size changed or not, and on HARD this runs 60 times a second because of the revert.
    this.setNameSize(this.godName, Phaser.Math.Clamp(Math.round(gh * 0.15), 11, 24));
    this.setNameSize(this.meName, Phaser.Math.Clamp(Math.round(mh * 0.17), 11, 24));

    this.godPct.setText(Math.round(this.godPercent) + '%');
    this.mePct.setText(Math.round(100 - this.godPercent) + '%');

    const nowIn = this.inBand();
    if (nowIn !== this.wasInBand) {
      this.wasInBand = nowIn;
      this.drawBand();
      // The design doc asks for haptics here. There is no audio or haptic layer in the build yet,
      // so the "you're there" signal is carried by the band turning green and the tile lifting.
      if (nowIn) this.godTile.setTint(0xFFFBE8);
      else this.godTile.clearTint();
    }
  }

  setNameSize(text, px) {
    if (text.lastSizePx === px) return;
    text.lastSizePx = px;
    text.setFontSize(px);
  }

  // ================================================================
  //  Input
  // ================================================================

  handlePointerDown(pointer) {
    // Re-anchor on every fresh touch. The gap between lifting a thumb at the bottom of the stage
    // and putting it back at the top is not a swipe, and must not be read as one.
    this.lastPointerY = pointer.y;
  }

  handlePointerMove(pointer) {
    if (this.phase !== 'play') return;
    if (!pointer.isDown) return;            // this is a DRAG, not a hover
    if (this.lastPointerY === undefined) { this.lastPointerY = pointer.y; return; }

    const dy = this.lastPointerY - pointer.y;   // up is positive
    this.lastPointerY = pointer.y;
    if (dy === 0) return;

    if (dy < 0) this.wobbled = true;        // only INPUT counts as a wobble; HARD's revert does not
    this.setPercent(this.godPercent + dy * (100 / LI_SWIPE_SPAN));
    if (this.godPercent > this.config.targetGodMax) this.overshot = true;
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play') return;
    const dt = delta / 1000;                // Phaser 3 passes (time, delta). The version this
                                            // replaced took (delta) and was doing its arithmetic
                                            // on milliseconds-since-boot.

    this.timeRemaining -= dt;

    // HARD only: the tiles creep back toward even, so the band has to be HELD, not just touched.
    // Applied while dragging too — that is what turns "flick it up" into "keep making room".
    if (this.config.revertRate) {
      const pull = this.config.revertRate * dt;
      if (this.godPercent > LI_START_GOD) {
        this.setPercent(Math.max(LI_START_GOD, this.godPercent - pull));
      } else if (this.godPercent < LI_START_GOD) {
        this.setPercent(Math.min(LI_START_GOD, this.godPercent + pull));
      }
    }

    if (this.inBand()) {
      this.inBandFor += dt;
      if (this.inBandFor >= LI_DWELL) { this.handleWin(); return; }
    } else {
      this.inBandFor = 0;
    }

    if (this.timeRemaining <= 0) { this.handleLoss(); return; }
    this.drawHUD();
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily. A `if (!this.hudTimer)` guard does not help across a
  //  restart: Phaser reuses the Scene instance, so the property is still truthy and still points
  //  at a destroyed object.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 8, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#4A3A2A',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(60);

    // The band is the picture; this is the number. On EASY the target tops out at 100, so it reads
    // "GOD 70%+" rather than a range nobody has to aim inside.
    const tgt = this.config.targetGodMax >= 100
      ? 'GOD ' + this.config.targetGodMin + '%+'
      : 'GOD ' + this.config.targetGodMin + '–' + this.config.targetGodMax + '%';
    this.hudTarget = this.add.text(GAME_WIDTH - 14, 12, tgt, {
      ...FONTS.SMALL, fontSize: '15px', fontStyle: 'bold', color: '#4A3A2A',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(60);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
  }

  showPrompt(text) {
    this.prompt = this.add.text(GAME_WIDTH / 2, 52, text, {
      ...FONTS.TITLE, color: '#C2731A', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(70);
    this.tweens.add({
      targets: this.prompt, scaleX: 1.07, scaleY: 1.07,
      duration: 460, yoyo: true, repeat: -1,
    });
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
    this.hudTarget.setVisible(false);
    this.band.setVisible(false);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    const clean = !this.wobbled && !this.overshot;
    this.endRound();

    this.godTile.clearTint();

    // "Light radiates from the GOD tile" — design doc §12.
    const cy = LI_BASELINE - this.tileHeight(this.godPercent) / 2;
    // Positioned at the tile and drawn at its OWN origin. A Graphics object scales about its
    // position, so a circle drawn at absolute (LI_GOD_X, cy) on a graphics sitting at (0,0) does
    // not swell in place — it flies off toward the bottom-right corner.
    const glow = this.add.graphics({ x: LI_GOD_X, y: cy }).setDepth(18);
    glow.fillStyle(0xFFF3C4, 0.75);
    glow.fillCircle(0, 0, 60);
    this.tweens.add({
      targets: glow, alpha: 0, scaleX: 3.4, scaleY: 3.4,
      duration: 900, ease: 'Quad.easeOut', onComplete: () => glow.destroy(),
    });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const ray = this.add.graphics().setDepth(17);
      ray.lineStyle(4, 0xFFD93D, 0.9);
      ray.lineBetween(LI_GOD_X + Math.cos(a) * 44, cy + Math.sin(a) * 44,
                      LI_GOD_X + Math.cos(a) * 74, cy + Math.sin(a) * 74);
      this.tweens.add({
        targets: ray, alpha: 0, duration: 760, delay: i * 18,
        ease: 'Quad.easeOut', onComplete: () => ray.destroy(),
      });
    }

    // John steps back as the tile fills the frame. He is the one who said the line.
    this.tweens.add({
      targets: this.john, y: LI_JOHN.feet + 6, scaleX: this.john.scaleX * 0.94,
      scaleY: this.john.scaleY * 0.94, duration: 700, ease: 'Sine.easeOut',
    });

    this.add.text(GAME_WIDTH / 2, 348, 'He must increase!', {
      ...FONTS.TITLE, color: '#1E9E55', fontSize: '23px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(80);

    const fast = elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, clean, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.HE_MUST_INCREASE,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  // Running out of time is the ONLY way to lose.
  //
  // §12 lists "overshoot or undershoot" under Lose Conditions, which read literally would end the
  // round the instant a thumb slips past 90 on MEDIUM. For a six-year-old on a 4-second clock that
  // is not a difficulty setting, it is a trap, and it contradicts the line above it — "fail to
  // reach target proportions BEFORE THE TIMER EXPIRES". Overshooting is treated as what it is: a
  // way to run the clock down, and the thing that costs the clean-approach bonus.
  handleLoss() {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();

    this.godTile.clearTint();

    // The tiles settle back to even. That reset IS the failure state — the verse undone.
    this.tweens.addCounter({
      from: this.godPercent, to: LI_START_GOD, duration: 600, ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        if (this.godTile && this.godTile.active) this.setPercent(tw.getValue());
      },
    });

    this.add.text(GAME_WIDTH / 2, 348, 'Try again!', {
      ...FONTS.TITLE, color: '#C2731A', fontSize: '24px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(80);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.HE_MUST_INCREASE,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/he-must-increase/ is missing or incomplete. The real plates
  //  shipped, so this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(LI_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFBE3B8, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xC8E6DC, 1);
      g.fillRect(0, 100, GAME_WIDTH, GAME_HEIGHT - 100);
      g.fillStyle(0xEDD68A, 1);
      g.fillEllipse(170, 300, 420, 190);
      g.generateTexture(LI_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }

    if (!this.textures.exists(LI_ASSETS.john.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x9FD8B4, 1);
      g.fillCircle(58, 52, 34);
      g.fillStyle(0xC9A878, 1);
      g.fillRect(28, 84, 60, 96);
      g.fillStyle(0x9FD8B4, 1);
      g.fillRect(84, 74, 34, 14);           // the raised, open hand
      g.lineStyle(5, ink, 1);
      g.strokeCircle(58, 52, 34);
      g.strokeRect(28, 84, 60, 96);
      g.generateTexture(LI_ASSETS.john.key, 126, 190);
      g.destroy();
    }

    [[LI_ASSETS.god.key, 0xF2CE7E, 176, 218], [LI_ASSETS.me.key, 0xC3C6EA, 124, 153]]
      .forEach(([key, fill, w, h]) => {
        if (this.textures.exists(key)) return;
        const g = this.make.graphics({ add: false });
        g.fillStyle(fill, 1);
        g.fillRoundedRect(4, 4, w - 8, h - 8, 22);
        g.lineStyle(5, ink, 1);
        g.strokeRoundedRect(4, 4, w - 8, h - 8, 22);
        g.generateTexture(key, w, h);
        g.destroy();
      });
  }
}
