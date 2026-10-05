class WalkAroundJerichoGame extends Phaser.Scene {
  constructor() {
    super({ key: 'WalkAroundJerichoGame' });
  }

  create(data) {
    this.config = data?.config || {
      laps: 7,
      timeLimit: 10.0,
      autoWalk: true,
      obstacles: false,
    };

    this.difficulty = data?.difficulty || 'easy';
    this.gameData = {
      currentLap: 1,
      lapDistance: 0,
      totalLaps: this.config.laps,
      timeLimit: this.config.timeLimit,
      timeRemaining: this.config.timeLimit,
      score: 0,
      hearts: 3,
      combo: 0,
      isWalking: false,
      isStunned: false,
      stunTimeRemaining: 0,
      wallCracks: 0,
      won: false,
      lost: false,
    };

    // Walker configuration
    this.walker = {
      x: 0,
      y: 0,
      radius: 12,
      pathIndex: 0,
      distanceAlongPath: 0,
    };

    // Wall configuration (center of screen)
    this.wall = {
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
      width: 200,
      height: 120,
      cornerRadius: 20,
      color: COLORS.wall || 0x8B4513,
    };

    // Define path as 4 waypoints (corners with padding)
    this.pathPadding = 40;
    this.pathWaypoints = [
      { x: this.wall.centerX - this.wall.width / 2 - this.pathPadding, y: this.wall.centerY - this.wall.height / 2 - this.pathPadding },
      { x: this.wall.centerX + this.wall.width / 2 + this.pathPadding, y: this.wall.centerY - this.wall.height / 2 - this.pathPadding },
      { x: this.wall.centerX + this.wall.width / 2 + this.pathPadding, y: this.wall.centerY + this.wall.height / 2 + this.pathPadding },
      { x: this.wall.centerX - this.wall.width / 2 - this.pathPadding, y: this.wall.centerY + this.wall.height / 2 + this.pathPadding },
    ];

    // Calculate total path length
    this.totalPathLength = this.calculatePathLength();
    this.tapAdvanceDistance = this.totalPathLength / 10; // Tap moves walker ~10% of lap

    // Obstacles (for hard difficulty)
    this.obstacles = [];
    this.generateObstacles();

    // Create graphics for wall and path
    this.wallGraphics = this.add.graphics();
    this.pathGraphics = this.add.graphics();

    // Draw initial state
    this.drawWall();
    this.drawPath();

    // Initialize walker position (starting position at first waypoint)
    this.updateWalkerPosition(0);

    // Input
    this.input.on('pointerdown', () => this.handleTap());

    // Timer
    // `addTimer` is the Phaser 2 API and does not exist in Phaser 3 — this threw on every
    // create() and the scene never ran. Phaser 3 is `addEvent`.
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.gameData.won && !this.gameData.lost) {
          this.gameData.timeRemaining -= 1;
          if (this.gameData.timeRemaining <= 0) {
            this.gameData.timeRemaining = 0;
            this.handleLoss();
          }
        }
      },
      loop: true,
    });

    // HUD
    this.drawHUD();

    // Record game start time
    this.gameStartTime = this.time.now;
  }

  handleTap() {
    if (this.gameData.won || this.gameData.lost) return;
    if (this.gameData.isStunned) return;

    if (this.config.autoWalk) {
      // Easy mode: tap to start walking this lap
      if (!this.gameData.isWalking) {
        this.gameData.isWalking = true;
      }
    } else {
      // Medium/Hard: tap to advance walker
      this.gameData.isWalking = true;
      this.advanceWalker(this.tapAdvanceDistance);
    }
  }

  advanceWalker(distance) {
    this.walker.distanceAlongPath += distance;

    // Check lap completion
    if (this.walker.distanceAlongPath >= this.totalPathLength) {
      this.completeLap();
    }

    // Check obstacle collision (hard mode)
    if (this.difficulty === 'hard' && !this.config.autoWalk) {
      this.checkObstacleCollision();
    }

    this.updateWalkerPosition(this.walker.distanceAlongPath);
  }

  completeLap() {
    this.gameData.currentLap += 1;
    this.gameData.wallCracks += 1;
    this.walker.distanceAlongPath = 0;
    this.gameData.isWalking = false;
    this.gameData.score += 100;
    this.gameData.combo += 1;

    this.drawWall();
    this.updateWalkerPosition(0);

    if (this.gameData.currentLap > this.gameData.totalLaps) {
      this.handleWin();
    }
  }

  checkObstacleCollision() {
    const walker = this.walker;
    for (let obstacle of this.obstacles) {
      const dist = Phaser.Math.Distance.Between(walker.x, walker.y, obstacle.x, obstacle.y);
      if (dist < walker.radius + obstacle.radius) {
        this.stun();
        break;
      }
    }
  }

  stun() {
    this.gameData.isStunned = true;
    this.gameData.stunTimeRemaining = 1.0; // 1 second stun
    this.gameData.isWalking = false;
    this.gameData.combo = 0;
  }

  calculatePathLength() {
    let length = 0;
    for (let i = 0; i < this.pathWaypoints.length; i++) {
      const p1 = this.pathWaypoints[i];
      const p2 = this.pathWaypoints[(i + 1) % this.pathWaypoints.length];
      length += Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
    }
    return length;
  }

  updateWalkerPosition(distanceAlongPath) {
    let currentDistance = 0;
    let found = false;

    for (let i = 0; i < this.pathWaypoints.length; i++) {
      const p1 = this.pathWaypoints[i];
      const p2 = this.pathWaypoints[(i + 1) % this.pathWaypoints.length];
      const segmentLength = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);

      if (currentDistance + segmentLength >= distanceAlongPath) {
        const t = (distanceAlongPath - currentDistance) / segmentLength;
        this.walker.x = Phaser.Math.Interpolation.Linear([p1.x, p2.x], t);
        this.walker.y = Phaser.Math.Interpolation.Linear([p1.y, p2.y], t);
        found = true;
        break;
      }

      currentDistance += segmentLength;
    }

    if (!found) {
      this.walker.x = this.pathWaypoints[0].x;
      this.walker.y = this.pathWaypoints[0].y;
    }
  }

  drawPath() {
    this.pathGraphics.clear();
    this.pathGraphics.lineStyle(2, COLORS.path || 0xCCCCCC, 0.5);
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(this.pathWaypoints[0].x, this.pathWaypoints[0].y);
    for (let i = 1; i < this.pathWaypoints.length; i++) {
      this.pathGraphics.lineTo(this.pathWaypoints[i].x, this.pathWaypoints[i].y);
    }
    this.pathGraphics.closePath();
    this.pathGraphics.strokePath();
  }

  drawWall() {
    this.wallGraphics.clear();
    this.wallGraphics.fillStyle(this.wall.color, 0.8);
    this.wallGraphics.fillRoundedRect(
      this.wall.centerX - this.wall.width / 2,
      this.wall.centerY - this.wall.height / 2,
      this.wall.width,
      this.wall.height,
      this.wall.cornerRadius
    );

    // Draw cracks based on lap count
    this.wallGraphics.lineStyle(2, 0x654321, 0.6);
    const crackCount = Math.min(this.gameData.wallCracks, 5);
    for (let i = 0; i < crackCount; i++) {
      const crackX = this.wall.centerX - this.wall.width / 2 + 20 + i * 35;
      const crackStartY = this.wall.centerY - this.wall.height / 2 + 10;
      const crackEndY = this.wall.centerY + this.wall.height / 2 - 10;
      this.wallGraphics.lineBetween(crackX, crackStartY, crackX + 5, crackEndY);
    }

    // Draw border
    this.wallGraphics.lineStyle(3, 0x654321, 1);
    this.wallGraphics.strokeRoundedRect(
      this.wall.centerX - this.wall.width / 2,
      this.wall.centerY - this.wall.height / 2,
      this.wall.width,
      this.wall.height,
      this.wall.cornerRadius
    );
  }

  generateObstacles() {
    this.obstacles = [];
    if (!this.config.obstacles) return;

    // Place obstacles at specific distances along the path
    const obstacleCount = 3 + (this.difficulty === 'hard' ? 2 : 0);
    for (let i = 0; i < obstacleCount; i++) {
      const distAlongPath = (this.totalPathLength / obstacleCount) * (i + 0.5);
      const pos = this.getPositionAlongPath(distAlongPath);
      this.obstacles.push({
        x: pos.x,
        y: pos.y,
        radius: 8,
      });
    }
  }

  getPositionAlongPath(distanceAlongPath) {
    let currentDistance = 0;
    for (let i = 0; i < this.pathWaypoints.length; i++) {
      const p1 = this.pathWaypoints[i];
      const p2 = this.pathWaypoints[(i + 1) % this.pathWaypoints.length];
      const segmentLength = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);

      if (currentDistance + segmentLength >= distanceAlongPath) {
        const t = (distanceAlongPath - currentDistance) / segmentLength;
        return {
          x: Phaser.Math.Interpolation.Linear([p1.x, p2.x], t),
          y: Phaser.Math.Interpolation.Linear([p1.y, p2.y], t),
        };
      }

      currentDistance += segmentLength;
    }
    return this.pathWaypoints[0];
  }

  drawHUD() {
    // Clear previous HUD if any
    if (this.hudText) {
      this.hudText.destroy();
    }

    const hudTextContent = [
      `❤️ ${this.gameData.hearts}`,
      `Score: ${this.gameData.score}`,
      `Combo: ${this.gameData.combo}`,
      `Time: ${this.gameData.timeRemaining.toFixed(1)}s`,
      `Lap ${this.gameData.currentLap}/${this.gameData.totalLaps}`,
    ].join('  |  ');

    this.hudText = this.add.text(GAME_WIDTH / 2, 15, hudTextContent, {
      font: `${FONTS.small || '14px'} Arial`,
      fill: COLORS.text || '#FFFFFF',
      align: 'center',
    });
    this.hudText.setOrigin(0.5, 0);
    this.hudText.setDepth(100);
  }

  drawWalker() {
    // Draw walker as blue circle with emoji
    if (!this.walkerGraphics) {
      this.walkerGraphics = this.add.graphics();
    }
    this.walkerGraphics.clear();
    this.walkerGraphics.fillStyle(COLORS.walker || 0x4A90E2, 1);
    this.walkerGraphics.fillCircle(this.walker.x, this.walker.y, this.walker.radius);

    // Add emoji text (using placeholder, can be replaced with texture)
    if (!this.walkerText) {
      this.walkerText = this.add.text(this.walker.x, this.walker.y, '🚶', {
        font: '20px Arial',
        align: 'center',
      });
      this.walkerText.setOrigin(0.5);
      this.walkerText.setDepth(50);
    } else {
      this.walkerText.setPosition(this.walker.x, this.walker.y);
    }
  }

  drawObstacles() {
    if (!this.config.obstacles) return;
    if (!this.obstaclesGraphics) {
      this.obstaclesGraphics = this.add.graphics();
    }
    this.obstaclesGraphics.clear();
    this.obstaclesGraphics.fillStyle(0x888888, 0.7);
    for (let obstacle of this.obstacles) {
      this.obstaclesGraphics.fillCircle(obstacle.x, obstacle.y, obstacle.radius);
    }
  }

  handleWin() {
    this.gameData.won = true;
    this.gameData.isWalking = false;

    // Calculate elapsed time and performance bonuses
    const elapsed = (this.time.now - this.gameStartTime) / 1000;
    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // Shake and wall collapse effect
    this.cameras.main.shake(300, 0.02);

    // Wall pieces fly outward
    this.wallGraphics.clear();

    // Display trumpets and victory message
    const trumpetsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '🎺 🎺 🎺', {
      font: '40px Arial',
      align: 'center',
    });
    trumpetsText.setOrigin(0.5);
    trumpetsText.setDepth(200);

    const victoryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'The walls have fallen!', {
      font: `${FONTS.large || '28px'} Arial`,
      fill: COLORS.success || '#00FF00',
      align: 'center',
    });
    victoryText.setOrigin(0.5);
    victoryText.setDepth(200);

    this.time.delayedCall(2000, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.WALK_AROUND_JERICHO,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    this.gameData.lost = true;
    this.gameData.isWalking = false;

    // Display loss message
    const lossText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Keep marching!', {
      font: `${FONTS.large || '28px'} Arial`,
      fill: COLORS.error || '#FF0000',
      align: 'center',
    });
    lossText.setOrigin(0.5);
    lossText.setDepth(200);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.WALK_AROUND_JERICHO,
        points: 0,
      });
    });
  }

  update(time, delta) {
    if (this.gameData.won || this.gameData.lost) return;

    // Handle stun timer
    if (this.gameData.isStunned) {
      this.gameData.stunTimeRemaining -= delta / 1000;
      if (this.gameData.stunTimeRemaining <= 0) {
        this.gameData.isStunned = false;
      }
    }

    // Auto-walk on easy mode
    if (this.config.autoWalk && this.gameData.isWalking && !this.gameData.isStunned) {
      const autoWalkSpeed = this.totalPathLength / (this.config.timeLimit * 1000); // Complete lap per time window
      this.advanceWalker(autoWalkSpeed * delta);
    }

    // Draw elements
    this.drawWall();
    this.drawPath();
    this.drawWalker();
    this.drawObstacles();

    // Update HUD every frame (for timer)
    this.drawHUD();
  }
}
