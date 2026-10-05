// ============================================
// MENU SCENE - Home screen
// ============================================

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // ---- Background image (fills the whole canvas) ----
    const bg = this.add.image(cx, cy, 'menu-bg');
    bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // ---- Title: "Little Stones" above the characters' heads ----
    // Characters are roughly centered; title sits above them
    const titleY = 42;

    // Text shadow / outline effect
    const shadowStyle = {
      fontFamily: 'Arial Black, Arial',
      fontSize: '38px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    };
    const titleStyle = {
      fontFamily: 'Arial Black, Arial',
      fontSize: '38px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#1A1A1A',
      strokeThickness: 5,
      shadow: {
        offsetX: 2,
        offsetY: 3,
        color: '#00000066',
        blur: 6,
        fill: true,
      },
    };

    this.add.text(cx, titleY, 'Little Stones', titleStyle).setOrigin(0.5);

    // ---- Two buttons: Play (bottom-left) and Levels (bottom-right) ----
    const btnY = GAME_HEIGHT - 52;
    const btnPadding = 90; // distance from edge to button center

    // Both buttons use 'btn-play' texture (orange rounded rect)
    // Play button — bottom-left
    const playBtn = this.add.image(btnPadding, btnY, 'btn-play')
      .setScale(1.1)
      .setInteractive({ useHandCursor: true });
    const playLabel = this.add.text(btnPadding, btnY, '▶  PLAY', {
      ...FONTS.BUTTON,
      fontSize: '18px',
    }).setOrigin(0.5);

    // Levels button — bottom-right
    const levelsBtn = this.add.image(GAME_WIDTH - btnPadding, btnY, 'btn-play')
      .setScale(1.1)
      .setInteractive({ useHandCursor: true });
    const levelsLabel = this.add.text(GAME_WIDTH - btnPadding, btnY, '🎯  LEVELS', {
      ...FONTS.BUTTON,
      fontSize: '18px',
    }).setOrigin(0.5);

    // ---- Button hover/press effects ----
    [playBtn, levelsBtn].forEach((btn) => {
      btn.on('pointerover', () => btn.setScale(1.15));
      btn.on('pointerout', () => btn.setScale(1.1));
    });

    // ---- Gentle pulse on both buttons ----
    this.tweens.add({
      targets: [playBtn, playLabel],
      scaleX: '+=0.03',
      scaleY: '+=0.03',
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: [levelsBtn, levelsLabel],
      scaleX: '+=0.03',
      scaleY: '+=0.03',
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400, // offset so they don't pulse in sync
    });

    // ---- Play button action ----
    playBtn.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        session.reset();
        this.startNextGame();
      });
    });

    // ---- Levels button action ----
    levelsBtn.on('pointerdown', () => {
      adminMode = true;
      this.cameras.main.fade(200, 0, 0, 0);
      this.time.delayedCall(200, () => {
        this.scene.start('GamePickerScene');
      });
    });

    // Fade in
    this.cameras.main.fadeIn(400);
  }

  startNextGame() {
    const gameKey = session.getRandomGame();
    this.scene.start('StoryScene', { gameKey });
  }
}
