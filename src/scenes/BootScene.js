// ============================================
// BOOT SCENE - Minimal initial load
// ============================================

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Generate all texture assets programmatically
    this.generateTextures();

    // Check if first launch
    const data = loadGameData();
    if (data.firstLaunch) {
      this.scene.start('OnboardingScene');
    } else {
      this.scene.start('MenuScene');
    }
  }

  generateTextures() {
    // -- UI Elements --
    this.createRoundedRect('btn-play', 280, 65, COLORS.SUNSET_ORANGE, 16);
    this.createRoundedRect('btn-secondary', 200, 50, COLORS.DEEP_PURPLE, 12);
    this.createRoundedRect('btn-small', 140, 45, COLORS.SKY_BLUE, 10);
    this.createRoundedRect('panel-dark', 340, 200, 0x2C3E50, 16);
    this.createRoundedRect('panel-light', 340, 120, 0x34495E, 12);
    this.createRoundedRect('card-nav', 100, 90, 0x34495E, 14);

    // Hearts
    this.createHeart('heart-full', COLORS.HEART_RED);
    this.createHeart('heart-empty', COLORS.HEART_EMPTY);

    // -- Let There Be Light assets --
    this.createLightSwitch('switch-off', 0x555555, 0x333333);
    this.createLightSwitch('switch-on', COLORS.SUNSHINE_YELLOW, COLORS.SUNSET_ORANGE);
    this.createDecoySwitch('switch-decoy', 0x884444);

    // -- Noah's Ark card assets --
    this.createCardTexture('card-back', COLORS.CARD_BACK);
    this.createCardTexture('card-matched', COLORS.SUCCESS_GREEN);
    this.createAnimalCards();

    // -- Tower of Babel assets --
    this.createBlock('tower-block', COLORS.TOWER_BROWN, 60, 28);
    this.createBlock('tower-block-damaged', COLORS.TOWER_DARK, 60, 28);

    // -- Wrestle the Angel assets --
    this.createCircle('tap-target', COLORS.SUNSET_ORANGE, 30);

    // -- Water to Wine assets --
    this.createRoundedRect('jar', 80, 160, 0x8B7355, 8);

    // -- Roll the Stone assets --
    this.createCircle('stone-large', 0x888888, 35);
    this.createRoundedRect('tomb', 120, 100, 0x554433, 6);
    this.createCircle('obstacle-rock', 0x666666, 12);

    // -- Daniel Lions Den assets --
    this.createCircle('daniel', 0x4A90E2, 18);
    this.createCircle('lion', 0xD4A017, 16);

    // -- Fiery Furnace assets --
    this.createRoundedRect('furnace', 200, 140, 0x8B4513, 10);

    // -- House on Rock assets --
    this.createRoundedRect('house', 60, 50, 0xCC8844, 4);
    this.createRoundedRect('foundation-rock', 120, 30, 0x666666, 4);
    this.createRoundedRect('foundation-sand', 120, 30, 0xD4A017, 4);

    // -- David vs Goliath assets --
    this.createCircle('sling-stone', 0x888888, 8);
    this.createRoundedRect('goliath', 50, 90, 0x8B0000, 6);

    // -- Walk Around Jericho assets --
    this.createCircle('walker', 0x4A90E2, 10);
    this.createRoundedRect('wall-segment', 16, 40, 0xAA8855, 2);

    // -- He Must Increase assets --
    this.createRoundedRect('tile-god', 100, 100, COLORS.GOLD, 8);
    this.createRoundedRect('tile-me', 100, 100, COLORS.SKY_BLUE, 8);

    // -- General --
    this.createCircle('particle', COLORS.SUNSHINE_YELLOW, 6);
    this.createCircle('star', COLORS.GOLD, 10);
  }

  createRoundedRect(key, w, h, color, radius) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, radius);
    // Slight highlight at top for depth
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(2, 2, w - 4, h / 3, { tl: radius, tr: radius, bl: 0, br: 0 });
    g.generateTexture(key, w, h);
    g.destroy();
  }

  createHeart(key, color) {
    const g = this.make.graphics({ add: false });
    const s = 24;
    g.fillStyle(color, 1);
    // Simple heart using circles and triangle
    g.fillCircle(s * 0.3, s * 0.3, s * 0.25);
    g.fillCircle(s * 0.7, s * 0.3, s * 0.25);
    g.fillTriangle(s * 0.05, s * 0.4, s * 0.95, s * 0.4, s * 0.5, s * 0.9);
    g.generateTexture(key, s, s);
    g.destroy();
  }

  createLightSwitch(key, plateColor, switchColor) {
    const g = this.make.graphics({ add: false });
    // Switch plate
    g.fillStyle(plateColor, 1);
    g.fillRoundedRect(0, 0, 70, 100, 10);
    // Switch toggle
    g.fillStyle(switchColor, 1);
    g.fillRoundedRect(22, 20, 26, 40, 6);
    // Screw dots
    g.fillStyle(0x888888, 1);
    g.fillCircle(35, 10, 3);
    g.fillCircle(35, 90, 3);
    g.generateTexture(key, 70, 100);
    g.destroy();
  }

  createDecoySwitch(key, color) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, 70, 100, 10);
    // X mark
    g.lineStyle(4, 0xff0000, 0.6);
    g.lineBetween(15, 20, 55, 80);
    g.lineBetween(55, 20, 15, 80);
    g.generateTexture(key, 70, 100);
    g.destroy();
  }

  createCardTexture(key, color) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, 70, 85, 8);
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeRoundedRect(0, 0, 70, 85, 8);
    if (key === 'card-back') {
      // Cross pattern on back
      g.fillStyle(0xffffff, 0.15);
      g.fillRect(30, 15, 10, 55);
      g.fillRect(15, 35, 40, 10);
    }
    g.generateTexture(key, 70, 85);
    g.destroy();
  }

  createAnimalCards() {
    // Animal symbols as colored cards with emoji-style shapes
    const animals = [
      { key: 'animal-lion',    color: 0xD4A017, symbol: '🦁' },
      { key: 'animal-dove',    color: 0xECF0F1, symbol: '🕊' },
      { key: 'animal-fish',    color: 0x3498DB, symbol: '🐟' },
      { key: 'animal-lamb',    color: 0xF5F5DC, symbol: '🐑' },
      { key: 'animal-eagle',   color: 0x795548, symbol: '🦅' },
      { key: 'animal-camel',   color: 0xD2691E, symbol: '🐪' },
      { key: 'animal-donkey',  color: 0x808080, symbol: '🫏' },
      { key: 'animal-serpent', color: 0x27AE60, symbol: '🐍' },
    ];

    animals.forEach(({ key, color }) => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(COLORS.CARD_FACE, 1);
      g.fillRoundedRect(0, 0, 70, 85, 8);
      g.lineStyle(2, color, 0.8);
      g.strokeRoundedRect(2, 2, 66, 81, 7);
      // Colored circle representing the animal
      g.fillStyle(color, 0.8);
      g.fillCircle(35, 38, 22);
      // Inner highlight
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(30, 32, 8);
      g.generateTexture(key, 70, 85);
      g.destroy();
    });
  }

  createBlock(key, color, w, h) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, 3);
    // Brick lines
    g.lineStyle(1, 0x000000, 0.2);
    g.lineBetween(w / 3, 0, w / 3, h);
    g.lineBetween(2 * w / 3, 0, 2 * w / 3, h);
    g.lineBetween(0, h / 2, w, h / 2);
    // Highlight
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(1, 1, w - 2, h / 3);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  createCircle(key, color, radius) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(color, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }
}
