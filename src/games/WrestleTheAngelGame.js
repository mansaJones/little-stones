// ============================================
// WRESTLE THE ANGEL - Rapid tap game
// Genesis 32:24-26  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// ============================================

// Art plates live in assets/games/wrestle-the-angel/.
// Every pose PNG is the whole two-character group, keyed off magenta, at exactly
// half the 2048px source scale — so ONE display scale fits them all and the
// character heads stay the same size from pose to pose.
//   footInset : PNG px between the bottom edge (cast shadow) and the feet, so each
//               pose's feet land on WTA_GROUND_Y regardless of its shadow/dust.
//   scale     : optional per-pose multiplier (the tall-winged poses would poke under
//               the HUD strip at 1.0).
const WTA_ASSET_PATH = 'assets/games/wrestle-the-angel/';
const WTA_POSE_SCALE = 0.36;
const WTA_GROUND_Y = 338;
const WTA_POSES = {
  neutral: { key: 'wta-pose-neutral', file: 'pose-neutral.png', footInset: 29,  scale: 1.0  },
  winning: { key: 'wta-pose-winning', file: 'pose-winning.png', footInset: 102, scale: 1.0  },
  win:     { key: 'wta-pose-win',     file: 'pose-win.png',     footInset: 10,  scale: 0.85 },
  losing:  { key: 'wta-pose-losing',  file: 'pose-losing.png',  footInset: 43,  scale: 0.92 },
  lose:    { key: 'wta-pose-lose',    file: 'pose-lose.png',    footInset: 15,  scale: 0.85 },
};

class WrestleTheAngelGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.WRESTLE_THE_ANGEL);
  }

  preload() {
    // Textures persist in the global TextureManager, so only fetch on first visit.
    if (!this.textures.exists('wta-bg')) {
      this.load.image('wta-bg', WTA_ASSET_PATH + 'bg.jpg');
    }
    Object.values(WTA_POSES).forEach(p => {
      if (!this.textures.exists(p.key)) this.load.image(p.key, WTA_ASSET_PATH + p.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;
    this.gameActive = false;
    this.tapCount = 0;
    this.timeRemaining = this.config.timeLimit;
    this.lastTapTime = 0;
    this.TAP_COOLDOWN = 50; // ms — ignore taps faster than this
    this.currentPose = null;

    // Background plate — river ford at dawn, pre-cropped to 16:9
    this.add.image(0, 0, 'wta-bg').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Characters: one sprite holding the current pose, feet anchored to the waterline
    this.actors = this.add.image(GAME_WIDTH / 2, WTA_GROUND_Y, WTA_POSES.neutral.key)
      .setOrigin(0.5, 1).setDepth(10);
    this.setPose('neutral');

    // HUD on top
    this.drawHUD();

    // Start game after brief delay
    this.time.delayedCall(500, () => this.startGame());
  }

  // ================================================================
  //  POSES
  // ================================================================

  setPose(name) {
    if (this.currentPose === name) return;
    const pose = WTA_POSES[name];
    this.currentPose = name;

    this.tweens.killTweensOf(this.actors);
    this.actors.setTexture(pose.key);
    const s = WTA_POSE_SCALE * pose.scale;
    this.actors.setScale(s);
    this.actors.y = WTA_GROUND_Y + pose.footInset * s;

    // Small pop so the swap reads as a beat, not a glitch
    this.actors.setScale(s * 0.94);
    this.tweens.add({
      targets: this.actors, scaleX: s, scaleY: s,
      duration: 160, ease: 'Back.easeOut',
    });
  }

  // Pure function of (taps, elapsed) — re-evaluated on every tap and timer tick,
  // so a push-back on medium/hard can drop the pose again.
  evaluatePose() {
    if (!this.gameActive) return;
    const half = this.config.targetTaps / 2;
    const elapsed = this.elapsedSeconds();

    let pose = 'neutral';
    if (this.tapCount > half) {
      pose = 'winning';
    } else if (elapsed > this.config.timeLimit / 2 && this.tapCount < half) {
      pose = 'losing';
    }
    this.setPose(pose);
  }

  // Seconds since startGame on the SAME clock the loss timeout runs on (Phaser's clamped
  // step delta). `this.time.now` is wall-clock and races ahead in a throttled/background
  // tab, which would show 0.0s and flip to 'losing' while the round is still live.
  elapsedSeconds() {
    return this.timeoutEvent ? this.timeoutEvent.getElapsedSeconds() : 0;
  }

  // ================================================================
  //  HUD  (same strip as Roll the Stone)
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

    this.progressText = this.add.text(bx + bw / 2, by + bh / 2, '', {
      ...FONTS.SMALL, color: '#FFD93D', fontStyle: 'bold', fontSize: '10px',
    }).setOrigin(0.5).setDepth(53);

    this.updateProgressBar();
  }

  updateProgressBar() {
    this.progressBar.clear();
    const pct = Math.min(1, this.tapCount / this.config.targetTaps);
    const w = Math.max(0, (this.pbW - 4) * pct);
    const color = this.tapCount >= this.config.targetTaps ? 0x2ECC71 : 0x6BCF7F;
    this.progressBar.fillStyle(color, 1);
    this.progressBar.fillRoundedRect(this.pbX + 2, this.pbY + 2, w, this.pbH - 4, 4);
    this.progressText.setText(`${this.tapCount} / ${this.config.targetTaps}`);
  }

  // ================================================================
  //  GAME LOGIC
  // ================================================================

  startGame() {
    this.gameActive = true;

    // Whole screen is the tap target
    this.input.on('pointerdown', this.handleTap, this);

    this.timerEvent = this.time.addEvent({
      delay: 50,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    this.timeoutEvent = this.time.delayedCall(this.config.timeLimit * 1000, () => {
      if (this.gameActive) this.handleLoss();
    });

    // Brief instruction hint
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18,
      'Tap anywhere — fast!', {
        ...FONTS.SMALL, color: '#ffffffaa', fontSize: '11px',
      }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2000, duration: 500 });
  }

  handleTap() {
    if (!this.gameActive) return;
    const now = this.time.now;

    // Anti-cheat: ignore taps too close together
    if (now - this.lastTapTime < this.TAP_COOLDOWN) {
      return;
    }
    this.lastTapTime = now;

    // Check for pushback (random decrease)
    // (was Phaser.Math.Random(), which doesn't exist in Phaser 3 — threw on every tap)
    const pushBack = Phaser.Math.FloatBetween(0, 1) < this.config.pushBackChance;

    if (pushBack) {
      // Push back — decrease counter, red flash, different shake
      this.tapCount = Math.max(0, this.tapCount - 1);

      // Red flash
      const flash = this.add.graphics().setDepth(30);
      flash.fillStyle(0xFF4757, 0.3);
      flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy(),
      });

      // Different shake pattern for pushback
      this.cameras.main.shake(120, 0.015);
    } else {
      // Successful tap
      this.tapCount++;

      // Screen shake
      this.cameras.main.shake(80, 0.008);

      // Particle burst at the grapple
      this.createTapParticles();
    }

    this.updateProgressBar();
    this.evaluatePose();

    // Check for win
    if (this.tapCount >= this.config.targetTaps) {
      this.handleWin();
    }
  }

  createTapParticles() {
    const centerX = this.actors.x;
    const centerY = this.actors.y - this.actors.displayHeight * 0.5;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = Phaser.Math.Between(150, 250);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const p = this.add.text(centerX, centerY, '⚡', {
        fontSize: `${Phaser.Math.Between(12, 18)}px`,
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: p,
        x: centerX + vx * 0.3,
        y: centerY + vy * 0.3,
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  updateTimer() {
    if (!this.gameActive) return;
    const elapsed = this.elapsedSeconds();
    this.timeRemaining = Math.max(0, this.config.timeLimit - elapsed);
    this.timerText.setText(this.timeRemaining.toFixed(1) + 's');

    if (this.timeRemaining < 2) this.timerText.setColor('#FF4757');
    else if (this.timeRemaining < 4) this.timerText.setColor('#FFD93D');

    this.evaluatePose();
  }

  // ================================================================
  //  END STATES
  // ================================================================

  _cleanup() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.timeoutEvent) this.timeoutEvent.remove();
    this.input.off('pointerdown', this.handleTap, this);
  }

  handleWin() {
    this.gameActive = false;
    const elapsed = this.elapsedSeconds();
    this._cleanup();

    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = this.tapCount >= this.config.targetTaps && elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.setPose('win');

    // Golden glow effect
    const glow = this.add.graphics().setDepth(5);
    glow.fillStyle(0xFFD700, 0.18);
    glow.fillCircle(GAME_WIDTH / 2, WTA_GROUND_Y - 120, 220);

    this.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 1000,
      onComplete: () => glow.destroy(),
    });

    // Victory text
    const victoryText = this.add.text(GAME_WIDTH / 2, 90, 'Blessed!', {
      ...FONTS.TITLE, color: '#FFD700', fontSize: '40px',
      stroke: '#5A3E1B', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(60);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      y: 70,
      duration: 600,
    });

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.WRESTLE_THE_ANGEL,
        points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    this.gameActive = false;
    this._cleanup();

    this.setPose('lose');

    // Shake with force
    this.cameras.main.shake(300, 0.02);

    // Defeat message
    const defeatText = this.add.text(GAME_WIDTH / 2, 80, 'Too strong!', {
      ...FONTS.TITLE, color: '#E74C3C', fontSize: '40px',
      stroke: '#4A1414', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(60);

    this.tweens.add({
      targets: defeatText,
      alpha: 1,
      duration: 400,
    });

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.WRESTLE_THE_ANGEL,
        points: 0,
      });
    });
  }
}
