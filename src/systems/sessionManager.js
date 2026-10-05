// ============================================
// SESSION MANAGER - Tracks current play session
// ============================================

class SessionManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.lives = 3;
    this.score = 0;
    this.gamesPlayed = [];
    this.combo = 0;
    this.bestCombo = 0;
    this.consecutiveWins = 0;
    this.consecutiveLosses = 0;
    this.difficulty = DIFFICULTY.EASY;
    this.adsWatched = 0;
  }

  recordWin(gameKey, points) {
    this.score += points;
    this.combo++;
    this.consecutiveWins++;
    this.consecutiveLosses = 0;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.gamesPlayed.push({ game: gameKey, result: 'WIN', points });
  }

  recordLoss(gameKey) {
    this.lives--;
    this.combo = 0;
    this.consecutiveWins = 0;
    this.consecutiveLosses++;
    this.gamesPlayed.push({ game: gameKey, result: 'LOSS', points: 0 });
  }

  getComboMultiplier() {
    if (this.combo >= 15) return 5.0;
    if (this.combo >= 10) return 3.0;
    if (this.combo >= 5) return 2.0;
    if (this.combo >= 3) return 1.5;
    return 1.0;
  }

  calculatePoints(difficulty, perfect, fast) {
    let base = SCORE_CONFIG.basePoints[difficulty] || 100;
    let multiplier = 1.0;
    if (perfect) multiplier *= SCORE_CONFIG.multipliers.perfect;
    if (fast) multiplier *= SCORE_CONFIG.multipliers.fast;
    multiplier *= this.getComboMultiplier();
    return Math.round(base * multiplier);
  }

  getRandomGame() {
    const lastGame = this.gamesPlayed.length > 0
      ? this.gamesPlayed[this.gamesPlayed.length - 1].game
      : null;
    const pool = ALL_GAME_KEYS.filter(k => k !== lastGame);
    return Phaser.Math.RND.pick(pool);
  }

  getPerformance() {
    return {
      consecutiveWins: this.consecutiveWins,
      consecutiveLosses: this.consecutiveLosses,
    };
  }

  getWinRate() {
    const wins = this.gamesPlayed.filter(g => g.result === 'WIN').length;
    const total = this.gamesPlayed.length;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }

  isSessionOver() {
    return this.lives <= 0;
  }

  canWatchAd() {
    return this.adsWatched < 3;
  }
}

// Global session instance
const session = new SessionManager();
