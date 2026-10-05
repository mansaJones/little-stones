// ============================================
// WATER TO WINE - Paint the vase red by swiping over it
// John 2:1-11  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// ============================================

// Art plates live in assets/games/water-to-wine/ (see tools/key_sprites.py).
//   bg.jpg             — the wedding-hall plate, pre-cropped to 16:9, 2x stage resolution
//   vase-water.png     — the blue vase, keyed off its checkerboard, 0.5x of its 2048 source
//   vase-wine.png      — the red vase, same source frame as vase-water (aligned crop), so the
//                        two overlay pixel-for-pixel
//   hand.png           — the swipe cursor
//   woman-neutral.png / woman-sad.png / woman-smile.png / woman-happy.png — the servant's four
//                        moods, aligned crop so a texture swap never shifts her body
const W2W_ASSET_PATH = 'assets/games/water-to-wine/';
const W2W_ASSETS = {
  bg:      { key: 'w2w-bg',            file: 'bg.jpg' },
  water:   { key: 'w2w-vase-water',    file: 'vase-water.png' },
  wine:    { key: 'w2w-vase-wine',     file: 'vase-wine.png' },
  hand:    { key: 'w2w-hand',          file: 'hand.png' },
  neutral: { key: 'w2w-woman-neutral', file: 'woman-neutral.png' },
  sad:     { key: 'w2w-woman-sad',     file: 'woman-sad.png' },
  smile:   { key: 'w2w-woman-smile',   file: 'woman-smile.png' },     // more than half the vase is red
  happy:   { key: 'w2w-woman-happy',   file: 'woman-happy.png' },     // the win: glass raised
};

// ---- Layout — measured off bg.jpg and the sprite frames ----
const W2W_VASE_X = 333;            // vase centre (the arch centre)
const W2W_VASE_BOTTOM = 377;       // bottom of the vase FRAME (shadow included); base sits at ~366 on the table
const W2W_VASE_SCALE = 0.46;       // display px per source px (376x606 frame -> 173x279)
const W2W_WOMAN_X = 578;           // frame centre; her body sits ~24px right of it (frame is union-cropped)
const W2W_WOMAN_BOTTOM = 447;      // frame bottom, below the stage: the table hides her from the hips down
const W2W_WOMAN_SCALE = 0.40;      // head top lands at y≈128
const W2W_TABLE_Y = 340;           // top edge of the table in stage px (row 680 of the 2x plate)
const W2W_HAND_H = 72;             // cursor height on stage
const W2W_GRID = 8;                // coverage grid cell, in vase-source px (~3.7 stage px)
const W2W_IDLE_BEFORE_DRAIN = 0.3; // seconds without a stroke before hard-mode drain kicks in

class WaterToWineGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.WATER_TO_WINE);
  }

  preload() {
    // Textures persist in the global TextureManager, so only fetch on first visit.
    Object.values(W2W_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, W2W_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;
    this.gameActive = false;
    this.timeRemaining = this.config.timeLimit;
    this.coverage = 0;               // painted fraction of the vase, 0..1
    this.mood = null;                // 'neutral' | 'sad' | 'smile' | 'happy' (happy = win only)
    this.stroking = false;
    this.lastStamp = null;           // last brush position on stage, for stroke interpolation
    this.lastStampTime = 0;          // elapsedSeconds() of the last stamp (drain idle check)

    // ---- Scene, back-to-front ----
    this.add.image(0, 0, W2W_ASSETS.bg.key).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    // The servant stands behind the table, so she goes under a cropped copy of the table strip.
    this.woman = this.add.image(W2W_WOMAN_X, W2W_WOMAN_BOTTOM, W2W_ASSETS.neutral.key)
      .setOrigin(0.5, 1).setScale(W2W_WOMAN_SCALE).setDepth(5);
    this.add.image(0, 0, W2W_ASSETS.bg.key).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setCrop(0, W2W_TABLE_Y * 2, GAME_WIDTH * 2, (GAME_HEIGHT - W2W_TABLE_Y) * 2).setDepth(6);

    this.createVase();
    this.createHand();
    this.drawHUD();

    // Hide the OS cursor over the canvas — the hand sprite IS the cursor. Restored on shutdown.
    this.prevCursor = this.input.manager.defaultCursor;
    this.input.setDefaultCursor('none');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.setDefaultCursor(this.prevCursor);
      if (this.textures.exists('w2w-brush')) this.textures.remove('w2w-brush');
    });

    this.setMood('neutral');
    this.time.delayedCall(800, () => this.startGame());
  }

  // ================================================================
  //  VASE — the red vase underneath, a RenderTexture of the blue vase on top,
  //  and the brush ERASES the blue to reveal the red.
  // ================================================================

  createVase() {
    const frame = this.textures.getFrame(W2W_ASSETS.water.key);
    this.vaseSrcW = frame.width;
    this.vaseSrcH = frame.height;
    this.vaseDispW = this.vaseSrcW * W2W_VASE_SCALE;
    this.vaseDispH = this.vaseSrcH * W2W_VASE_SCALE;
    this.vaseLeft = W2W_VASE_X - this.vaseDispW / 2;
    this.vaseTop = W2W_VASE_BOTTOM - this.vaseDispH;

    this.wineVase = this.add.image(W2W_VASE_X, W2W_VASE_BOTTOM, W2W_ASSETS.wine.key)
      .setOrigin(0.5, 1).setScale(W2W_VASE_SCALE).setDepth(10);

    // Water layer at source resolution, displayed at the same scale — exact overlay.
    this.waterRT = this.add.renderTexture(W2W_VASE_X, W2W_VASE_BOTTOM, this.vaseSrcW, this.vaseSrcH)
      .setOrigin(0.5, 1).setScale(W2W_VASE_SCALE).setDepth(11);
    this.waterRT.draw(W2W_ASSETS.water.key, 0, 0);

    // Soft round brush, sized in source px so it erases at the right stage size.
    this.brushR = this.config.brushRadius / W2W_VASE_SCALE;
    const d = Math.ceil(this.brushR * 2);
    if (this.textures.exists('w2w-brush')) this.textures.remove('w2w-brush');
    const tex = this.textures.createCanvas('w2w-brush', d, d);
    const ctx = tex.context;
    const g = ctx.createRadialGradient(d / 2, d / 2, this.brushR * 0.55, d / 2, d / 2, this.brushR);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, d, d);
    tex.refresh();

    this.buildCoverageGrid();
  }

  // Coverage is tracked on a coarse grid over the vase's opaque pixels, independent of the
  // pixels on screen: each cell holds a paint level 0..1 (1 = wine). Reading the vase alpha
  // once through a tiny canvas is one drawImage + one getImageData.
  buildCoverageGrid() {
    const gw = Math.ceil(this.vaseSrcW / W2W_GRID);
    const gh = Math.ceil(this.vaseSrcH / W2W_GRID);
    const src = this.textures.get(W2W_ASSETS.water.key).getSourceImage();
    const cv = Phaser.Display.Canvas.CanvasPool.create2D(this, gw, gh);
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, gw, gh);
    ctx.drawImage(src, 0, 0, gw, gh);
    const px = ctx.getImageData(0, 0, gw, gh).data;
    Phaser.Display.Canvas.CanvasPool.remove(cv);

    this.gridW = gw;
    this.gridH = gh;
    this.cellIsVase = new Uint8Array(gw * gh);
    this.cellPaint = new Float32Array(gw * gh);
    this.vaseCellCount = 0;
    for (let i = 0; i < gw * gh; i++) {
      if (px[i * 4 + 3] >= 128) { this.cellIsVase[i] = 1; this.vaseCellCount++; }
    }
  }

  // Stage px -> vase source px
  toVase(x, y) {
    return { x: (x - this.vaseLeft) / W2W_VASE_SCALE, y: (y - this.vaseTop) / W2W_VASE_SCALE };
  }

  // One dab of the brush at a stage position: erase the water there and mark the grid.
  stamp(x, y) {
    const p = this.toVase(x, y);
    const r = this.brushR;
    if (p.x < -r || p.y < -r || p.x > this.vaseSrcW + r || p.y > this.vaseSrcH + r) return;   // off the vase entirely

    this.waterRT.erase('w2w-brush', p.x - r, p.y - r);

    // The soft brush is fully opaque out to ~55% of r and fades to 0 at r: count 80% as painted.
    const pr = r * 0.8;
    const c0 = Math.max(0, Math.floor((p.x - pr) / W2W_GRID));
    const c1 = Math.min(this.gridW - 1, Math.ceil((p.x + pr) / W2W_GRID));
    const r0 = Math.max(0, Math.floor((p.y - pr) / W2W_GRID));
    const r1 = Math.min(this.gridH - 1, Math.ceil((p.y + pr) / W2W_GRID));
    for (let gy = r0; gy <= r1; gy++) {
      const cy = gy * W2W_GRID + W2W_GRID / 2;
      for (let gx = c0; gx <= c1; gx++) {
        const cx = gx * W2W_GRID + W2W_GRID / 2;
        const dx = cx - p.x, dy = cy - p.y;
        if (dx * dx + dy * dy <= pr * pr) this.cellPaint[gy * this.gridW + gx] = 1;
      }
    }
  }

  // Coverage = mean paint level over the vase cells, so hard mode's fade-back reads on the bar
  // exactly as it looks on the vase instead of dropping off a cliff at some threshold.
  recomputeCoverage() {
    let sum = 0;
    for (let i = 0; i < this.cellPaint.length; i++) {
      if (this.cellIsVase[i]) sum += this.cellPaint[i];
    }
    this.coverage = this.vaseCellCount ? sum / this.vaseCellCount : 0;
    this.updateProgressBar(this.coverage * 100);
    this.evaluateMood();
    if (this.gameActive && this.coverage >= this.config.winCoverage) this.handleWin();
  }

  // Hard mode: paint fades back toward water while the finger is idle. Drawing the water
  // texture back over the layer at alpha a is exactly paint *= (1 - a) per cell.
  drain(dt) {
    const a = Math.min(1, this.config.drainRate * dt);
    if (a <= 0) return;
    this.waterRT.draw(W2W_ASSETS.water.key, 0, 0, a);
    for (let i = 0; i < this.cellPaint.length; i++) this.cellPaint[i] *= (1 - a);
    this.recomputeCoverage();
  }

  // ================================================================
  //  HAND CURSOR + THE SERVANT
  // ================================================================

  createHand() {
    const frame = this.textures.getFrame(W2W_ASSETS.hand.key);
    const s = W2W_HAND_H / frame.height;
    this.hand = this.add.image(W2W_VASE_X + 30, W2W_VASE_BOTTOM - this.vaseDispH * 0.55, W2W_ASSETS.hand.key)
      .setOrigin(0.5, 0.6).setScale(s).setDepth(30);
    this.handScale = s;

    // Idle hint: bob over the vase until the first pointer move
    this.handHint = this.tweens.add({
      targets: this.hand, y: this.hand.y - 22, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.input.on('pointermove', this.moveHand, this);
  }

  moveHand(pointer) {
    if (this.handHint) { this.handHint.stop(); this.handHint = null; }
    this.hand.setPosition(pointer.x, pointer.y);
  }

  // neutral until half the time is gone, sad after that — unless more than half the vase is
  // red, which makes her smile whatever the clock says. 5% hysteresis so drain can't flicker
  // her. 'happy' (glass raised) is reserved for the win and is never set from here.
  evaluateMood() {
    if (!this.gameActive) return;
    let mood;
    if (this.coverage > 0.5 || (this.mood === 'smile' && this.coverage > 0.45)) mood = 'smile';
    else if (this.elapsedSeconds() > this.config.timeLimit / 2) mood = 'sad';
    else mood = 'neutral';
    this.setMood(mood);
  }

  setMood(mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.woman.setTexture(W2W_ASSETS[mood].key);
    this.tweens.killTweensOf(this.woman);
    this.woman.setScale(W2W_WOMAN_SCALE * 0.94);
    this.tweens.add({ targets: this.woman, scale: W2W_WOMAN_SCALE, duration: 220, ease: 'Back.easeOut' });
  }

  // ================================================================
  //  HUD
  // ================================================================

  drawHUD() {
    const bg = this.add.graphics().setDepth(50);
    bg.fillStyle(0x000000, 0.22);
    bg.fillRoundedRect(8, 6, GAME_WIDTH - 16, 40, 8);

    for (let i = 0; i < 3; i++) {
      this.add.image(28 + i * 24, 26, i < session.lives ? 'heart-full' : 'heart-empty')
        .setDepth(51);
    }

    this.timerText = this.add.text(GAME_WIDTH - 18, 14, `${this.config.timeLimit}s`, {
      ...FONTS.TIMER, fontSize: '18px',
    }).setOrigin(1, 0).setDepth(51);

    this.add.text(150, 26, `⭐ ${session.score}`, {
      ...FONTS.SMALL, color: '#FFD93D', fontSize: '11px',
    }).setOrigin(0, 0.5).setDepth(51);

    if (session.combo >= 3) {
      this.add.text(220, 26, `🔥 x${session.combo}`, {
        ...FONTS.SMALL, color: '#FF9F43', fontSize: '11px',
      }).setOrigin(0, 0.5).setDepth(51);
    }

    this.createProgressBar();
  }

  createProgressBar() {
    const bx = 280, by = 16, bw = 265, bh = 20;

    const bg = this.add.graphics().setDepth(51);
    bg.fillStyle(0x333333, 0.55);
    bg.fillRoundedRect(bx, by, bw, bh, 6);
    bg.lineStyle(1.5, 0x666666, 0.4);
    bg.strokeRoundedRect(bx, by, bw, bh, 6);

    this.progressBar = this.add.graphics().setDepth(52);
    this.pbX = bx; this.pbY = by; this.pbW = bw; this.pbH = bh;

    this.progressText = this.add.text(bx + bw / 2, by + bh / 2, '0%', {
      ...FONTS.SMALL, color: '#FFD93D', fontStyle: 'bold', fontSize: '10px',
    }).setOrigin(0.5).setDepth(53);

    this.updateProgressBar(0);
  }

  updateProgressBar(pct) {
    this.progressBar.clear();
    const w = Math.max(0, (this.pbW - 4) * (pct / 100));
    this.progressBar.fillStyle(0xC0392B, 1);
    this.progressBar.fillRoundedRect(this.pbX + 2, this.pbY + 2, w, this.pbH - 4, 4);
    this.progressText.setText(`${Math.floor(pct)}%`);
  }

  // ================================================================
  //  GAME LOGIC
  // ================================================================

  startGame() {
    this.gameActive = true;

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.timerEvent = this.time.addEvent({
      delay: 50, callback: this.updateTimer, callbackScope: this, loop: true,
    });
    this.timeoutEvent = this.time.delayedCall(this.config.timeLimit * 1000, () => {
      if (this.gameActive) this.handleLoss();
    });

    // Brief instruction hint
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18,
      '🖐️ Swipe all over the vase!', {
        ...FONTS.SMALL, color: '#ffffff', fontSize: '11px',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2000, duration: 500 });
  }

  // Seconds since startGame on the SAME clock the loss timeout runs on (Phaser's clamped
  // step delta). `this.time.now` is wall-clock and races ahead in a throttled/background tab.
  elapsedSeconds() {
    return this.timeoutEvent ? this.timeoutEvent.getElapsedSeconds() : 0;
  }

  onPointerDown(pointer) {
    if (!this.gameActive) return;
    this.stroking = true;
    this.hand.setScale(this.handScale * 0.9);
    this.lastStamp = { x: pointer.x, y: pointer.y };
    this.stamp(pointer.x, pointer.y);
    this.lastStampTime = this.elapsedSeconds();
    this.recomputeCoverage();
  }

  onPointerMove(pointer) {
    if (!this.gameActive || !this.stroking || !pointer.isDown) return;

    // Fast swipes arrive as sparse move events: dab along the segment so the trail is solid.
    const from = this.lastStamp || { x: pointer.x, y: pointer.y };
    const dx = pointer.x - from.x, dy = pointer.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.config.brushRadius * 0.4;
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) this.stamp(from.x + dx * i / n, from.y + dy * i / n);

    this.lastStamp = { x: pointer.x, y: pointer.y };
    this.lastStampTime = this.elapsedSeconds();
    this.recomputeCoverage();
  }

  onPointerUp() {
    this.stroking = false;
    this.lastStamp = null;
    this.hand.setScale(this.handScale);
  }

  updateTimer() {
    if (!this.gameActive) return;
    const elapsed = this.elapsedSeconds();
    this.timeRemaining = Math.max(0, this.config.timeLimit - elapsed);
    this.timerText.setText(this.timeRemaining.toFixed(1) + 's');
    if (this.timeRemaining < 2) this.timerText.setColor('#FF4757');
    else if (this.timeRemaining < 4) this.timerText.setColor('#FFD93D');

    if (this.config.drainRate > 0 && elapsed - this.lastStampTime > W2W_IDLE_BEFORE_DRAIN && this.coverage > 0) {
      this.drain(0.05);
    } else {
      this.evaluateMood();                       // the sad-after-half-time flip needs no swipe
    }
  }

  // Stop the clocks. Read elapsedSeconds() BEFORE calling this: TimerEvent.remove() sets the
  // event's elapsed to its full delay.
  _cleanup() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.timeoutEvent) this.timeoutEvent.remove();
    this.stroking = false;
  }

  handleWin() {
    this.gameActive = false;
    const elapsed = this.elapsedSeconds();
    this.finalElapsed = elapsed;
    this._cleanup();

    const fast = elapsed < this.config.timeLimit * 0.6;
    const perfect = this.difficulty === DIFFICULTY.EASY || elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // Snap the last few percent to full: every drop is wine.
    this.waterRT.clear();
    this.cellPaint.fill(1);
    this.coverage = 1;
    this.updateProgressBar(100);
    this.setMood('happy');

    const flash = this.add.graphics().setDepth(20);
    flash.fillStyle(0xffffff, 0.7);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: flash, alpha: 0, duration: 450 });

    for (let i = 0; i < 16; i++) {
      this.time.delayedCall(i * 40, () => {
        const sparkle = this.add.text(
          W2W_VASE_X + Phaser.Math.Between(-this.vaseDispW / 2, this.vaseDispW / 2),
          this.vaseTop + Phaser.Math.Between(0, this.vaseDispH),
          '✨', { fontSize: '20px' }).setOrigin(0.5).setDepth(21);
        this.tweens.add({ targets: sparkle, y: sparkle.y - 40, alpha: 0, duration: 600, ease: 'Quad.easeOut' });
      });
    }

    const successText = this.add.text(GAME_WIDTH / 2, 70, 'The water is wine!', {
      ...FONTS.TITLE, color: '#FFD93D', fontSize: '24px',
      stroke: '#5A0F1F', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(40);
    this.tweens.add({ targets: successText, alpha: 1, delay: 300, duration: 400 });

    this.time.delayedCall(1800, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.WATER_TO_WINE,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    this.gameActive = false;
    this.finalElapsed = this.elapsedSeconds();
    this._cleanup();
    this.setMood('sad');

    this.cameras.main.shake(200, 0.02);

    this.add.text(GAME_WIDTH / 2, 70, 'Still just water!', {
      ...FONTS.TITLE, color: '#E74C3C',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.WATER_TO_WINE,
        points: 0,
      });
    });
  }
}
