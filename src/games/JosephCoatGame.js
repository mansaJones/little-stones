// ============================================
// JOSEPH'S COAT OF MANY COLORS - Watch the stripes, then repeat the pattern
// Genesis 37:3  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §18
// Art spec:      docs/Art_Plate_Prompts.md Scene 18
// ============================================

// Art plates live in assets/games/joseph-coat/
//   bg.jpg            — Jacob's tent. Centre and bottom strip kept clear, as Scene 18 asks.
//   joseph-base       — standing, coat in five PLAIN WHITE bands.
//   joseph-twirl      — the win pose, same five bands.
//   *-stripe-1..5     — one mask per band per pose, cut from the plate and tinted at runtime.
//   dye-pot           — the clay pot. Never tinted.
//   dye-liquid        — just the white liquid inside it. This is what carries the colour.
//
// No stripe colour is baked into any plate: §18 re-rolls the pattern every round, so a coloured
// band could not be re-used. The masks are pure white, because setTint() MULTIPLIES -- tint a
// cream mask and every colour comes out muddy.
const JC_ASSET_PATH = 'assets/games/joseph-coat/';
const JC_ASSETS = {
  bg:     { key: 'jc-bg',     file: 'bg.jpg' },
  base:   { key: 'jc-base',   file: 'joseph-base.png' },
  twirl:  { key: 'jc-twirl',  file: 'joseph-twirl.png' },
  pot:    { key: 'jc-pot',    file: 'dye-pot.png' },
  liquid: { key: 'jc-liquid', file: 'dye-liquid.png' },
};
const JC_BANDS = 5;
for (let i = 1; i <= JC_BANDS; i++) {
  JC_ASSETS['baseS' + i]  = { key: 'jc-base-s' + i,  file: 'joseph-base-stripe-' + i + '.png' };
  JC_ASSETS['twirlS' + i] = { key: 'jc-twirl-s' + i, file: 'joseph-twirl-stripe-' + i + '.png' };
}

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let JC_ART_PROBED = false;

// ---- The dyes ----
// §18: "Never color alone. Each dye pot carries a distinct symbol... and its own note. Roughly 1 in
// 12 boys has a color vision deficiency; without the symbols, this game is a wall for them."
//
// §18 names dot, star, heart, wave, square and moon. Wave and moon are drawn here as a TRIANGLE and
// a DIAMOND, because those two glyphs render in Arial everywhere and a missing glyph is a tofu box
// -- which would take the accessibility aid away from exactly the players who need it. (This build
// has already lost one emoji to that: a four-person family ZWJ sequence came out as empty boxes.)
// All six are solid geometric shapes, so they read at 20px and they differ in SILHOUETTE, not only
// in colour.
//
// `note` is the frequency §18 asks for. Nothing plays it yet -- this build has no audio at all --
// but the number belongs with the colour it goes with, so sound is a drop-in rather than a
// re-think. The SYMBOL is what carries the accessibility requirement on its own today.
const JC_DYES = [
  { color: 0xE8533A, symbol: '●', name: 'dot',      note: 523.25 },  // C5
  { color: 0x4A90E2, symbol: '★', name: 'star',     note: 587.33 },  // D5
  { color: 0xF5C33B, symbol: '♥', name: 'heart',    note: 659.25 },  // E5
  { color: 0x5FBF77, symbol: '▲', name: 'triangle', note: 698.46 },  // F5
  { color: 0x9B6FD1, symbol: '■', name: 'square',   note: 784.00 },  // G5
  { color: 0xE55FA3, symbol: '◆', name: 'diamond',  note: 880.00 },  // A5
];

// ---- Layout, measured off the plate ----
// The rug's top edge is the floor line: dusty rose against the cream tent wall, median row 590 of
// 750 -> stage y 295. Joseph stands on it; the pots sit along the bottom strip Scene 18 asked to
// be kept clear, and that strip is genuinely clear on the delivered plate.
const JC_FLOOR = 300;
const JC_JOSEPH_X = 333;
const JC_JOSEPH_H = 212;
const JC_POT_W = 60;
const JC_POT_GAP = 18;
const JC_POT_BASE = 372;      // pot feet
const JC_POT_PAD = 14;        // how far the tap target extends past the art, for small fingers

const JC_INTRO_MS = 800;
const JC_FLASH_FRAC = 0.72;   // of each playback step the stripe is lit; the rest is the gap
const JC_PAINT_MS = 240;

class JosephCoatGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.JOSEPH_COAT);
  }

  preload() {
    if (JC_ART_PROBED) return;
    JC_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[JosephCoat] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(JC_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, JC_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;      // STRING: 'easy' | 'medium' | 'hard'

    this.ensureTextures();

    // ---- Round state. All of it reset here, never at declaration: Phaser reuses the Scene
    // instance across restarts, so anything left on `this` survives into the next round as a
    // stale handle to a destroyed GameObject.
    this.phase = 'intro';                   // intro -> playback -> answer -> over
    this.outcome = null;
    this.timeRemaining = this.config.timeLimit;
    this.pattern = this.rollPattern();
    this.answered = 0;
    this.playT = 0;                         // seconds into the playback, on the GAME clock
    this.playIndex = -1;
    this.pots = [];
    this.stripes = [];

    this.add.image(0, 0, JC_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createJoseph();
    this.createPots();
    this.createHUD();
    this.drawHUD();

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  // §18: EASY and MEDIUM draw distinct colours; HARD "allows repeats (red, blue, red), which is
  // much harder than it sounds". A repeat is only interesting if it is not adjacent-identical by
  // accident, so the roll avoids two in a row -- "red red blue" is a memory freebie, "red blue red"
  // is the thing worth testing.
  rollPattern() {
    const n = Math.min(this.config.patternLength, JC_BANDS);
    const pots = this.config.potCount;
    const out = [];
    if (this.config.allowRepeats) {
      while (out.length < n) {
        const v = Phaser.Math.Between(0, pots - 1);
        if (out.length && out[out.length - 1] === v) continue;
        out.push(v);
      }
    } else {
      const bag = [];
      for (let i = 0; i < pots; i++) bag.push(i);
      Phaser.Utils.Array.Shuffle(bag);
      for (let i = 0; i < n; i++) out.push(bag[i]);
    }
    return out;
  }

  // ================================================================
  //  Scene
  // ================================================================

  createJoseph() {
    const j = this.add.image(JC_JOSEPH_X, JC_FLOOR, JC_ASSETS.base.key)
      .setOrigin(0.5, 1).setDepth(10);
    j.setScale(JC_JOSEPH_H / j.height);
    this.joseph = j;

    // One mask per band, stacked on him at the same size and origin so they line up exactly --
    // they were cut from the same plate at the same crop, so "same scale, same origin" is all the
    // alignment they need. Hidden until painted.
    for (let i = 0; i < JC_BANDS; i++) {
      const s = this.add.image(JC_JOSEPH_X, JC_FLOOR, JC_ASSETS['baseS' + (i + 1)].key)
        .setOrigin(0.5, 1).setDepth(11);
      s.setScale(JC_JOSEPH_H / s.height);
      s.setVisible(false);
      this.stripes.push(s);
    }
  }

  createPots() {
    const n = this.config.potCount;
    const total = n * JC_POT_W + (n - 1) * JC_POT_GAP;
    const x0 = GAME_WIDTH / 2 - total / 2 + JC_POT_W / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (JC_POT_W + JC_POT_GAP);
      const dye = JC_DYES[i];

      const pot = this.add.image(x, JC_POT_BASE, JC_ASSETS.pot.key).setOrigin(0.5, 1).setDepth(20);
      pot.setScale(JC_POT_W / pot.width);
      const liquid = this.add.image(x, JC_POT_BASE, JC_ASSETS.liquid.key)
        .setOrigin(0.5, 1).setDepth(21);
      liquid.setScale(JC_POT_W / liquid.width);
      liquid.setTint(dye.color);

      // The symbol sits ON the liquid. White with a dark stroke so it reads against every one of
      // the six colours without needing a per-colour decision.
      const glyph = this.add.text(x, JC_POT_BASE - pot.displayHeight + 16, dye.symbol, {
        fontFamily: 'Arial', fontSize: '19px', color: '#FFFFFF',
        stroke: '#3A2E2A', strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(22);

      // A padded hit area rather than the sprite's own bounds: these are 60px wide and the players
      // are six. Phaser hit-tests through the scene camera, so this keeps working when the canvas
      // is wider than the stage.
      const h = pot.displayHeight;
      pot.setInteractive(new Phaser.Geom.Rectangle(
        -JC_POT_PAD / pot.scaleX, -JC_POT_PAD / pot.scaleY,
        (JC_POT_W + JC_POT_PAD * 2) / pot.scaleX, (h + JC_POT_PAD * 2) / pot.scaleY),
        Phaser.Geom.Rectangle.Contains);
      pot.on('pointerdown', () => this.onPot(i));

      this.pots.push({ index: i, pot: pot, liquid: liquid, glyph: glyph, x: x, dye: dye });
    }
  }

  // ================================================================
  //  Intro, then playback
  // ================================================================

  runIntro() {
    this.prompt = this.add.text(GAME_WIDTH / 2, 52, 'Watch the colours!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '20px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(900);

    this.time.delayedCall(JC_INTRO_MS, () => {
      if (this.outcome) return;
      this.phase = 'playback';
    });
  }

  // §18: "Use the clamped game clock for the playback timing as well as the answer timer, so a
  // throttled tab doesn't desync the playback from the sound." So the playback is advanced from
  // update()'s dt, not from a chain of delayedCalls -- a backgrounded tab slows both together, and
  // the pattern a child sees is always the pattern the game is waiting for.
  stepPlayback(dt) {
    this.playT += dt;
    const step = this.config.playbackStep;
    const idx = Math.floor(this.playT / step);

    if (idx >= this.pattern.length) {
      this.clearFlash();
      this.beginAnswer();
      return;
    }
    if (idx !== this.playIndex) {
      this.playIndex = idx;
      this.flash(idx);
    }
    // Drop the lit stripe for the tail of each step, so two of the same colour in a row read as
    // two flashes rather than as one long one. That is the whole difficulty of HARD.
    if (this.playT - idx * step > step * JC_FLASH_FRAC) this.clearFlash();
  }

  flash(i) {
    const dye = JC_DYES[this.pattern[i]];
    const s = this.stripes[i];
    s.setTint(dye.color);
    s.setVisible(true);
    const p = this.pots[this.pattern[i]];
    if (p) {
      this.tweens.add({ targets: [p.pot, p.liquid, p.glyph], scaleX: '*=1.12', scaleY: '*=1.12',
                        duration: 110, yoyo: true, ease: 'Sine.easeOut' });
    }
  }

  clearFlash() {
    for (let i = 0; i < JC_BANDS; i++) {
      if (i >= this.answered) this.stripes[i].setVisible(false);
    }
  }

  beginAnswer() {
    this.phase = 'answer';
    this.timeRemaining = this.config.timeLimit;   // §18: watching never eats into answer time
    if (this.prompt) this.prompt.setText('Your turn!');
  }

  // ================================================================
  //  Input
  // ================================================================

  onPot(i) {
    if (this.phase !== 'answer' || this.outcome) return;    // §18: locked during playback

    const want = this.pattern[this.answered];
    const p = this.pots[i];
    if (i !== want) {
      this.wrong(p);
      return;
    }

    // §18: "each correct tap paints the next stripe, so the coat fills in as the child answers"
    const s = this.stripes[this.answered];
    s.setTint(p.dye.color);
    s.setVisible(true);
    s.setAlpha(0);
    this.tweens.add({ targets: s, alpha: 1, duration: JC_PAINT_MS, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: [p.pot, p.liquid, p.glyph], scaleX: '*=1.14', scaleY: '*=1.14',
                      duration: 110, yoyo: true, ease: 'Sine.easeOut' });
    this.answered++;
    this.drawHUD();

    if (this.answered >= this.pattern.length) this.handleWin();
  }

  wrong(p) {
    this.tweens.add({ targets: [p.pot, p.liquid, p.glyph], angle: 10,
                      duration: 70, yoyo: true, repeat: 2 });
    this.cameras.main.shake(160, 0.005);
    this.handleLoss();
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase === 'intro' || this.phase === 'over') return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    if (this.phase === 'playback') { this.stepPlayback(dt); this.drawHUD(); return; }

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) { this.handleLoss(); return; }
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
      ...FONTS.TIMER, fontSize: '24px', color: '#7A4A22',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(900);

    this.hudCount = this.add.text(GAME_WIDTH - 14, 10, '', {
      ...FONTS.SMALL, fontSize: '16px', fontStyle: 'bold', color: '#7A4A22',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(900);
  }

  drawHUD() {
    // No countdown during playback, because there is nothing to count down -- §18 is explicit that
    // watching costs nothing. A ticking clock there would teach a child to rush the one part of
    // the round they are supposed to sit still for.
    this.hudTimer.setText(this.phase === 'answer'
      ? Math.max(0, this.timeRemaining).toFixed(1) + 's' : '');
    this.hudCount.setText(this.answered + '/' + this.pattern.length);
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.phase = 'over';
    this.pots.forEach(p => p.pot.disableInteractive());
    this.hudTimer.setVisible(false);
    this.hudCount.setVisible(false);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    const spent = this.config.timeLimit - this.timeRemaining;
    this.endRound();

    // The twirl is a different plate with its own five masks, so the painted colours are carried
    // across by index rather than by reusing the standing masks, which would not line up.
    // §18's success line is "The coat is complete, Joseph twirls" -- but EASY answers only 3 of the
    // coat's 5 bands, so carrying across just the answered ones would twirl a coat still two-fifths
    // cream at the one moment it is being admired. The leftovers are filled with dyes the pattern
    // did NOT use, so the finished coat is a coat of many colours rather than a repeat of the
    // answer. They fade in after the answered bands, left to settle before the twirl reads.
    // Prefer dyes that had a pot on screen this round, so the finished coat is mostly made of
    // colours the child just saw; the off-screen dyes only come in when EASY (3 answered, 4 pots)
    // runs out of on-screen spares.
    const used = new Set(this.pattern);
    const spare = [];
    for (let i = 0; i < this.config.potCount; i++) if (!used.has(i)) spare.push(i);
    for (let i = this.config.potCount; i < JC_DYES.length; i++) if (!used.has(i)) spare.push(i);

    this.joseph.setTexture(JC_ASSETS.twirl.key);
    this.joseph.setScale(JC_JOSEPH_H / this.joseph.height);
    this.stripes.forEach((s, i) => {
      s.setTexture(JC_ASSETS['twirlS' + (i + 1)].key);
      s.setScale(JC_JOSEPH_H / s.height);
      const answered = i < this.pattern.length;
      const dye = answered ? this.pattern[i]
                           : spare[(i - this.pattern.length) % Math.max(1, spare.length)];
      s.setTint(JC_DYES[dye === undefined ? i % JC_DYES.length : dye].color);
      s.setVisible(true).setAlpha(answered ? 1 : 0);
      if (!answered) {
        this.tweens.add({ targets: s, alpha: 1, duration: 240,
                          delay: 140 + (i - this.pattern.length) * 170, ease: 'Quad.easeOut' });
      }
    });
    this.tweens.add({ targets: [this.joseph].concat(this.stripes),
                      angle: { from: -6, to: 6 }, duration: 420, yoyo: true, repeat: 2,
                      ease: 'Sine.easeInOut' });

    if (this.prompt) this.prompt.destroy();
    this.add.text(GAME_WIDTH / 2, 30, 'What a beautiful coat!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    const perfect = spent < this.config.timeLimit * 0.4;
    const fast = spent < this.config.timeLimit * 0.65;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.JOSEPH_COAT,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();

    // §18: "The stripes fade back to cream." Nothing is destroyed and nobody is told off -- the
    // coat simply goes back to being plain, which is where the next round starts from.
    this.stripes.forEach(s => this.tweens.add({
      targets: s, alpha: 0, duration: 420, ease: 'Quad.easeIn',
      onComplete: () => s.setVisible(false),
    }));

    if (this.prompt) this.prompt.destroy();
    this.add.text(GAME_WIDTH / 2, 30, 'Watch closely!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.JOSEPH_COAT,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/joseph-coat/ is missing or incomplete. The real plates shipped,
  //  so this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(JC_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xF2E4D0, 1); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xC9A0A0, 1); g.fillRect(0, JC_FLOOR - 5, GAME_WIDTH, GAME_HEIGHT - JC_FLOOR + 5);
      g.generateTexture(JC_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }
    // The figure and its five bands, as one block each, so the masks still line up.
    const FW = 205, FH = 460, TOP = 100;
    const bandH = (FH - TOP) / JC_BANDS;
    ['base', 'twirl'].forEach((pose) => {
      if (!this.textures.exists(JC_ASSETS[pose].key)) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x9FA8E8, 1); g.fillCircle(FW / 2, 60, 52);
        g.fillStyle(0xFFFFFF, 1); g.lineStyle(4, ink, 1);
        g.fillRect(28, TOP, FW - 56, FH - TOP);
        g.strokeRect(28, TOP, FW - 56, FH - TOP);
        g.generateTexture(JC_ASSETS[pose].key, FW, FH);
        g.destroy();
      }
      for (let i = 0; i < JC_BANDS; i++) {
        const k = JC_ASSETS[pose + 'S' + (i + 1)].key;
        if (this.textures.exists(k)) continue;
        const g = this.make.graphics({ add: false });
        g.fillStyle(0xFFFFFF, 1);
        g.fillRect(30, TOP + i * bandH + 2, FW - 60, bandH - 4);
        g.generateTexture(k, FW, FH);
        g.destroy();
      }
    });
    [['pot', 0xC9AE86], ['liquid', 0xFFFFFF]].forEach(([n, fill]) => {
      if (this.textures.exists(JC_ASSETS[n].key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(fill, 1);
      if (n === 'pot') { g.lineStyle(4, ink, 1); g.fillEllipse(75, 80, 140, 120); g.strokeEllipse(75, 80, 140, 120); }
      else g.fillEllipse(75, 26, 96, 34);
      g.generateTexture(JC_ASSETS[n].key, 150, 146);
      g.destroy();
    });
  }
}
