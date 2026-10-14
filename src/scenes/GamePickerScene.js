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

    // Game list — 5 columns, as many rows as the playable list needs. Retired games are not
    // listed; see RETIRED_GAME_KEYS in constants.js.
    const games = PLAYABLE_GAME_KEYS.map(key => ({
      key: key,
      name: GAME_NAMES[key],
      icon: this.getIcon(key),
    }));

    // The grid sizes itself to the list. Nothing here is a fixed card size, because a fixed card
    // size is what broke it: 124x80 in five columns fitted when the picker had thirteen games, but
    // eighteen needs four rows, and 4 x 80 plus gaps is 344px crammed into the 272px band between
    // the header and the difficulty toggle. Measured before the fix: five cards sat ON the toggle
    // and three fell past the bottom of the stage entirely.
    //
    // So: try each column count, and keep whichever gives the TALLEST card that still fits. Height
    // is the objective rather than area because the card carries a wrapped two- or three-line
    // name, and height is what the name needs -- "Nehemiah Rebuilds the Wall" in a short wide card
    // is the thing that overflows next.
    const gapX = 10;
    const gapY = 8;
    const MARGIN_X = 12;
    const BAND_TOP = 42;
    const BAND_BOTTOM = 310;        // 10px clear of the difficulty toggle, whose top edge is y=320
    const MAX_ASPECT = 1.35;        // wider than this and the name has nowhere to wrap
    const MIN_CARD_H = 44;

    const availW = GAME_WIDTH - MARGIN_X * 2;
    const availH = BAND_BOTTOM - BAND_TOP;

    let best = null;
    for (let c = 4; c <= 7; c++) {
      const r = Math.ceil(games.length / c);
      const w = (availW - (c - 1) * gapX) / c;
      const h = Math.min(w / MAX_ASPECT, (availH - (r - 1) * gapY) / r);
      if (h < MIN_CARD_H) continue;
      if (!best || h > best.h || (h === best.h && w > best.w)) best = { cols: c, rows: r, w: w, h: h };
    }
    // Every column count was too tight -- only reachable with a far longer list than this app has.
    // Fall back to the narrowest cards rather than drawing nothing.
    if (!best) {
      const c = 7, r = Math.ceil(games.length / c);
      best = { cols: c, rows: r, w: (availW - (c - 1) * gapX) / c,
               h: (availH - (r - 1) * gapY) / r };
    }

    const cols = best.cols;
    const cardW = best.w;
    const cardH = best.h;
    const rows = best.rows;
    const gridH = rows * cardH + (rows - 1) * gapY;
    const startY = BAND_TOP + (availH - gridH) / 2;

    // Type scales with the card, from the proportions the 124x80 card was designed at.
    const iconSize = Math.max(16, Math.round(cardH * 0.325));
    const nameSize = Math.max(8, Math.min(10, Math.round(cardH * 0.125)));

    games.forEach((game, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Each ROW is centred on its own width, not on a full row's. Eleven games at five columns
      // is 5/5/1, and a lone last card left-aligned under two full rows reads as a bug.
      const inRow = Math.min(cols, games.length - row * cols);
      const rowW = inRow * cardW + (inRow - 1) * gapX;
      const x = (GAME_WIDTH - rowW) / 2 + cardW / 2 + col * (cardW + gapX);
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

      // Icon and name are placed as fractions of the card, not at a fixed -15 / +18, so they stay
      // put when the card resizes.
      this.add.text(x, y - cardH * 0.19, game.icon, { fontSize: iconSize + 'px' }).setOrigin(0.5);

      this.add.text(x, y + cardH * 0.22, game.name, {
        ...FONTS.SMALL,
        fontSize: nameSize + 'px',
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
      [GAME_KEYS.SAMSON_JAWBONE]: '💪',
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
      // Spans the CANVAS, not the stage, so there is no unpainted bleed around it.
      g.fillRect(-STAGE_X, -STAGE_Y + (CANVAS_HEIGHT / steps) * i,
                 CANVAS_WIDTH, CANVAS_HEIGHT / steps + 1);
    }
  }
}
