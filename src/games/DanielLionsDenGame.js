class DanielLionsDenGame extends Phaser.Scene {
  constructor() {
    super({ key: 'DanielLionsDenGame' });
  }

  create(data) {
    this.config = data.config || {
      lionCount: 2,
      surviveTime: 5.0,
      lionSpeed: 60
    };
    this.difficulty = data.difficulty || 1;

    // Game state
    this.score = 0;
    this.combo = 0;
    this.hearts = 3;
    this.surviveTimeRemaining = this.config.surviveTime;
    this.gameActive = true;
    this.won = false;
    this.dangerGlowActive = false;

    // Play area bounds
    this.playArea = {
      x: 40,
      y: 70,
      width: GAME_WIDTH - 80,
      height: GAME_HEIGHT - 110
    };

    // Draw gradient background
    this.drawGradientBG();

    // Input handling
    this.input.on('pointermove', this.handleDrag, this);
    this.input.on('pointerdown', this.handlePointerDown, this);

    // Create Daniel
    this.createDaniel();

    // Create lions
    this.lions = [];
    this.createLions();

    // Charge timer for hard mode
    this.chargeTimer = 0;

    // Screen shake overlay
    this.shakeOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0);

    // Danger glow overlay
    this.dangerOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0);

    // Track game start time for scoring
    this.gameStartTime = this.time.now;
  }

  drawGradientBG() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillGradientStyle(0x2C1810, 0x2C1810, 0x1a0e08, 0x1a0e08, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.generateTexture('gradientBG', GAME_WIDTH, GAME_HEIGHT);
    graphics.destroy();
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gradientBG');
  }

  createDaniel() {
    const centerX = this.playArea.x + this.playArea.width / 2;
    const centerY = this.playArea.y + this.playArea.height / 2;

    // Create circle texture for Daniel
    this.createCircleTexture('danielCircle', 25, COLORS.primary);

    this.daniel = this.add.container(centerX, centerY);
    this.daniel.circle = this.add.image(0, 0, 'danielCircle');
    this.daniel.emoji = this.add.text(0, 0, '🙏', {
      font: 'bold 28px Arial',
      align: 'center'
    }).setOrigin(0.5);
    this.daniel.add([this.daniel.circle, this.daniel.emoji]);

    this.daniel.targetX = centerX;
    this.daniel.targetY = centerY;
    this.daniel.radius = 25;
  }

  createLions() {
    this.createCircleTexture('lionCircle', 22, COLORS.warning);

    for (let i = 0; i < this.config.lionCount; i++) {
      const lion = this.add.container(0, 0);
      const circle = this.add.image(0, 0, 'lionCircle');
      const emoji = this.add.text(0, 0, '🦁', {
        font: 'bold 24px Arial',
        align: 'center'
      }).setOrigin(0.5);
      lion.add([circle, emoji]);

      lion.radius = 22;
      lion.speed = this.config.lionSpeed;
      lion.isCharging = false;
      lion.chargeTarget = { x: 0, y: 0 };

      // Position at random edge
      this.positionLionAtEdge(lion);

      // Set initial target
      lion.targetX = this.getRandomInPlayArea().x;
      lion.targetY = this.getRandomInPlayArea().y;

      this.lions.push(lion);
    }
  }

  positionLionAtEdge(lion) {
    const edges = ['top', 'bottom', 'left', 'right'];
    const edge = Phaser.Utils.Array.GetRandom(edges);

    let x, y;
    switch (edge) {
      case 'top':
        x = Phaser.Math.Between(this.playArea.x, this.playArea.x + this.playArea.width);
        y = this.playArea.y;
        break;
      case 'bottom':
        x = Phaser.Math.Between(this.playArea.x, this.playArea.x + this.playArea.width);
        y = this.playArea.y + this.playArea.height;
        break;
      case 'left':
        x = this.playArea.x;
        y = Phaser.Math.Between(this.playArea.y, this.playArea.y + this.playArea.height);
        break;
      case 'right':
        x = this.playArea.x + this.playArea.width;
        y = Phaser.Math.Between(this.playArea.y, this.playArea.y + this.playArea.height);
        break;
    }

    lion.x = x;
    lion.y = y;
  }

  getRandomInPlayArea() {
    return {
      x: Phaser.Math.Between(this.playArea.x + 30, this.playArea.x + this.playArea.width - 30),
      y: Phaser.Math.Between(this.playArea.y + 30, this.playArea.y + this.playArea.height - 30)
    };
  }

  createCircleTexture(key, radius, color) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(color, 1);
    graphics.fillCircle(radius, radius, radius);
    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
  }

  handlePointerDown(pointer) {
    if (this.gameActive) {
      this.handleDrag(pointer);
    }
  }

  handleDrag(pointer) {
    if (!this.gameActive) return;

    const x = Phaser.Math.Clamp(
      pointer.x,
      this.playArea.x + this.daniel.radius,
      this.playArea.x + this.playArea.width - this.daniel.radius
    );
    const y = Phaser.Math.Clamp(
      pointer.y,
      this.playArea.y + this.daniel.radius,
      this.playArea.y + this.playArea.height - this.daniel.radius
    );

    this.daniel.targetX = x;
    this.daniel.targetY = y;
  }

  update(time, delta) {
    if (!this.gameActive) return;

    const deltaSeconds = delta / 1000;

    // Update survive timer
    this.surviveTimeRemaining -= deltaSeconds;
    if (this.surviveTimeRemaining <= 0 && !this.won) {
      this.won = true;
      this.handleWin();
      return;
    }

    // Smooth Daniel movement toward target
    const smoothing = 0.15;
    this.daniel.x += (this.daniel.targetX - this.daniel.x) * smoothing;
    this.daniel.y += (this.daniel.targetY - this.daniel.y) * smoothing;

    // Update lions
    this.updateLions(deltaSeconds);

    // Hard mode charging
    if (this.difficulty === 3) {
      this.chargeTimer += deltaSeconds;
      if (this.chargeTimer >= 3) {
        this.chargeTimer = 0;
        const randomLion = Phaser.Utils.Array.GetRandom(this.lions);
        randomLion.isCharging = true;
        randomLion.chargeTarget.x = this.daniel.x;
        randomLion.chargeTarget.y = this.daniel.y;
        // Charging lasts 1.5 seconds
        this.time.delayedCall(1500, () => {
          randomLion.isCharging = false;
        });
      }
    }

    // Check collisions
    this.checkCollisions();

    // Update danger glow
    this.updateDangerGlow();

    // Draw HUD
    this.drawHUD();
  }

  updateLions(deltaSeconds) {
    for (let lion of this.lions) {
      let moveX, moveY, moveDistance;

      if (lion.isCharging) {
        // Charge at Daniel at 2x speed
        const chargeSpeed = lion.speed * 2;
        moveX = lion.chargeTarget.x - lion.x;
        moveY = lion.chargeTarget.y - lion.y;
        moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveDistance > 0) {
          const moveAmount = chargeSpeed * deltaSeconds;
          lion.x += (moveX / moveDistance) * moveAmount;
          lion.y += (moveY / moveDistance) * moveAmount;
        }
      } else {
        // Patrol toward target
        moveX = lion.targetX - lion.x;
        moveY = lion.targetY - lion.y;
        moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);

        if (moveDistance < 15) {
          // Pick new target
          const newTarget = this.getRandomInPlayArea();
          lion.targetX = newTarget.x;
          lion.targetY = newTarget.y;
        } else {
          // Move toward target
          const moveAmount = lion.speed * deltaSeconds;
          lion.x += (moveX / moveDistance) * moveAmount;
          lion.y += (moveY / moveDistance) * moveAmount;
        }
      }

      // Keep lion in play area
      lion.x = Phaser.Math.Clamp(lion.x, this.playArea.x, this.playArea.x + this.playArea.width);
      lion.y = Phaser.Math.Clamp(lion.y, this.playArea.y, this.playArea.y + this.playArea.height);
    }
  }

  checkCollisions() {
    for (let lion of this.lions) {
      const dx = lion.x - this.daniel.x;
      const dy = lion.y - this.daniel.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        this.gameActive = false;
        this.handleLoss();
      }
    }
  }

  updateDangerGlow() {
    let nearestDistance = Infinity;

    for (let lion of this.lions) {
      const dx = lion.x - this.daniel.x;
      const dy = lion.y - this.daniel.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < nearestDistance) {
        nearestDistance = distance;
      }
    }

    if (nearestDistance < 60) {
      this.dangerGlowActive = true;
      const alpha = Phaser.Math.Clamp(1 - nearestDistance / 60, 0.1, 0.4);
      this.dangerOverlay.setAlpha(alpha);
    } else {
      this.dangerGlowActive = false;
      this.dangerOverlay.setAlpha(0);
    }
  }

  drawHUD() {
    // Clear previous HUD
    this.children.list.forEach(child => {
      if (child.name && (child.name.includes('hud') || child.name.includes('timer'))) {
        child.destroy();
      }
    });

    // Hearts
    const heartText = this.add.text(GAME_WIDTH - 30, 15, '❤️ ' + this.hearts, {
      font: FONTS.button,
      fill: COLORS.danger
    }).setOrigin(1, 0).setName('hud-hearts').setDepth(100);

    // Score
    const scoreText = this.add.text(10, 15, 'Score: ' + this.score, {
      font: FONTS.body,
      fill: COLORS.text
    }).setOrigin(0, 0).setName('hud-score').setDepth(100);

    // Combo
    if (this.combo > 0) {
      const comboText = this.add.text(GAME_WIDTH / 2, 15, 'Combo: ' + this.combo, {
        font: FONTS.button,
        fill: COLORS.warning
      }).setOrigin(0.5, 0).setName('hud-combo').setDepth(100);
    }

    // Survive timer (counting down)
    const timerSeconds = Math.max(0, this.surviveTimeRemaining).toFixed(1);
    const timerText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, '⏱️ ' + timerSeconds + 's', {
      font: FONTS.button,
      fill: COLORS.primary
    }).setOrigin(0.5, 1).setName('hud-timer').setDepth(100);
  }

  handleWin() {
    this.gameActive = false;

    // Angel appears
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '👼', {
      font: '72px Arial',
      align: 'center'
    }).setOrigin(0.5);

    // Lions lie down
    for (let lion of this.lions) {
      lion.emoji.setText('😴');
    }

    // Victory text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'God protected Daniel!', {
      font: FONTS.heading,
      fill: COLORS.success,
      align: 'center'
    }).setOrigin(0.5);

    // Calculate points
    const elapsed = (this.time.now - this.gameStartTime) / 1000;
    const fast = elapsed < this.config.surviveTime * 0.7;
    const perfect = false; // No perfect condition for survival-based game
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // Transition after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.DANIEL_LIONS_DEN,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    // Screen shake
    this.cameras.main.shake(300, 0.02);

    // "Caught!" text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Caught!', {
      font: FONTS.heading,
      fill: COLORS.danger,
      align: 'center'
    }).setOrigin(0.5);

    // Transition after 1.5 seconds
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.DANIEL_LIONS_DEN,
        points: 0,
      });
    });
  }
}
