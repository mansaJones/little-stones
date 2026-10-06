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
    // Route based on first launch (moved from BootScene)
    const data = loadGameData();
    if (data.firstLaunch) {
      this.scene.start('OnboardingScene');
    } else {
      this.scene.start('MenuScene');
    }
  }
}
