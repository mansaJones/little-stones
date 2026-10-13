// ============================================
// SHARED BACKDROP - the pre- and post-game pages wear the mini-game's own level art
// Used by StoryScene and InstructionScene (pre) and GameLoopScene (post).
// ============================================

// gameKey -> the backdrop plate that game already loads for itself, plus the scrim that makes
// white text readable on top of it.
//
// THE TEXTURE KEY MUST MATCH the one the game's own file uses. Match it and the JPEG is decoded
// once and shared: whichever scene reaches it first warms the cache for the other, and the game's
// own `if (!this.textures.exists(...))` guard then skips its load. Get it wrong and the same
// 1334x750 plate sits in GPU memory twice, about 4MB a copy, accumulating across a 20-round
// session. Nothing in the app would complain, so the harness asserts the match statically.
//
// `scrim` is per-plate and NOT a shared constant, which was the first attempt and was wrong. These
// plates run from a near-white pasture to a nearly black furnace interior; one alpha either leaves
// the pale ones illegible or turns the dark ones to mud. Each value is computed, not chosen: white
// body text wants about 4.5:1 contrast, which puts the page behind it at WCAG relative luminance
// <= 0.183, so alpha = (plateLuminance - 0.183) / (plateLuminance - scrimLuminance), clamped to
// [0.22, 0.82]. Every plate below lands at 4.51:1 except the furnace, which is already darker than
// the target and clamps to 0.22 at 7.1:1. Re-measure if a plate is ever redrawn.
//
// null means the game has no plate. DAVID_VS_GOLIATH draws its own gradient at runtime and
// TOWER_OF_BABEL never had art; both fall back to the page's original gradient.
const GAME_BACKDROPS = {
  // Two plates for this one, dark and light. The light one is used here: the dark plate is nearly
  // black, and under any scrim it reads as a blank page rather than as the game's art.
  [GAME_KEYS.LET_THERE_BE_LIGHT]:  { key: 'ltbl-bg-light', file: 'assets/games/let-there-be-light/bg-light.jpg', scrim: 0.80 },
  [GAME_KEYS.NOAHS_ARK]:           { key: 'na-bg',  file: 'assets/games/noahs-ark/bg.jpg',          scrim: 0.56 },
  [GAME_KEYS.TOWER_OF_BABEL]:      null,
  [GAME_KEYS.WRESTLE_THE_ANGEL]:   { key: 'wta-bg', file: 'assets/games/wrestle-the-angel/bg.jpg',  scrim: 0.68 },
  [GAME_KEYS.WATER_TO_WINE]:       { key: 'w2w-bg', file: 'assets/games/water-to-wine/bg.jpg',      scrim: 0.70 },
  [GAME_KEYS.ROLL_THE_STONE]:      { key: 'rts-bg', file: 'assets/games/roll-the-stone/bg.jpg',     scrim: 0.64 },
  [GAME_KEYS.DANIEL_LIONS_DEN]:    { key: 'ld-bg',  file: 'assets/games/lions-den/bg.jpg',          scrim: 0.65 },
  [GAME_KEYS.FIERY_FURNACE]:       { key: 'ff-bg',  file: 'assets/games/fiery-furnace/bg.jpg',      scrim: 0.22 },
  [GAME_KEYS.HOUSE_ON_ROCK]:       { key: 'hr-bg',  file: 'assets/games/house-on-rock/bg.jpg',      scrim: 0.56 },
  [GAME_KEYS.DAVID_VS_GOLIATH]:    null,
  [GAME_KEYS.WALK_AROUND_JERICHO]: { key: 'lj-bg',  file: 'assets/games/jericho/bg.jpg',            scrim: 0.70 },
  [GAME_KEYS.HE_MUST_INCREASE]:    { key: 'li-bg',  file: 'assets/games/he-must-increase/bg.jpg',   scrim: 0.74 },
  [GAME_KEYS.LOST_SHEEP]:          { key: 'ls-bg',  file: 'assets/games/lost-sheep/bg.jpg',         scrim: 0.73 },
  [GAME_KEYS.SAMSON_JAWBONE]:      { key: 'sj-bg',  file: 'assets/games/samson/bg.jpg',             scrim: 0.74 },
};

// Scrim colours. GameLoopScene carried its win/loss signal in a flat background colour, so the
// tint keeps that signal rather than the art replacing it. All three sit within 0.006 relative
// luminance of each other, so the per-plate alphas above hold whichever is used.
const SCRIM_NEUTRAL = 0x16122E;
const SCRIM_WIN     = 0x07240C;
const SCRIM_LOSS    = 0x2A0A12;

// Call from a scene's preload(). Queues only the one plate that scene needs, and only if some
// earlier scene has not already loaded it.
function queueGameBackdrop(scene, gameKey) {
  const bd = GAME_BACKDROPS[gameKey];
  if (!bd || scene.textures.exists(bd.key)) return;
  scene.load.image(bd.key, bd.file);
}

// Call from create(). Returns false if there is no plate, or if it failed to load - the caller
// then draws its original gradient, so a missing or 404ing file degrades to exactly what these
// pages looked like before rather than to a blank screen.
function drawGameBackdrop(scene, gameKey, tintColor) {
  const bd = GAME_BACKDROPS[gameKey];
  if (!bd || !scene.textures.exists(bd.key)) return false;
  scene.add.image(0, 0, bd.key)
    .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-20);
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, tintColor || SCRIM_NEUTRAL, bd.scrim)
    .setOrigin(0).setDepth(-19);

  // A dark band fading up from the bottom edge.
  //
  // The flat scrim is sized for the BODY TEXT, which sits in the middle of the page on plain
  // ground. The small chrome along the bottom - the Story / How to Play / Go! steps, the progress
  // bar, "Tap to skip", the score line - is unstroked grey at 9-12px, and it lands wherever the
  // plate happens to be busiest. On the furnace it fell straight across the painted flames and
  // became unreadable. One band here beats adding a stroke to a dozen text objects across three
  // scenes, and it protects whatever chrome those pages grow later.
  const band = scene.add.graphics().setDepth(-18);
  band.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.55, 0.55);
  band.fillRect(0, GAME_HEIGHT - 95, GAME_WIDTH, 95);
  return true;
}
