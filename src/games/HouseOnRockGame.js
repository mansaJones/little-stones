// ============================================
// HOUSE ON ROCK vs SAND - Drag the house onto the rock before the storm
// Matthew 7:24-27  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: docs/biblical_game_design_doc.md §7
// Art spec:      docs/Art_Plate_Prompts.md Scene 9
// ============================================

// Art plates live in assets/games/house-on-rock/
//   bg.jpg     — the split landscape. Rock on the LEFT, sand on the RIGHT, the seam dead centre.
//                The delivered panel is 1972x1386 against a 16:9 stage, so it is cropped
//                vertically and CENTRED: keeping the bottom crushes the sky the storm needs,
//                keeping the top loses the floodwater.
//   house.png  — the draggable house. The only moving part in the scene.
const HR_ASSET_PATH = 'assets/games/house-on-rock/';
const HR_ASSETS = {
  bg:    { key: 'hr-bg',    file: 'bg.jpg' },
  house: { key: 'hr-house', file: 'house.png' },
};

// Attempted once per page load; without this every missing file is re-requested every round,
// because textures.exists() stays false after a 404.
let HR_ART_PROBED = false;

// ---- Layout, MEASURED off bg.jpg rather than chosen ----
// The storm front falls on the exact centre of the plate, which is also the boundary between the
// rock ground and the sand.
const HR_SEAM_X = 333;

// The rock plateau. Its top surface is very nearly flat but not quite: it runs from y=134 at the
// left frame edge down to y=150 at x=240, where the face drops away. The house follows that slope
// so it looks planted rather than hovering.
const HR_ROCK = { x0: 8, x1: 238, yLeft: 134, yRight: 150 };

// The sand. Its top edge wanders between y=175 and y=192 across the right half, so the landing
// band is generous rather than a line — which is correct: landing on sand is supposed to be the
// easy mistake, not a precision feat.
const HR_SAND = { x0: 345, x1: 648, yTop: 168, yBottom: 358 };

// Between the rock's right face (x=238) and the seam (x=333) is plain brown ground, which is
// neither foundation. That gap is deliberate: ~95px of dead space between the two targets, so a
// six-year-old aiming for the rock does not clip the sand.

const HR_HOUSE_W = 66;
const HR_START_X = HR_SEAM_X;
const HR_START_Y = 108;          // feet, up in the cloud band above the seam
const HR_GRAB_PAD = 18;          // how far outside the sprite still counts as grabbing it
const HR_MIN_Y = 44;
const HR_MAX_Y = 362;

// HARD only. The house is sprung toward the finger rather than pinned to it, so a steady wind
// holds it a constant distance downwind and the player has to drag past the rock to land on it.
// At the peak wind below the lag is about 22px against a 230px-wide plateau — felt, but fair.
const HR_FOLLOW_K = 9;

// Wind ramps across the round: "wind force increases over time" (§7, Progressive Elements). 1.0x
// at the start to 2.5x at the buzzer. That ramp is also what makes "house blown off screen" a
// reachable lose condition — ignore the house entirely and it leaves the frame before the clock.
const HR_WIND_RAMP = 1.5;

// How dark the storm gets by the time the clock runs out. The clouds are baked into the plate, so
// "storm clouds gather as the timer counts down" is carried by the scene closing in rather than by
// new cloud art.
const HR_STORM_ALPHA = 0.3;

class HouseOnRockGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.HOUSE_ON_ROCK);
  }

  preload() {
    if (HR_ART_PROBED) return;
    HR_ART_PROBED = true;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[HouseOnRock] no art for "' + file.key + '" — using a generated placeholder.');
    });
    Object.values(HR_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, HR_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;      // STRING: 'easy' | 'medium' | 'hard'

    this.ensureTextures();

    // ---- Round state. All of it reset here, never at declaration: Phaser reuses the Scene
    // instance across restarts, so anything left on `this` survives into the next round as a
    // stale handle to a destroyed GameObject.
    this.phase = 'intro';                   // intro -> play -> over
    this.outcome = null;
    this.timeRemaining = this.config.timeLimit;
    this.dragging = false;
    this.dragTargetX = HR_START_X;
    this.dragTargetY = HR_START_Y;
    this.grabOffsetX = 0;
    this.grabOffsetY = 0;
    this.windNow = 0;
    this.returning = false;
    this.prompt = null;

    this.add.image(0, 0, HR_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createLabels();
    this.createHouse();
    this.createStorm();
    this.createHUD();
    this.drawHUD();

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);

    this.showPrompt(this.difficulty === DIFFICULTY.HARD
      ? 'Fight the wind — build on the rock!'
      : 'Drag the house onto the rock!');

    this.gameStartTime = this.time.now;
    this.time.delayedCall(500, () => { if (!this.outcome) this.phase = 'play'; });
  }

  // ================================================================
  //  The two foundations
  // ================================================================

  // The plateau is not level. Interpolating across it is the difference between a house that sits
  // on the rock and one that floats a few pixels above its right-hand end.
  rockSurfaceY(x) {
    const t = Phaser.Math.Clamp((x - HR_ROCK.x0) / (HR_ROCK.x1 - HR_ROCK.x0), 0, 1);
    return HR_ROCK.yLeft + t * (HR_ROCK.yRight - HR_ROCK.yLeft);
  }

  // The house's origin is (0.5, 1), so house.y IS the feet. Everything below tests that point.
  onRock(x, y) {
    if (x < HR_ROCK.x0 || x > HR_ROCK.x1) return false;
    const s = this.rockSurfaceY(x);
    return y > s - 24 && y < s + 30;
  }

  onSand(x, y) {
    return x >= HR_SAND.x0 && x <= HR_SAND.x1 && y >= HR_SAND.yTop && y <= HR_SAND.yBottom;
  }

  createLabels() {
    // EASY only, per config.labelsVisible. §7 wants MEDIUM to be "both look similar", but the
    // delivered plate is a grey rock beside golden sand — they could not look less similar, and no
    // runtime trick makes them match. So MEDIUM's step up is losing the labels and a second off
    // the clock, and the rain falling on the sand side only is the standing clue §7 asks for.
    if (!this.config.labelsVisible) return;
    // Written ON each foundation, not floating above it. Floating, the ROCK label sat at exactly
    // the height a correctly-placed house occupies, so a win left its white stroke poking out from
    // behind the roof like a rendering fault. On the surfaces they also read as what they are:
    // the label names the thing it is written on.
    const style = { ...FONTS.TITLE, fontSize: '19px', stroke: '#FFFFFF', strokeThickness: 5 };
    this.add.text(150, 228, 'ROCK', { ...style, color: '#2F3A46' })
      .setOrigin(0.5).setDepth(40);
    this.add.text(500, 252, 'SAND', { ...style, color: '#9A6A14' })
      .setOrigin(0.5).setDepth(40);
  }

  createHouse() {
    this.house = this.add.image(HR_START_X, HR_START_Y, HR_ASSETS.house.key)
      .setOrigin(0.5, 1).setDepth(60);
    this.house.setScale(HR_HOUSE_W / this.house.width);
    this.houseH = this.house.displayHeight;

    // A small idle bob, so an untouched house reads as "floating, waiting to be placed" rather
    // than as a scene that has not started.
    this.bob = this.tweens.add({
      targets: this.house, y: HR_START_Y + 7,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  createStorm() {
    this.storm = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x2B2F4A)
      .setOrigin(0).setDepth(80).setAlpha(0);
  }

  // ================================================================
  //  Input
  // ================================================================

  holdsHouse(px, py) {
    const halfW = this.house.displayWidth / 2 + HR_GRAB_PAD;
    return Math.abs(px - this.house.x) <= halfW
        && py >= this.house.y - this.houseH - HR_GRAB_PAD
        && py <= this.house.y + HR_GRAB_PAD;
  }

  handlePointerDown(pointer) {
    if (this.phase !== 'play') return;
    if (!this.holdsHouse(pointer.x, pointer.y)) return;

    if (this.bob) { this.bob.stop(); this.bob = null; }
    this.tweens.killTweensOf(this.house);
    this.returning = false;
    this.dragging = true;
    // Grab by the point that was actually touched, so the house does not jump under the finger.
    this.grabOffsetX = this.house.x - pointer.x;
    this.grabOffsetY = this.house.y - pointer.y;
    this.dragTargetX = this.house.x;
    this.dragTargetY = this.house.y;
  }

  handlePointerMove(pointer) {
    if (!this.dragging || this.phase !== 'play') return;
    this.dragTargetX = pointer.x + this.grabOffsetX;
    this.dragTargetY = Phaser.Math.Clamp(pointer.y + this.grabOffsetY, HR_MIN_Y, HR_MAX_Y);
  }

  handlePointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.phase !== 'play') return;

    const x = this.house.x, y = this.house.y;
    if (this.onRock(x, y)) { this.handleWin(); return; }
    if (this.onSand(x, y)) { this.handleLoss('sand'); return; }

    // Released over neither foundation. Doing nothing here reads as a broken control to a child,
    // so the house goes back to where it started and the round carries on. On HARD the wind picks
    // it up again from there, which is punishment enough.
    this.returning = true;
    this.tweens.add({
      targets: this.house, x: HR_START_X, y: HR_START_Y,
      duration: 260, ease: 'Sine.easeOut',
      onComplete: () => { this.returning = false; },
    });
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (this.phase !== 'play') return;
    const dt = delta / 1000;                // Phaser 3 passes (time, delta)

    this.timeRemaining -= dt;

    // "Wind force increases over time", §7. The old build read `this.difficulty === 2` to decide
    // whether to apply wind at all — but difficulty is a STRING here, so that test never passed
    // and HARD had no wind in it whatsoever.
    const spent = 1 - Phaser.Math.Clamp(this.timeRemaining / this.config.timeLimit, 0, 1);
    this.windNow = (this.config.windForce || 0) * (1 + HR_WIND_RAMP * spent);

    if (this.dragging) {
      if (this.windNow > 0) {
        // Sprung, not pinned: a steady wind then holds the house a fixed distance downwind of the
        // finger and the player has to aim past the rock. Pinning it to the pointer would make the
        // wind invisible for as long as it was held, which is most of the round.
        const k = Math.min(HR_FOLLOW_K * dt, 1);
        this.house.x += (this.dragTargetX - this.house.x) * k;
        this.house.y += (this.dragTargetY - this.house.y) * k;
      } else {
        this.house.setPosition(this.dragTargetX, this.dragTargetY);
      }
    }

    // Wind blows whether or not the house is held — that is what "fight resistance" means.
    if (this.windNow > 0 && !this.returning) {
      this.house.x += this.windNow * dt;
      if (this.house.x > GAME_WIDTH + 50) { this.handleLoss('blown'); return; }
    }
    this.house.y = Phaser.Math.Clamp(this.house.y, HR_MIN_Y, HR_MAX_Y);

    this.storm.setAlpha(HR_STORM_ALPHA * spent);
    if (this.timeRemaining <= 0) { this.handleLoss('time'); return; }
    this.drawHUD();
  }

  // ================================================================
  //  HUD
  //
  //  Built once in create(), never lazily. The version this replaced also drew hearts, score and
  //  combo here and never updated any of them — those live on `session`, and GameLoopScene shows
  //  them between rounds.
  // ================================================================

  createHUD() {
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 8, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#2E3344',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(90);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
  }

  showPrompt(text) {
    this.prompt = this.add.text(GAME_WIDTH / 2, 356, text, {
      ...FONTS.TITLE, color: '#FFFFFF', fontSize: '18px',
      stroke: '#2E3344', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(90);
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.phase = 'over';
    this.dragging = false;
    if (this.bob) { this.bob.stop(); this.bob = null; }
    this.tweens.killTweensOf(this.house);
    if (this.prompt) { this.prompt.destroy(); this.prompt = null; }
    this.hudTimer.setVisible(false);
  }

  handleWin() {
    if (this.outcome) return;
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    this.endRound();

    // Settle it exactly onto the plateau. Dropping it within the tolerance band is the player's
    // job; sitting flush on the rock is the scene's.
    const restY = this.rockSurfaceY(this.house.x);
    this.tweens.add({
      targets: this.house, y: restY, duration: 220, ease: 'Quad.easeOut',
    });
    this.storm.setAlpha(0);

    // §7 asks for "family safe" here. A heart, not the four-person family emoji: that one is a
    // three-ZWJ sequence and any platform missing it draws four separate boxes instead of a
    // family, which is what headless Chromium does.
    const heart = this.add.text(this.house.x, restY - this.houseH - 12, '❤️', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(85).setAlpha(0);
    this.tweens.add({
      targets: heart, alpha: 1, y: heart.y - 10, duration: 460, ease: 'Back.easeOut',
    });

    this.add.text(GAME_WIDTH / 2, 348, 'Your house stands firm!', {
      ...FONTS.TITLE, color: '#1E9E55', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(95);

    const fast = elapsed < this.config.timeLimit * 0.65;
    const perfect = elapsed < this.config.timeLimit * 0.45;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    this.time.delayedCall(1800, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.HOUSE_ON_ROCK,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss(reason) {
    if (this.outcome) return;
    this.outcome = 'loss';
    this.endRound();
    this.storm.setAlpha(HR_STORM_ALPHA);

    if (reason === 'sand') {
      // §7: "Place house on sand (house collapses in storm)".
      this.tweens.add({
        targets: this.house, angle: 22, y: this.house.y + 16, alpha: 0.35,
        duration: 520, ease: 'Quad.easeIn',
      });
      this.cameras.main.shake(380, 0.009);
    } else if (reason === 'blown') {
      this.house.setVisible(false);
    }

    const msg = reason === 'blown' ? 'The wind carried it away!'
              : reason === 'time'  ? 'The storm hit first!'
              :                      'Build on solid ground!';
    this.add.text(GAME_WIDTH / 2, 348, msg, {
      ...FONTS.TITLE, color: '#E8533A', fontSize: '21px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(95);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.HOUSE_ON_ROCK,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Only reached if assets/games/house-on-rock/ is missing or incomplete. The real plates
  //  shipped, so this exists to keep a broken checkout playable, not to be looked at.
  // ================================================================

  ensureTextures() {
    const ink = 0x1A1A1A;

    if (!this.textures.exists(HR_ASSETS.bg.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xA9A4C6, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xE8C878, 1);
      g.fillRect(HR_SEAM_X, HR_SAND.yTop + 14, GAME_WIDTH - HR_SEAM_X, GAME_HEIGHT);
      g.fillStyle(0xB2A98E, 1);
      g.fillRect(0, 177, HR_SEAM_X, GAME_HEIGHT - 177);
      g.fillStyle(0x9AA1AC, 1);
      g.fillRect(0, HR_ROCK.yLeft, HR_ROCK.x1, 190);
      g.lineStyle(5, ink, 1);
      g.strokeRect(-6, HR_ROCK.yLeft, HR_ROCK.x1 + 6, 190);
      g.generateTexture(HR_ASSETS.bg.key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }

    if (!this.textures.exists(HR_ASSETS.house.key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xF3E6C8, 1);
      g.fillRect(16, 60, 108, 80);
      g.fillStyle(0xC08A8A, 1);
      g.fillTriangle(6, 62, 70, 10, 134, 62);
      g.fillStyle(0xC9A063, 1);
      g.fillRect(58, 96, 26, 44);
      g.lineStyle(6, ink, 1);
      g.strokeRect(16, 60, 108, 80);
      g.strokeTriangle(6, 62, 70, 10, 134, 62);
      g.generateTexture(HR_ASSETS.house.key, 140, 146);
      g.destroy();
    }
  }
}
