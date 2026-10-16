// ============================================
// INSTRUCTION SCENE - How to play. Advances on the button, never on a timer.
// ============================================

class InstructionScene extends Phaser.Scene {
  constructor() {
    super('InstructionScene');
  }

  init(data) {
    this.gameKey = data.gameKey;
    this.isFirstGame = data.isFirstGame || false;
  }

  preload() {
    queueGameBackdrop(this, this.gameKey);
  }

  create(data) {
    const story = GAME_STORIES[this.gameKey];

    if (!drawGameBackdrop(this, this.gameKey)) this.drawGradientBG(0x302b63, 0x24243e);

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
      [GAME_KEYS.WALK_AROUND_JERICHO]: { icon: '🌀', gesture: 'DRAG IN CIRCLES', anim: 'tap' },
      [GAME_KEYS.HE_MUST_INCREASE]: { icon: '⬆️', gesture: 'SWIPE TO RESIZE', anim: 'tap' },
      [GAME_KEYS.LOST_SHEEP]: { icon: '🐑', gesture: 'TAP TO SEARCH', anim: 'tap' },
      [GAME_KEYS.SAMSON_JAWBONE]: { icon: '💪', gesture: 'DRAG TO CHASE', anim: 'tap' },
      [GAME_KEYS.BABY_MOSES]: { icon: '📱', gesture: 'TILT TO STEER', anim: 'tap' },
      [GAME_KEYS.PETER_WATER]: { icon: '✋', gesture: 'PRESS & HOLD', anim: 'tap' },
      [GAME_KEYS.FEEDING_5000]: { icon: '🧺', gesture: 'SLIDE TO CATCH', anim: 'drag' },
      [GAME_KEYS.RED_SEA]: { icon: '🌊', gesture: 'SPREAD TWO FINGERS', anim: 'tap' },
      [GAME_KEYS.NEHEMIAH_WALL]: { icon: '🧱', gesture: 'TAP TO DROP', anim: 'tap' },
      [GAME_KEYS.ZACCHAEUS]: { icon: '🤚', gesture: 'TAP LEFT, THEN RIGHT', anim: 'tap' },
      [GAME_KEYS.JOSEPH_COAT]: { icon: '🎨', gesture: 'WATCH, THEN REPEAT', anim: 'tap' },
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

    // 16px in a 200px column was the smallest readable thing on the page, and it is the one line
    // that tells a six-year-old what to actually do. At 20px it needs a wider column and more
    // headroom: the longest string in the set is 87 characters ("Spread two fingers apart to part
    // the sea, and hold it open while everyone walks across!"), which wraps to four lines, and at
    // the old spacing the fourth line landed on the gesture label. The column is widened to 250 --
    // it spans x 325..575, clear of the gesture icon's 60..140 on the left and the 667 edge on the
    // right -- and the gesture label drops to 224 to make room. Verified against all 39 strings,
    // normal and HARD, not just the one that looked worst.
    this.add.text(450, 96, instructionText, {
      ...FONTS.BODY,
      fontSize: '20px',
      wordWrap: { width: 250 },
      align: 'center',
      lineSpacing: 5,
    }).setOrigin(0.5, 0);

    // RIGHT SIDE: Gesture label
    this.add.text(450, 224, info.gesture, {
      ...FONTS.COMBO,
      fontSize: '18px',
      color: '#FF9F43',
    }).setOrigin(0.5);

    // BOTTOM CENTER: Progress dots
    this.drawProgressDots(333.5, 285, 1);

    // Nothing moves until the button is pressed. The 2000ms auto-advance (3500 on the first game)
    // gave a child two seconds to read the instruction they had just been given, and the "Tap to
    // skip" hint meant a stray thumb skipped it entirely. Timer bar, "Get Ready!" and the hint are
    // all gone with it.
    const btnY = 342;
    const btn = this.add.image(333.5, btnY, 'btn-play')
      .setDisplaySize(210, 46)
      .setInteractive({ useHandCursor: true });
    this.add.text(333.5, btnY, "LET'S GO  \u25B6", {
      ...FONTS.BUTTON, fontSize: '16px',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      // §15: iOS only hands over device motion if requestPermission() is called from a user
      // gesture, and it names this screen's tap as the place to do it. That tap is now this
      // button, so the call moves here with it -- Baby Moses is unplayable on an iPhone without
      // it. A no-op on every other game and on every platform without the gate.
      if (this.gameKey === GAME_KEYS.BABY_MOSES && typeof BMMotion !== 'undefined') BMMotion.request();
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
      // Spans the CANVAS, not the stage, so there is no unpainted bleed around it.
      g.fillRect(-STAGE_X, -STAGE_Y + (CANVAS_HEIGHT / steps) * i,
                 CANVAS_WIDTH, CANVAS_HEIGHT / steps + 1);
    }
  }
}
