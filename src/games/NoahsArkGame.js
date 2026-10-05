// ============================================
// NOAH'S ARK - Memory matching game
// Genesis 7:9  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// ============================================

// Art plates live in assets/games/noahs-ark/ (see tools/key_sprites.py).
//   bg.jpg           — inside the ark, animals peeking in from both sides, 16:9 at 2x stage res
//   card-back.png    — the deck back (ark + doves), keyed off magenta, 224x320
//   card-<animal>.png — one face per animal, same 224x320 frame so every card is the same size
const NA_ASSET_PATH = 'assets/games/noahs-ark/';
const NA_ANIMALS = ['lion', 'lamb', 'donkey', 'dove', 'fish', 'eagle', 'camel', 'serpent'];
const NA_ASSETS = {
  bg:   { key: 'na-bg',        file: 'bg.jpg' },
  back: { key: 'na-card-back', file: 'card-back.png' },
};
NA_ANIMALS.forEach(a => { NA_ASSETS[a] = { key: `na-card-${a}`, file: `card-${a}.png` }; });

// ---- Layout — the clear floor between the peeking animals, under the HUD strip ----
const NA_CARD_ASPECT = 0.70;       // width / height of the card art
const NA_GRID = { left: 100, right: 567, top: 58, bottom: 365, gap: 8, maxCardH: 130 };

class NoahsArkGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.NOAHS_ARK);
  }

  preload() {
    // Textures persist in the global TextureManager, so only fetch on first visit.
    Object.values(NA_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, NA_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;
    this.gameActive = false;
    this.matchedPairs = 0;
    this.totalPairs = this.config.pairs;
    this.flippedCards = [];
    this.canFlip = true;
    this.cards = [];
    this.timeRemaining = this.config.timeLimit;

    this.add.image(0, 0, NA_ASSETS.bg.key).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createCardGrid();
    this.drawHUD();

    // Peek phase
    if (this.config.peekTime > 0) {
      this.revealAllCards();
      this.time.delayedCall(this.config.peekTime * 1000, () => {
        this.hideAllCards();
        this.startGame();
      });
    } else {
      this.startGame();
    }
  }

  // ================================================================
  //  HUD
  // ================================================================

  drawHUD() {
    const bg = this.add.graphics().setDepth(50);
    bg.fillStyle(0x000000, 0.22);
    bg.fillRoundedRect(8, 6, GAME_WIDTH - 16, 40, 8);

    for (let i = 0; i < 3; i++) {
      this.add.image(28 + i * 24, 26, i < session.lives ? 'heart-full' : 'heart-empty')
        .setDepth(51);
    }

    this.timerText = this.add.text(GAME_WIDTH - 18, 14, `${this.config.timeLimit}s`, {
      ...FONTS.TIMER, fontSize: '18px',
    }).setOrigin(1, 0).setDepth(51);

    this.add.text(150, 26, `⭐ ${session.score}`, {
      ...FONTS.SMALL, color: '#FFD93D', fontSize: '11px',
    }).setOrigin(0, 0.5).setDepth(51);

    if (session.combo >= 3) {
      this.add.text(220, 26, `🔥 x${session.combo}`, {
        ...FONTS.SMALL, color: '#FF9F43', fontSize: '11px',
      }).setOrigin(0, 0.5).setDepth(51);
    }

    this.createProgressBar();
  }

  createProgressBar() {
    const bx = 280, by = 16, bw = 265, bh = 20;

    const bg = this.add.graphics().setDepth(51);
    bg.fillStyle(0x333333, 0.55);
    bg.fillRoundedRect(bx, by, bw, bh, 6);
    bg.lineStyle(1.5, 0x666666, 0.4);
    bg.strokeRoundedRect(bx, by, bw, bh, 6);

    this.progressBar = this.add.graphics().setDepth(52);
    this.pbX = bx; this.pbY = by; this.pbW = bw; this.pbH = bh;

    this.progressText = this.add.text(bx + bw / 2, by + bh / 2, '', {
      ...FONTS.SMALL, color: '#FFD93D', fontStyle: 'bold', fontSize: '10px',
    }).setOrigin(0.5).setDepth(53);

    this.updateProgressBar();
  }

  updateProgressBar() {
    this.progressBar.clear();
    const w = Math.max(0, (this.pbW - 4) * (this.matchedPairs / this.totalPairs));
    this.progressBar.fillStyle(0x6BCF7F, 1);
    this.progressBar.fillRoundedRect(this.pbX + 2, this.pbY + 2, w, this.pbH - 4, 4);
    this.progressText.setText(`Pairs ${this.matchedPairs}/${this.totalPairs}`);
  }

  // ================================================================
  //  CARDS
  // ================================================================

  createCardGrid() {
    const selectedAnimals = Phaser.Utils.Array.Shuffle([...NA_ANIMALS]).slice(0, this.totalPairs);

    let cardData = [];
    selectedAnimals.forEach((animal, i) => {
      cardData.push({ id: i, animal });
      cardData.push({ id: i, animal });
    });
    cardData = Phaser.Utils.Array.Shuffle(cardData);

    // Fit the grid to the floor: rows decide the height, columns cap the width, art keeps its aspect.
    const cols = this.config.gridCols;
    const rows = this.config.gridRows;
    const G = NA_GRID;
    const areaW = G.right - G.left;
    const areaH = G.bottom - G.top;
    let cardH = Math.min(G.maxCardH, (areaH - G.gap * (rows - 1)) / rows);
    let cardW = cardH * NA_CARD_ASPECT;
    const maxW = (areaW - G.gap * (cols - 1)) / cols;
    if (cardW > maxW) { cardW = maxW; cardH = cardW / NA_CARD_ASPECT; }
    cardW = Math.floor(cardW); cardH = Math.floor(cardH);
    this.cardW = cardW; this.cardH = cardH;

    const gridW = cols * cardW + (cols - 1) * G.gap;
    const gridH = rows * cardH + (rows - 1) * G.gap;
    const startX = (G.left + G.right) / 2 - gridW / 2 + cardW / 2;
    const startY = (G.top + G.bottom) / 2 - gridH / 2 + cardH / 2;

    cardData.forEach((data, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardW + G.gap);
      const y = startY + row * (cardH + G.gap);
      this.cards.push(this.createCard(x, y, data));
    });
  }

  createCard(x, y, data) {
    const container = this.add.container(x, y).setDepth(10);

    const back = this.add.image(0, 0, NA_ASSETS.back.key)
      .setDisplaySize(this.cardW, this.cardH)
      .setInteractive({ useHandCursor: true });

    const front = this.add.image(0, 0, NA_ASSETS[data.animal].key)
      .setDisplaySize(this.cardW, this.cardH)
      .setVisible(false);

    container.add([back, front]);
    container.setSize(this.cardW, this.cardH);

    const cardObj = {
      container, back, front,
      pairId: data.id,
      animal: data.animal,
      faceUp: false,
      matched: false,
    };

    back.on('pointerdown', () => {
      if (!this.gameActive || !this.canFlip || cardObj.faceUp || cardObj.matched) return;
      this.flipCard(cardObj, true);
    });

    return cardObj;
  }

  flipCard(card, checkMatch) {
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 100,
      onComplete: () => {
        card.faceUp = !card.faceUp;
        card.back.setVisible(!card.faceUp);
        card.front.setVisible(card.faceUp);
        this.tweens.add({ targets: card.container, scaleX: 1, duration: 100 });
      },
    });

    if (checkMatch && card.faceUp === false) {
      this.flippedCards.push(card);

      if (this.flippedCards.length === 2) {
        this.canFlip = false;
        this.time.delayedCall(250, () => this.checkMatch());
      }
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;

    if (card1.pairId === card2.pairId) {
      card1.matched = true;
      card2.matched = true;
      this.matchedPairs++;
      this.updateProgressBar();

      this.tweens.add({
        targets: [card1.container, card2.container],
        scaleX: 1.1, scaleY: 1.1,
        duration: 200,
        yoyo: true,
        onComplete: () => {
          this.tweens.add({ targets: [card1.container, card2.container], alpha: 0.4, duration: 300 });
        },
      });

      if (this.matchedPairs >= this.totalPairs) {
        this.handleWin();
        return;
      }
    } else {
      this.time.delayedCall(500, () => {
        this.flipCard(card1, false);
        this.flipCard(card2, false);
      });
    }

    this.flippedCards = [];
    this.time.delayedCall(700, () => { this.canFlip = true; });
  }

  revealAllCards() {
    this.cards.forEach(card => {
      card.back.setVisible(false);
      card.front.setVisible(true);
      card.faceUp = true;
    });
  }

  hideAllCards() {
    this.cards.forEach(card => {
      card.back.setVisible(true);
      card.front.setVisible(false);
      card.faceUp = false;
    });
  }

  // ================================================================
  //  GAME LOGIC
  // ================================================================

  startGame() {
    this.gameActive = true;

    this.timerEvent = this.time.addEvent({
      delay: 100, callback: this.updateTimer, callbackScope: this, loop: true,
    });
    this.timeoutEvent = this.time.delayedCall(this.config.timeLimit * 1000, () => {
      if (this.gameActive) this.handleLoss();
    });
  }

  // Seconds since startGame on the SAME clock the loss timeout runs on (Phaser's clamped
  // step delta). `this.time.now` is wall-clock and races ahead in a throttled/background tab.
  elapsedSeconds() {
    return this.timeoutEvent ? this.timeoutEvent.getElapsedSeconds() : 0;
  }

  // Stop the clocks. Read elapsedSeconds() BEFORE calling this: TimerEvent.remove() sets the
  // event's elapsed to its full delay.
  _cleanup() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.timeoutEvent) this.timeoutEvent.remove();
    this.canFlip = false;
  }

  updateTimer() {
    if (!this.gameActive) return;
    const elapsed = this.elapsedSeconds();
    this.timeRemaining = Math.max(0, this.config.timeLimit - elapsed);
    this.timerText.setText(this.timeRemaining.toFixed(1) + 's');
    if (this.timeRemaining < 5) this.timerText.setColor('#FF4757');
    else if (this.timeRemaining < 10) this.timerText.setColor('#FFD93D');
  }

  handleWin() {
    this.gameActive = false;
    const elapsed = this.elapsedSeconds();
    this.finalElapsed = elapsed;
    this._cleanup();

    const fast = elapsed < this.config.timeLimit * 0.7;
    const perfect = this.matchedPairs === this.totalPairs && elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    const allAboard = this.add.text(GAME_WIDTH / 2, 100, 'All aboard!', {
      ...FONTS.TITLE, color: '#2ECC71', fontSize: '26px',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(40);
    this.tweens.add({ targets: allAboard, alpha: 1, y: 90, duration: 500, ease: 'Back.easeOut' });

    for (let i = 0; i < 16; i++) {
      this.time.delayedCall(i * 50, () => {
        const sparkle = this.add.text(
          Phaser.Math.Between(NA_GRID.left, NA_GRID.right), Phaser.Math.Between(NA_GRID.top, NA_GRID.bottom),
          '✨', { fontSize: '20px' }).setOrigin(0.5).setDepth(41);
        this.tweens.add({ targets: sparkle, y: sparkle.y - 40, alpha: 0, duration: 700, ease: 'Quad.easeOut' });
      });
    }

    this.time.delayedCall(2000, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.NOAHS_ARK,
        points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    this.gameActive = false;
    this.finalElapsed = this.elapsedSeconds();
    this._cleanup();

    this.add.text(GAME_WIDTH / 2, 100, 'Time\'s up!', {
      ...FONTS.TITLE, color: '#E74C3C',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);

    this.cameras.main.shake(200, 0.02);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.NOAHS_ARK,
        points: 0,
      });
    });
  }
}
