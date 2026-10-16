// ============================================
// STORY SCENE - Pre-game biblical context. Advances on the button, never on a timer.
// ============================================

class StoryScene extends Phaser.Scene {
  constructor() {
    super('StoryScene');
  }

  // init and preload both receive the same data object create does. The backdrop has to be queued
  // in preload, which does not take an argument, so the key is stashed here first.
  init(data) {
    this.gameKey = data.gameKey;
    this.isFirstGame = data.isFirstGame || false;
  }

  preload() {
    queueGameBackdrop(this, this.gameKey);
  }

  create(data) {
    const story = GAME_STORIES[this.gameKey];

    // The mini-game's own level art, behind a dark wash. Falls back to the original gradient for
    // the games that have no plate.
    if (!drawGameBackdrop(this, this.gameKey)) this.drawGradientBG(0x0f0c29, 0x302b63);

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
      [GAME_KEYS.LOST_SHEEP]: '🐑',
      [GAME_KEYS.SAMSON_JAWBONE]: '💪',
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
    this.drawProgressDots(GAME_WIDTH / 2, GAME_HEIGHT - 80, 0);

    // Nothing moves until the button is pressed.
    //
    // This page used to advance itself after 3000ms, with a tap anywhere to skip. Both halves were
    // wrong for the audience: a six-year-old reading "Jacob gave his son Joseph a beautiful coat
    // of many colors" does not finish it in three seconds, and a child resting a thumb on the
    // screen skipped the story without ever knowing it was there. The timer bar, the countdown and
    // the "Tap to skip" hint are all gone with it.
    const btnY = GAME_HEIGHT - 30;
    const btn = this.add.image(GAME_WIDTH / 2, btnY, 'btn-play')
      .setDisplaySize(210, 46)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, btnY, 'HOW TO PLAY  \u25B6', {
      ...FONTS.BUTTON, fontSize: '16px',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => this.advance());
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
      // Spans the CANVAS, not the stage, so there is no unpainted bleed around it.
      g.fillRect(-STAGE_X, -STAGE_Y + (CANVAS_HEIGHT / steps) * i,
                 CANVAS_WIDTH, CANVAS_HEIGHT / steps + 1);
    }
  }
}
