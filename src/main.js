// ============================================
// MAIN - Phaser game initialization
// ============================================

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
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
  ],
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
