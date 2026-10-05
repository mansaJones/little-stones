// ============================================
// RESULT SCENE - Session end stats
// Landscape layout: 667x375
// ============================================

class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const data = loadGameData();

    // Background
    this.drawGradientBG(0x1a1a2e, 0x0f0c29);

    // Header
    this.add.text(cx, 28, '🏆 SESSION COMPLETE! 🏆', {
      ...FONTS.TITLE,
      fontSize: '20px',
      color: '#FFD93D',
    }).setOrigin(0.5);

    // --- Two-column layout ---
    // Left: stats panel | Right: score + progress

    // Left panel — stats
    const panelX = 20;
    const panelY = 55;
    const panelW = 310;
    const panelH = 210;
    const g = this.add.graphics();
    g.fillStyle(0x2C3E50, 0.7);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 12);

    const stats = [
      { label: 'Games Played', value: session.gamesPlayed.length.toString(), icon: '🎮' },
      { label: 'Win Rate', value: `${session.getWinRate()}%`, icon: '📈' },
      { label: 'Best Combo', value: `${session.bestCombo} wins`, icon: '🔥' },
      { label: 'Points Earned', value: `+${session.score.toLocaleString()}`, icon: '⭐' },
    ];

    stats.forEach((stat, i) => {
      const sy = panelY + 18 + i * 47;
      this.add.text(panelX + 15, sy, stat.icon, { fontSize: '20px' });
      this.add.text(panelX + 45, sy + 2, stat.label, { ...FONTS.SMALL, color: '#ffffff88' });
      this.add.text(panelX + panelW - 15, sy + 2, stat.value, {
        ...FONTS.SMALL,
        fontStyle: 'bold',
        color: '#FFD93D',
      }).setOrigin(1, 0);
    });

    // Right column — total score box
    const rightX = 350;
    const scoreBoxY = panelY;
    const sg = this.add.graphics();
    sg.fillStyle(COLORS.DEEP_PURPLE, 0.5);
    sg.fillRoundedRect(rightX, scoreBoxY, 297, 65, 10);

    this.add.text(rightX + 148, scoreBoxY + 12, 'Total Score', {
      ...FONTS.SMALL, color: '#ffffff88',
    }).setOrigin(0.5);
    this.add.text(rightX + 148, scoreBoxY + 40, data.totalScore.toLocaleString(), {
      ...FONTS.SCORE, fontSize: '22px',
    }).setOrigin(0.5);

    // Right column — progress to next level
    const progressY = scoreBoxY + 80;
    const nextLevel = data.currentLevel + 1;
    const levelThresholds = [0, 1000, 2500, 5000, 8000, 12000, 17000, 23000, 30000, 40000];
    const currentThreshold = levelThresholds[data.currentLevel] || 40000;
    const prevThreshold = levelThresholds[data.currentLevel - 1] || 0;
    const progress = Math.min(1, (data.totalScore - prevThreshold) / (currentThreshold - prevThreshold));

    if (data.currentLevel < 10) {
      this.add.text(rightX + 148, progressY, `Progress to Level ${nextLevel}`, {
        ...FONTS.SMALL, color: '#ffffff88',
      }).setOrigin(0.5);

      const barW = 240;
      const barH = 12;
      const barX = rightX + 148 - barW / 2;
      const barBG = this.add.graphics();
      barBG.fillStyle(0x333333, 1);
      barBG.fillRoundedRect(barX, progressY + 16, barW, barH, 6);

      const barFill = this.add.graphics();
      barFill.fillStyle(COLORS.GRASS_GREEN, 1);
      barFill.fillRoundedRect(barX, progressY + 16, barW * progress, barH, 6);

      this.add.text(rightX + 148, progressY + 38, `${Math.round(progress * 100)}% — Need ${(currentThreshold - data.totalScore).toLocaleString()} more`, {
        ...FONTS.SMALL, color: '#6BCF7F', fontSize: '11px',
      }).setOrigin(0.5);

      if (data.totalScore >= currentThreshold && data.currentLevel < 10) {
        data.currentLevel++;
        data.unlockedLevels.push(data.currentLevel);
        saveGameData(data);

        const levelUp = this.add.text(rightX + 148, progressY + 60, `🎉 LEVEL UP! Now Level ${data.currentLevel}!`, {
          ...FONTS.COMBO, fontSize: '16px', color: '#FFD93D',
        }).setOrigin(0.5);
        this.tweens.add({
          targets: levelUp,
          scaleX: 1.15, scaleY: 1.15,
          duration: 400,
          yoyo: true,
          repeat: 3,
        });
      }
    }

    // Buttons — bottom center
    const btnY = GAME_HEIGHT - 50;
    const playBtn = this.add.image(cx - 90, btnY, 'btn-small')
      .setInteractive({ useHandCursor: true });
    this.add.text(cx - 90, btnY, 'PLAY AGAIN', {
      ...FONTS.SMALL, fontStyle: 'bold',
    }).setOrigin(0.5);

    const homeBtn = this.add.image(cx + 90, btnY, 'btn-secondary')
      .setDisplaySize(140, 45)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx + 90, btnY, 'HOME', {
      ...FONTS.SMALL, fontStyle: 'bold',
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      session.reset();
      const gameKey = session.getRandomGame();
      this.scene.start('StoryScene', { gameKey });
    });

    homeBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Fade in
    this.cameras.main.fadeIn(500);
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
