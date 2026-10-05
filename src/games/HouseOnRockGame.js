class HouseOnRockGame extends Phaser.Scene {
  constructor() {
    super({ key: 'HouseOnRockGame' });
    this.config = null;
    this.difficulty = 1;
    this.gameActive = true;
    this.timeRemaining = 0;
    this.windVelocity = 0;
    this.housePosition = { x: 0, y: 0 };
    this.foundationPositions = {};
    this.rainParticles = [];
    this.hudElements = {};
    this.stormIntensity = 0;
    this.rockFoundationSide = 'left';
    this.sandFoundationSide = 'right';
    this.gameStartTime = 0;
  }

  init(data) {
    this.config = data.config || {
      timeLimit: 4.0,
      windForce: 0,
      labelsVisible: true
    };
    this.difficulty = data.difficulty || 0;
  }

  create() {
    // Randomize which side is rock/sand (left/right)
    const randomSide = Phaser.Math.Between(0, 1);
    if (randomSide === 0) {
      this.rockFoundationSide = 'left';
      this.sandFoundationSide = 'right';
    } else {
      this.rockFoundationSide = 'right';
      this.sandFoundationSide = 'left';
    }

    this.timeRemaining = this.config.timeLimit;
    this.windVelocity = 0;
    this.stormIntensity = 0;
    this.gameActive = true;
    this.gameStartTime = this.time.now;

    // Create sky gradient background
    this.createSkyBackground();

    // Create storm elements
    this.createRainParticles();

    // Create foundations
    this.createFoundations();

    // Create house
    this.createHouse();

    // Create HUD
    this.drawHUD();

    // Start timer
    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.gameActive) {
          this.timeRemaining -= 0.1;
          if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.handleLoss('timeout');
          }
        }
      },
      loop: true
    });
  }

  createSkyBackground() {
    // Create gradient from light blue (storm) to darker blue
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const colorTop = Phaser.Display.Color.HexStringToColor('0x4A6FA5');
    const colorBottom = Phaser.Display.Color.HexStringToColor('0x2C3E50');

    graphics.fillGradientStyle(
      colorTop.color,
      colorTop.color,
      colorBottom.color,
      colorBottom.color,
      1
    );
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const texture = graphics.generateTexture('skyGradient', GAME_WIDTH, GAME_HEIGHT);
    graphics.destroy();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'skyGradient');
  }

  createRainParticles() {
    // Create falling rain particles
    for (let i = 0; i < 30; i++) {
      const rainDrop = this.add.rectangle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(-50, GAME_HEIGHT),
        2,
        8,
        COLORS.white
      );
      rainDrop.alpha = 0.6;
      this.rainParticles.push({
        sprite: rainDrop,
        vy: Phaser.Math.Between(150, 250)
      });
    }
  }

  createFoundations() {
    const foundationY = GAME_HEIGHT - 80;
    const foundationWidth = 120;
    const foundationHeight = 60;

    // Left side foundation
    const leftX = GAME_WIDTH / 4;
    const rightX = (GAME_WIDTH * 3) / 4;

    if (this.rockFoundationSide === 'left') {
      // ROCK on left
      const rockFoundation = this.add.image(leftX, foundationY, 'foundation-rock');
      rockFoundation.setDisplaySize(foundationWidth, foundationHeight);
      this.foundationPositions.rock = {
        x: leftX,
        y: foundationY,
        width: foundationWidth,
        height: foundationHeight,
        type: 'rock'
      };

      // SAND on right
      const sandFoundation = this.add.image(rightX, foundationY, 'foundation-sand');
      sandFoundation.setDisplaySize(foundationWidth, foundationHeight);
      this.foundationPositions.sand = {
        x: rightX,
        y: foundationY,
        width: foundationWidth,
        height: foundationHeight,
        type: 'sand'
      };
    } else {
      // SAND on left
      const sandFoundation = this.add.image(leftX, foundationY, 'foundation-sand');
      sandFoundation.setDisplaySize(foundationWidth, foundationHeight);
      this.foundationPositions.sand = {
        x: leftX,
        y: foundationY,
        width: foundationWidth,
        height: foundationHeight,
        type: 'sand'
      };

      // ROCK on right
      const rockFoundation = this.add.image(rightX, foundationY, 'foundation-rock');
      rockFoundation.setDisplaySize(foundationWidth, foundationHeight);
      this.foundationPositions.rock = {
        x: rightX,
        y: foundationY,
        width: foundationWidth,
        height: foundationHeight,
        type: 'rock'
      };
    }

    // Add labels if visible
    if (this.config.labelsVisible) {
      this.add.text(
        this.foundationPositions.rock.x,
        this.foundationPositions.rock.y + 40,
        'ROCK',
        {
          font: `${FONTS.small}px ${FONTS.family}`,
          fill: COLORS.white,
          align: 'center'
        }
      ).setOrigin(0.5, 0);

      this.add.text(
        this.foundationPositions.sand.x,
        this.foundationPositions.sand.y + 40,
        'SAND',
        {
          font: `${FONTS.small}px ${FONTS.family}`,
          fill: COLORS.white,
          align: 'center'
        }
      ).setOrigin(0.5, 0);
    }
  }

  createHouse() {
    this.house = this.add.image(GAME_WIDTH / 2, 80, 'house');
    this.house.setDisplaySize(60, 50);
    this.house.setInteractive({ draggable: true });

    this.input.on('dragstart', (pointer, gameObject) => {
      if (gameObject === this.house) {
        this.house.setDepth(1000);
      }
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (gameObject === this.house && this.gameActive) {
        // Clamp house within game bounds
        gameObject.x = Phaser.Math.Clamp(dragX, 30, GAME_WIDTH - 30);
        gameObject.y = Phaser.Math.Clamp(dragY, 30, GAME_HEIGHT - 100);

        this.housePosition.x = gameObject.x;
        this.housePosition.y = gameObject.y;
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (gameObject === this.house && this.gameActive) {
        this.checkFoundationCollision();
      }
    });

    this.housePosition = { x: this.house.x, y: this.house.y };
  }

  checkFoundationCollision() {
    const houseBounds = this.house.getBounds();
    const rockBounds = new Phaser.Geom.Rectangle(
      this.foundationPositions.rock.x - this.foundationPositions.rock.width / 2,
      this.foundationPositions.rock.y - this.foundationPositions.rock.height / 2,
      this.foundationPositions.rock.width,
      this.foundationPositions.rock.height
    );
    const sandBounds = new Phaser.Geom.Rectangle(
      this.foundationPositions.sand.x - this.foundationPositions.sand.width / 2,
      this.foundationPositions.sand.y - this.foundationPositions.sand.height / 2,
      this.foundationPositions.sand.width,
      this.foundationPositions.sand.height
    );

    // Check overlap with foundations
    if (Phaser.Geom.Rectangle.Overlaps(houseBounds, rockBounds)) {
      this.handleWin();
    } else if (Phaser.Geom.Rectangle.Overlaps(houseBounds, sandBounds)) {
      this.handleLoss('sand');
    }
  }

  handleWin() {
    if (!this.gameActive) return;
    this.gameActive = false;

    // Calculate points based on time
    const elapsed = (this.time.now - this.gameStartTime) / 1000;
    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // House stands firm
    this.tweens.add({
      targets: this.house,
      duration: 300,
      scaleX: 1.1,
      scaleY: 1.1,
      ease: 'Back.easeOut'
    });

    // Add family safe emoji
    this.add.text(GAME_WIDTH / 2, 50, '👨‍👩‍👧‍👦', {
      font: '48px Arial',
      align: 'center'
    }).setOrigin(0.5);

    // Sky clears (sun breaks through)
    this.tweens.add({
      targets: this.cameras.main,
      duration: 800,
      backgroundColor: Phaser.Display.Color.HexStringToColor('0x87CEEB')
    });

    // Transition with result data
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.HOUSE_ON_ROCK,
        points: points,
        timeElapsed: elapsed
      });
    });
  }

  handleLoss(reason) {
    if (!this.gameActive) return;
    this.gameActive = false;

    if (reason === 'sand') {
      // House collapses
      this.tweens.add({
        targets: this.house,
        duration: 600,
        scaleX: 0,
        scaleY: 0,
        rotation: Phaser.Math.PI * 2,
        ease: 'Quad.easeIn'
      });

      // Debris/collapse effect
      this.add.text(GAME_WIDTH / 2, this.house.y, '💔', {
        font: '48px Arial',
        align: 'center'
      }).setOrigin(0.5);
    } else if (reason === 'timeout') {
      // House blown away by wind
      this.tweens.add({
        targets: this.house,
        duration: 800,
        x: reason === 'timeout' ? GAME_WIDTH + 100 : this.house.x,
        y: -100,
        alpha: 0,
        rotation: Phaser.Math.PI * 4,
        ease: 'Quad.easeIn'
      });
    }

    // Transition with result data
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.HOUSE_ON_ROCK,
        points: 0
      });
    });
  }

  drawHUD() {
    const hudY = 15;
    const hudX = 15;
    const spacing = 130;

    // Hearts (lives)
    // SessionManager exposes lives/score/combo directly on the instance; there is no nested
    // stats object. The old nested lookup threw on every create(), so this scene never ran.
    const hearts = session.lives;
    this.hudElements.hearts = this.add.text(hudX, hudY, `❤️ ${hearts}`, {
      font: `${FONTS.medium}px ${FONTS.family}`,
      fill: COLORS.white
    });

    // Score
    const score = session.score;
    this.hudElements.score = this.add.text(hudX + spacing, hudY, `⭐ ${score}`, {
      font: `${FONTS.medium}px ${FONTS.family}`,
      fill: COLORS.white
    });

    // Combo
    const combo = session.combo;
    this.hudElements.combo = this.add.text(
      hudX + spacing * 2,
      hudY,
      `🔥 x${combo}`,
      {
        font: `${FONTS.medium}px ${FONTS.family}`,
        fill: COLORS.white
      }
    );

    // Timer
    this.hudElements.timer = this.add.text(GAME_WIDTH - 80, hudY, '⏱️ 4.0s', {
      font: `${FONTS.medium}px ${FONTS.family}`,
      fill: COLORS.white
    }).setOrigin(0, 0);
  }

  update() {
    // Update timer display
    if (this.hudElements.timer) {
      this.hudElements.timer.setText(`⏱️ ${this.timeRemaining.toFixed(1)}s`);
    }

    // Update storm intensity based on time remaining
    const maxTime = this.config.timeLimit;
    this.stormIntensity = 1 - this.timeRemaining / maxTime;

    // Apply wind force on hard mode
    if (this.difficulty === 2 && this.gameActive) {
      this.house.x += (this.config.windForce / 60);
      // Clamp to bounds
      this.house.x = Phaser.Math.Clamp(this.house.x, 30, GAME_WIDTH - 30);
    }

    // Update rain particles
    this.rainParticles.forEach((particle, index) => {
      particle.sprite.y += particle.vy / 60;

      // Reset rain at top
      if (particle.sprite.y > GAME_HEIGHT) {
        particle.sprite.y = -10;
        particle.sprite.x = Phaser.Math.Between(0, GAME_WIDTH);
      }

      // Increase opacity and speed as storm intensifies
      particle.sprite.alpha = 0.4 + this.stormIntensity * 0.6;
      particle.vy = 150 + this.stormIntensity * 150;
    });

    // Visual clue: rain splashes on rock, sinks into sand (on medium/hard)
    if (this.difficulty >= 1) {
      this.rainParticles.forEach((particle) => {
        const distToRock = Phaser.Math.Distance.Between(
          particle.sprite.x,
          particle.sprite.y,
          this.foundationPositions.rock.x,
          this.foundationPositions.rock.y
        );
        const distToSand = Phaser.Math.Distance.Between(
          particle.sprite.x,
          particle.sprite.y,
          this.foundationPositions.sand.x,
          this.foundationPositions.sand.y
        );

        // If near rock, bounces (y velocity inverts briefly)
        if (distToRock < 80 && particle.sprite.y > GAME_HEIGHT - 100) {
          particle.vy *= -0.7; // Bounce effect
        }

        // If near sand, sinks (no bounce, just passes through visually)
        // (sand foundation doesn't bounce the rain)
      });
    }

    // Darken sky as time runs out
    if (this.gameActive) {
      const baseColor = Phaser.Display.Color.HexStringToColor('0x4A6FA5');
      const darkColor = Phaser.Display.Color.HexStringToColor('0x1A2332');
      // Two Phaser 3 API errors lived here. `Color.Interpolate` is a NAMESPACE, not a callable —
      // the method is ColorWithColor(from, to, length, index), which takes a step out of a range
      // rather than a 0..1 fraction. And it returns a {r,g,b} object, so it has to be packed into
      // a colour int before setBackgroundColor will accept it.
      const t = Phaser.Math.Clamp(this.stormIntensity, 0, 1);
      const lerped = Phaser.Display.Color.Interpolate.ColorWithColor(
        baseColor,
        darkColor,
        100,
        Math.round(t * 100)
      );
      this.cameras.main.setBackgroundColor(
        Phaser.Display.Color.GetColor(lerped.r, lerped.g, lerped.b)
      );
    }
  }
}
