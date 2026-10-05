// ============================================
// TOWER OF BABEL - Tap blocks to destroy
// Genesis 11:1-9
// Landscape layout: 667x375
// ============================================

class TowerOfBabelGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.TOWER_OF_BABEL);
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;
    this.gameActive = false;
    this.blocksDestroyed = 0;
    this.blocks = [];
    this.buildTimer = null;
    this.towerHeight = 0;
    this.maxHeight = 230; // pixels from ground to "heaven" — fits 375px height
    this.timeRemaining = this.config.timeLimit;
    this.gameStartTime = 0;

    // Background — desert sky
    this.drawGradientBG(0xE8A87C, 0x85CDFD);

    // Ground
    const ground = this.add.graphics();
    ground.fillStyle(COLORS.SAND, 1);
    ground.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
    ground.lineStyle(1, 0xD4A017, 0.3);
    for (let i = 0; i < 6; i++) {
      ground.lineBetween(
        Phaser.Math.Between(0, GAME_WIDTH),
        GAME_HEIGHT - 45 + i * 7,
        Phaser.Math.Between(0, GAME_WIDTH),
        GAME_HEIGHT - 45 + i * 7
      );
    }

    // "Heaven" line at top
    this.heavenLine = this.add.graphics();
    this.heavenLine.lineStyle(2, COLORS.GOLD, 0.4);
    this.heavenLine.lineBetween(0, 70, GAME_WIDTH, 70);
    this.add.text(GAME_WIDTH / 2, 58, '☁️ Heaven ☁️', {
      ...FONTS.SMALL, color: '#FFD70088', fontStyle: 'italic',
    }).setOrigin(0.5);

    // Clouds
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.text(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(20, 90),
        '☁️',
        { fontSize: `${Phaser.Math.Between(16, 28)}px` }
      ).setAlpha(0.4);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
      });
    }

    // HUD
    this.drawHUD();

    // Blocks destroyed counter — positioned left side
    this.destroyedText = this.add.text(120, 30, `Blocks: 0/${this.config.targetBlocks}`, {
      ...FONTS.SMALL, color: '#FFD93D',
    }).setOrigin(0.5);

    // Height danger meter (right side)
    this.dangerMeter = this.add.graphics();
    this.updateDangerMeter(0);

    // Start the game
    this.time.delayedCall(500, () => this.startGame());
  }

  drawHUD() {
    for (let i = 0; i < 3; i++) {
      this.add.image(30 + i * 28, 30, i < session.lives ? 'heart-full' : 'heart-empty');
    }
    this.timerText = this.add.text(GAME_WIDTH - 30, 20, `${this.config.timeLimit}s`, FONTS.TIMER)
      .setOrigin(1, 0).setScale(0.7);
    this.add.text(GAME_WIDTH / 2, 25, `⭐ ${session.score}`, {
      ...FONTS.SMALL, color: '#FFD93D',
    }).setOrigin(0.5);
    if (session.combo >= 3) {
      this.add.text(GAME_WIDTH / 2, 45, `🔥 x${session.combo}`, {
        ...FONTS.SMALL, color: '#FF9F43',
      }).setOrigin(0.5);
    }
  }

  startGame() {
    this.gameActive = true;
    this.gameStartTime = this.time.now;

    this.buildNextBlock();

    this.timerEvent = this.time.addEvent({
      delay: 50,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    this.timeoutEvent = this.time.delayedCall(this.config.timeLimit * 1000, () => {
      if (this.gameActive) this.handleLoss();
    });
  }

  buildNextBlock() {
    if (!this.gameActive) return;

    const blockW = 55;
    const blockH = 24;
    const groundY = GAME_HEIGHT - 50;

    const row = this.blocks.length;
    const xOffset = Phaser.Math.Between(-15, 15);
    const x = GAME_WIDTH / 2 + xOffset;
    const y = groundY - (row + 1) * (blockH + 2);

    // Check if tower reached heaven
    if (y <= 75) {
      this.handleTowerReachedHeaven();
      return;
    }

    const block = this.add.image(x, y - 80, 'tower-block')
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const blockData = {
      image: block,
      hp: this.config.blockHP,
      row: row,
    };

    // Drop animation
    this.tweens.add({
      targets: block,
      y: y,
      alpha: 1,
      duration: 300,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.cameras.main.shake(50, 0.005);
      },
    });

    block.on('pointerdown', () => {
      if (!this.gameActive) return;
      this.hitBlock(blockData);
    });

    this.blocks.push(blockData);

    // Update danger meter
    this.towerHeight = (groundY - y) / this.maxHeight;
    this.updateDangerMeter(this.towerHeight);

    // Schedule next block
    const buildInterval = 1000 / this.config.buildSpeed;
    this.buildTimer = this.time.delayedCall(buildInterval, () => {
      this.buildNextBlock();
    });
  }

  hitBlock(blockData) {
    blockData.hp--;

    if (blockData.hp <= 0) {
      this.destroyBlock(blockData);
    } else {
      blockData.image.setTexture('tower-block-damaged');
      this.tweens.add({
        targets: blockData.image,
        scaleX: 1.1,
        duration: 50,
        yoyo: true,
      });
    }
  }

  destroyBlock(blockData) {
    this.blocksDestroyed++;
    this.destroyedText.setText(`Blocks: ${this.blocksDestroyed}/${this.config.targetBlocks}`);

    const x = blockData.image.x;
    const y = blockData.image.y;

    // Particle burst
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(x, y, 'particle')
        .setTint(COLORS.TOWER_BROWN)
        .setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-40, 40),
        y: y + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }

    blockData.image.destroy();
    const idx = this.blocks.indexOf(blockData);
    if (idx > -1) this.blocks.splice(idx, 1);

    this.cameras.main.shake(80, 0.01);

    this.collapseBlocksAbove(blockData.row);

    if (this.blocksDestroyed >= this.config.targetBlocks) {
      this.handleWin();
    }
  }

  collapseBlocksAbove(destroyedRow) {
    this.blocks.forEach(block => {
      if (block.row > destroyedRow) {
        block.row--;
        this.tweens.add({
          targets: block.image,
          y: block.image.y + 26,
          duration: 200,
          ease: 'Bounce.easeOut',
        });
      }
    });
  }

  updateDangerMeter(heightRatio) {
    this.dangerMeter.clear();
    const meterX = GAME_WIDTH - 18;
    const meterH = 240;
    const meterY = 75;
    const meterW = 10;

    // Background
    this.dangerMeter.fillStyle(0x333333, 0.5);
    this.dangerMeter.fillRoundedRect(meterX, meterY, meterW, meterH, 5);

    // Fill from bottom
    const fillH = meterH * Math.min(1, heightRatio);
    const color = heightRatio > 0.8 ? 0xFF4757 : heightRatio > 0.5 ? 0xFFD93D : 0x6BCF7F;
    this.dangerMeter.fillStyle(color, 0.8);
    this.dangerMeter.fillRoundedRect(meterX, meterY + meterH - fillH, meterW, fillH, 5);
  }

  handleTowerReachedHeaven() {
    this.gameActive = false;
    if (this.timerEvent) this.timerEvent.remove();
    if (this.timeoutEvent) this.timeoutEvent.remove();
    if (this.buildTimer) this.buildTimer.remove();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Tower reached heaven!', {
      ...FONTS.TITLE, color: '#E74C3C', fontSize: '20px',
    }).setOrigin(0.5);

    this.cameras.main.shake(300, 0.03);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.TOWER_OF_BABEL,
        points: 0,
      });
    });
  }

  updateTimer() {
    if (!this.gameActive) return;
    const elapsed = (this.time.now - this.gameStartTime) / 1000;
    this.timeRemaining = Math.max(0, this.config.timeLimit - elapsed);
    this.timerText.setText(this.timeRemaining.toFixed(1) + 's');

    if (this.timeRemaining < 2) this.timerText.setColor('#FF4757');
    else if (this.timeRemaining < 4) this.timerText.setColor('#FFD93D');
  }

  handleWin() {
    this.gameActive = false;
    if (this.timerEvent) this.timerEvent.remove();
    if (this.timeoutEvent) this.timeoutEvent.remove();
    if (this.buildTimer) this.buildTimer.remove();

    const elapsed = (this.time.now - this.gameStartTime) / 1000;
    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = this.blocksDestroyed >= this.config.targetBlocks && elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // Tower collapse animation
    this.blocks.forEach((block, i) => {
      this.tweens.add({
        targets: block.image,
        y: GAME_HEIGHT + 50,
        x: block.image.x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 800,
        delay: i * 50,
        ease: 'Power2',
      });
    });

    this.cameras.main.shake(400, 0.02);

    this.time.delayedCall(1200, () => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Tower Toppled!', {
        ...FONTS.TITLE, color: '#2ECC71',
      }).setOrigin(0.5);
    });

    this.time.delayedCall(2500, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.TOWER_OF_BABEL,
        points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    this.gameActive = false;
    if (this.timerEvent) this.timerEvent.remove();
    if (this.buildTimer) this.buildTimer.remove();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Time's up!", {
      ...FONTS.TITLE, color: '#E74C3C',
    }).setOrigin(0.5);

    this.cameras.main.shake(200, 0.02);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.TOWER_OF_BABEL,
        points: 0,
      });
    });
  }

  drawGradientBG(colorTop, colorBottom) {
    const g = this.add.graphics();
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Phaser.Math.Interpolation.Linear([(colorTop >> 16) & 0xFF, (colorBottom >> 16) & 0xFF], ratio);
      const gv = Phaser.Math.Interpolation.Linear([(colorTop >> 8) & 0xFF, (colorBottom >> 8) & 0xFF], ratio);
      const b = Phaser.Math.Interpolation.Linear([colorTop & 0xFF, colorBottom & 0xFF], ratio);
      g.fillStyle(Phaser.Display.Color.GetColor(Math.round(r), Math.round(gv), Math.round(b)));
      g.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }
  }
}
