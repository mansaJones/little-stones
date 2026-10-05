// ============================================
// STORY SCENE - Pre-game biblical context (3 seconds)
// ============================================

class StoryScene extends Phaser.Scene {
  constructor() {
    super('StoryScene');
  }

  create(data) {
    this.gameKey = data.gameKey;
    this.isFirstGame = data.isFirstGame || false;
    const story = GAME_STORIES[this.gameKey];

    // Dark gradient background
    this.drawGradientBG(0x0f0c29, 0x302b63);

    // LEFT SIDE (~40% width, ~267px): Glowing orb + story icon (centered vertically)
    const leftCx = GAME_WIDTH * 0.2;
    const verticalCenter = GAME_HEIGHT / 2;

    // Scene illustration placeholder (glowing orb)
    const orb = this.add.graphics();
    orb.fillStyle(COLORS.GOLD, 0.3);
    orb.fillCircle(leftCx, verticalCenter, 50);
    orb.fillStyle(COLORS.GOLD, 0.15);
    orb.fillCircle(leftCx, verticalCenter, 75);

    // Pulsing glow
    this.tweens.add({
      targets: orb,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Story icon
    const icons = {
      [GAME_KEYS.LET_THERE_BE_LIGHT]: '💡',
      [GAME_KEYS.NOAHS_ARK]: '🚢',
      [GAME_KEYS.TOWER_OF_BABEL]: '🏗️',
      [GAME_KEYS.WRESTLE_THE_ANGEL]: '👼',
      [GAME_KEYS.WATER_TO_WINE]: '🍷',
      [GAME_KEYS.ROLL_THE_STONE]: '🪨',
      [GAME_KEYS.DANIEL_LIONS_DEN]: '🦁',
      [GAME_KEYS.FIERY_FURNACE]: '🔥',
      [GAME_KEYS.HOUSE_ON_ROCK]: '🏠',
      [GAME_KEYS.DAVID_VS_GOLIATH]: '🎯',
      [GAME_KEYS.WALK_AROUND_JERICHO]: '🏰',
      [GAME_KEYS.HE_MUST_INCREASE]: '⬆️',
    };
    this.add.text(leftCx, verticalCenter, icons[this.gameKey] || '📖', {
      fontSize: '40px',
    }).setOrigin(0.5);

    // RIGHT SIDE (~60% width, ~400px): Title, story text, bible reference (stacked vertically)
    const rightStartX = GAME_WIDTH * 0.4;
    const rightWidth = GAME_WIDTH * 0.6 - 10; // Leave 10px margin
    const textStartY = 20;
    const spacing = 65;

    // Title
    this.add.text(rightStartX + rightWidth / 2, textStartY, `"${story.title}"`, {
      ...FONTS.TITLE,
      fontSize: '18px',
      color: '#FFD93D',
      wordWrap: { width: rightWidth - 10 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // Story text
    this.add.text(rightStartX + rightWidth / 2, textStartY + spacing, story.story, {
      ...FONTS.STORY,
      fontSize: '12px',
      wordWrap: { width: rightWidth - 10 },
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    // Bible reference
    this.add.text(rightStartX + rightWidth / 2, textStartY + spacing + 90, story.reference, {
      ...FONTS.VERSE,
      fontSize: '11px',
      wordWrap: { width: rightWidth - 10 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // Progress dots (BOTTOM CENTER)
    const bottomY = GAME_HEIGHT - 55;
    this.drawProgressDots(GAME_WIDTH / 2, bottomY, 0);

    // Auto-advance timer bar (bottom center, above progress dots)
    const timerBarY = GAME_HEIGHT - 35;
    const barW = 150;
    const timerBar = this.add.graphics();
    timerBar.fillStyle(0xffffff, 0.15);
    timerBar.fillRoundedRect(GAME_WIDTH / 2 - barW / 2, timerBarY, barW, 5, 2);

    const fill = this.add.graphics();
    const duration = 3000;

    this.tweens.addCounter({
      from: 0,
      to: barW,
      duration: duration,
      onUpdate: (tween) => {
        fill.clear();
        fill.fillStyle(COLORS.GOLD, 0.8);
        fill.fillRoundedRect(GAME_WIDTH / 2 - barW / 2, timerBarY, tween.getValue(), 5, 2);
      },
    });

    // Tap to skip hint (very bottom)
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'Tap to skip', {
      ...FONTS.SMALL,
      fontSize: '9px',
      color: '#ffffff44',
    }).setOrigin(0.5, 1);

    // Auto-advance or tap to skip
    this.advanceTimer = this.time.delayedCall(duration, () => {
      this.advance();
    });

    this.input.once('pointerdown', () => {
      if (this.advanceTimer) this.advanceTimer.remove();
      this.advance();
    });
  }

  advance() {
    this.cameras.main.fade(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start('InstructionScene', {
        gameKey: this.gameKey,
        isFirstGame: this.isFirstGame,
      });
    });
  }

  drawProgressDots(x, y, active) {
    const labels = ['Story', 'How to Play', 'Go!'];
    labels.forEach((label, i) => {
      const dx = x - 65 + i * 65;
      const isActive = i === active;
      const g = this.add.graphics();
      g.fillStyle(isActive ? COLORS.GOLD : 0xffffff, isActive ? 1 : 0.3);
      g.fillCircle(dx, y, isActive ? 5 : 3);
      this.add.text(dx, y + 12, label, {
        ...FONTS.SMALL,
        fontSize: '9px',
        color: isActive ? '#FFD700' : '#ffffff44',
      }).setOrigin(0.5);
    });
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
