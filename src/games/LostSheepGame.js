// ============================================
// FIND THE LOST SHEEP - Tap the hiding spots to find the one lost sheep
// Luke 15:3-7  —  Pastel cel-shaded art plates
// Landscape layout: 667x375
// Gameplay spec: biblical_game_design_doc.md §13   Art: Art_Plate_Prompts.md Scene 13
// ============================================

// Art plates live in assets/games/lost-sheep/. The art doc names assets with underscores; the
// files on disk use hyphens. Mapping, art-doc name -> filename:
//   backdrop plate   -> bg.jpg                 pasture, hills, sky. The left third and the whole
//                                              play area stay EMPTY: every tappable thing is a
//                                              runtime sprite, because the spot count changes per
//                                              tier and the sheep relocates on HARD.
//   lost_sheep       -> sheep.png
//   hide_bush_a      -> bush-a.png
//   hide_bush_b      -> bush-b.png
//   hide_rock        -> rock.png
//   shepherd_search  -> shepherd-search.png    base pose, facing right
//   shepherd_listen  -> shepherd-listen.png    mid-win  (a warm cue just landed)
//   shepherd_call    -> shepherd-call.png      mid-lose AND lose-final
//   shepherd_found   -> shepherd-found.png     win-final, sheep across his shoulders
//   critter_bird     -> critter-bird.png
//   critter_rabbit   -> critter-rabbit.png
//
// NONE OF IT IS REQUIRED TO RUN. Any asset that 404s is replaced by a generated placeholder at
// the same footprint (see ensureTextures), so this game is playable before the art exists and
// needs no code change when it lands — drop the files in and they take over.
const LS_ASSET_PATH = 'assets/games/lost-sheep/';
const LS_ASSETS = {
  bg:     { key: 'ls-bg',     file: 'bg.jpg' },
  sheep:  { key: 'ls-sheep',  file: 'sheep.png' },
  bushA:  { key: 'ls-bush-a', file: 'bush-a.png' },
  bushB:  { key: 'ls-bush-b', file: 'bush-b.png' },
  rock:   { key: 'ls-rock',   file: 'rock.png' },
  search: { key: 'ls-search', file: 'shepherd-search.png' },
  listen: { key: 'ls-listen', file: 'shepherd-listen.png' },
  call:   { key: 'ls-call',   file: 'shepherd-call.png' },
  found:  { key: 'ls-found',  file: 'shepherd-found.png' },
  bird:   { key: 'ls-bird',   file: 'critter-bird.png' },
  rabbit: { key: 'ls-rabbit', file: 'critter-rabbit.png' },
};

// The real art is attempted ONCE per page load. Without this flag preload() re-requests every
// missing file on every round, because textures.exists() stays false after a 404 — eleven failed
// requests per play. The TextureManager is global, so one probe is all we ever need.
let LS_ART_PROBED = false;

// ---- Layout ----
// Jesus stands at the left edge, clear of every hiding spot, so he never covers a tap target and
// the seafoam-skin-vs-sage-foliage readability problem in the art doc stays academic.
// The shepherd runs off the BOTTOM of the stage on purpose. The delivered pose sheet crops the
// top-row figures (search, listen) flat at the quadrant boundary: their robe hems are sliced off
// square, with no outline, and at any on-stage position that reads as a white box under him. The
// hem is unrecoverable from the source, so the frame bottom is parked below the stage edge, where
// a figure leaving frame is just framing. Regenerate the sheet with the figures fully inside their
// quadrants and this can come back up.
const LS_SHEPHERD_X = 96;
const LS_SHEPHERD_FEET = 394;   // = the sprite frame's bottom, 19px below the stage
const LS_SHEPHERD_H = 200;      // display height of the frame; the scale is derived from it

// His right edge must clear every hiding spot or he covers a tap target. At this height the frame
// is ~203 wide, putting his right edge at 197; the leftmost slot's left edge is 208.
const LS_SHEPHERD_SHOULDER_Y = 290;   // where the found sheep is handed over

const LS_SPOT_W = 62;        // display size of a hiding spot at slot scale 1.0
const LS_SPOT_H = 50;
const LS_SHEEP_W = 44;       // must stay comfortably inside LS_SPOT_W or the sheep is never hidden
const LS_SHEEP_H = 36;
const LS_HIT_MIN = 44;       // minimum tap target, per the input model in the design doc

// Slot table. MEASURED OFF THE DELIVERED bg.jpg, not invented. This is the second plate: the
// first had forest down the middle and a shrub at the right edge, which left only a narrow band of
// usable meadow. This one is the pasture Scene 13 actually asks for — open grass across the full
// width from about y=190 down — so the field spreads over the whole lower two thirds of the stage.
//
// How these were found: classify the plate into grass / not-grass (grass is the only GREEN-dominant
// region; brightness is useless here because the whole plate is bright pastel), then keep only
// positions where a spot's whole footprint is at least 97% grass. If the backdrop is replaced
// again, re-run that measurement. Do not hand-nudge these.
//
// y is the BOTTOM of the spot — it stands on the grass — and s sells distance. Rows are spaced so
// no two spots can overlap at any tier: row 0 bottoms at 234 and row 1's tops reach 246, row 1
// bottoms at 296 and row 2's tops reach 300. An overlapped spot is a tap target a child cannot hit.
// Rows are also x-staggered so the field reads as scatter rather than a grid.
//
// Every slot clears the shepherd's right edge (197) as well, or he would cover a tap target.
const LS_SLOTS = [
  { x: 233, y: 234, s: 0.80, row: 0 },
  { x: 300, y: 234, s: 0.80, row: 0 },
  { x: 367, y: 234, s: 0.80, row: 0 },
  { x: 434, y: 234, s: 0.80, row: 0 },
  { x: 501, y: 234, s: 0.80, row: 0 },
  { x: 568, y: 234, s: 0.80, row: 0 },
  { x: 635, y: 234, s: 0.80, row: 0 },
  { x: 264, y: 296, s: 1.00, row: 1 },
  { x: 361, y: 296, s: 1.00, row: 1 },
  { x: 459, y: 296, s: 1.00, row: 1 },
  { x: 556, y: 296, s: 1.00, row: 1 },
  { x: 293, y: 360, s: 1.20, row: 2 },
  { x: 387, y: 360, s: 1.20, row: 2 },
  { x: 481, y: 360, s: 1.20, row: 2 },
  { x: 575, y: 360, s: 1.20, row: 2 },
];
const LS_TAP_DEBOUNCE = 250;  // ms. EASY has no wrong-tap limit, so on EASY this is the ONLY thing
                              // stopping a child from sweeping all four spots in half a second.
const LS_WARM = 0.67;         // cue strength at or above this counts as "warm" — drives the pose
const LS_PLAY_SPAN = 420;     // px across the play area, the normaliser for cue strength

// Style lock (Art_Plate_Prompts.md): uniform outline, flat cel fills, pastel non-human skin.
// Used only by the placeholder generator, but kept here so the stand-ins land in the right
// neighbourhood and a missing asset reads as "art not in yet" rather than "something is broken".
const LS_PAL = {
  ink: 0x1A1A1A,
  skyTop: 0xD9CFF0, skyLow: 0xFFD9C0,
  hillFar: 0xB9B6DE, hillMid: 0xC3DCC0, grass: 0xB9DCB5,
  sage: 0xA9C49A, sageDark: 0x93B084,
  rose: 0xD9B8B4, tan: 0xC8AE93,
  wool: 0xF6EFDF, muzzle: 0xB0A9A3,
  skin: 0xB8E3D4, robe: 0xFBFBF7, sash: 0xE8D39A,
  hair: 0x8A6246, crook: 0xBFA27C,
  blush: 0xF5B5C8, flower: 0xF0B9CF,
  bird: 0xBBD4EC, rabbit: 0xD9C3A5,
};

class LostSheepGame extends Phaser.Scene {
  constructor() {
    super(GAME_KEYS.LOST_SHEEP);
  }

  preload() {
    if (LS_ART_PROBED) return;
    LS_ART_PROBED = true;

    // A missing plate is the expected state until the art ships, so downgrade the loader's
    // complaint to one tidy line instead of letting it look like a fault.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      console.info('[LostSheep] no art for "' + file.key + '" — using a generated placeholder.');
    });

    Object.values(LS_ASSETS).forEach(a => {
      if (!this.textures.exists(a.key)) this.load.image(a.key, LS_ASSET_PATH + a.file);
    });
  }

  create(data) {
    this.config = data.config;
    this.difficulty = data.difficulty;

    this.ensureTextures();

    // ---- Round state. All of it reset here, never at declaration: Phaser reuses the Scene
    // instance across restarts, so anything left on `this` from the last round survives.
    this.gameActive = false;
    this.outcome = null;            // null | 'win' | 'loss'
    this.timeRemaining = this.config.timeLimit;
    this.wrongTaps = 0;
    this.lastTapAt = -Infinity;
    this.lastCue = null;            // 0..1, 1 = right on top of the sheep
    this.hadWarmCue = false;
    this.hasRelocated = false;
    this.pose = null;
    this.spots = [];

    this.add.image(0, 0, LS_ASSETS.bg.key)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.createShepherd();
    this.layOutSpots();
    this.placeSheep();
    this.createHUD();
    this.setPose('search');
    this.drawHUD();

    this.gameStartTime = this.time.now;

    // A short beat before the clock starts, so the field is on screen and readable before the
    // round is already running. Same grace the other games give.
    this.time.delayedCall(500, () => {
      this.gameActive = true;
      if (this.config.peekInterval > 0) this.schedulePeek();
    });
  }

  // ================================================================
  //  Field setup
  // ================================================================

  createShepherd() {
    this.shepherd = this.add.image(LS_SHEPHERD_X, LS_SHEPHERD_FEET, LS_ASSETS.search.key)
      .setOrigin(0.5, 1).setDepth(60);
    this.shepherd.setScale(LS_SHEPHERD_H / this.shepherd.height);
    this.shepherdScale = this.shepherd.scale;
  }

  // Stratified pick: shuffle each depth row, then take one slot at a time round-robin across the
  // rows. Flat random over all twelve can legally hand EASY four slots in the same row, which
  // reads as a bug and makes the field look half-empty.
  pickSlots(n) {
    const byRow = [[], [], []];
    LS_SLOTS.forEach(slot => byRow[slot.row].push(slot));
    byRow.forEach(r => Phaser.Utils.Array.Shuffle(r));

    const picked = [];
    for (let i = 0; picked.length < n && i < LS_SLOTS.length; i++) {
      const row = byRow[i % 3];
      const slot = row[Math.floor(i / 3)];
      if (slot) picked.push(slot);
    }
    return picked;
  }

  // `hide_bush_a` — the plain bush — has not been generated yet. Rather than stand a crude
  // placeholder next to finished art, bush A is bush B MIRRORED: a different silhouette off the
  // same plate, and nobody can tell it is a reuse at sprite size. Delete the fallback the day
  // bush-a.png lands; it takes over on its own.
  spotVariants() {
    const hasA = this.textures.exists(LS_ASSETS.bushA.key);
    return [
      { key: LS_ASSETS.bushB.key, flip: false },
      { key: hasA ? LS_ASSETS.bushA.key : LS_ASSETS.bushB.key, flip: !hasA },
      { key: LS_ASSETS.rock.key, flip: false },
    ];
  }

  layOutSpots() {
    const variants = this.spotVariants();

    // ONE offset for the whole round, then rotate strictly. Re-rolling per spot is how you get a
    // field of eight rocks: the mix becomes random rather than balanced, which is the exact
    // "looks copy-pasted" failure the variants exist to prevent. Rotating gives 3/3/2 at eight
    // spots every time, and the offset keeps consecutive rounds from being identical. Variants
    // are decoration, never a clue — they must stay useless as hints.
    this.variantOffset = Phaser.Math.Between(0, variants.length - 1);

    this.pickSlots(this.config.spotCount).forEach((slot, i) => {
      const v = variants[(i + this.variantOffset) % variants.length];

      const sprite = this.add.image(slot.x, slot.y, v.key)
        .setOrigin(0.5, 1)
        .setDepth(10 + slot.row * 10)
        .setFlipX(v.flip);
      sprite.setDisplaySize(LS_SPOT_W * slot.s, LS_SPOT_H * slot.s);

      // The whole sprite is the hit target, expanded to the 44x44 minimum where it is smaller.
      // A separate zone rather than the sprite itself, because the sprite gets tweened around
      // when it rustles and a moving hit target is a mis-tap waiting to happen.
      const hitW = Math.max(sprite.displayWidth, LS_HIT_MIN);
      const hitH = Math.max(sprite.displayHeight, LS_HIT_MIN);
      const zone = this.add.zone(slot.x, slot.y - sprite.displayHeight / 2, hitW, hitH)
        .setInteractive({ useHandCursor: true });

      const spot = { slot, sprite, zone, tapped: false, critterUsed: false };
      zone.on('pointerdown', () => this.tapSpot(spot));
      this.spots.push(spot);
    });
  }

  placeSheep() {
    this.sheepSpot = Phaser.Utils.Array.GetRandom(this.spots);

    // Layer 1, behind the spot sprites: that is what makes the EASY peek a plain tween of the
    // sheep's own offset out past the spot's edge, with no masking anywhere.
    this.sheep = this.add.image(0, 0, LS_ASSETS.sheep.key).setOrigin(0.5, 1);
    this.moveSheepTo(this.sheepSpot);
  }

  moveSheepTo(spot) {
    this.sheepSpot = spot;
    const s = spot.slot;
    this.sheep.setPosition(s.x, s.y + 2);
    this.sheep.setDisplaySize(LS_SHEEP_W * s.s, LS_SHEEP_H * s.s);
    this.sheep.setDepth(10 + s.row * 10 - 1);
    this.sheep.setAlpha(1);

    // Peek toward open ground: away from the nearer screen edge, so the sliver of cream never
    // slides off stage or behind a neighbouring spot.
    this.peekDir = s.x > GAME_WIDTH * 0.62 ? -1 : 1;
  }

  // ================================================================
  //  EASY peek
  // ================================================================

  schedulePeek() {
    // delayedCall rather than a looping timer: the loop keeps firing through the win beat and
    // tweens a sheep that handleWin has already handed to another tween.
    this.peekTimer = this.time.delayedCall(this.config.peekInterval * 1000, () => {
      if (!this.gameActive) return;
      this.doPeek();
      this.schedulePeek();
    });
  }

  doPeek() {
    const out = this.peekDir * (this.sheep.displayWidth * 0.62);
    this.tweens.add({
      targets: this.sheep,
      x: this.sheepSpot.slot.x + out,
      duration: 420, yoyo: true, hold: 260, ease: 'Sine.easeInOut',
    });
  }

  // ================================================================
  //  Tapping
  // ================================================================

  tapSpot(spot) {
    if (!this.gameActive) return;
    if (this.time.now - this.lastTapAt < LS_TAP_DEBOUNCE) return;
    this.lastTapAt = this.time.now;

    this.nodToward(spot);

    if (spot === this.sheepSpot) {
      this.handleWin(spot);
      return;
    }

    spot.tapped = true;
    this.wrongTaps++;

    // Cue strength is distance from the tapped spot to the sheep, normalised across the play area
    // and inverted, so 1 is right on top of it. Drives the rustle amplitude and the pose. The
    // design doc also maps it to bleat volume — there is no audio system in this build yet, so
    // the visual is currently carrying the cue on its own.
    const d = Phaser.Math.Distance.Between(
      spot.slot.x, spot.slot.y, this.sheepSpot.slot.x, this.sheepSpot.slot.y);
    this.lastCue = Phaser.Math.Clamp(1 - d / LS_PLAY_SPAN, 0, 1);
    if (this.lastCue >= LS_WARM) this.hadWarmCue = true;

    const strength = this.config.hotCold ? this.lastCue : 0.25;
    this.rustle(spot, strength);
    if (this.config.hotCold) this.showCue(spot, this.lastCue);
    if (Math.random() < 0.5) this.releaseCritter(spot);

    // HARD only: the sheep moves once, mid-round. It can only move to a spot the player has NOT
    // already opened — relocating it behind a bush they have proven empty makes the round
    // unwinnable, which is the opposite of the point of this parable.
    if (this.config.relocateAfter > 0 && !this.hasRelocated &&
        this.wrongTaps >= this.config.relocateAfter) {
      this.relocateSheep();
    }

    if (this.config.wrongTapLimit > 0 && this.wrongTaps >= this.config.wrongTapLimit) {
      this.handleLoss();
      return;
    }

    this.setPose(this.poseForState());
    this.drawHUD();
  }

  rustle(spot, strength) {
    const sway = 3 + strength * 11;   // degrees
    this.tweens.killTweensOf(spot.sprite);
    spot.sprite.setAngle(0);
    this.tweens.add({
      targets: spot.sprite,
      angle: { from: -sway, to: sway },
      duration: 70, yoyo: true, repeat: 2,
      onComplete: () => spot.sprite.setAngle(0),
    });
  }

  // A word, not just a stronger rustle. Rustle amplitude alone is a comparison a six-year-old
  // cannot make across two taps several seconds apart, and the audio half of the design doc's
  // cue does not exist yet. Three bands, so it reads at a glance.
  showCue(spot, strength) {
    const band = strength >= LS_WARM ? { t: 'Very warm!', c: '#D24A20' }
               : strength >= 0.42    ? { t: 'Warmer',     c: '#C97A14' }
               :                       { t: 'Cold',       c: '#2F6E9E' };

    const label = this.add.text(spot.slot.x, spot.slot.y - spot.sprite.displayHeight - 6, band.t, {
      ...FONTS.SMALL, fontSize: '14px', fontStyle: 'bold', color: band.c,
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(70);

    // A cue on the outermost slot runs off the edge of the stage at origin 0.5. Pull it back in
    // rather than letting the word get clipped — an unreadable cue is no cue.
    label.x = Phaser.Math.Clamp(label.x, label.displayWidth / 2 + 4,
                                GAME_WIDTH - label.displayWidth / 2 - 4);

    this.tweens.add({
      targets: label, y: label.y - 22, alpha: 0,
      duration: 850, ease: 'Quad.easeOut', onComplete: () => label.destroy(),
    });
  }

  releaseCritter(spot) {
    if (spot.critterUsed) return;

    // Pool whatever shipped. `critter_bird` does not exist yet and has no sensible stand-in, so
    // until it does the rabbit does all the popping out — which is better than half the wrong
    // taps flushing a placeholder blob.
    const pool = [LS_ASSETS.bird.key, LS_ASSETS.rabbit.key].filter(k => this.textures.exists(k));
    if (pool.length === 0) return;
    spot.critterUsed = true;

    const key = Phaser.Utils.Array.GetRandom(pool);
    const bird = key === LS_ASSETS.bird.key;
    const c = this.add.image(spot.slot.x, spot.slot.y - 8, key)
      .setOrigin(0.5, 1).setDepth(10 + spot.slot.row * 10 + 1);
    c.setDisplaySize(30 * spot.slot.s, 28 * spot.slot.s);

    // The bird goes up and off; the rabbit hops sideways along the ground.
    this.tweens.add({
      targets: c,
      x: bird ? c.x + Phaser.Math.Between(-24, 24) : c.x + Phaser.Math.Between(40, 70),
      y: bird ? c.y - 86 : c.y - 2,
      alpha: 0,
      duration: bird ? 900 : 700,
      ease: bird ? 'Sine.easeOut' : 'Quad.easeOut',
      onComplete: () => c.destroy(),
    });
  }

  relocateSheep() {
    const open = this.spots.filter(s => !s.tapped && s !== this.sheepSpot);
    if (open.length === 0) return;   // nothing safe to move to; leave it where it is
    this.hasRelocated = true;

    const target = Phaser.Utils.Array.GetRandom(open);
    this.tweens.killTweensOf(this.sheep);

    // Hide the move, but rustle the destination. The child should feel that something happened
    // out there without being told which bush — that is the whole trick on HARD.
    this.sheep.setAlpha(0);
    this.moveSheepTo(target);
    this.sheep.setAlpha(0);
    this.tweens.add({ targets: this.sheep, alpha: 1, duration: 200, delay: 240 });
    this.time.delayedCall(180, () => this.rustle(target, 0.35));
  }

  nodToward(spot) {
    // Every hiding spot is to the shepherd's right — he lives at the left edge — so there is
    // nothing to flip. A small lean, sized by how far up the field the tap was, is what reads as
    // "he turned to look over there".
    const lean = Phaser.Math.Linear(0.055, -0.03, (spot.slot.y - 234) / 126);
    this.tweens.add({
      targets: this.shepherd, rotation: lean,
      duration: 160, yoyo: true, hold: 240, ease: 'Sine.easeInOut',
    });
  }

  // ================================================================
  //  Poses — a pure function of round state, same pattern as Wrestle the Angel
  // ================================================================

  poseForState() {
    if (this.outcome === 'win') return 'found';
    if (this.outcome === 'loss') return 'call';
    if (this.lastCue !== null && this.lastCue >= LS_WARM) return 'listen';
    const spent = 1 - this.timeRemaining / this.config.timeLimit;
    if (spent > 0.5 && !this.hadWarmCue) return 'call';
    return 'search';
  }

  // Only ever swaps on a real change. setTexture every frame churns the batch for nothing, and
  // re-deriving the scale from the new frame on every tick makes the sprite twitch whenever two
  // poses come back from the generator at even slightly different heights.
  setPose(pose) {
    if (pose === this.pose) return;
    this.pose = pose;
    this.shepherd.setTexture(LS_ASSETS[pose].key);
    this.shepherd.setScale(LS_SHEPHERD_H / this.shepherd.height);
    this.shepherdScale = this.shepherd.scale;
  }

  // ================================================================
  //  Loop
  // ================================================================

  update(time, delta) {
    if (!this.gameActive) return;

    this.timeRemaining -= delta / 1000;
    if (this.timeRemaining <= 0) {
      this.handleLoss();
      return;
    }

    this.setPose(this.poseForState());
    this.drawHUD();
  }

  // ================================================================
  //  HUD
  // ================================================================

  // Built once per scene START, never lazily. Phaser reuses the Scene instance across restarts,
  // so `this.hudTimer` survives as a stale handle to a DESTROYED Text object; a lazy
  // `if (!this.hudTimer)` guard sees a truthy corpse, skips creation, and setText() throws on the
  // second play of the session. This bit it once already in FieryFurnaceGame.
  createHUD() {
    // Dark text on a light halo, not the usual white-on-dark. This scene's sky is pale peach and
    // lavender; white HUD text disappears into it.
    this.hudTimer = this.add.text(GAME_WIDTH / 2, 12, '', {
      ...FONTS.TIMER, fontSize: '26px', color: '#3B3A52',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(80);

    this.hudTaps = this.add.text(GAME_WIDTH - 14, 15, '', {
      ...FONTS.SMALL, color: '#3B3A52', stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(80);
  }

  drawHUD() {
    this.hudTimer.setText(Math.max(0, this.timeRemaining).toFixed(1) + 's');
    this.hudTaps.setText(
      this.config.wrongTapLimit > 0
        ? 'Tries left: ' + Math.max(0, this.config.wrongTapLimit - this.wrongTaps)
        : ''
    );
  }

  // ================================================================
  //  Outcomes
  // ================================================================

  elapsedSeconds() {
    return (this.time.now - this.gameStartTime) / 1000;
  }

  endRound() {
    this.gameActive = false;

    // The HUD sits where the outcome banner goes, and a frozen clock during the win beat is noise
    // on top of a collision. Retire it the moment the round is decided.
    this.hudTimer.setVisible(false);
    this.hudTaps.setVisible(false);

    if (this.peekTimer) this.peekTimer.remove(false);
    this.tweens.killTweensOf(this.sheep);
    this.spots.forEach(s => {
      s.zone.disableInteractive();
      this.tweens.killTweensOf(s.sprite);
      s.sprite.setAngle(0);
    });
  }

  handleWin(spot) {
    this.outcome = 'win';
    const elapsed = this.elapsedSeconds();
    this.endRound();

    const perfect = this.wrongTaps === 0 && this.difficulty !== DIFFICULTY.EASY;
    const fast = elapsed < this.config.timeLimit * 0.5;
    const points = session.calculatePoints(this.difficulty, perfect, fast);

    // The sheep hops clear of the bush, then crosses to the shepherd, who picks it up. The
    // found pose already carries a sheep, so this one is retired on arrival rather than parked
    // next to him looking like a second sheep.
    this.sheep.setDepth(75);
    this.tweens.add({
      targets: this.sheep,
      x: spot.slot.x + this.peekDir * 34, y: spot.slot.y - 16,
      duration: 260, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.sheep,
          x: LS_SHEPHERD_X + 40, y: LS_SHEPHERD_SHOULDER_Y,
          duration: 560, ease: 'Sine.easeInOut',
          onComplete: () => {
            this.setPose('found');
            this.sheep.setVisible(false);
          },
        });
      },
    });

    this.add.text(GAME_WIDTH / 2, 52, 'Found you!', {
      ...FONTS.TITLE, color: '#1E9E55', fontSize: '24px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(80);

    this.add.text(GAME_WIDTH / 2, 84, 'God never stops looking for us.', {
      ...FONTS.BODY, color: '#4A4063', fontSize: '15px',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(80);

    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(400 + i * 55, () => {
        const sparkle = this.add.text(
          LS_SHEPHERD_X + Phaser.Math.Between(-30, 110),
          LS_SHEPHERD_SHOULDER_Y + Phaser.Math.Between(-70, 60),
          '✨', { fontSize: '18px' }).setOrigin(0.5).setDepth(81);
        this.tweens.add({
          targets: sparkle, y: sparkle.y - 34, alpha: 0, duration: 620, ease: 'Quad.easeOut',
        });
      });
    }

    this.time.delayedCall(2100, () => {
      this.scene.start('GameLoopScene', {
        result: 'WIN',
        gameKey: GAME_KEYS.LOST_SHEEP,
        points: points,
        timeElapsed: elapsed,
      });
    });
  }

  handleLoss() {
    this.outcome = 'loss';
    this.endRound();
    this.setPose('call');

    // The sheep is shown, still safe behind its bush, and the shepherd is still calling. Nothing
    // here may suggest the sheep is gone — the whole point of the parable is that it never is.
    // No shake, no red, no failure sting.
    this.sheep.setDepth(75);
    this.tweens.add({
      targets: this.sheep,
      x: this.sheepSpot.slot.x + this.peekDir * (this.sheep.displayWidth * 0.75),
      duration: 420, ease: 'Sine.easeOut',
    });
    this.rustle(this.sheepSpot, 0.8);

    this.add.text(GAME_WIDTH / 2, 52, 'Keep looking!', {
      ...FONTS.TITLE, color: '#C2731A', fontSize: '24px',
      stroke: '#FFFFFF', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(80);

    this.add.text(GAME_WIDTH / 2, 84, 'The shepherd never gives up.', {
      ...FONTS.BODY, color: '#4A4063', fontSize: '15px',
      stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(80);

    this.time.delayedCall(1800, () => {
      this.scene.start('GameLoopScene', {
        result: 'LOSS',
        gameKey: GAME_KEYS.LOST_SHEEP,
        points: 0,
      });
    });
  }

  // ================================================================
  //  Placeholder art
  //
  //  Everything below exists only so the game runs before assets/games/lost-sheep/ is populated.
  //  Each stand-in is generated at the same footprint the real plate will occupy, so the layout
  //  constants above stay valid either way. When a real file lands, textures.exists() is true for
  //  that key and the matching generator is skipped — per asset, so a half-delivered set works.
  //  Deleting this block once the art ships is safe; nothing else calls into it.
  // ================================================================

  // bush-a and critter-bird are deliberately absent from this map. They each have a better
  // fallback than a stand-in: bush A borrows bush B mirrored, and with no bird the rabbit simply
  // does all the work. See spotVariants() and releaseCritter().
  ensureTextures() {
    const gen = {
      [LS_ASSETS.bg.key]:     () => this.genBackdrop(),
      [LS_ASSETS.sheep.key]:  () => this.genSheep(LS_ASSETS.sheep.key),
      [LS_ASSETS.bushB.key]:  () => this.genBush(LS_ASSETS.bushB.key, true),
      [LS_ASSETS.rock.key]:   () => this.genRock(),
      [LS_ASSETS.search.key]: () => this.genShepherd(LS_ASSETS.search.key, 'search'),
      [LS_ASSETS.listen.key]: () => this.genShepherd(LS_ASSETS.listen.key, 'listen'),
      [LS_ASSETS.call.key]:   () => this.genShepherd(LS_ASSETS.call.key, 'call'),
      [LS_ASSETS.found.key]:  () => this.genShepherd(LS_ASSETS.found.key, 'found'),
      [LS_ASSETS.rabbit.key]: () => this.genCritter(LS_ASSETS.rabbit.key, false),
    };
    Object.keys(gen).forEach(key => {
      if (!this.textures.exists(key)) gen[key]();
    });
  }

  gfx() {
    return this.make.graphics({ add: false });
  }

  // Oversized white eye + pupil + blush, the one motif every character in the style lock shares.
  face(g, cx, cy, r) {
    g.fillStyle(0xFFFFFF, 1);
    g.fillEllipse(cx - r * 0.5, cy, r * 0.5, r * 0.66);
    g.fillEllipse(cx + r * 0.5, cy, r * 0.5, r * 0.66);
    g.fillStyle(LS_PAL.ink, 1);
    g.fillCircle(cx - r * 0.5, cy + r * 0.05, r * 0.2);
    g.fillCircle(cx + r * 0.5, cy + r * 0.05, r * 0.2);
    g.fillStyle(LS_PAL.blush, 1);
    g.fillEllipse(cx - r * 1.0, cy + r * 0.5, r * 0.5, r * 0.3);
    g.fillEllipse(cx + r * 1.0, cy + r * 0.5, r * 0.5, r * 0.3);
  }

  genBackdrop() {
    const g = this.gfx();
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    // Placeholder-only. The real plate's horizon is wherever the artist put it and LS_SLOTS is
    // measured against it; this just has to clear the top of row 0 (y=188) so the stand-in field
    // does not float in the sky.
    const LS_HORIZON_Y = 182;

    // Sky: pale lavender at the top running down to warm peach, and the band ends AT the horizon —
    // run it to a fixed 200px and the peach never appears, because the grass covers the bottom
    // half of the gradient.
    const steps = 48;
    const band = LS_HORIZON_Y + 12;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(LS_PAL.skyTop),
        Phaser.Display.Color.ValueToColor(LS_PAL.skyLow),
        100, Math.round(t * 100));
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (band / steps) * i, W, band / steps + 1);
    }

    g.fillStyle(0xFFFFFF, 0.5);
    g.fillEllipse(128, 40, 112, 36);
    g.fillEllipse(486, 30, 140, 32);

    // Far hills, then the mid hill, then the near grass. Each one a flat fill — no gradients on
    // the ground, per the style lock. The grass line is pinned to LS_HORIZON_Y so the back row of
    // hiding spots stands ON it rather than floating above it.
    g.fillStyle(LS_PAL.hillFar, 1);
    g.fillEllipse(120, LS_HORIZON_Y + 52, 440, 120);
    g.fillEllipse(520, LS_HORIZON_Y + 58, 500, 136);
    g.fillStyle(LS_PAL.hillMid, 1);
    g.fillEllipse(350, LS_HORIZON_Y + 70, 740, 140);
    g.fillStyle(LS_PAL.grass, 1);
    g.fillRect(0, LS_HORIZON_Y, W, H - LS_HORIZON_Y);
    g.fillStyle(LS_PAL.hillMid, 1);
    g.fillEllipse(330, LS_HORIZON_Y + 118, 700, 76);

    // The other ninety-nine, in the fold on the far hill. Scenery, never a game object. It has to
    // sit clear ABOVE the back row of slots: level with them it reads as a tappable thing, which
    // is exactly the mistake the art doc warns about.
    const foldY = LS_HORIZON_Y - 26;
    g.fillStyle(LS_PAL.tan, 1);
    g.fillRect(470, foldY, 42, 9);
    g.fillStyle(0xFFFFFF, 0.92);
    for (let i = 0; i < 6; i++) g.fillCircle(475 + i * 7, foldY - 2, 2.6);
    g.lineStyle(1.4, LS_PAL.ink, 1);
    g.strokeRect(470, foldY, 42, 9);

    g.generateTexture(LS_ASSETS.bg.key, W, H);
    g.destroy();
  }

  genSheep(key) {
    const g = this.gfx();
    const W = 120, H = 108;

    g.lineStyle(4, LS_PAL.ink, 1);
    g.fillStyle(LS_PAL.muzzle, 1);
    [[36, 94], [52, 96], [70, 96], [86, 94]].forEach(([x, y]) => {
      g.fillRect(x - 4, y - 22, 8, 22);
      g.strokeRect(x - 4, y - 22, 8, 22);
    });

    // Wool as chunky scalloped bumps, outlined as one silhouette rather than per-bump.
    g.fillStyle(LS_PAL.wool, 1);
    const bumps = [[44, 54, 24], [66, 46, 26], [88, 56, 22], [78, 72, 24], [52, 74, 22]];
    bumps.forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.lineStyle(4, LS_PAL.ink, 1);
    bumps.forEach(([x, y, r]) => g.strokeCircle(x, y, r));
    g.fillStyle(LS_PAL.wool, 1);
    bumps.forEach(([x, y, r]) => g.fillCircle(x, y, r - 2.4));

    g.fillStyle(LS_PAL.muzzle, 1);
    g.fillCircle(30, 58, 21);
    g.lineStyle(4, LS_PAL.ink, 1);
    g.strokeCircle(30, 58, 21);
    g.fillStyle(LS_PAL.muzzle, 1);
    g.fillEllipse(12, 48, 14, 20);
    g.fillEllipse(46, 44, 14, 18);
    g.lineStyle(3, LS_PAL.ink, 1);
    g.strokeEllipse(12, 48, 14, 20);
    g.strokeEllipse(46, 44, 14, 18);
    g.fillStyle(LS_PAL.muzzle, 1);
    g.fillCircle(30, 58, 19);
    this.face(g, 30, 54, 9);

    g.generateTexture(key, W, H);
    g.destroy();
  }

  genBush(key, flowers) {
    const g = this.gfx();
    const W = 160, H = 132;

    // Wider than tall and dense enough to cover the sheep completely at the shared scale —
    // LS_SHEEP_W/H against LS_SPOT_W/H is the check that matters.
    const lumps = flowers
      ? [[48, 78, 42], [82, 58, 46], [116, 80, 38], [66, 96, 36], [100, 98, 34]]
      : [[52, 80, 44], [80, 62, 48], [112, 80, 42], [80, 96, 40]];

    g.fillStyle(LS_PAL.sage, 1);
    lumps.forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.lineStyle(4, LS_PAL.ink, 1);
    lumps.forEach(([x, y, r]) => g.strokeCircle(x, y, r));
    g.fillStyle(LS_PAL.sage, 1);
    lumps.forEach(([x, y, r]) => g.fillCircle(x, y, r - 2.4));

    g.lineStyle(3, LS_PAL.sageDark, 1);
    [[62, 70, 86, 54], [96, 74, 118, 60], [74, 100, 92, 86]].forEach(([a, b, c, d]) =>
      g.lineBetween(a, b, c, d));

    if (flowers) {
      g.fillStyle(LS_PAL.flower, 1);
      [[62, 52], [112, 66]].forEach(([x, y]) => {
        g.fillCircle(x, y, 7);
        g.lineStyle(2.4, LS_PAL.ink, 1);
        g.strokeCircle(x, y, 7);
        g.fillStyle(LS_PAL.sash, 1);
        g.fillCircle(x, y, 2.6);
        g.fillStyle(LS_PAL.flower, 1);
      });
    }

    g.generateTexture(key, W, H);
    g.destroy();
  }

  genRock() {
    const g = this.gfx();
    const W = 160, H = 132;

    g.fillStyle(LS_PAL.rose, 1);
    g.fillRoundedRect(16, 36, 128, 90, { tl: 52, tr: 44, bl: 14, br: 16 });
    g.lineStyle(4, LS_PAL.ink, 1);
    g.strokeRoundedRect(16, 36, 128, 90, { tl: 52, tr: 44, bl: 14, br: 16 });
    g.fillStyle(LS_PAL.tan, 1);
    g.fillRoundedRect(24, 94, 112, 30, { tl: 10, tr: 10, bl: 12, br: 14 });
    g.lineStyle(3, LS_PAL.ink, 0.65);
    g.lineBetween(24, 94, 136, 94);
    g.lineBetween(62, 54, 78, 76);

    g.generateTexture(LS_ASSETS.rock.key, W, H);
    g.destroy();
  }

  genShepherd(key, pose) {
    const g = this.gfx();
    const W = 150, H = 330;
    const cx = 72;

    // Crook, behind him on 'found' (it rests in the crook of an arm there), in hand otherwise.
    if (pose !== 'found') {
      g.lineStyle(9, LS_PAL.crook, 1);
      g.lineBetween(130, 112, 130, 318);
      g.beginPath();
      g.arc(117, 112, 13, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(200), false);
      g.strokePath();
    }

    g.fillStyle(LS_PAL.robe, 1);
    g.fillTriangle(cx - 46, 318, cx + 46, 318, cx, 140);
    g.fillRoundedRect(cx - 26, 136, 52, 90, 14);
    g.lineStyle(4, LS_PAL.ink, 1);
    g.strokeTriangle(cx - 46, 318, cx + 46, 318, cx, 140);

    g.fillStyle(LS_PAL.sash, 1);
    g.fillRect(cx - 28, 212, 56, 13);
    g.lineStyle(3, LS_PAL.ink, 1);
    g.strokeRect(cx - 28, 212, 56, 13);

    // Bare feet
    g.fillStyle(LS_PAL.skin, 1);
    g.fillEllipse(cx - 15, 320, 22, 11);
    g.fillEllipse(cx + 15, 320, 22, 11);
    g.lineStyle(3, LS_PAL.ink, 1);
    g.strokeEllipse(cx - 15, 320, 22, 11);
    g.strokeEllipse(cx + 15, 320, 22, 11);

    // Arm, one per pose. This is the only thing that differs between the four stand-ins, which
    // is also true of the real art: the three edit poses change nothing but the arm.
    g.lineStyle(13, LS_PAL.skin, 1);
    if (pose === 'search')      g.lineBetween(cx + 12, 160, cx + 34, 118);  // shading his eyes
    else if (pose === 'listen') g.lineBetween(cx + 14, 162, cx + 40, 132);  // hand cupped to ear
    else if (pose === 'call')   g.lineBetween(cx + 12, 158, cx + 30, 122);  // beside his mouth
    else                        g.lineBetween(cx - 14, 156, cx - 34, 126);  // holding the legs

    // Head: seafoam, cool blue-green, never a realistic skin tone.
    g.fillStyle(LS_PAL.skin, 1);
    g.fillCircle(cx, 112, 30);
    g.lineStyle(4, LS_PAL.ink, 1);
    g.strokeCircle(cx, 112, 30);
    g.fillStyle(LS_PAL.hair, 1);
    g.fillCircle(cx, 100, 30);
    g.fillRect(cx - 30, 96, 60, 24);
    g.fillStyle(LS_PAL.skin, 1);
    g.fillCircle(cx, 112, 25);
    g.fillStyle(LS_PAL.hair, 1);
    g.fillEllipse(cx, 136, 34, 20);
    g.fillStyle(LS_PAL.skin, 1);
    g.fillEllipse(cx, 130, 22, 12);
    this.face(g, cx, pose === 'found' ? 112 : 110, 11);
    if (pose === 'found') {   // eyes closed in a big happy smile
      g.fillStyle(LS_PAL.skin, 1);
      g.fillRect(cx - 20, 103, 40, 12);
      g.lineStyle(3, LS_PAL.ink, 1);
      g.lineBetween(cx - 16, 110, cx - 6, 110);
      g.lineBetween(cx + 6, 110, cx + 16, 110);
    }

    // Halo: a thin pale gold ring, no glow and no rays.
    g.lineStyle(4, LS_PAL.sash, 1);
    g.strokeEllipse(cx, 70, 46, 13);

    // On 'found' he carries the sheep across his shoulders — same cream wool as the sheep sprite.
    if (pose === 'found') {
      // Across the SHOULDERS, below the chin — any higher and the wool reads as a beard.
      const wool = [[cx - 26, 164, 16], [cx - 2, 158, 18], [cx + 22, 164, 15]];
      g.fillStyle(LS_PAL.wool, 1);
      wool.forEach(([x, y, r]) => g.fillCircle(x, y, r));
      g.lineStyle(4, LS_PAL.ink, 1);
      wool.forEach(([x, y, r]) => g.strokeCircle(x, y, r));
      g.fillStyle(LS_PAL.wool, 1);
      wool.forEach(([x, y, r]) => g.fillCircle(x, y, r - 2.4));
      g.fillStyle(LS_PAL.muzzle, 1);
      g.fillCircle(cx + 38, 166, 11);
      g.lineStyle(3, LS_PAL.ink, 1);
      g.strokeCircle(cx + 38, 166, 11);
    }

    g.generateTexture(key, W, H);
    g.destroy();
  }

  genCritter(key, bird) {
    const g = this.gfx();
    const W = 80, H = 72;

    if (bird) {
      g.fillStyle(LS_PAL.bird, 1);
      g.fillEllipse(40, 42, 48, 38);
      g.fillTriangle(16, 36, 40, 20, 40, 44);
      g.fillTriangle(64, 36, 40, 20, 40, 44);
      g.lineStyle(3.5, LS_PAL.ink, 1);
      g.strokeEllipse(40, 42, 48, 38);
      g.fillStyle(LS_PAL.wool, 1);
      g.fillEllipse(40, 52, 28, 18);
      g.fillStyle(LS_PAL.sash, 1);
      g.fillTriangle(40, 36, 50, 40, 40, 44);
      this.face(g, 40, 34, 8);
    } else {
      g.fillStyle(LS_PAL.rabbit, 1);
      g.fillEllipse(40, 48, 46, 34);
      g.fillEllipse(30, 22, 11, 30);
      g.fillEllipse(44, 20, 11, 32);
      g.lineStyle(3.5, LS_PAL.ink, 1);
      g.strokeEllipse(40, 48, 46, 34);
      g.strokeEllipse(30, 22, 11, 30);
      g.strokeEllipse(44, 20, 11, 32);
      g.fillStyle(LS_PAL.rabbit, 1);
      g.fillEllipse(40, 48, 42, 30);
      g.fillStyle(LS_PAL.wool, 1);
      g.fillCircle(66, 54, 9);
      this.face(g, 38, 44, 8);
    }

    g.generateTexture(key, W, H);
    g.destroy();
  }
}
