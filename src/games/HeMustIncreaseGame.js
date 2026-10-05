/**
 * HeMustIncreaseGame.js
 *
 * Phaser 3 scene: "He Must Increase, I Must Decrease" (John 3:30)
 * A biblical mini-game where players resize tiles via swipes to reach a target balance.
 *
 * Globals used: GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS, GAME_KEYS, DIFFICULTY,
 *               session (SessionManager), updateGameStats(), GAME_STORIES
 */

class HeMustIncreaseGame extends Phaser.Scene {
  constructor() {
    super({ key: GAME_KEYS.HE_MUST_INCREASE });
  }

  init(data) {
    this.config = data.config || {};
    this.difficulty = data.difficulty || DIFFICULTY.EASY;

    // Difficulty-based config with defaults
    this.targetGodMin = this.config.targetGodMin || [70, 80, 90][this.difficulty];
    this.targetGodMax = this.config.targetGodMax || [100, 90, 95][this.difficulty];
    this.timeLimit = this.config.timeLimit || [5.0, 4.0, 3.0][this.difficulty];
    this.revertRate = this.config.revertRate || [0, 0, 5][this.difficulty];

    // Game state
    this.godPercent = 50;
    this.mePercent = 50;
    this.timeRemaining = this.timeLimit;
    this.isInTargetRange = false;
    this.inRangeTimer = 0;
    this.inRangeThreshold = 0.5;

    // Input tracking
    this.pointerStart = null;
    this.swipeThreshold = 30;

    // Game state
    this.gameOver = false;
    this.won = false;

    // HUD elements
    this.hearts = 3;
    this.score = 0;
    this.combo = 0;
  }

  create() {
    // Record game start time for elapsed calculation
    this.gameStartTime = this.time.now;

    // Draw background
    this.drawGradientBG();

    // Create container for tiles
    this.tilesContainer = this.add.container(0, 0);

    // Initialize tile graphics
    this.meTile = null;
    this.godTile = null;
    this.createTiles();

    // Create UI elements
    this.createHUD();
    this.createTargetMeter();
    this.createConfirmButton();

    // Input handling
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  update(delta) {
    if (this.gameOver) return;

    // Apply revert mechanic on hard mode
    if (this.difficulty === DIFFICULTY.HARD && this.revertRate > 0) {
      const revertAmount = (this.revertRate / 100) * (delta / 1000);
      const targetPercent = 50;

      if (this.godPercent < targetPercent) {
        this.godPercent = Math.min(this.godPercent + revertAmount, targetPercent);
      } else if (this.godPercent > targetPercent) {
        this.godPercent = Math.max(this.godPercent - revertAmount, targetPercent);
      }
      this.mePercent = 100 - this.godPercent;
      this.updateTiles();
    }

    // Check target range
    const wasInRange = this.isInTargetRange;
    this.isInTargetRange = this.godPercent >= this.targetGodMin &&
                           this.godPercent <= this.targetGodMax;

    if (this.isInTargetRange) {
      this.inRangeTimer += delta / 1000;
      // Auto-confirm after threshold
      if (this.inRangeTimer >= this.inRangeThreshold && !wasInRange) {
        this.handleWin();
      }
    } else {
      this.inRangeTimer = 0;
    }

    // Update target meter
    this.updateTargetMeter();

    // Update HUD
    this.updateHUD();
  }

  drawGradientBG() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x4A90E2, 0x4A90E2, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.generateTexture('gradientBG', GAME_WIDTH, GAME_HEIGHT);
    graphics.destroy();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gradientBG');
  }

  createTiles() {
    const totalTileWidth = 500;
    const tileHeight = 250;
    const startX = (GAME_WIDTH - totalTileWidth) / 2;
    const startY = (GAME_HEIGHT - tileHeight) / 2;

    this.tileStartX = startX;
    this.tileStartY = startY;
    this.totalTileWidth = totalTileWidth;
    this.tileHeight = tileHeight;

    // ME tile (left, blue)
    this.meTile = this.add.rectangle(
      this.tileStartX + this.mePercent * this.totalTileWidth / 200,
      this.tileStartY + this.tileHeight / 2,
      this.mePercent * this.totalTileWidth / 100,
      this.tileHeight,
      COLORS.BLUE
    );
    this.meTile.setOrigin(0.5, 0.5);
    this.meTile.setStrokeStyle(3, 0xffffff);
    this.meTile.setInteractive();

    // GOD tile (right, gold)
    this.godTile = this.add.rectangle(
      this.tileStartX + this.mePercent * this.totalTileWidth / 100 +
        this.godPercent * this.totalTileWidth / 200,
      this.tileStartY + this.tileHeight / 2,
      this.godPercent * this.totalTileWidth / 100,
      this.tileHeight,
      COLORS.GOLD
    );
    this.godTile.setOrigin(0.5, 0.5);
    this.godTile.setStrokeStyle(3, 0xffffff);
    this.godTile.setInteractive();

    // Labels
    this.add.text(
      this.meTile.x,
      this.meTile.y - 40,
      'ME',
      { ...FONTS.LARGE, fill: COLORS.WHITE }
    ).setOrigin(0.5, 0.5);

    this.add.text(
      this.godTile.x,
      this.godTile.y - 40,
      'GOD',
      { ...FONTS.LARGE, fill: COLORS.BLACK }
    ).setOrigin(0.5, 0.5);

    // Percentage displays
    this.mePercentText = this.add.text(
      this.meTile.x,
      this.meTile.y,
      `${Math.round(this.mePercent)}%`,
      { ...FONTS.MEDIUM, fill: COLORS.WHITE }
    ).setOrigin(0.5, 0.5);

    this.godPercentText = this.add.text(
      this.godTile.x,
      this.godTile.y,
      `${Math.round(this.godPercent)}%`,
      { ...FONTS.MEDIUM, fill: COLORS.BLACK }
    ).setOrigin(0.5, 0.5);
  }

  updateTiles() {
    this.mePercent = Math.max(0, Math.min(100, this.mePercent));
    this.godPercent = 100 - this.mePercent;

    const meWidth = this.mePercent * this.totalTileWidth / 100;
    const godWidth = this.godPercent * this.totalTileWidth / 100;

    // Update ME tile
    this.meTile.setDisplaySize(meWidth, this.tileHeight);
    this.meTile.setPosition(
      this.tileStartX + meWidth / 2,
      this.tileStartY + this.tileHeight / 2
    );

    // Update GOD tile
    this.godTile.setDisplaySize(godWidth, this.tileHeight);
    this.godTile.setPosition(
      this.tileStartX + meWidth + godWidth / 2,
      this.tileStartY + this.tileHeight / 2
    );

    // Update percentage texts
    this.mePercentText.setText(`${Math.round(this.mePercent)}%`);
    this.mePercentText.setPosition(this.meTile.x, this.meTile.y);

    this.godPercentText.setText(`${Math.round(this.godPercent)}%`);
    this.godPercentText.setPosition(this.godTile.x, this.godTile.y);
  }

  createTargetMeter() {
    const meterY = GAME_HEIGHT - 60;
    const meterWidth = 300;
    const meterX = GAME_WIDTH / 2 - meterWidth / 2;

    // Background bar
    this.add.rectangle(
      GAME_WIDTH / 2,
      meterY,
      meterWidth,
      20,
      0x333333
    ).setOrigin(0.5, 0.5);

    // Min/Max range indicator
    const minX = meterX + (this.targetGodMin / 100) * meterWidth;
    const maxX = meterX + (this.targetGodMax / 100) * meterWidth;

    this.targetRangeBar = this.add.rectangle(
      (minX + maxX) / 2,
      meterY,
      maxX - minX,
      20,
      0x00ff00
    ).setOrigin(0.5, 0.5).setAlpha(0.5);

    // Current indicator
    this.currentIndicator = this.add.rectangle(
      meterX + (this.godPercent / 100) * meterWidth,
      meterY,
      8,
      25,
      0xffff00
    ).setOrigin(0.5, 0.5);

    // Label
    this.add.text(
      GAME_WIDTH / 2,
      meterY - 30,
      `GOD: ${this.targetGodMin}-${this.targetGodMax}%`,
      { ...FONTS.SMALL, fill: COLORS.WHITE }
    ).setOrigin(0.5, 0.5);
  }

  updateTargetMeter() {
    const meterWidth = 300;
    const meterX = GAME_WIDTH / 2 - meterWidth / 2;
    const meterY = GAME_HEIGHT - 60;

    this.currentIndicator.setPosition(
      meterX + (this.godPercent / 100) * meterWidth,
      meterY
    );

    // Change color based on target range
    if (this.isInTargetRange) {
      this.currentIndicator.setFillStyle(0x00ff00);
    } else {
      this.currentIndicator.setFillStyle(0xffff00);
    }
  }

  createConfirmButton() {
    const buttonX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT - 20;

    this.confirmButton = this.add.rectangle(
      buttonX,
      buttonY,
      120,
      35,
      this.isInTargetRange ? COLORS.GREEN : COLORS.GRAY
    ).setOrigin(0.5, 0.5);
    this.confirmButton.setStrokeStyle(2, COLORS.WHITE);
    this.confirmButton.setInteractive();

    this.confirmButtonText = this.add.text(
      buttonX,
      buttonY,
      'CONFIRM',
      { ...FONTS.SMALL, fill: COLORS.BLACK }
    ).setOrigin(0.5, 0.5);

    this.confirmButton.on('pointerdown', () => {
      if (this.isInTargetRange && !this.gameOver) {
        this.handleWin();
      }
    });
  }

  createHUD() {
    const padding = 10;

    // Hearts
    this.heartsText = this.add.text(
      padding + 30,
      padding + 20,
      `❤ ${this.hearts}`,
      { ...FONTS.MEDIUM, fill: COLORS.RED }
    ).setOrigin(0, 0);

    // Score
    this.scoreText = this.add.text(
      GAME_WIDTH / 2,
      padding + 20,
      `Score: ${this.score}`,
      { ...FONTS.MEDIUM, fill: COLORS.WHITE }
    ).setOrigin(0.5, 0);

    // Combo
    this.comboText = this.add.text(
      GAME_WIDTH - padding - 80,
      padding + 20,
      `Combo: ${this.combo}`,
      { ...FONTS.MEDIUM, fill: COLORS.YELLOW }
    ).setOrigin(1, 0);

    // Timer
    this.timerText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 110,
      `Time: ${this.timeRemaining.toFixed(1)}s`,
      { ...FONTS.LARGE, fill: COLORS.WHITE }
    ).setOrigin(0.5, 0.5);
  }

  updateHUD() {
    this.heartsText.setText(`❤ ${this.hearts}`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`Combo: ${this.combo}`);
    this.timerText.setText(`Time: ${this.timeRemaining.toFixed(1)}s`);

    // Update confirm button color
    this.confirmButton.setFillStyle(
      this.isInTargetRange ? COLORS.GREEN : COLORS.GRAY
    );
  }

  updateTimer() {
    if (this.gameOver) return;

    this.timeRemaining -= 0.1;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.handleLoss();
    }
  }

  onPointerDown(pointer) {
    if (this.gameOver) return;

    this.pointerStart = {
      x: pointer.x,
      y: pointer.y,
      time: this.time.now
    };
  }

  onPointerUp(pointer) {
    if (this.gameOver || !this.pointerStart) return;

    const deltaX = pointer.x - this.pointerStart.x;
    const deltaY = pointer.y - this.pointerStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < this.swipeThreshold) {
      this.pointerStart = null;
      return;
    }

    const angle = Math.atan2(deltaY, deltaX);
    const isVertical = Math.abs(angle) > Math.PI / 4 && Math.abs(angle) < (3 * Math.PI) / 4;

    if (isVertical) {
      if (deltaY < 0) {
        // Swipe UP - increase GOD
        this.godPercent = Math.min(this.godPercent + 5, 100);
      } else {
        // Swipe DOWN - decrease GOD
        this.godPercent = Math.max(this.godPercent - 5, 0);
      }
      this.mePercent = 100 - this.godPercent;
      this.updateTiles();

      // Add visual feedback
      this.tweens.add({
        targets: this.meTile,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        yoyo: true
      });
    }

    this.pointerStart = null;
  }

  handleWin() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.won = true;

    // Prevent further input
    this.input.off('pointerdown');
    this.input.off('pointerup');

    // Gold glow effect
    this.godTile.setFillStyle(0xffff99);

    // Light radiate effect
    const radiateGraphics = this.make.graphics({ x: 0, y: 0, add: true });
    radiateGraphics.lineStyle(3, 0xffff00, 0.8);
    radiateGraphics.strokeCircle(this.godTile.x, this.godTile.y, 40);

    this.tweens.add({
      targets: radiateGraphics,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => radiateGraphics.destroy()
    });

    // Victory text
    const victoryText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 60,
      '"He must increase,\nI must decrease!"',
      { ...FONTS.LARGE, fill: COLORS.GOLD, align: 'center' }
    ).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: victoryText,
      y: GAME_HEIGHT / 2 - 100,
      alpha: 0,
      duration: 1500,
      delay: 500,
      ease: 'Quad.easeIn'
    });

    // Calculate points based on performance
    const elapsed = (this.time.now - this.gameStartTime) / 1000;
    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // Transition
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.HE_MUST_INCREASE,
        points: points,
        timeElapsed: elapsed
      });
    });
  }

  handleLoss() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.won = false;

    // Prevent further input
    this.input.off('pointerdown');
    this.input.off('pointerup');

    // Reset tiles to equal
    this.godPercent = 50;
    this.mePercent = 50;
    this.updateTiles();

    // Shake effect
    this.cameras.main.shake(300, 0.01);

    // Loss text
    const lossText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 60,
      'Time\'s Up!',
      { ...FONTS.LARGE, fill: COLORS.RED }
    ).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: lossText,
      y: GAME_HEIGHT / 2 - 100,
      alpha: 0,
      duration: 1500,
      delay: 500,
      ease: 'Quad.easeIn'
    });

    // Transition
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.HE_MUST_INCREASE,
        points: 0
      });
    });
  }

  shutdown() {
    this.input.off('pointerdown');
    this.input.off('pointerup');
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
  }
}
