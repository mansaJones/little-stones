// ============================================
// DATA MANAGER - LocalStorage persistence
// ============================================

const STORAGE_KEY = 'biblicalGameData';

function getDefaultGameData() {
  return {
    totalScore: 0,
    currentLevel: 1,
    unlockedLevels: [1],
    currentAvatar: 'default',
    achievements: [],
    firstLaunch: true,
    stats: {
      totalGamesPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      bestCombo: 0,
      perfectGames: 0,
    },
    // Built from ALL_GAME_KEYS, not listed by hand. The hand-written list fell out of date
    // silently every time a mini-game was added: updateGameStats guards on
    // `if (data.miniGameStats[gameKey])`, so a missing key means that game's plays are recorded
    // nowhere and nothing anywhere throws to tell you.
    miniGameStats: ALL_GAME_KEYS.reduce(function (acc, key) {
      acc[key] = { played: 0, won: 0, bestTime: null };
      return acc;
    }, {}),
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      hapticEnabled: true,
    },
  };
}

function validateGameData(data) {
  return (
    typeof data === 'object' && data !== null &&
    typeof data.totalScore === 'number' && data.totalScore >= 0 &&
    typeof data.currentLevel === 'number' &&
    data.currentLevel >= 1 && data.currentLevel <= 10 &&
    Array.isArray(data.unlockedLevels)
  );
}

function saveGameData(data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(STORAGE_KEY + '_backup', serialized);
  } catch (e) {
    console.warn('[Save] Failed to save game data:', e.message);
  }
}

// A save written before a mini-game existed has no miniGameStats key for it, and
// updateGameStats silently drops stats for a key it cannot find. Backfilling on every load means
// adding a game never costs a returning player that game's stats.
function backfillGameData(data) {
  if (!data.miniGameStats || typeof data.miniGameStats !== 'object') data.miniGameStats = {};
  ALL_GAME_KEYS.forEach(function (key) {
    if (!data.miniGameStats[key]) data.miniGameStats[key] = { played: 0, won: 0, bestTime: null };
  });
  return data;
}

function loadGameData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (validateGameData(parsed)) return backfillGameData(parsed);
    }
  } catch (e) {
    console.warn('[Load] Primary save corrupted, trying backup...');
  }
  try {
    const backup = localStorage.getItem(STORAGE_KEY + '_backup');
    if (backup) {
      const parsed = JSON.parse(backup);
      if (validateGameData(parsed)) {
        localStorage.setItem(STORAGE_KEY, backup);
        return backfillGameData(parsed);
      }
    }
  } catch (e) {
    console.warn('[Load] Backup also corrupted, resetting.');
  }
  return getDefaultGameData();
}

function updateGameStats(gameKey, won, timeElapsed) {
  const data = loadGameData();
  data.stats.totalGamesPlayed++;
  if (won) data.stats.totalWins++;
  else data.stats.totalLosses++;

  if (data.miniGameStats[gameKey]) {
    data.miniGameStats[gameKey].played++;
    if (won) {
      data.miniGameStats[gameKey].won++;
      if (timeElapsed && (!data.miniGameStats[gameKey].bestTime || timeElapsed < data.miniGameStats[gameKey].bestTime)) {
        data.miniGameStats[gameKey].bestTime = timeElapsed;
      }
    }
  }
  saveGameData(data);
  return data;
}
