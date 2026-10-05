// ============================================
// PRELOAD SCENE - Asset loading
// ============================================

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image('menu-bg', 'assets/ui/menu-bg.jpg');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
