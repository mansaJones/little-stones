// ============================================
// GAME LOOP SCENE - Handles transitions between mini-games
// Landscape layout: 667x375
// ============================================

class GameLoopScene extends Phaser.Scene {
  constructor() {
    super('GameLoopScene');
  }

  create(data) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const result = data.result; // 'WIN' or 'LOSS'
    const gameKey = data.gameKey;
    const points = data.points || 0;
    const story = GAME_STORIES[gameKey];

    // Background
    this.add.graphics()
      .fillStyle(result === 'WIN' ? 0x0a2a0a : 0x2a0a0a, 1)
      .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (result === 'WIN') {
      // --- WIN --- Two-column: left = visuals, right = info
      session.recordWin(gameKey, points);
      updateGameStats(gameKey, true, data.timeElapsed);

      // Left column — emoji + title
      const leftX = 170;
      this.add.text(leftX, 80, '✨', { fontSize: '60px' }).setOrigin(0.5);
      this.add.text(leftX, 150, 'Great Job!', {
        ...FONTS.TITLE, color: '#2ECC71',
      }).setOrigin(0.5);

      this.add.text(leftX, 195, story.successMessage, {
        ...FONTS.STORY,
        color: '#ffffff',
        wordWrap: { width: 260 },
        align: 'center',
        fontSize: '13px',
      }).setOrigin(0.5, 0);

      // Right column — points + combo
      const rightX = 480;
      this.add.text(rightX, 100, `+${points}`, {
        ...FONTS.SCORE, fontSize: '42px',
      }).setOrigin(0.5);
      this.add.text(rightX, 145, 'Points!', {
        ...FONTS.SUBTITLE, color: '#FFD700',
      }).setOrigin(0.5);

      if (session.combo >= 3) {
        const comboText = this.add.text(rightX, 190, `🔥 COMBO x${session.combo}!`, FONTS.COMBO).setOrigin(0.5);
        this.tweens.add({
          targets: comboText,
          scaleX: 1.2, scaleY: 1.2,
          duration: 300,
          yoyo: true,
          repeat: 2,
        });
      }

      // Particle celebration
      for (let i = 0; i < 15; i++) {
        const star = this.add.image(
          Phaser.Math.Between(20, GAME_WIDTH - 20),
          Phaser.Math.Between(20, 120),
          'star'
        ).setAlpha(0).setScale(Phaser.Math.FloatBetween(0.3, 1));

        this.tweens.add({
          targets: star,
          alpha: 1,
          y: star.y + Phaser.Math.Between(30, 80),
          duration: Phaser.Math.Between(500, 1500),
          delay: Phaser.Math.Between(0, 500),
          onComplete: () => {
            this.tweens.add({ targets: star, alpha: 0, duration: 300 });
          },
        });
      }

    } else {
      // --- LOSS --- Two-column: left = visuals, right = lives
      session.recordLoss(gameKey);
      updateGameStats(gameKey, false);

      const leftX = 170;
      this.add.text(leftX, 80, '😔', { fontSize: '60px' }).setOrigin(0.5);
      this.add.text(leftX, 150, 'Almost!', {
        ...FONTS.TITLE, color: '#E74C3C',
      }).setOrigin(0.5);

      this.add.text(leftX, 190, story.failMessage, {
        ...FONTS.STORY,
        wordWrap: { width: 260 },
        align: 'center',
        fontSize: '13px',
      }).setOrigin(0.5, 0);

      // Right column — lives remaining
      const rightX = 480;
      this.add.text(rightX, 100, 'Lives Remaining:', {
        ...FONTS.SMALL, color: '#ffffff88',
      }).setOrigin(0.5);

      for (let i = 0; i < 3; i++) {
        this.add.image(rightX - 40 + i * 40, 135, i < session.lives ? 'heart-full' : 'heart-empty')
          .setScale(1.5);
      }

      if (session.consecutiveLosses >= 2) {
        this.add.text(rightX, 185, "You've got this!\nKeep trying!", {
          ...FONTS.BODY, color: '#FFD93D', align: 'center',
        }).setOrigin(0.5);
      }
    }

    // --- Continue / End Logic --- bottom strip
    const btnY = GAME_HEIGHT - 55;

    if (adminMode) {
      // Admin/test mode — always return to game picker
      const pickBtn = this.add.image(cx, btnY, 'btn-play').setInteractive({ useHandCursor: true });
      this.add.text(cx, btnY, 'PICK ANOTHER ▶', FONTS.BUTTON).setOrigin(0.5);

      pickBtn.on('pointerdown', () => {
        this.cameras.main.fade(200, 0, 0, 0);
        this.time.delayedCall(200, () => {
          this.scene.start('GamePickerScene');
        });
      });

      this.add.text(cx, btnY + 30, 'ADMIN MODE — returning to game picker', {
        ...FONTS.SMALL, color: '#FF9F4388',
      }).setOrigin(0.5);

    } else if (session.isSessionOver()) {
      this.add.text(cx, btnY - 25, 'No lives left!', {
        ...FONTS.BODY, color: '#E74C3C',
      }).setOrigin(0.5);

      const endBtn = this.add.image(cx, btnY + 10, 'btn-play').setInteractive({ useHandCursor: true });
      this.add.text(cx, btnY + 10, 'VIEW RESULTS', FONTS.BUTTON).setOrigin(0.5);
      endBtn.on('pointerdown', () => this.endSession());

    } else {
      const contBtn = this.add.image(cx, btnY, 'btn-play').setInteractive({ useHandCursor: true });
      this.add.text(cx, btnY, 'CONTINUE ▶', FONTS.BUTTON).setOrigin(0.5);

      contBtn.on('pointerdown', () => {
        this.cameras.main.fade(200, 0, 0, 0);
        this.time.delayedCall(200, () => {
          const nextGame = session.getRandomGame();
          this.scene.start('StoryScene', { gameKey: nextGame });
        });
      });

      this.add.text(cx, btnY + 30, `Game ${session.gamesPlayed.length} of 20  |  Score: ${session.score}`, {
        ...FONTS.SMALL, color: '#ffffff55',
      }).setOrigin(0.5);

      if (session.gamesPlayed.length >= 20) {
        this.time.delayedCall(500, () => this.endSession());
      }
    }

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  endSession() {
    const data = loadGameData();
    data.totalScore += session.score;
    if (session.bestCombo > data.stats.bestCombo) {
      data.stats.bestCombo = session.bestCombo;
    }
    saveGameData(data);

    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('ResultScene');
    });
  }
}
