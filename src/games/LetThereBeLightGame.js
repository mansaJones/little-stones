// ============================================
// LET THERE BE LIGHT - Reaction speed game
// Genesis 1:3  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// ============================================

// Art plates live in assets/games/let-there-be-light/ (see tools/key_sprites.py).
//   bg-dark.jpg / bg-light.jpg — the same cloud ribbons, night and day, pre-cropped to 16:9
//   star.png / sun.png         — the sky character, night and day
//   switch-off.png / -on.png   — the switch, keyed off magenta, both fitted to LTBL_SWITCH_H
// Modes (gameConfig.letThereBeLight): easy = 1 switch, medium = 2 in any order,
// hard = 3 in Day 1 → 2 → 3 order. The sky flips to day once every switch is on.
const LTBL_ASSET_PATH = 'assets/games/let-there-be-light/';
const LTBL_ASSETS = {
  bgDark:    { key: 'ltbl-bg-dark',    file: 'bg-dark.jpg' },
  bgLight:   { key: 'ltbl-bg-light',   file: 'bg-light.jpg' },
  star:      { key: 'ltbl-star',       file: 'star.png' },
  sun:       { key: 'ltbl-sun',        file: 'sun.png' },
  switchOff: { key: 'ltbl-switch-off', file: 'switch-off.png' },
  switchOn:  { key: 'ltbl-switch-on',  file: 'switch-on.png' },
};
const LTBL_SWITCH_H = 110;                   // on-stage switch height (both states)
const LTBL_SKY_H = 90;                       // on-stage star / sun height
const LTBL_SKY_POS = { x: 333, y: 95 };      // open sky between the cloud ribbons
const LTBL_SWITCH_Y = 235;                   // switch row centre

class LetThereBeLightGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.LET_THERE_BE_LIGHT);
  }

  preload() {
    // Textures persist in the global TextureManager, so only fetch on first visit.
    Object.values(LTBL_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, LTBL_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;
    this.gameActive = false;
    this.switches = [];
    this.switchesOn = 0;
    this.nextSwitchIndex = 0;
    this.timeRemaining = this.config.reactionWindow;

    // Night sky, with the day sky stacked on top at alpha 0 — the win crossfades it in
    this.add.image(0, 0, LTBL_ASSETS.bgDark.key).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);
    this.bgLight = this.add.image(0, 0, LTBL_ASSETS.bgLight.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(1).setAlpha(0);

    // Star now, sun later
    this.star = this.addSkyChar(LTBL_ASSETS.star.key).setDepth(5);
    this.sun = this.addSkyChar(LTBL_ASSETS.sun.key).setDepth(5).setAlpha(0).setScale(0.001);
    this.twinkle = this.tweens.add({
      targets: this.star, scaleX: this.star.scaleX * 1.08, scaleY: this.star.scaleY * 1.08,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // HUD
    this.drawHUD();

    // "Darkness..." text
    this.darknessText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '🌑 Darkness...', {
      ...FONTS.TITLE, color: '#C8B8E8', stroke: '#1A1030', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(40);

    this.waitText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, 'Wait for the light switch...', {
      ...FONTS.SMALL, color: '#C8B8E8', stroke: '#1A1030', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(40).setAlpha(0.7);

    // Random delay before switches appear (1-2 seconds)
    const delay = Phaser.Math.Between(1000, 2000);
    this.time.delayedCall(delay, () => this.startGame());
  }

  addSkyChar(key) {
    const img = this.add.image(LTBL_SKY_POS.x, LTBL_SKY_POS.y, key);
    img.setScale(LTBL_SKY_H / img.height);
    return img;
  }

  // ================================================================
  //  HUD  (same strip as Roll the Stone, minus the progress bar)
  // ================================================================

  drawHUD() {
    const bg = this.add.graphics().setDepth(50);
    bg.fillStyle(0x000000, 0.22);
    bg.fillRoundedRect(8, 6, GAME_WIDTH - 16, 40, 8);

    for (let i = 0; i < 3; i++) {
      this.add.image(28 + i * 24, 26, i < session.lives ? 'heart-full' : 'heart-empty')
        .setDepth(51);
    }

    this.timerText = this.add.text(GAME_WIDTH - 18, 14, '', {
      ...FONTS.TIMER, fontSize: '18px',
    }).setOrigin(1, 0).setDepth(51).setAlpha(0);

    this.add.text(150, 26, `⭐ ${session.score}`, {
      ...FONTS.SMALL, color: '#FFD93D', fontSize: '11px',
    }).setOrigin(0, 0.5).setDepth(51);

    if (session.combo >= 3) {
      this.add.text(220, 26, `🔥 x${session.combo}`, {
        ...FONTS.SMALL, color: '#FF9F43', fontSize: '11px',
      }).setOrigin(0, 0.5).setDepth(51);
    }
  }

  // ================================================================
  //  GAME LOGIC
  // ================================================================

  startGame() {
    this.gameActive = true;

    if (this.darknessText) this.darknessText.destroy();
    if (this.waitText) this.waitText.destroy();
    this.timerText.setAlpha(1);

    const count = this.config.switchCount || 1;
    const positions = this.getSpreadPositions(count);
    positions.forEach((pos, i) => this.createSwitch(pos, i, count));

    if (this.config.sequential) this.flashSequence(positions);

    this.timerEvent = this.time.addEvent({
      delay: 50, callback: this.updateTimer, callbackScope: this, loop: true,
    });

    this.timeoutEvent = this.time.delayedCall(this.config.reactionWindow * 1000, () => {
      if (this.gameActive) this.handleLoss();
    });
  }

  // Seconds since startGame on the SAME clock the loss timeout runs on (Phaser's clamped
  // step delta). `this.time.now` is wall-clock and races ahead in a throttled/background tab.
  elapsedSeconds() {
    return this.timeoutEvent ? this.timeoutEvent.getElapsedSeconds() : 0;
  }

  createSwitch(pos, i, count) {
    const sw = this.add.image(pos.x, pos.y, LTBL_ASSETS.switchOff.key)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    const offScale = LTBL_SWITCH_H / sw.height;
    sw.setScale(0);

    // Soft pool of light so the switch reads against the dark sky
    const glow = this.add.graphics().setDepth(9);
    glow.fillStyle(COLORS.SUNSHINE_YELLOW, 0.18);
    glow.fillCircle(pos.x, pos.y, 62);
    this.tweens.add({ targets: glow, alpha: 0.45, duration: 450, yoyo: true, repeat: -1 });

    const entry = { image: sw, glow, index: i, on: false, x: pos.x, offScale };

    if (this.config.sequential) {
      entry.label = this.add.text(pos.x, pos.y - LTBL_SWITCH_H / 2 - 14, `Day ${i + 1}`, {
        ...FONTS.SMALL, color: '#FFD93D', fontStyle: 'bold', stroke: '#1A1030', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(11);
      entry.badge = this.add.text(pos.x, pos.y + LTBL_SWITCH_H / 2 + 16, `${i + 1}`, {
        ...FONTS.HUD, fontSize: '22px', color: '#FFD93D', stroke: '#1A1030', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(11);
    }

    this.tweens.add({
      targets: sw, scaleX: offScale, scaleY: offScale,
      duration: 200, delay: i * (this.config.sequential ? 150 : 100), ease: 'Back.easeOut',
    });

    this.switches.push(entry);

    sw.on('pointerdown', () => {
      if (!this.gameActive || entry.on) return;

      // Hard mode: has to be the next one in the sequence
      if (this.config.sequential && i !== this.nextSwitchIndex) {
        if (entry.shaking) return;
        entry.shaking = true;
        this.cameras.main.shake(100, 0.02);
        sw.setTint(0xFF6B6B);
        this.tweens.add({
          targets: sw, x: pos.x + 5, duration: 50, yoyo: true, repeat: 3,
          onComplete: () => { sw.x = pos.x; sw.clearTint(); entry.shaking = false; },
        });
        return;
      }

      this.flipOn(entry);
      if (this.switchesOn >= count) this.handleWin();
    });
  }

  flipOn(entry) {
    entry.on = true;
    this.switchesOn++;
    this.nextSwitchIndex++;

    const sw = entry.image;
    this.tweens.killTweensOf(sw);                  // also kills a running wrong-tap shake…
    sw.clearTint();                                // …whose onComplete would have done these
    sw.x = entry.x;
    entry.shaking = false;
    sw.setTexture(LTBL_ASSETS.switchOn.key);
    const onScale = LTBL_SWITCH_H / sw.height;       // ON plate is a different size — fit it, don't pop
    sw.setScale(onScale * 0.9);
    this.tweens.add({ targets: sw, scaleX: onScale, scaleY: onScale, duration: 180, ease: 'Back.easeOut' });

    // Glow brightens and holds
    this.tweens.killTweensOf(entry.glow);
    entry.glow.setAlpha(0.7);

    if (entry.badge) entry.badge.setColor('#2ECC71');
  }

  flashSequence(positions) {
    // Hard mode: show the order once before the clock matters
    this.time.delayedCall(300, () => {
      positions.forEach((pos, i) => {
        this.time.delayedCall(i * 400, () => {
          const flash = this.add.graphics().setDepth(12);
          flash.fillStyle(COLORS.SUNSHINE_YELLOW, 0.4);
          flash.fillCircle(pos.x, pos.y, 55);
          this.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
        });
      });
    });
  }

  getSpreadPositions(count) {
    const positions = [];
    if (count === 1) {
      positions.push({ x: Phaser.Math.Between(180, GAME_WIDTH - 180), y: LTBL_SWITCH_Y + Phaser.Math.Between(-15, 25) });
    } else {
      for (let i = 0; i < count; i++) {
        positions.push({
          x: Math.round(GAME_WIDTH * (i + 1) / (count + 1)),
          y: LTBL_SWITCH_Y + Phaser.Math.Between(-15, 15),
        });
      }
    }
    return positions;
  }

  updateTimer() {
    if (!this.gameActive) return;
    const elapsed = this.elapsedSeconds();
    this.timeRemaining = Math.max(0, this.config.reactionWindow - elapsed);
    this.timerText.setText(this.timeRemaining.toFixed(1) + 's');

    if (this.timeRemaining < 1) this.timerText.setColor('#FF4757');
    else if (this.timeRemaining < 2) this.timerText.setColor('#FFD93D');
  }

  // ================================================================
  //  END STATES
  // ================================================================

  _cleanup() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.timeoutEvent) this.timeoutEvent.remove();
    this.switches.forEach(s => s.image.disableInteractive());
  }

  handleWin() {
    this.gameActive = false;
    const elapsed = this.elapsedSeconds();
    this._cleanup();

    const fast = elapsed < this.config.reactionWindow * 0.7;
    const perfect = this.difficulty === DIFFICULTY.EASY || elapsed < this.config.reactionWindow * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.flipToDay();

    this.time.delayedCall(700, () => {
      const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, '"Let there be light!"', {
        ...FONTS.TITLE, color: '#FFD93D', fontSize: '24px',
        stroke: '#5A3E1B', strokeThickness: 6,
      }).setOrigin(0.5).setAlpha(0).setScale(0.7).setDepth(60);
      this.tweens.add({ targets: t, alpha: 1, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' });
    });

    this.time.delayedCall(2000, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN', gameKey: GAME_KEYS.LET_THERE_BE_LIGHT, points, timeElapsed: elapsed,
      });
    });
  }

  // Night → day: the day plate crossfades in over the night plate, the star hands off to the sun,
  // and a brief warm flash sells the moment. Switch glows fade out — the sky is the light now.
  flipToDay() {
    const flash = this.add.graphics().setDepth(45).setAlpha(0);
    flash.fillStyle(0xFFF4C0, 1);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: flash, alpha: 0.55, duration: 180, yoyo: true, onComplete: () => flash.destroy() });

    this.tweens.add({ targets: this.bgLight, alpha: 1, duration: 650, ease: 'Sine.easeInOut' });

    if (this.twinkle) this.twinkle.stop();
    this.tweens.add({ targets: this.star, alpha: 0, scaleX: 0.001, scaleY: 0.001, duration: 350, ease: 'Back.easeIn' });
    const sunScale = LTBL_SKY_H / this.sun.height;
    this.tweens.add({
      targets: this.sun, alpha: 1, scaleX: sunScale, scaleY: sunScale, angle: 360,
      delay: 250, duration: 550, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({
        targets: this.sun, scaleX: sunScale * 1.05, scaleY: sunScale * 1.05,
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      }),
    });

    this.switches.forEach(s => {
      this.tweens.killTweensOf(s.glow);
      this.tweens.add({ targets: s.glow, alpha: 0, duration: 500 });
    });
  }

  handleLoss() {
    this.gameActive = false;
    this._cleanup();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Too slow!', {
      ...FONTS.TITLE, color: '#E74C3C', stroke: '#4A1414', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(60);

    this.cameras.main.shake(200, 0.02);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS', gameKey: GAME_KEYS.LET_THERE_BE_LIGHT, points: 0,
      });
    });
  }
}
