// ============================================
// ROLL THE STONE AWAY - Drag the boulder to open the tomb
// Luke 24:2  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// ============================================

// Art plates live in assets/games/roll-the-stone/ (see tools/key_sprites.py).
//   bg.jpg     — the tomb plate, pre-cropped to 16:9, 2x stage resolution
//   stone.png  — the boulder, keyed off magenta, 0.5x of its 2048 source
//   jesus.png  — Jesus, keyed off magenta, 1.0x of its 1024 source
const RTS_ASSET_PATH = 'assets/games/roll-the-stone/';
const RTS_ASSETS = {
  bg:    { key: 'rts-bg',    file: 'bg.jpg' },
  stone: { key: 'rts-stone', file: 'stone.png' },
  jesus: { key: 'rts-jesus', file: 'jesus.png' },
};

class RollTheStoneGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.ROLL_THE_STONE);
  }

  preload() {
    // Textures persist in the global TextureManager, so only fetch on first visit.
    Object.values(RTS_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, RTS_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;
    this.gameActive = false;
    this.isDragging = false;
    this.timeRemaining = this.config.timeLimit;
    this.obstacles = [];
    this.obstacleHits = 0;
    this.maxObstacleHits = 3;

    // ---- Layout constants — measured off bg.jpg (the dark doorway opening) ----
    this.ARCH_CX = 334;                                      // doorway centre x
    this.ARCH_HW = 40;                                       // opening half-width
    this.ARCH_TOP = 151;                                     // top of the arch opening
    this.CURVE_Y = 190;                                      // where the arch curve begins
    this.THRESHOLD_Y = 263;                                  // bottom of the opening / top step
    this.BOULDER_R = 62;                                     // big enough to cover the opening
    this.BOULDER_CY = (this.ARCH_TOP + this.THRESHOLD_Y) / 2;

    // Stone travel
    this.stoneStartX = this.ARCH_CX + 5;
    this.maxTravel = 180;
    this.targetDistance = this.maxTravel * (this.config.targetPercent / 100);

    // Jesus' walk-out (win beat): inside the dark doorway -> threshold -> down the steps
    // to the path. Heights are on-stage pixel heights, so perspective is just scale.
    this.WALK = {
      insideY: this.THRESHOLD_Y - 14, hInside: 62,          // deep in the doorway, small + dim
      doorY:   this.THRESHOLD_Y + 2,  hDoor:   96,          // crossing the threshold
      stopY:   335,                   hEnd:    140,         // stops centred on the path
      durationMs: 2000, steps: 7,
    };

    // ---- Scene, back-to-front ----
    this.add.image(0, 0, RTS_ASSETS.bg.key).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    // Tomb light layer (inside the doorway, behind the stone)
    this.tombLightGfx = this.add.graphics().setDepth(2);
    this.updateTombLight(0);

    // Boulder — the sprite is roughly circular; 4% over so the wobbly rim still covers the arch
    const d = this.BOULDER_R * 2 * 1.04;
    this.boulder = this.add.image(this.stoneStartX, this.BOULDER_CY, RTS_ASSETS.stone.key)
      .setDisplaySize(d, d).setDepth(8);

    // HUD on top
    this.drawHUD();

    this.time.delayedCall(300, () => this.startGame());
  }

  // ================================================================
  //  TOMB LIGHT
  // ================================================================

  updateTombLight(progress) {
    this.tombLightGfx.clear();
    if (progress <= 0) return;

    const cx = this.ARCH_CX;
    const mid = this.BOULDER_CY;
    const hw = this.ARCH_HW;
    const a = 0.15 + progress * 0.55;

    // Outer glow
    this.tombLightGfx.fillStyle(0xFFE8A0, a * 0.35);
    this.tombLightGfx.fillCircle(cx, mid, hw * 1.15);
    // Mid glow
    this.tombLightGfx.fillStyle(0xFFD060, a * 0.55);
    this.tombLightGfx.fillCircle(cx, mid, hw * 0.65);
    // Core
    this.tombLightGfx.fillStyle(0xFFF0C0, a);
    this.tombLightGfx.fillCircle(cx, mid, hw * 0.28);

    // Light rays spilling left (visible as stone moves)
    if (progress > 0.25) {
      const ra = (progress - 0.25) * 0.35;
      this.tombLightGfx.fillStyle(0xFFE8A0, ra);
      this.tombLightGfx.fillTriangle(
        cx - 8, mid - 25,
        cx - hw * 2.2 * progress, this.ARCH_TOP - 10,
        cx - 8, mid + 25
      );
    }
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

    if (this.config.obstacles) {
      this.obstacleText = this.add.text(GAME_WIDTH - 18, GAME_HEIGHT - 18, 'Hits: 0/3', {
        ...FONTS.SMALL, color: '#E74C3C', fontSize: '11px',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(1, 1).setDepth(51);
    }
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
    this.progressBar.fillStyle(0x6BCF7F, 1);
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

    if (this.config.obstacles) this.spawnObstacles();

    // Brief instruction hint
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18,
      '← Drag the stone to roll it away', {
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
    const dx = pointer.x - this.boulder.x;
    const dy = pointer.y - this.boulder.y;
    if (Math.sqrt(dx * dx + dy * dy) <= this.BOULDER_R + 22) {
      this.isDragging = true;
      this.dragStartPX = pointer.x;
      this.dragStartBX = this.boulder.x;
    }
  }

  onPointerMove(pointer) {
    if (!this.gameActive || !this.isDragging) return;

    const rawDelta = pointer.x - this.dragStartPX;
    const delta = Math.min(0, rawDelta); // leftward only
    const weightedDelta = delta * (1 - this.config.weight);

    let newX = this.dragStartBX + weightedDelta;
    newX = Phaser.Math.Clamp(newX, this.stoneStartX - this.maxTravel, this.stoneStartX);
    this.boulder.x = newX;

    // Rolling rotation
    const dist = this.stoneStartX - newX;
    this.boulder.rotation = -(dist / this.BOULDER_R);

    // Progress
    const progress = Math.min(1, dist / this.targetDistance);
    this.updateProgressBar(progress * 100);
    this.updateTombLight(progress);

    if (progress >= 1) this.handleWin();
  }

  onPointerUp() { this.isDragging = false; }

  updateTimer() {
    if (!this.gameActive) return;
    const elapsed = this.elapsedSeconds();
    this.timeRemaining = Math.max(0, this.config.timeLimit - elapsed);
    this.timerText.setText(this.timeRemaining.toFixed(1) + 's');
    if (this.timeRemaining < 2) this.timerText.setColor('#FF4757');
    else if (this.timeRemaining < 4) this.timerText.setColor('#FFD93D');
  }

  // ---- Hard-mode obstacles ----

  spawnObstacles() {
    this.obstacleSpawnEvent = this.time.addEvent({
      delay: 1500,
      callback: () => {
        if (!this.gameActive) return;
        const x = Phaser.Math.Between(80, GAME_WIDTH - 80);
        const g = this.add.graphics().setDepth(10);
        this.obstacles.push({ x, y: -15, graphic: g });
      },
      loop: true,
    });
    this.obstacleUpdateEvent = this.time.addEvent({
      delay: 30,
      callback: () => {
        if (!this.gameActive) return;
        this.obstacles = this.obstacles.filter(obs => {
          obs.y += 3.5;
          obs.graphic.clear();
          obs.graphic.fillStyle(0x6B6060, 1);
          obs.graphic.fillCircle(obs.x, obs.y, 12);
          obs.graphic.lineStyle(2, 0x1A1A1A, 0.55);
          obs.graphic.strokeCircle(obs.x, obs.y, 12);

          const dx = obs.x - this.boulder.x;
          const dy = obs.y - this.boulder.y;
          if (Math.sqrt(dx * dx + dy * dy) < this.BOULDER_R + 12) {
            this.obstacleHits++;
            this.obstacleText.setText(`Hits: ${this.obstacleHits}/3`);
            obs.graphic.destroy();
            this.cameras.main.shake(100, 0.008);
            if (this.obstacleHits >= this.maxObstacleHits) this.handleObstacleLoss();
            return false;
          }
          if (obs.y > GAME_HEIGHT + 20) { obs.graphic.destroy(); return false; }
          return true;
        });
      },
      loop: true,
    });
  }

  // ================================================================
  //  END STATES
  // ================================================================

  _cleanup() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.timeoutEvent) this.timeoutEvent.remove();
    if (this.obstacleSpawnEvent) this.obstacleSpawnEvent.remove();
    if (this.obstacleUpdateEvent) this.obstacleUpdateEvent.remove();
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
  }

  handleWin() {
    this.gameActive = false;
    this.isDragging = false;
    const elapsed = this.elapsedSeconds();
    this._cleanup();

    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // Light bursts out of the open tomb
    this.updateTombLight(1);
    const flash = this.add.graphics().setDepth(60).setAlpha(0);
    flash.fillStyle(0xFFE8A0, 1);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({
      targets: flash, alpha: 0.45, duration: 350, yoyo: true, hold: 120,
      onComplete: () => flash.destroy(),
    });

    // He walks out; the result screen waits for him
    this.time.delayedCall(350, () => this.walkOut(() => {
      const risen = this.add.text(GAME_WIDTH / 2, 84, 'He is risen!', {
        ...FONTS.TITLE, color: '#FFD700', fontSize: '34px',
        stroke: '#5A3E1B', strokeThickness: 6,
      }).setOrigin(0.5).setAlpha(0).setScale(0.6).setDepth(61);
      this.tweens.add({
        targets: risen, alpha: 1, scaleX: 1, scaleY: 1,
        duration: 450, ease: 'Back.easeOut',
      });

      this.time.delayedCall(1300, () => {
        this.scene.start('GameLoopScene', {
          result: 'WIN', gameKey: GAME_KEYS.ROLL_THE_STONE, points, timeElapsed: elapsed,
        });
      });
    }));
  }

  // Jesus emerges from the dark doorway, comes down the steps and stops on the path.
  // One normalised tween drives position, size (perspective), brightness and a step bob.
  walkOut(onDone) {
    const W = this.WALK;
    const jesus = this.add.image(this.ARCH_CX, W.insideY, RTS_ASSETS.jesus.key)
      .setOrigin(0.5, 1).setDepth(4).setAlpha(0);
    this.jesus = jesus;
    const texH = jesus.height;                        // unscaled texture height
    const DARK = { r: 0x4A, g: 0x4A, b: 0x66 };       // tint while inside the tomb
    const lerp = (a, b, u) => a + (b - a) * u;

    const apply = (t) => {
      let y, h;
      if (t < 0.4) {                                  // inside -> threshold
        const u = t / 0.4;
        y = lerp(W.insideY, W.doorY, u);
        h = lerp(W.hInside, W.hDoor, u);
      } else {                                        // threshold -> down the steps -> path
        const u = (t - 0.4) / 0.6;
        y = lerp(W.doorY, W.stopY, u);
        h = lerp(W.hDoor, W.hEnd, u);
      }
      const bob = Math.abs(Math.sin(t * Math.PI * W.steps)) * 3;
      jesus.y = y - bob;
      jesus.setScale(h / texH);
      jesus.rotation = Math.sin(t * Math.PI * W.steps) * 0.035;

      // fully lit by the time he reaches the threshold
      const k = Math.min(1, t / 0.4);
      const r = Math.round(lerp(DARK.r, 255, k));
      const g = Math.round(lerp(DARK.g, 255, k));
      const b = Math.round(lerp(DARK.b, 255, k));
      jesus.setTint((r << 16) | (g << 8) | b);
    };

    apply(0);
    this.tweens.add({ targets: jesus, alpha: 1, duration: 300 });

    const walk = { t: 0 };
    this.tweens.add({
      targets: walk, t: 1, duration: W.durationMs, delay: 200, ease: 'Linear',
      onUpdate: () => apply(walk.t),
      onComplete: () => {
        jesus.y = W.stopY;
        jesus.rotation = 0;
        jesus.setScale(W.hEnd / texH);
        jesus.clearTint();
        if (onDone) onDone();
      },
    });
  }

  handleObstacleLoss() {
    this.gameActive = false;
    this._cleanup();
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Stone broke!', {
      ...FONTS.TITLE, color: '#E74C3C', stroke: '#4A1414', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(60);
    this.cameras.main.shake(200, 0.02);
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS', gameKey: GAME_KEYS.ROLL_THE_STONE, points: 0,
      });
    });
  }

  handleLoss() {
    this.gameActive = false;
    this._cleanup();
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Time\'s up!', {
      ...FONTS.TITLE, color: '#E74C3C', stroke: '#4A1414', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(60);
    this.cameras.main.shake(200, 0.02);
    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS', gameKey: GAME_KEYS.ROLL_THE_STONE, points: 0,
      });
    });
  }
}
