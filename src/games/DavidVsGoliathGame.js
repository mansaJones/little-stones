/**
 * DavidVsGoliathGame.js
 * Phaser 3 Scene: David vs Goliath - Slingshot aim and release mini-game
 * Based on 1 Samuel 17
 */

class DavidVsGoliathGame extends Phaser.Scene {
  constructor() {
    super({ key: 'DavidVsGoliathGame' });
  }

  init(data) {
    this.config = data.config || {
      attempts: 3,
      goliathSpeed: 0,
      aimLineVisible: true,
      timeLimit: 10.0
    };
    this.difficulty = data.difficulty || 'easy';
  }

  create() {
    // Get config from init data
    const config = this.config;

    // Game state
    this.gameState = {
      attempts: config.attempts,
      score: 0,
      combo: 0,
      timeRemaining: config.timeLimit,
      gameOver: false,
      won: false,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    // Physics properties
    this.stoneSpeed = 400; // px/s
    this.hitRadius = 40;
    this.headShotZoneRatio = 0.3; // Top 30% is headshot

    // Draw background
    this.drawGradientBG();

    // Create Goliath (right side)
    this.goliath = this.add.text(
      GAME_WIDTH - 80,
      GAME_HEIGHT / 2,
      '🗿',
      {
        fontSize: '80px',
        fontFamily: 'Arial'
      }
    );
    this.goliath.setOrigin(0.5, 0.5);
    this.goliath.baseY = GAME_HEIGHT / 2;
    this.goliath.goliathSpeed = config.goliathSpeed;

    // Create David (left side)
    this.david = this.add.text(
      80,
      GAME_HEIGHT / 2 + 40,
      '👦',
      {
        fontSize: '60px',
        fontFamily: 'Arial'
      }
    );
    this.david.setOrigin(0.5, 0.5);

    // Slingshot line (visual feedback while dragging)
    this.slingLine = this.add.graphics();
    this.slingLine.visible = false;

    // Aim line (trajectory preview)
    this.aimLine = this.add.graphics();
    this.aimLine.visible = false;
    this.aimLineEnabled = config.aimLineVisible;

    // Stone projectile container
    this.activeStone = null;

    // HUD elements
    this.hudTexts = {};
    this.drawHUD();

    // Timer
    this.timerEvent = this.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    // Input handling
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

  }

  drawGradientBG() {
    // Create gradient: sand at bottom, blue sky at top
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });

    // Sky gradient (top)
    gradient.fillStyle(0x87CEEB, 1); // Sky blue
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT / 2);

    // Sand gradient (bottom)
    gradient.fillStyle(0xD4A574, 1); // Sandy color
    gradient.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);

    // Use graphics as texture
    const texture = gradient.generateTexture('bgGradient', GAME_WIDTH, GAME_HEIGHT);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgGradient').setDepth(-1);

    gradient.destroy();
  }

  drawHUD() {
    const padding = 10;
    const fontSize = '18px';

    // Attempts remaining (hearts)
    this.hudTexts.attempts = this.add.text(
      padding,
      padding,
      this.getAttemptsDisplay(),
      { fontSize, fontFamily: FONTS.main, fill: COLORS.danger }
    );

    // Score
    this.hudTexts.score = this.add.text(
      GAME_WIDTH / 2,
      padding,
      `Score: ${this.gameState.score}`,
      { fontSize, fontFamily: FONTS.main, fill: COLORS.primary }
    );
    this.hudTexts.score.setOrigin(0.5, 0);

    // Combo
    this.hudTexts.combo = this.add.text(
      GAME_WIDTH - padding,
      padding,
      `Combo: ${this.gameState.combo}`,
      { fontSize, fontFamily: FONTS.main, fill: COLORS.success }
    );
    this.hudTexts.combo.setOrigin(1, 0);

    // Timer
    this.hudTexts.timer = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - padding - 30,
      `Time: ${this.gameState.timeRemaining.toFixed(1)}s`,
      { fontSize, fontFamily: FONTS.main, fill: COLORS.warning }
    );
    this.hudTexts.timer.setOrigin(0.5, 0);

    // Instructions
    this.hudTexts.instructions = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - padding - 5,
      'Drag David back to aim, release to fire!',
      { fontSize: '12px', fontFamily: FONTS.main, fill: COLORS.text }
    );
    this.hudTexts.instructions.setOrigin(0.5, 1);
  }

  updateHUD() {
    if (this.hudTexts.attempts) {
      this.hudTexts.attempts.setText(this.getAttemptsDisplay());
    }
    if (this.hudTexts.score) {
      this.hudTexts.score.setText(`Score: ${this.gameState.score}`);
    }
    if (this.hudTexts.combo) {
      this.hudTexts.combo.setText(`Combo: ${this.gameState.combo}`);
    }
    if (this.hudTexts.timer) {
      this.hudTexts.timer.setText(`Time: ${this.gameState.timeRemaining.toFixed(1)}s`);
    }
  }

  getAttemptsDisplay() {
    let display = 'Attempts: ';
    for (let i = 0; i < this.gameState.attempts; i++) {
      display += '❤️';
    }
    return display;
  }

  updateTimer() {
    if (this.gameState.gameOver) return;

    this.gameState.timeRemaining -= 0.1;

    if (this.gameState.timeRemaining <= 0) {
      this.gameState.timeRemaining = 0;
      this.handleLoss();
    }

    this.updateHUD();
  }

  onPointerDown(pointer) {
    if (this.gameState.gameOver) return;

    // Check if pointer is near David
    const davidDist = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      this.david.x,
      this.david.y
    );

    if (davidDist < 60) {
      this.gameState.isDragging = true;
      this.gameState.dragStartX = pointer.x;
      this.gameState.dragStartY = pointer.y;
      this.slingLine.visible = true;
    }
  }

  onPointerMove(pointer) {
    if (!this.gameState.isDragging) return;

    const dragDist = Phaser.Math.Distance.Between(
      this.gameState.dragStartX,
      this.gameState.dragStartY,
      pointer.x,
      pointer.y
    );

    // Draw sling line (from David to current pointer)
    this.slingLine.clear();
    this.slingLine.lineStyle(2, 0xFF6B6B, 0.8);
    this.slingLine.lineBetween(
      this.david.x,
      this.david.y,
      pointer.x,
      pointer.y
    );

    // Draw aim line if enabled and dragging back (left)
    if (this.aimLineEnabled && pointer.x < this.david.x) {
      const angle = Phaser.Math.Angle.Between(
        this.david.x,
        this.david.y,
        pointer.x,
        pointer.y
      );

      this.aimLine.clear();
      this.aimLine.lineStyle(2, 0x4ECDC4, 0.5);
      this.aimLine.setDashed([5, 5]);

      const endX = this.david.x + Math.cos(angle) * 300;
      const endY = this.david.y + Math.sin(angle) * 300;

      this.aimLine.lineBetween(this.david.x, this.david.y, endX, endY);
      this.aimLine.visible = true;
    }
  }

  onPointerUp(pointer) {
    if (!this.gameState.isDragging) return;

    this.gameState.isDragging = false;
    this.slingLine.visible = false;
    this.aimLine.visible = false;

    // Calculate release angle
    const angle = Phaser.Math.Angle.Between(
      this.david.x,
      this.david.y,
      pointer.x,
      pointer.y
    );

    // Fire stone
    this.fireStone(angle);
  }

  fireStone(angle) {
    // Create stone projectile
    const stone = this.add.text(
      this.david.x,
      this.david.y,
      '💎',
      { fontSize: '20px', fontFamily: 'Arial' }
    );
    stone.setOrigin(0.5, 0.5);
    stone.setData('angle', angle);
    stone.setData('distance', 0);
    stone.setData('hasHit', false);

    this.activeStone = stone;

    // Tween stone flight
    const flightDistance = Math.max(GAME_WIDTH, GAME_HEIGHT) + 100;
    const flightDuration = (flightDistance / this.stoneSpeed) * 1000;

    const endX = this.david.x + Math.cos(angle) * flightDistance;
    const endY = this.david.y + Math.sin(angle) * flightDistance;

    this.tweens.add({
      targets: stone,
      x: endX,
      y: endY,
      duration: flightDuration,
      onUpdate: () => {
        this.checkStoneCollision(stone);
      },
      onComplete: () => {
        // Stone left screen without hitting
        if (!stone.getData('hasHit')) {
          this.handleMiss();
        }
        stone.destroy();
        this.activeStone = null;
      }
    });
  }

  checkStoneCollision(stone) {
    if (stone.getData('hasHit')) return;

    const dist = Phaser.Math.Distance.Between(
      stone.x,
      stone.y,
      this.goliath.x,
      this.goliath.y
    );

    if (dist < this.hitRadius) {
      stone.setData('hasHit', true);

      // Check for headshot (top 30% of Goliath)
      const isHeadshot = stone.y < (this.goliath.y - 40);

      this.handleWin(isHeadshot);
      stone.destroy();
      this.activeStone = null;
    }
  }

  handleWin(isHeadshot) {
    if (this.gameState.gameOver) return;
    this.gameState.gameOver = true;
    this.gameState.won = true;

    // Calculate elapsed time and points
    const elapsed = (this.time.now - this.gameStartTime) / 1000;
    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = isHeadshot || elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.gameState.score += points;
    this.gameState.combo++;

    // Victory text
    const victoryText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Victory!',
      {
        fontSize: '48px',
        fontFamily: FONTS.bold,
        fill: COLORS.success,
        fontStyle: 'bold'
      }
    );
    victoryText.setOrigin(0.5, 0.5);

    if (isHeadshot) {
      const headshotText = this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 50,
        'HEADSHOT! +50 points',
        {
          fontSize: '20px',
          fontFamily: FONTS.main,
          fill: COLORS.warning
        }
      );
      headshotText.setOrigin(0.5, 0);
    }

    // Goliath falls
    this.tweens.add({
      targets: this.goliath,
      rotation: Math.PI / 2,
      x: this.goliath.x + 20,
      y: this.goliath.y + 40,
      duration: 600,
      ease: 'Quad.easeIn'
    });

    // Transition after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.DAVID_VS_GOLIATH,
        points: points,
        timeElapsed: elapsed
      });
    });
  }

  handleMiss() {
    if (this.gameState.gameOver) return;

    this.gameState.attempts--;
    this.gameState.combo = 0;

    this.updateHUD();

    if (this.gameState.attempts <= 0) {
      this.handleLoss();
    }
  }

  handleLoss() {
    if (this.gameState.gameOver) return;
    this.gameState.gameOver = true;
    this.gameState.won = false;

    // Disable input
    this.input.enabled = false;

    const lossText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'The giant stands!',
      {
        fontSize: '36px',
        fontFamily: FONTS.bold,
        fill: COLORS.danger,
        fontStyle: 'bold'
      }
    );
    lossText.setOrigin(0.5, 0.5);

    // Transition after 1.5 seconds
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.DAVID_VS_GOLIATH,
        points: 0
      });
    });
  }

  update() {
    if (this.gameState.gameOver) return;

    // Move Goliath up and down on hard difficulty
    if (this.goliath.goliathSpeed > 0) {
      const time = this.time.elapsed / 1000;
      const offset = Math.sin(time * this.goliath.goliathSpeed / 100) * 40;
      this.goliath.y = this.goliath.baseY + offset;
    }
  }

  shutdown() {
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
  }
}
