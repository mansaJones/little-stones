// ============================================
// GAME PICKER SCENE - Dev/test: pick any mini-game
// Landscape layout: 667x375
// ============================================

class GamePickerScene extends Phaser.Scene {
  constructor() {
    super('GamePickerScene');
  }

  create() {
    // Background
    this.drawGradientBG(0x1a1a2e, 0x16213e);

    // Header
    this.add.text(GAME_WIDTH / 2, 22, '🎯 Pick a Mini-Game', {
      ...FONTS.TITLE,
      fontSize: '20px',
      color: '#FFD93D',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(30, 22, '← Back', {
      ...FONTS.SMALL,
      fontSize: '12px',
      color: '#ffffff88',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      adminMode = false;
      this.scene.start('MenuScene');
    });

    // Game list — 5 columns x 3 rows (15 slots)
    const games = ALL_GAME_KEYS.map(key => ({
      key: key,
      name: GAME_NAMES[key],
      icon: this.getIcon(key),
    }));

    const cols = 5;
    const cardW = 124;
    const cardH = 80;
    const gapX = 10;
    const gapY = 8;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (GAME_WIDTH - gridW) / 2 + cardW / 2;
    const startY = 55;

    games.forEach((game, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY) + cardH / 2;

      // Card background
      const bg = this.add.graphics();
      bg.fillStyle(0x2C3E50, 0.8);
      bg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);

      // Hover highlight
      const hover = this.add.graphics();
      hover.fillStyle(COLORS.SUNSET_ORANGE, 0.3);
      hover.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
      hover.setVisible(false);

      // Icon
      this.add.text(x, y - 15, game.icon, { fontSize: '26px' }).setOrigin(0.5);

      // Name
      this.add.text(x, y + 18, game.name, {
        ...FONTS.SMALL,
        fontSize: '10px',
        fontStyle: 'bold',
        wordWrap: { width: cardW - 10 },
        align: 'center',
      }).setOrigin(0.5);

      // Hit zone
      const hitZone = this.add.zone(x, y, cardW, cardH)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => hover.setVisible(true));
      hitZone.on('pointerout', () => hover.setVisible(false));
      hitZone.on('pointerdown', () => {
        session.reset();                       // reset() drops difficulty back to EASY…
        session.difficulty = adminDifficulty;  // …so re-apply the toggle's choice
        this.scene.start('StoryScene', { gameKey: game.key });
      });
    });

    this.drawDifficultyToggle();

    // Admin mode label
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'ADMIN MODE — game returns here after each round', {
      ...FONTS.SMALL,
      fontSize: '9px',
      color: '#FF9F4388',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(300);
  }

  // EASY / MEDIUM / HARD segmented control. Sets the global adminDifficulty, which the card
  // handler applies after session.reset(); the normal Play flow never touches it.
  drawDifficultyToggle() {
    const levels = [DIFFICULTY.EASY, DIFFICULTY.MEDIUM, DIFFICULTY.HARD];
    const segW = 88, segH = 26, gap = 6, y = 333;
    const totalW = levels.length * segW + (levels.length - 1) * gap;
    const startX = GAME_WIDTH / 2 - totalW / 2 + 30;

    this.add.text(startX - 12, y, 'Difficulty', {
      ...FONTS.SMALL, fontSize: '11px', color: '#ffffff88',
    }).setOrigin(1, 0.5);

    const segments = levels.map((level, i) => {
      const x = startX + i * (segW + gap);
      const bg = this.add.graphics();
      const label = this.add.text(x + segW / 2, y, level.toUpperCase(), {
        ...FONTS.SMALL, fontSize: '11px', fontStyle: 'bold',
      }).setOrigin(0.5);
      const zone = this.add.zone(x + segW / 2, y, segW, segH).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        adminDifficulty = level;
        segments.forEach(s => s.paint());
      });
      const seg = {
        paint: () => {
          const on = adminDifficulty === level;
          bg.clear();
          bg.fillStyle(on ? COLORS.SUNSET_ORANGE : 0x2C3E50, on ? 1 : 0.8);
          bg.fillRoundedRect(x, y - segH / 2, segW, segH, 8);
          label.setColor(on ? '#ffffff' : '#ffffff88');
        },
      };
      seg.paint();
      return seg;
    });
  }

  getIcon(key) {
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
    };
    return icons[key] || '📖';
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
