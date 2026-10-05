// ============================================
// GAME CONFIG - Centralized difficulty parameters
// ============================================

const GAME_CONFIG = {
  letThereBeLight: {
    // switchCount switches appear; all must be flipped on. sequential = Day 1 → 2 → 3 order.
    easy:   { reactionWindow: 2.0, switchCount: 1, sequential: false },
    medium: { reactionWindow: 2.5, switchCount: 2, sequential: false },
    hard:   { reactionWindow: 3.0, switchCount: 3, sequential: true  },
  },
  noahsArk: {
    easy:   { pairs: 3, timeLimit: 30, peekTime: 2.0, gridCols: 3, gridRows: 2 },
    medium: { pairs: 5, timeLimit: 25, peekTime: 1.0, gridCols: 5, gridRows: 2 },
    hard:   { pairs: 8, timeLimit: 20, peekTime: 1.0, gridCols: 4, gridRows: 4 },
  },
  towerOfBabel: {
    easy:   { targetBlocks: 5,  timeLimit: 6.0, buildSpeed: 0.8, blockHP: 1 },
    medium: { targetBlocks: 8,  timeLimit: 5.0, buildSpeed: 1.2, blockHP: 1 },
    hard:   { targetBlocks: 10, timeLimit: 4.0, buildSpeed: 1.8, blockHP: 2 },
  },
  wrestleTheAngel: {
    easy:   { targetTaps: 15, timeLimit: 5.0, pushBackChance: 0 },
    medium: { targetTaps: 20, timeLimit: 4.0, pushBackChance: 0.15 },
    hard:   { targetTaps: 25, timeLimit: 3.0, pushBackChance: 0.25 },
  },
  waterToWine: {
    // Paint the vase red by swiping over it. brushRadius is in stage px; winCoverage is the
    // painted fraction that counts as "the whole vase" (snaps to full); drainRate is the
    // fraction of paint lost per second while the finger is idle (hard only).
    easy:   { timeLimit: 8.0, brushRadius: 34, winCoverage: 0.80, drainRate: 0 },
    medium: { timeLimit: 7.0, brushRadius: 26, winCoverage: 0.80, drainRate: 0 },
    hard:   { timeLimit: 9.0, brushRadius: 22, winCoverage: 0.80, drainRate: 0.35 },
  },
  rollTheStone: {
    easy:   { targetPercent: 80, timeLimit: 5.0, weight: 0.3, obstacles: false },
    medium: { targetPercent: 100, timeLimit: 4.0, weight: 0.6, obstacles: false },
    hard:   { targetPercent: 100, timeLimit: 4.0, weight: 0.6, obstacles: true },
  },
  danielLionsDen: {
    easy:   { lionCount: 2, surviveTime: 5.0, lionSpeed: 60 },
    medium: { lionCount: 3, surviveTime: 7.0, lionSpeed: 90 },
    hard:   { lionCount: 4, surviveTime: 10.0, lionSpeed: 120 },
  },
  fieryFurnace: {
    // Difficulty is ONE dial: how many fireballs are in the air at once. Everything else is
    // identical across tiers on purpose — speed, angel radius, angel speed and round length
    // all stay fixed so the only thing that changes is crowding.
    //
    // spawnInterval is short and constant so the field fills to maxActive and STAYS there; the
    // cap is the binding constraint, not the spawn rate. A fireball crosses in roughly 3.5s at
    // this speed, so 0.45s keeps even 6 slots saturated.
    //
    // allowedHits still varies. It is a second dial and could be flattened to 0 across the
    // board if you want crowding to be the whole story.
    easy:   { surviveTime: 8.0, spawnInterval: 0.45, fireballSpeed: 100, maxActive: 2, allowedHits: 2, angelRadius: 38, angelSpeed: 320 },
    medium: { surviveTime: 8.0, spawnInterval: 0.45, fireballSpeed: 100, maxActive: 4, allowedHits: 1, angelRadius: 38, angelSpeed: 320 },
    hard:   { surviveTime: 8.0, spawnInterval: 0.45, fireballSpeed: 100, maxActive: 6, allowedHits: 0, angelRadius: 38, angelSpeed: 320 },
  },
  houseOnRock: {
    easy:   { timeLimit: 4.0, windForce: 0, labelsVisible: true },
    medium: { timeLimit: 3.0, windForce: 0, labelsVisible: false },
    hard:   { timeLimit: 3.0, windForce: 80, labelsVisible: false },
  },
  davidVsGoliath: {
    easy:   { attempts: 3, goliathSpeed: 0, aimLineVisible: true, timeLimit: 10.0 },
    medium: { attempts: 2, goliathSpeed: 0, aimLineVisible: true, timeLimit: 8.0 },
    hard:   { attempts: 1, goliathSpeed: 40, aimLineVisible: false, timeLimit: 6.0 },
  },
  walkAroundJericho: {
    easy:   { laps: 7, timeLimit: 10.0, autoWalk: true, obstacles: false },
    medium: { laps: 7, timeLimit: 8.0, autoWalk: false, obstacles: false },
    hard:   { laps: 7, timeLimit: 6.0, autoWalk: false, obstacles: true },
  },
  heMustIncrease: {
    easy:   { targetGodMin: 70, targetGodMax: 100, timeLimit: 5.0, revertRate: 0 },
    medium: { targetGodMin: 80, targetGodMax: 90, timeLimit: 4.0, revertRate: 0 },
    hard:   { targetGodMin: 90, targetGodMax: 95, timeLimit: 3.0, revertRate: 5 },
  },
  lostSheep: {
    // Difficulty is mainly ONE dial: how many hiding spots are on the field. The round shortens
    // alongside it, and the help degrades — a free visual peek on easy, a hot/cold cue on medium
    // and hard, plus one mid-round relocation on hard so "I already checked that bush" stops
    // being reliable.
    //
    // Zero means off throughout, matching windForce/drainRate/goliathSpeed elsewhere:
    // peekInterval 0 = no peek, wrongTapLimit 0 = unlimited wrong taps, relocateAfter 0 = the
    // sheep never moves. relocateAfter N = move once, on the Nth wrong tap.
    //
    // The round length is called timeLimit so getAdjustedConfig's adaptive scaling picks it up.
    // spotCount and wrongTapLimit are deliberately NOT scaled — the field should look the same
    // every time a child sees a given tier, or they can never learn it.
    easy:   { spotCount: 4, timeLimit: 8.0, peekInterval: 2.0, wrongTapLimit: 0, hotCold: false, relocateAfter: 0 },
    medium: { spotCount: 6, timeLimit: 6.0, peekInterval: 0,   wrongTapLimit: 4, hotCold: true,  relocateAfter: 0 },
    hard:   { spotCount: 8, timeLimit: 5.0, peekInterval: 0,   wrongTapLimit: 3, hotCold: true,  relocateAfter: 2 },
  },
};

// Story context for each game
const GAME_STORIES = {
  [GAME_KEYS.LET_THERE_BE_LIGHT]: {
    title: "Let There Be Light",
    reference: "Genesis 1:3",
    story: "God said 'Let there be light' and created light from darkness. He creates everything!",
    successMessage: "You brought the light! Just like God fills the world with brightness.",
    failMessage: "It's still dark! Try to be quicker next time!",
    instruction: "Tap every light switch that appears!",
    instructionHard: "Tap the switches in the right order!",
  },
  [GAME_KEYS.NOAHS_ARK]: {
    title: "Noah's Ark",
    reference: "Genesis 7:9",
    story: "Noah brought animals onto the ark two by two. Can you match them all?",
    successMessage: "All animals aboard! The ark is ready to sail!",
    failMessage: "Some animals missed the boat! Try matching faster!",
    instruction: "Flip cards to find matching animal pairs!",
  },
  [GAME_KEYS.TOWER_OF_BABEL]: {
    title: "Tower of Babel",
    reference: "Genesis 11:1-9",
    story: "People tried to build a tower to reach heaven. Tap the blocks to bring it down!",
    successMessage: "The tower has fallen! God teaches us humility.",
    failMessage: "The tower reached too high! Tap faster next time!",
    instruction: "Tap the blocks to destroy the tower before it reaches the top!",
  },
  [GAME_KEYS.WRESTLE_THE_ANGEL]: {
    title: "Wrestle the Angel",
    reference: "Genesis 32:24-26",
    story: "Jacob wrestled with an angel all night and wouldn't give up. God blessed him for his determination!",
    successMessage: "You persevered! God blesses those who don't give up!",
    failMessage: "The angel was too strong! Keep trying!",
    instruction: "Tap the screen as fast as you can!",
    instructionHard: "Tap fast — but watch out for push-backs!",
  },
  [GAME_KEYS.WATER_TO_WINE]: {
    title: "Water to Wine",
    reference: "John 2:1-11",
    story: "At a wedding, Jesus performed his first miracle by turning water into wine!",
    successMessage: "The water is now wine! What an amazing miracle!",
    failMessage: "Still just water! Keep swiping!",
    instruction: "Swipe all over the vase to turn the water into wine!",
    instructionHard: "Swipe all over the vase — but the color drains back if you stop!",
  },
  [GAME_KEYS.ROLL_THE_STONE]: {
    title: "Roll the Stone Away",
    reference: "Luke 24:2",
    story: "When Jesus rose from the dead, the heavy stone was rolled away from the tomb. A miracle!",
    successMessage: "He is risen! The tomb is open!",
    failMessage: "The stone is too heavy! Try again!",
    instruction: "Drag the stone to open the tomb!",
    instructionHard: "Drag the stone — dodge the falling rocks!",
  },
  [GAME_KEYS.DANIEL_LIONS_DEN]: {
    title: "Daniel in the Lions' Den",
    reference: "Daniel 6",
    story: "Daniel trusted God even in a den of hungry lions. God kept him safe all night!",
    successMessage: "God protected Daniel! The lions didn't touch him!",
    failMessage: "A lion caught Daniel! Try to dodge better!",
    instruction: "Drag Daniel to avoid the lions!",
  },
  [GAME_KEYS.FIERY_FURNACE]: {
    title: "The Fiery Furnace",
    reference: "Daniel 3:25",
    story: "Shadrach, Meshach and Abednego were thrown into the hottest furnace — and God sent a fourth figure to walk with them in the fire.",
    successMessage: "Not one of them was harmed! God walked with them in the fire.",
    failMessage: "A fireball got through! Stay closer to the boys!",
    instruction: "Move the angel to block the fireballs!",
    instructionHard: "Block them all — nothing gets through!",
  },
  [GAME_KEYS.HOUSE_ON_ROCK]: {
    title: "House on Rock vs Sand",
    reference: "Matthew 7:24-27",
    story: "Jesus taught that wise people build their house on solid rock, not shifting sand!",
    successMessage: "Smart builder! Your house stands firm on the rock!",
    failMessage: "The house fell! Build on solid ground next time!",
    instruction: "Drag the house onto the rock foundation!",
    instructionHard: "Drag to the rock — fight the wind!",
  },
  [GAME_KEYS.DAVID_VS_GOLIATH]: {
    title: "David vs Goliath",
    reference: "1 Samuel 17",
    story: "Young David defeated the giant Goliath with just a sling and a stone. God gives courage!",
    successMessage: "Direct hit! The giant falls! God gives courage to the faithful!",
    failMessage: "The stone missed! Aim carefully, David!",
    instruction: "Pull back the sling and release to hit Goliath!",
    instructionHard: "One shot — Goliath is moving!",
  },
  [GAME_KEYS.WALK_AROUND_JERICHO]: {
    title: "Walk Around Jericho",
    reference: "Joshua 6:15",
    story: "Joshua and the Israelites walked around Jericho's walls 7 times, then the walls fell down!",
    successMessage: "The walls have fallen! God is mighty!",
    failMessage: "Not enough laps! Keep marching!",
    instruction: "Tap to march around the walls 7 times!",
    instructionHard: "Tap rhythmically — dodge obstacles!",
  },
  [GAME_KEYS.HE_MUST_INCREASE]: {
    title: "He Must Increase",
    reference: "John 3:30",
    story: "John the Baptist said about Jesus: 'He must increase, I must decrease.' We make room for God!",
    successMessage: "Perfect balance! God fills your life with purpose!",
    failMessage: "Not quite right! Adjust the balance!",
    instruction: "Swipe up to grow GOD, swipe down to shrink ME!",
    instructionHard: "Be precise — the tiles slowly revert!",
  },
  [GAME_KEYS.LOST_SHEEP]: {
    title: "Find the Lost Sheep",
    reference: "Luke 15:3-7",
    story: "Jesus told a story about a shepherd with 100 sheep. When one wandered off, he searched until he found it. God never stops looking for us!",
    successMessage: "You found the lost sheep! God never stops looking for us.",
    // Never "the sheep is gone". Time ran out and the shepherd is still searching — that is the
    // whole point of the parable, and the fail state is not allowed to undercut it.
    failMessage: "The shepherd is still searching! He never gives up.",
    instruction: "Tap the bushes and rocks to find the lost sheep!",
    instructionHard: "Find the sheep fast — and it might move!",
  },
};

// Scoring configuration
const SCORE_CONFIG = {
  basePoints: {
    easy: 100,
    medium: 200,
    hard: 300,
  },
  multipliers: {
    perfect: 2.0,
    fast: 1.5,
  },
  combo: {
    3: 1.5,
    5: 2.0,
    10: 3.0,
    15: 5.0,
  },
};

// Config key mapping
const CONFIG_KEY_MAP = {
  [GAME_KEYS.LET_THERE_BE_LIGHT]: 'letThereBeLight',
  [GAME_KEYS.NOAHS_ARK]: 'noahsArk',
  [GAME_KEYS.TOWER_OF_BABEL]: 'towerOfBabel',
  [GAME_KEYS.WRESTLE_THE_ANGEL]: 'wrestleTheAngel',
  [GAME_KEYS.WATER_TO_WINE]: 'waterToWine',
  [GAME_KEYS.ROLL_THE_STONE]: 'rollTheStone',
  [GAME_KEYS.DANIEL_LIONS_DEN]: 'danielLionsDen',
  [GAME_KEYS.FIERY_FURNACE]: 'fieryFurnace',
  [GAME_KEYS.HOUSE_ON_ROCK]: 'houseOnRock',
  [GAME_KEYS.DAVID_VS_GOLIATH]: 'davidVsGoliath',
  [GAME_KEYS.WALK_AROUND_JERICHO]: 'walkAroundJericho',
  [GAME_KEYS.HE_MUST_INCREASE]: 'heMustIncrease',
  [GAME_KEYS.LOST_SHEEP]: 'lostSheep',
};

// Adaptive difficulty modifiers
function getAdjustedConfig(gameName, difficulty, sessionPerformance) {
  const configKey = CONFIG_KEY_MAP[gameName];
  if (!configKey || !GAME_CONFIG[configKey]) {
    console.warn('[Config] Unknown game:', gameName);
    return {};
  }

  const baseConfig = { ...GAME_CONFIG[configKey][difficulty] };

  // NOTE: timeLimit and reactionWindow get HARDER as they shrink. surviveTime is the opposite —
  // a longer survival is a harder round — so it scales the other way. Affects fieryFurnace and
  // danielLionsDen, which are both survive-the-clock games and were previously skipped entirely
  // by this function because neither carries a timeLimit key.

  if (sessionPerformance && sessionPerformance.consecutiveWins >= 3) {
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 0.93;
    if (baseConfig.reactionWindow) baseConfig.reactionWindow *= 0.93;
    if (baseConfig.surviveTime) baseConfig.surviveTime *= 1.07;
  }

  if (sessionPerformance && sessionPerformance.consecutiveLosses >= 2) {
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 1.10;
    if (baseConfig.reactionWindow) baseConfig.reactionWindow *= 1.10;
    if (baseConfig.surviveTime) baseConfig.surviveTime *= 0.91;
  }

  if (sessionPerformance && sessionPerformance.consecutiveLosses >= 4) {
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 1.25;
    if (baseConfig.reactionWindow) baseConfig.reactionWindow *= 1.25;
    if (baseConfig.surviveTime) baseConfig.surviveTime *= 0.80;
  }

  return baseConfig;
}
