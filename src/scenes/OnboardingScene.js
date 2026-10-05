// ============================================
// ONBOARDING SCENE - First launch experience
// ============================================

class OnboardingScene extends Phaser.Scene {
  constructor() {
    super('OnboardingScene');
  }

  create() {
    const cx = GAME_WIDTH / 2;

    // Gradient background
    this.drawGradientBG(COLORS.DEEP_PURPLE, COLORS.SKY_BLUE);

    // Title - TOP CENTER
    this.add.text(cx, 30, '✨ Bible Adventures ✨', {
      ...FONTS.TITLE,
      fontSize: '26px',
    }).setOrigin(0.5);

    // Subtitle - TOP CENTER
    this.add.text(cx, 55, 'Learn & Play with Scripture', {
      ...FONTS.SUBTITLE,
      color: '#FFD93D',
    }).setOrigin(0.5);

    // Animated icons in horizontal row - MIDDLE
    const icons = ['📖', '⭐', '🕊️', '🌟', '🙏'];
    const iconStartX = (GAME_WIDTH - icons.length * 70 + 70) / 2; // Center the row
    icons.forEach((icon, i) => {
      const t = this.add.text(iconStartX + i * 70, 140, icon, { fontSize: '40px' }).setOrigin(0.5);
      this.tweens.add({
        targets: t,
        y: 125,
        duration: 800 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Instructions - BELOW ICONS
    this.add.text(cx, 210, 'Tap, swipe, and match\nyour way through\nBible stories!', {
      ...FONTS.BODY,
      fontSize: '18px',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Play button - BOTTOM CENTER
    const btn = this.add.image(cx, 290, 'btn-play').setInteractive({ useHandCursor: true });
    const btnText = this.add.text(cx, 290, '▶  START PLAYING', FONTS.BUTTON).setOrigin(0.5);

    // Pulse animation on button
    this.tweens.add({
      targets: [btn, btnText],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    btn.on('pointerdown', () => {
      // Mark first launch done
      const data = loadGameData();
      data.firstLaunch = false;
      saveGameData(data);

      // Start first session directly — first game is always Let There Be Light
      session.reset();
      this.scene.start('StoryScene', {
        gameKey: GAME_KEYS.LET_THERE_BE_LIGHT,
        isFirstGame: true,
      });
    });

    // Version text - VERY BOTTOM
    this.add.text(cx, 360, 'v1.0.0-prototype', {
      ...FONTS.SMALL,
      color: '#ffffff44',
    }).setOrigin(0.5);
  }

  drawGradientBG(colorTop, colorBottom) {
    const g = this.add.graphics();
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Phaser.Math.Interpolation.Linear([(colorTop >> 16) & 0xFF, (colorBottom >> 16) & 0xFF], ratio);
      const gv = Phaser.Math.Interpolation.Linear([(colorTop >> 8) & 0xFF, (colorBottom >> 8) & 0xFF], ratio);
      const b = Phaser.Math.Interpolation.Linear([colorTop & 0xFF, colorBottom & 0xFF], ratio);
      g.fillStyle(Phaser.Display.Color.GetColor(Math.round(r), Math.round(gv), Math.round(b)));
      const y = (GAME_HEIGHT / steps) * i;
      g.fillRect(0, y, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }
  }
}
