// ============================================
// MAIN - Phaser game initialization
// ============================================

// Size the canvas to this device BEFORE Phaser reads the config. FIT then scales a canvas that
// already matches the aspect it is about to be fitted into, so there is nothing to letterbox.
//
// Measured off the CONTAINER, not the window: on a phone the container IS the window, but on a
// desktop the stylesheet frames it at 844x475, and sizing to the window there would letterbox
// the canvas inside its own frame. The container is laid out by the time this runs -- the CSS is
// inline in <head> and every script tag is at the end of <body>. If it has no box at all (the
// portrait rotate-prompt hides it) fall back to the window, and computeCanvasSize() falls back
// to the stage aspect if that is empty too.
(function () {
  const box = document.getElementById('game-container').getBoundingClientRect();
  computeCanvasSize(box.width || window.innerWidth, box.height || window.innerHeight);
})();

// Park every scene's camera so WORLD (0,0) is the stage's top-left corner, wherever the stage
// happens to sit inside a canvas that is now device-shaped. Every coordinate in every game file is
// in stage space, so this one line is what keeps all of them meaning the same thing on a 2.17
// phone as on a 1.78 one -- including pointer.worldX, which is how taps land in the right place.
//
// This is a GLOBAL SCENE PLUGIN rather than a loop over game.scene.scenes, because that array is
// empty immediately after new Phaser.Game(): scenes declared in the config are queued, not built.
// A loop there silently registers nothing. The plugin manager instead installs one of these into
// every scene and calls boot(), where the scene's own emitter is live -- and CREATE re-fires on
// every scene.start() and scene.restart(), so the offset survives replays.
class StageOffsetPlugin extends Phaser.Plugins.ScenePlugin {
  boot() {
    this.scene.events.on(Phaser.Scenes.Events.CREATE, this.park, this);
  }

  park() {
    // Phaser installs this plugin into its internal __SYSTEM scene too, which has no camera.
    if (!this.scene.cameras || !this.scene.cameras.main) return;
    this.scene.cameras.main.setScroll(-STAGE_X, -STAGE_Y);
    drawBackdropBleed(this.scene);
  }
}

const config = {
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    OnboardingScene,
    MenuScene,
    GamePickerScene,
    StoryScene,
    InstructionScene,
    GameLoopScene,
    ResultScene,
    LetThereBeLightGame,
    NoahsArkGame,
    TowerOfBabelGame,
    WrestleTheAngelGame,
    WaterToWineGame,
    RollTheStoneGame,
    DanielLionsDenGame,
    FieryFurnaceGame,
    HouseOnRockGame,
    DavidVsGoliathGame,
    WalkAroundJerichoGame,
    HeMustIncreaseGame,
    LostSheepGame,
    SamsonJawboneGame,
    BabyMosesGame,
    PeterWaterGame,
    RedSeaGame,
  ],
  plugins: {
    scene: [{ key: 'StageOffset', plugin: StageOffsetPlugin, mapping: 'stageOffset' }],
  },
  // Disable right-click context menu
  disableContextMenu: true,
};

// Check for crashed session before starting
(function checkCrashedSession() {
  try {
    const orphan = localStorage.getItem('currentSession');
    if (orphan) {
      const sessionData = JSON.parse(orphan);
      if (sessionData.inProgress && sessionData.score > 0) {
        const gameData = loadGameData();
        gameData.totalScore += sessionData.score;
        saveGameData(gameData);
        console.log(`[Recovery] Recovered ${sessionData.score} points from crashed session.`);
      }
      localStorage.removeItem('currentSession');
    }
  } catch (e) {
    localStorage.removeItem('currentSession');
  }
})();

// Launch!
const game = new Phaser.Game(config);

