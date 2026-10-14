// ============================================
// FEEDING THE 5,000 - Drag the basket and catch the bread and fish
// John 6:1-13  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §21
// Art spec:      docs/Art_Plate_Prompts.md Scene 21
// ============================================

// Art plates live in assets/games/feeding-5000/
//   bg.jpg          — the hillside, with the crowd already in it at the left and right edges.
//   jesus           — top centre, on the rock, static.
//   bread / fish    — fall from his hands.
//   basket-*        — the boy, three fill states, dragged along the bottom.
const FK_ASSET_PATH = 'assets/games/feeding-5000/';
const FK_ASSETS = {
  bg:     { key: 'fk-bg',     file: 'bg.jpg' },
  jesus:  { key: 'fk-jesus',  file: 'jesus.png' },
  bread:  { key: 'fk-bread',  file: 'bread.png' },
  fish:   { key: 'fk-fish',   file: 'fish.png' },
  empty:  { key: 'fk-empty',  file: 'basket-empty.png' },
  half:   { key: 'fk-half',   file: 'basket-half.png' },
  full:   { key: 'fk-full',   file: 'basket-full.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let FK_ART_PROBED = false;

// ---- Layout, measured off the plate (key_feed5k.py prints these) ----
//
// Scene 21 asked to keep the middle of the frame open "from the top rock down to the bottom edge",
// and it is -- but the hill's crest slopes away from the rock with the crowd sitting on it, so the
// clear grass is a WEDGE: only 110px either side of centre at y=82, 273 at y=150, the full width
// below y=206. Spawning "across the width" at the top would drop loaves on the audience.
//
// So items fall from JESUS and fan outward, which is what the story says anyway, and which keeps
// every path inside the wedge by construction. Measured, for a path aimed at the far edge of the
// playable band:
//
//      y  82.5   path  40.5 from centre, wedge allows 110.7
//      y 150.0   path 113.1 from centre, wedge allows 272.8
//      y 262.5   path 232.1 from centre, wedge allows 333.4
const FK_JESUS_X = 333.5;
const FK_JESUS_FEET = 69.1;
const FK_JESUS_H = 62;
const FK_SPAWN_X = 333.5;
const FK_SPAWN_Y = 43.1;              // his hands
const FK_BOY_H = 96;
const FK_BOY_FEET = 366;
const FK_CATCH_Y = 333.5;             // the basket rim: 0.662 of the sprite down
const FK_ITEM_W = 26;
const FK_FALL = FK_CATCH_Y - FK_SPAWN_Y;

const FK_BASKET_W = 54;               // the rim is 78% of the sprite's width
const FK_CATCH_PAD = 8;               // a little forgiveness on each side, for small fingers
const FK_EDGE_PAD = FK_ITEM_W;        // items always land fully on screen
// §21: "Speed cap on the basket, same reasoning as Samson: without it, catching is free." §21 does
// not say what the cap IS, so it is measured. Consecutive landings are on average a third of the
// stage apart (~205px) and HARD releases one every 0.366s, so keeping up with the average pair
// needs 560px/s. Swept against a player who always chases the soonest item it can actually reach:
//
//      440px/s  hard  50% (14.2 of 15)
//      470px/s  hard  67% (14.7)
//      500px/s  hard  67% (14.5)
//      520px/s  hard 100%
//
// The knee is around 510 for a PERFECT player, which is the wrong place to sit -- a child is not
// perfect. 600 crosses the stage in 1.1s: comfortably clear of the knee, and still far slower than
// a real thumb flick (1300px/s+), so the cap is a genuine constraint rather than a formality.
const FK_BASKET_SPEED = 600;
const FK_MIN_GAP_S = 0.5;             // §21: never two at the same x within half a second
const FK_MIN_GAP_X = 70;              // ...and "the same x" means within a basket's reach
const FK_GUARANTEE = 1.6;             // §21: spawn rate x time >= 1.6 x the catch target
const FK_INTRO_MS = 800;

class FeedingFiveThousandGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.FEEDING_5000);
  }

  preload() {
    if (FK_ART_PROBED) return;
    FK_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[Feeding5000] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(FK_ASSETS).forEach((a) => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, FK_ASSET_PATH + a.file);
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
    this.caught = 0;
    this.missed = 0;
    this.items = [];
    this.recent = [];                       // {t, x} of recent spawns, for the 0.5s rule
    this.spawnT = 0;
    this.basketX = GAME_WIDTH / 2;
    this.wantX = GAME_WIDTH / 2;
    this.fill = 'empty';

    // §21: "spawn rate x time >= 1.6 x the catch target, so the target is always reachable."
    // Against the USABLE window, not the whole round: an item released later than one fall-time
    // before the buzzer can never be caught, so counting it towards the guarantee would make the
    // guarantee a lie. At EASY that is the difference between a ratio of 1.6 and one of 1.29.
    this.fallTime = FK_FALL / this.config.fallSpeed;
    const window = Math.max(0.5, this.config.timeLimit - this.fallTime);
    this.spawnEvery = window / (FK_GUARANTEE * this.config.targetCatches);

    this.add.image(0, 0, FK_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    const j = this.add.image(FK_JESUS_X, FK_JESUS_FEET, FK_ASSETS.jesus.key)
      .setOrigin(0.5, 1).setDepth(10);
    j.setScale(FK_JESUS_H / j.height);
    this.jesus = j;

    this.basket = this.add.image(this.basketX, FK_BOY_FEET, FK_ASSETS.empty.key)
      .setOrigin(0.5, 1).setDepth(30);
    this.basket.setScale(FK_BOY_H / this.basket.height);

    this.worldPoint = new Phaser.Math.Vector2();
    this.createHUD();
    this.drawHUD();

    this.gameStartTime = this.time.now;
    this.runIntro();
  }

  runIntro() {
    this.prompt = this.add.text(GAME_WIDTH / 2, 120, 'Slide the basket to catch it all!', {
      ...FONTS.TITLE, color: '#2F5A3A', fontSize: '19px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(900);

    this.time.delayedCall(FK_INTRO_MS, () => {
      if (this.outcome) return;
      this.phase = 'play';
      this.spawn();                                   // one in the air immediately
      this.tweens.add({ targets: this.prompt, alpha: 0, duration: 400,
                        onComplete: () => { if (this.prompt) { this.prompt.destroy(); this.prompt = null; } } });
    });
  }

  // ================================================================
  //  Input
  //
  //  §21: "Horizontal drag only. The basket follows the finger's x with a speed cap; vertical
  //  movement is ignored."
  // ================================================================

  // getWorldPoint, not pointer.worldX: worldX is a cache Phaser refreshes on input EVENTS, and this
  // game POLLS, so on a widened canvas the cache sits a whole stage-offset out. Peter Walks on Water
  // shipped exactly that and was unplayable on a 2.17 phone.
  readWantX() {
    const p = this.input.activePointer;
    if (!p || !p.isDown) return this.wantX;
    this.cameras.main.getWorldPoint(p.x, p.y, this.worldPoint);
    return Phaser.Math.Clamp(this.worldPoint.x, FK_BASKET_W / 2, GAME_WIDTH - FK_BASKET_W / 2);
  }

  // ================================================================
  //  The food
  // ================================================================

  // Items fall from Jesus and fan outward. The landing x is chosen first and the horizontal speed
  // follows from it, so "where can the basket be" is a decision rather than an emergent accident --
  // and so §21's "never two at the same x within 0.5s" can actually be enforced.
  pickLandingX() {
    const lo = FK_EDGE_PAD, hi = GAME_WIDTH - FK_EDGE_PAD;
    const now = this.elapsedSeconds();
    this.recent = this.recent.filter(r => now - r.t < FK_MIN_GAP_S);
    for (let tries = 0; tries < 24; tries++) {
      const x = Phaser.Math.FloatBetween(lo, hi);
      if (this.recent.every(r => Math.abs(r.x - x) >= FK_MIN_GAP_X)) return x;
    }
    // Nowhere far enough from the last few: go as far from them as the stage allows rather than
    // dropping the spawn, because a skipped spawn would quietly break the reachability guarantee.
    let best = lo, bestD = -1;
    for (let i = 0; i <= 24; i++) {
      const x = lo + (hi - lo) * (i / 24);
      const d = Math.min.apply(null, this.recent.map(r => Math.abs(r.x - x)).concat([1e9]));
      if (d > bestD) { bestD = d; best = x; }
    }
    return best;
  }

  spawn() {
    if (this.outcome || this.phase !== 'play') return;
    const landing = this.pickLandingX();
    this.recent.push({ t: this.elapsedSeconds(), x: landing });

    const isFish = Math.random() < 0.4;
    const img = this.add.image(FK_SPAWN_X, FK_SPAWN_Y,
                               isFish ? FK_ASSETS.fish.key : FK_ASSETS.bread.key).setDepth(20);
    img.setScale(FK_ITEM_W / img.width);
    this.items.push({
      img: img, y: FK_SPAWN_Y, x0: FK_SPAWN_X, landing: landing,
      vx: (landing - FK_SPAWN_X) / this.fallTime,
      spin: Phaser.Math.FloatBetween(-110, 110),
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      dead: false,
    });
  }

  stepItems(dt) {
    const sway = this.config.swayAmount || 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.dead) continue;
      it.y += this.config.fallSpeed * dt;
      const t = (it.y - FK_SPAWN_Y) / this.config.fallSpeed;
      // §21: "HARD: items sway side to side as they fall." The sway is added to the straight path
      // and is zero at the catch line, so a swaying item still arrives exactly where it was aimed
      // -- the sway makes it harder to READ, not impossible to catch.
      const frac = Phaser.Math.Clamp((it.y - FK_SPAWN_Y) / FK_FALL, 0, 1);
      const wobble = sway * Math.sin(it.phase + frac * Math.PI * 3) * (1 - frac);
      it.img.x = it.x0 + it.vx * t + wobble;
      it.img.y = it.y;
      it.img.angle += it.spin * dt;

      if (it.y >= FK_CATCH_Y) {
        // Settle it ON the line before judging. A frame step carries the item PAST the catch line,
        // and because x is a function of how far it has fallen, testing it where it happens to
        // land is testing it up to 2.6px beyond where it was aimed -- a fairness error that grows
        // with fall speed, i.e. one that is worst on HARD.
        it.y = FK_CATCH_Y;
        it.img.y = FK_CATCH_Y;
        it.img.x = it.landing;
        const reach = FK_BASKET_W / 2 + FK_CATCH_PAD;
        if (Math.abs(it.img.x - this.basketX) <= reach) this.catchItem(it);
        else this.missItem(it);
      }
    }
    this.items = this.items.filter(it => !it.dead);
  }

  catchItem(it) {
    it.dead = true;
    it.img.destroy();
    this.caught++;
    this.updateFill();
    this.drawHUD();

    this.tweens.killTweensOf(this.basket);
    this.basket.setScale(FK_BOY_H / this.basket.height);
    this.tweens.add({ targets: this.basket, scaleX: this.basket.scaleX * 1.08,
                      scaleY: this.basket.scaleY * 0.93, duration: 90, yoyo: true,
                      ease: 'Quad.easeOut' });
    const pop = this.add.text(this.basketX, FK_CATCH_Y - 14, '+1', {
      ...FONTS.SMALL, fontSize: '15px', fontStyle: 'bold', color: '#2F7A4A',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(905);
    this.tweens.add({ targets: pop, y: pop.y - 20, alpha: 0, duration: 520,
                      onComplete: () => pop.destroy() });

    if (this.caught >= this.config.targetCatches) this.handleWin();
  }

  // §21: "no penalty for a miss. The story is abundance; there's always more. A missed loaf lands
  // on the grass and someone in the crowd happily picks it up." There is no crowd-member sprite in
  // Scene 21's layer table -- the crowd is painted into the backdrop at the edges, far from where
  // anything lands -- so the pick-up is a bounce, a crumb puff and a fade. See ASSETS.md.
  missItem(it) {
    it.dead = true;
    this.missed++;
    const img = it.img;
    img.y = FK_CATCH_Y;
    this.tweens.add({
      targets: img, y: FK_CATCH_Y + 16, duration: 180, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        for (let i = 0; i < 5; i++) {
          const c = this.add.circle(img.x + Phaser.Math.Between(-9, 9), img.y + 10,
                                    Phaser.Math.Between(2, 4), 0xF0E2BC, 0.9).setDepth(21);
          this.tweens.add({ targets: c, y: c.y - Phaser.Math.Between(6, 16), alpha: 0,
                            duration: 420, onComplete: () => c.destroy() });
        }
        this.tweens.add({ targets: img, alpha: 0, scale: img.scale * 0.6, duration: 320,
                          onComplete: () => img.destroy() });
      },
    });
  }

  // §21: "Basket fill is three overlay states, swapped at 1/3 and 2/3 of the target."
  updateFill() {
    const f = this.caught / this.config.targetCatches;
    const want = f >= 2 / 3 ? 'full' : (f >= 1 / 3 ? 'half' : 'empty');
    if (want === this.fill) return;
    this.fill = want;
    this.basket.setTexture(FK_ASSETS[want].key);
    this.basket.setScale(FK_BOY_H / this.basket.height);
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play' || this.outcome) return;
    const dt = Math.min(delta / 1000, 0.05);   // Phaser 3 passes (time, delta)

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) { this.handleLoss(); return; }

    this.wantX = this.readWantX();
    const step = FK_BASKET_SPEED * dt;
    const d = this.wantX - this.basketX;
    this.basketX += Phaser.Math.Clamp(d, -step, step);
    this.basket.x = this.basketX;

    this.spawnT += dt;
    while (this.spawnT >= this.spawnEvery) { this.spawnT -= this.spawnEvery; this.spawn(); }

    this.stepItems(dt);
    this.drawHUD();
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily: Phaser reuses the Scene instance, so an
  //  `if (!this.hudTimer)` guard sees a truthy handle to a destroyed object.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(14, 8, '', {
      ...FONTS.TIMER, fontSize: '24px', color: '#2F5A3A',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0, 0).setDepth(900);

    this.hudCount = this.add.text(GAME_WIDTH - 14, 10, '', {
      ...FONTS.SMALL, fontSize: '16px', fontStyle: 'bold', color: '#2F5A3A',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(900);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    this.hudCount.setText(this.caught + '/' + this.config.targetCatches);
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
    this.items.forEach(it => { if (it.img && it.img.active) it.img.destroy(); });
    this.items = [];
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    const spent = this.config.timeLimit - this.timeRemaining;
    this.endRound();

    this.basket.setTexture(FK_ASSETS.full.key);
    this.basket.setScale(FK_BOY_H / this.basket.height);
    this.tweens.add({ targets: this.basket, y: FK_BOY_FEET - 12, duration: 220,
                      yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });

    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.add.text(GAME_WIDTH / 2, 120, 'Everyone had enough!', {
      ...FONTS.TITLE, color: '#1E7A55', fontSize: '22px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    const perfect = spent < this.config.timeLimit * 0.4;
    const fast = spent < this.config.timeLimit * 0.65;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1900, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.FEEDING_5000,
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
    this.add.text(GAME_WIDTH / 2, 120, 'Catch some more!', {
      ...FONTS.TITLE, color: '#8A4B1E', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(950);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.FEEDING_5000,
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

    if (!this.textures.exists(FK_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xDCE8D4, 1); g.fillRect(0, 0, GAME_WIDTH, 90);
      g.fillStyle(0xB7CFA8, 1); g.fillRect(0, 90, GAME_WIDTH, GAME_HEIGHT - 90);
      g.generateTexture(FK_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }
    if (!this.textures.exists(FK_ASSETS.jesus.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xBFE5D6, 1); g.fillCircle(41, 30, 24);
      g.fillStyle(0xFFFFFF, 1); g.lineStyle(4, ink, 1);
      g.fillRect(16, 54, 50, 80); g.strokeRect(16, 54, 50, 80);
      g.generateTexture(FK_ASSETS.jesus.key, 83, 136);
      g.destroy();
    }
    [['bread', 0xD9A95F, 57, 47], ['fish', 0xD1949C, 57, 41]].forEach(([n, col, w, h]) => {
      if (this.textures.exists(FK_ASSETS[n].key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(col, 1); g.lineStyle(4, ink, 1);
      g.fillEllipse(w / 2, h / 2, w - 6, h - 6); g.strokeEllipse(w / 2, h / 2, w - 6, h - 6);
      g.generateTexture(FK_ASSETS[n].key, w, h);
      g.destroy();
    });
    [['empty', 0], ['half', 1], ['full', 2]].forEach(([n, lvl]) => {
      if (this.textures.exists(FK_ASSETS[n].key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xC4B2E8, 1); g.fillCircle(76, 34, 28);
      g.fillStyle(0xF4EBD6, 1); g.lineStyle(5, ink, 1);
      g.fillRect(52, 66, 50, 60); g.strokeRect(52, 66, 50, 60);
      g.fillStyle(0xE3CFA2, 1);
      g.fillRoundedRect(24, 128, 106, 60, 10); g.strokeRoundedRect(24, 128, 106, 60, 10);
      if (lvl) { g.fillStyle(0xD9A95F, 1); g.fillRect(34, 128 - lvl * 12, 86, 10 + lvl * 12); }
      g.generateTexture(FK_ASSETS[n].key, 153, 211);
      g.destroy();
    });
  }
}
