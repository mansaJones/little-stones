// ============================================
// INSTRUCTION SCENE - How to play (2 seconds)
// ============================================

class InstructionScene extends Phaser.Scene {
  constructor() {
    super('InstructionScene');
  }

  create(data) {
    this.gameKey = data.gameKey;
    this.isFirstGame = data.isFirstGame || false;
    const story = GAME_STORIES[this.gameKey];

    // Background
    this.drawGradientBG(0x302b63, 0x24243e);

    // Gesture animation based on game type
    const gestureMap = {
      [GAME_KEYS.LET_THERE_BE_LIGHT]: { icon: '👆', gesture: 'TAP', anim: 'tap' },
      [GAME_KEYS.NOAHS_ARK]: { icon: '🔄', gesture: 'FLIP & MATCH', anim: 'tap' },
      [GAME_KEYS.TOWER_OF_BABEL]: { icon: '💥', gesture: 'TAP TO DESTROY', anim: 'tap' },
      [GAME_KEYS.WRESTLE_THE_ANGEL]: { icon: '👊', gesture: 'TAP RAPIDLY', anim: 'tap' },
      [GAME_KEYS.WATER_TO_WINE]: { icon: '🖐️', gesture: 'SWIPE OVER THE VASE', anim: 'tap' },
      [GAME_KEYS.ROLL_THE_STONE]: { icon: '👉', gesture: 'DRAG', anim: 'tap' },
      [GAME_KEYS.DANIEL_LIONS_DEN]: { icon: '🏃', gesture: 'DRAG TO DODGE', anim: 'tap' },
      [GAME_KEYS.FIERY_FURNACE]: { icon: '👼', gesture: 'MOVE TO BLOCK', anim: 'tap' },
      [GAME_KEYS.HOUSE_ON_ROCK]: { icon: '🏠', gesture: 'DRAG TO BUILD', anim: 'tap' },
      [GAME_KEYS.DAVID_VS_GOLIATH]: { icon: '🎯', gesture: 'AIM & RELEASE', anim: 'tap' },
      [GAME_KEYS.WALK_AROUND_JERICHO]: { icon: '🚶', gesture: 'TAP TO MARCH', anim: 'tap' },
      [GAME_KEYS.HE_MUST_INCREASE]: { icon: '⬆️', gesture: 'SWIPE TO RESIZE', anim: 'tap' },
      [GAME_KEYS.LOST_SHEEP]: { icon: '🐑', gesture: 'TAP TO SEARCH', anim: 'tap' },
    };

    const info = gestureMap[this.gameKey];

    // LEFT SIDE: Large gesture icon with animation (centered vertically)
    const gestureIcon = this.add.text(100, 187.5, info.icon, { fontSize: '80px' }).setOrigin(0.5);

    // Tap animation
    this.tweens.add({
      targets: gestureIcon,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 300,
      yoyo: true,
      repeat: -1,
      hold: 400,
    });

    // RIGHT SIDE: "How to Play" header
    this.add.text(450, 60, 'How to Play:', {
      ...FONTS.TITLE,
      fontSize: '20px',
      color: '#FFD93D',
    }).setOrigin(0.5, 0);

    // RIGHT SIDE: Instruction text
    const instructionText = session.difficulty === DIFFICULTY.HARD && story.instructionHard
      ? story.instructionHard
      : story.instruction;

    this.add.text(450, 100, instructionText, {
      ...FONTS.BODY,
      fontSize: '16px',
      wordWrap: { width: 200 },
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    // RIGHT SIDE: Gesture label
    this.add.text(450, 200, info.gesture, {
      ...FONTS.COMBO,
      fontSize: '18px',
      color: '#FF9F43',
    }).setOrigin(0.5);

    // BOTTOM CENTER: Progress dots
    this.drawProgressDots(333.5, 295, 1);

    // BOTTOM: Timer bar
    const timerBar = this.add.graphics();
    const barY = 330;
    const barW = 200;
    timerBar.fillStyle(0xffffff, 0.15);
    timerBar.fillRoundedRect(333.5 - barW / 2, barY, barW, 6, 3);

    const fill = this.add.graphics();
    const duration = this.isFirstGame ? 3500 : 2000;

    this.tweens.addCounter({
      from: 0,
      to: barW,
      duration: duration,
      onUpdate: (tween) => {
        fill.clear();
        fill.fillStyle(COLORS.SUNSET_ORANGE, 0.8);
        fill.fillRoundedRect(333.5 - barW / 2, barY, tween.getValue(), 6, 3);
      },
    });

    // BOTTOM: "Get Ready!" countdown
    this.add.text(333.5, 350, 'Get Ready!', {
      ...FONTS.BODY,
      fontSize: '14px',
      color: '#ffffff66',
    }).setOrigin(0.5);

    // BOTTOM: Tap to skip
    this.add.text(333.5, 365, 'Tap to skip', {
      ...FONTS.SMALL,
      fontSize: '12px',
      color: '#ffffff33',
    }).setOrigin(0.5);

    this.advanceTimer = this.time.delayedCall(duration, () => {
      this.advance();
    });

    this.input.once('pointerdown', () => {
      if (this.advanceTimer) this.advanceTimer.remove();
      this.advance();
    });
  }

  advance() {
    this.cameras.main.fade(150, 0, 0, 0);
    this.time.delayedCall(150, () => {
      this.scene.start(this.gameKey, {
        difficulty: session.difficulty,
        config: getAdjustedConfig(this.gameKey, session.difficulty, session.getPerformance()),
      });
    });
  }

  drawProgressDots(x, y, active) {
    const labels = ['Story', 'How to Play', 'Go!'];
    labels.forEach((label, i) => {
      const dx = x - 80 + i * 80;
      const isActive = i === active;
      const g = this.add.graphics();
      g.fillStyle(isActive ? COLORS.SUNSET_ORANGE : 0xffffff, isActive ? 1 : 0.3);
      g.fillCircle(dx, y, isActive ? 6 : 4);
      this.add.text(dx, y + 15, label, {
        ...FONTS.SMALL,
        fontSize: '10px',
        color: isActive ? '#FF9F43' : '#ffffff44',
      }).setOrigin(0.5);
    });
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
      g.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }
  }
}
