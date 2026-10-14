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
    // chargeInterval is seconds between one lion breaking off its patrol to rush Daniel; 0 = never,
    // matching windForce/drainRate elsewhere. The design doc has always said HARD lions
    // occasionally charge, and the code has always had a charge branch — but it was gated on
    // `difficulty === 3` while difficulty is the string 'hard', so it had never once run.
    //
    // surviveTime is a SURVIVAL clock: longer is harder, which is why getAdjustedConfig scales it
    // the opposite way to timeLimit.
    //
    // UNBALANCED — see §5 'As built'. Measured with a near-optimal dodging bot, medium wins about
    // 4 rounds in 14 and hard about 1 in 14, which is far too steep for 6-8s with three lives a
    // session. These numbers are the design doc's and have been left alone; the tested fix is
    // medium {lionSpeed: 78, surviveTime: 6.0} and hard {lionSpeed: 95, surviveTime: 7.5}, which
    // measured 70% and 30%.
    easy:   { lionCount: 2, surviveTime: 5.0,  lionSpeed: 60,  chargeInterval: 0 },
    medium: { lionCount: 3, surviveTime: 7.0,  lionSpeed: 90,  chargeInterval: 0 },
    hard:   { lionCount: 4, surviveTime: 10.0, lionSpeed: 120, chargeInterval: 3.0 },
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
    // TWO phases, each with its own clock (design doc §11, redesigned 2026-10-05).
    //
    // Phase 1, the march: drag the phalanx round the city `laps` times inside `timeLimit`. The
    // phalanx is capped at one lap per second, so the fastest legal march is 7s and the tiers
    // leave 5 / 3 / 2 seconds of slack. `autoWalk` is gone — both phases are player-driven now.
    //
    // Phase 2, the horn: `targetTaps` taps inside `hornTime`, which starts FRESH so scraping
    // through lap seven with 0.1s left does not doom the horn. `hornDrain` is meter units lost per
    // second; 0 = no drain, matching windForce/chargeInterval elsewhere.
    //
    // timeLimit and targetTaps are named so getAdjustedConfig scales both for free. hornTime is
    // deliberately not scaled.
    easy:   { laps: 7, timeLimit: 12.0, targetTaps: 12, hornTime: 4.0, hornDrain: 0,   obstacles: false },
    medium: { laps: 7, timeLimit: 10.0, targetTaps: 16, hornTime: 4.0, hornDrain: 2.5, obstacles: false },
    hard:   { laps: 7, timeLimit: 9.0,  targetTaps: 20, hornTime: 4.0, hornDrain: 3.5, obstacles: true  },
  },
  samsonJawbone: {
    // Difficulty is ONE dial: how fast a Philistine flees, against Samson's FIXED 265 px/s cap
    // (SJ_SAMSON_SPEED). That is 0.25x / 0.38x / 0.51x of his speed, so he closes on them at every
    // tier and the difference is only how long the chase takes. The bonk target rises alongside it
    // to keep the pace honest; round length, Samson's cap and the flee radius are deliberately
    // identical across all three tiers.
    //
    // HALVED from 115 / 185 / 240 on playtest. §14 called those "playtest starting points" and
    // flagged HARD as untested; at 0.91x of Samson's cap a fleeing Philistine in open ground was
    // not catchable by a child, which is the note that came back. §14's own numbers are now stale.
    //
    // onField is how many are alive at once -- a bonked one is replaced ~0.5s later, so the field
    // never empties before the target is reached.
    easy:   { timeLimit: 8.0, targetBonks: 5, fleeSpeed: 65,  onField: 3 },
    medium: { timeLimit: 8.0, targetBonks: 7, fleeSpeed: 100, onField: 4 },
    hard:   { timeLimit: 8.0, targetBonks: 9, fleeSpeed: 135, onField: 4 },
  },
  babyMoses: {
    // Difficulty is ONE dial: obstacle DENSITY. §15 holds the run length and the bump stall
    // constant across tiers on purpose -- they are module constants in BabyMosesGame.js
    // (BM_RUN_TIME = 7.0s, BM_BUMP_STALL = 0.6s) rather than config, because scaling them would
    // change what the game is rather than how hard it is.
    //
    // So the round is 10s against a 7s run: 3 seconds of slack, and a bump costs 0.6, which makes
    // timeLimit a budget of exactly FIVE bumps at every tier. What changes is how hard five is to
    // stay under -- 5 obstacles on easy, 9 plus a hippo on medium, 14 plus a hippo plus a current
    // on hard. timeLimit is the only key adaptive difficulty touches, which is what §15 asks for.
    //
    // `obstacles` names a hand-authored lane pattern in BabyMosesGame.js. The patterns are level
    // geometry rather than tunables, and §15 is explicit that they must not be random: "Random
    // placement can produce a wall with no gap."
    //
    // Zero means off throughout, matching windForce / relocateAfter elsewhere: hippoAt 0 = the
    // hippo never surfaces, current 0 = no cross-current.
    easy:   { timeLimit: 10.0, obstacles: 'easy',   hippoAt: 0,   current: 0  },
    medium: { timeLimit: 10.0, obstacles: 'medium', hippoAt: 3.2, current: 0  },
    hard:   { timeLimit: 10.0, obstacles: 'hard',   hippoAt: 2.6, current: 55 },
  },
  peterWater: {
    // Difficulty is ONE dial, and §16 names it: "Jesus' drift speed (none / slow / faster) is the
    // difficulty dial." Everything else is held flat on purpose -- the walk is 5 seconds of
    // HOLDING at every tier, and the round is 8, so the slack is timeLimit - walkTime = 3s of not
    // holding. timeLimit is the only key adaptive difficulty touches.
    //
    // driftSpeed is in radians/second against a fixed 30px amplitude (PW_DRIFT_AMP), so a higher
    // number means Jesus bobs FASTER through the same water, not further out of reach.
    //
    // sinkRate is flat across tiers: at 0.55/s a finger that comes off stays off for 1.8 seconds
    // before the rescue triggers, which is well inside the 3s of slack. Letting go is meant to
    // cost, not to end the round.
    //
    // Zero means off throughout, matching windForce / relocateAfter elsewhere: driftSpeed 0 = he
    // stands still, waveEvery 0 = no wave ever hides him.
    easy:   { timeLimit: 8.0, walkTime: 5.0, sinkRate: 0.55, driftSpeed: 0,   waveEvery: 0   },
    medium: { timeLimit: 8.0, walkTime: 5.0, sinkRate: 0.55, driftSpeed: 1.1, waveEvery: 0   },
    hard:   { timeLimit: 8.0, walkTime: 5.0, sinkRate: 0.55, driftSpeed: 2.0, waveEvery: 2.1 },
  },
  josephCoat: {
    // §18: "Pattern length (3 / 4 / 5) is the difficulty dial." The pot count rises with it so the
    // choice gets wider at the same time, and HARD allows repeats -- "red, blue, red", which §18
    // rightly says is much harder than it sounds.
    //
    // timeLimit is the ANSWER timer only. §18: "the 8-second answer timer starts after the playback
    // finishes. Watching never eats into answer time." It is the one key adaptive difficulty
    // touches; patternLength, potCount, allowRepeats and playbackStep stay fixed, because they are
    // what the tier IS.
    //
    // playbackStep is seconds per stripe during playback: slower on EASY so there is time to say
    // the colour out loud, quicker on HARD.
    easy:   { timeLimit: 8.0, patternLength: 3, potCount: 4, allowRepeats: false, playbackStep: 0.60 },
    medium: { timeLimit: 8.0, patternLength: 4, potCount: 5, allowRepeats: false, playbackStep: 0.50 },
    hard:   { timeLimit: 8.0, patternLength: 5, potCount: 6, allowRepeats: true,  playbackStep: 0.45 },
  zacchaeus: {
    // §17's two dials move together -- the tap target rises as the clock shortens -- but the one
    // that changes how the game FEELS is the third: what a same-side tap costs.
    //
    //   EASY   a wrong tap does nothing, so alternating two thumbs is fine
    //   MEDIUM it costs a step
    //   HARD   it costs two, which turns mashing into rhythm
    //
    // slipSteps is deliberately NOT scaled by adaptive difficulty: it is the character of the
    // tier, not its dosage. Zero means off, matching windForce / relocateAfter elsewhere.
    easy:   { timeLimit: 8.0, targetTaps: 14, slipSteps: 0 },
    medium: { timeLimit: 7.0, targetTaps: 18, slipSteps: 1 },
    hard:   { timeLimit: 6.0, targetTaps: 22, slipSteps: 2 },
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
  // §21: "Fall speed and catch target rise together," and MEDIUM's twelve is the twelve baskets
  // left over. swayAmount is HARD only -- §21: "items sway side to side as they fall."
  //
  // There is deliberately no spawn-rate key. §21 fixes the rate by a guarantee instead -- "spawn
  // rate x time >= 1.6 x the catch target, so the target is always reachable" -- so the game
  // derives it, against the USABLE window rather than the whole round. An item released later than
  // one fall-time before the buzzer can never be caught, and counting it would make the guarantee
  // a lie: at EASY that is a real ratio of 1.29 against the promised 1.6.
  //
  // §21: "targetCatches is not scaled by adaptive difficulty."
  feedingFiveThousand: {
    easy:   { timeLimit: 10.0, targetCatches: 8,  fallSpeed: 150, swayAmount: 0 },
    medium: { timeLimit: 10.0, targetCatches: 12, fallSpeed: 190, swayAmount: 0 },
    hard:   { timeLimit: 10.0, targetCatches: 15, fallSpeed: 240, swayAmount: 26 },
  },
  // §20: "Crosser count and required width rise together. On a phone, 50% of the screen height
  // between two fingers is a real stretch, which is the point."
  //
  // requiredSpread is a fraction of the SCREEN HEIGHT, and it measures the FINGER SPREAD, not the
  // drawn path. §20 words it as the path width, which the delivered backdrop cannot deliver: its
  // horizon sits 59% down, so the dry seabed is only 41.3% of the screen and a 50% path has
  // nowhere to go. Reading it as the gesture keeps §20's difficulty exactly -- HARD still asks for
  // a 187.5px stretch -- and the path follows at RS_SPREAD_GAIN, drawing 131px. See ASSETS.md.
  redSea: {
    easy:   { timeLimit: 10.0, crossers: 4, requiredSpread: 0.30 },
    medium: { timeLimit: 10.0, crossers: 6, requiredSpread: 0.40 },
    hard:   { timeLimit: 10.0, crossers: 8, requiredSpread: 0.50 },
  },
  // §19: "Stones to place (4 / 6 / 8) is the main dial," and the gap always holds 8, so what is
  // NOT in stonesToPlace is already built into the wall when the round starts -- Nehemiah 4:6, the
  // wall joined "to half its height". The game derives that count rather than reading a key, so
  // the two can never drift apart and leave a nine-stone gap.
  //
  // §19 names exactly four keys: timeLimit, stonesToPlace, tolerance and swingSpeed. tolerance is
  // in STAGE PIXELS of horizontal error at the moment of release, against a swing that reaches
  // 52.6px either side of the gap's centre line; swingSpeed is in Hz, so 0.38 is a 2.6s round trip.
  // They tighten together, as §19 asks.
  //
  // What they really control is a window in TIME, not in pixels: the stone is inside tolerance for
  // asin(tolerance / 52.6) / (pi * swingSpeed) seconds, twice a cycle, and a child's timing scatter
  // has to fit inside that. These four numbers are measured, not chosen -- a simulated player with
  // a given timing sigma, 8-14 rounds a cell:
  //
  //                       window     sigma 80ms   sigma 110ms   mashing
  //     easy  30 / 0.38   +/-254ms      100%         100%          0%
  //     med   26 / 0.50   +/-165ms      100%          88%          0%
  //     hard  22 / 0.62   +/-111ms       79%          50%          0%
  //
  // An earlier 22/15/10 against 0.45/0.62/0.80 looked like a sensible ladder on paper and measured
  // 29% on HARD at 80ms: eight stones in twelve seconds does not leave room for a 0.8s miss
  // penalty at a 52% hit rate. Mashing loses on every tier, because the stone swings IN from an
  // extreme and a stone released on sight is 52.6px off centre.
  nehemiahWall: {
    easy:   { timeLimit: 12.0, stonesToPlace: 4, tolerance: 30, swingSpeed: 0.38 },
    medium: { timeLimit: 12.0, stonesToPlace: 6, tolerance: 26, swingSpeed: 0.50 },
    hard:   { timeLimit: 12.0, stonesToPlace: 8, tolerance: 22, swingSpeed: 0.62 },
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
    reference: "Joshua 6:15-20",
    story: "Joshua and the Israelites walked around Jericho's walls 7 times, then the walls fell down!",
    successMessage: "The walls have fallen! God is mighty!",
    // Neutral about WHICH phase ran out, because either can.
    failMessage: "The walls still stand! Keep marching!",
    instruction: "Drag the soldiers around the city 7 times, then tap to blow the horn!",
    instructionHard: "March 7 laps, dodge the rocks, then blow the horn!",
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
  [GAME_KEYS.SAMSON_JAWBONE]: {
    title: "Samson and the Jawbone",
    reference: "Judges 15:14-16",
    story: "Samson was tied up with brand-new ropes, but God made him strong \u2014 the ropes fell off like burnt thread! With only a donkey's jawbone, Samson chased off a whole army of Philistines.",
    successMessage: "God gave Samson strength! The Philistines ran away!",
    failMessage: "They slipped away! Keep chasing!",
    instruction: "Drag Samson around the field to bonk the Philistines!",
    instructionHard: "They are nearly as fast as you \u2014 corner them against the edges!",
  },
  [GAME_KEYS.BABY_MOSES]: {
    title: "Baby Moses in the Basket",
    reference: "Exodus 2:1-10",
    story: "Baby Moses' mother put him in a little basket on the river. God watched over him, and Pharaoh's daughter found him and kept him safe!",
    successMessage: "God kept baby Moses safe! Pharaoh's daughter lifted him from the reeds.",
    failMessage: "The basket is still bobbing along! Keep steering!",
    instruction: "Tilt to steer the basket past the reeds and rocks!",
    instructionHard: "The current pushes you at the banks \u2014 lean against it!",
  },
  [GAME_KEYS.PETER_WATER]: {
    title: "Peter Walks on Water",
    reference: "Matthew 14:22-33",
    story: "Jesus walked on the stormy sea and called Peter to come. When Peter kept his eyes on Jesus, he walked on water too!",
    successMessage: "Peter walked on water! He kept his eyes on Jesus.",
    failMessage: "Jesus caught him straight away \u2014 keep your eyes on Jesus!",
    instruction: "Press and hold on Jesus to keep Peter walking!",
    instructionHard: "Waves will hide Him \u2014 hold where He IS, not where you can see Him!",
  },
  [GAME_KEYS.JOSEPH_COAT]: {
    title: "Joseph's Coat of Many Colors",
    reference: "Genesis 37:3",
    story: "Jacob gave his son Joseph a beautiful coat of many colors. Every color showed how much his father loved him!",
    successMessage: "What a beautiful coat! Every colour showed how much his father loved him.",
    failMessage: "The colours faded \u2014 watch the stripes closely and try again!",
    instruction: "Watch the stripes light up, then tap the dye pots in the same order!",
    instructionHard: "Colours can repeat this time \u2014 watch the order, not just the colours!",
  [GAME_KEYS.ZACCHAEUS]: {
    title: "Zacchaeus Climbs the Tree",
    reference: "Luke 19:1-10",
    story: "Zacchaeus was too short to see Jesus, so he climbed a tree! Jesus looked up and said, 'Come down, I'm visiting your house today!'",
    successMessage: "Zacchaeus climbed high and Jesus saw him! Jesus came looking for him.",
    failMessage: "Jesus is already at the tree \u2014 climb a bit quicker next time!",
    instruction: "Tap LEFT then RIGHT, over and over, to climb the tree!",
    instructionHard: "Tap the same side twice and you slip down two \u2014 keep the rhythm!",
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
  [GAME_KEYS.FEEDING_5000]: {
    title: 'Feeding the 5,000',
    reference: 'John 6:1-13',
    story: 'A boy shared his five loaves and two fish. Jesus thanked God, and everyone ate. There were even twelve baskets left over!',
    successMessage: 'Everyone had enough! A little became more than enough.',
    failMessage: "The food is still falling \u2014 catch some more and try again!",
    instruction: 'Slide the basket left and right to catch the bread and fish!',
    instructionHard: 'Fifteen to catch, falling faster, and they sway on the way down \u2014 watch closely!',
  },
  [GAME_KEYS.RED_SEA]: {
    title: 'Moses Parts the Red Sea',
    reference: 'Exodus 14:21-22',
    story: 'Moses stretched out his hand over the sea. God split the water in two, and His people walked across on dry ground!',
    successMessage: 'God made a way! Everyone crossed over on dry ground.',
    failMessage: 'Some people are still waiting \u2014 hold the water open a little longer!',
    instruction: 'Spread two fingers apart to part the sea, and hold it open while everyone walks across!',
    instructionHard: 'Eight people to get across, and the path has to be wider \u2014 stretch those fingers!',
  },
  [GAME_KEYS.NEHEMIAH_WALL]: {
    title: 'Nehemiah Rebuilds the Wall',
    reference: 'Nehemiah 2:17-18; 4:6; 6:15',
    story: "Jerusalem's walls were broken down. Nehemiah got everyone working together, and they rebuilt the whole wall in just 52 days!",
    successMessage: 'The wall is finished! Everyone worked together and the gap is closed.',
    failMessage: "The gap is still open \u2014 keep building and try again!",
    instruction: 'Tap to drop each stone when it swings over the gap!',
    instructionHard: 'The gap is empty this time, and the crane swings faster \u2014 wait for the middle!',
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
  [GAME_KEYS.SAMSON_JAWBONE]: 'samsonJawbone',
  [GAME_KEYS.BABY_MOSES]: 'babyMoses',
  [GAME_KEYS.PETER_WATER]: 'peterWater',
  [GAME_KEYS.JOSEPH_COAT]: 'josephCoat',
  [GAME_KEYS.FEEDING_5000]: 'feedingFiveThousand',
  [GAME_KEYS.RED_SEA]: 'redSea',
  [GAME_KEYS.NEHEMIAH_WALL]: 'nehemiahWall',
  [GAME_KEYS.ZACCHAEUS]: 'zacchaeus',
};

// Adaptive difficulty modifiers
function getAdjustedConfig(gameName, difficulty, sessionPerformance) {
  const configKey = CONFIG_KEY_MAP[gameName];
  if (!configKey || !GAME_CONFIG[configKey]) {
    console.warn('[Config] Unknown game:', gameName);
    return {};
  }

  const baseConfig = { ...GAME_CONFIG[configKey][difficulty] };

  // targetTaps is scaled for ZACCHAEUS ONLY, by name, and this is deliberate.
  //
  // §17 says the key is named so adaptive difficulty scales it "for free", and walkAroundJericho's
  // config comment says the same thing about itself -- but nothing in this function has ever
  // touched targetTaps, so both claims were aspirational. wrestleAngel carries the key too.
  //
  // Scaling it for everything would quietly re-balance two games that shipped and were tuned
  // without it, so the opt-in is per game rather than per key. If Jericho or Wrestle should get it
  // too, add them here and re-run their harnesses -- do not widen the test to the key name.
  const scalesTaps = configKey === 'zacchaeus';

  // NOTE: timeLimit and reactionWindow get HARDER as they shrink. surviveTime is the opposite —
  // a longer survival is a harder round — so it scales the other way. Affects fieryFurnace and
  // danielLionsDen, which are both survive-the-clock games and were previously skipped entirely
  // by this function because neither carries a timeLimit key.

  if (sessionPerformance && sessionPerformance.consecutiveWins >= 3) {
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 0.93;
    if (baseConfig.reactionWindow) baseConfig.reactionWindow *= 0.93;
    if (baseConfig.surviveTime) baseConfig.surviveTime *= 1.07;
    // rounded: a target of 19.26 taps is a number no child can finish exactly
    if (scalesTaps && baseConfig.targetTaps) baseConfig.targetTaps = Math.round(baseConfig.targetTaps * 1.07);
  }

  if (sessionPerformance && sessionPerformance.consecutiveLosses >= 2) {
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 1.10;
    if (baseConfig.reactionWindow) baseConfig.reactionWindow *= 1.10;
    if (baseConfig.surviveTime) baseConfig.surviveTime *= 0.91;
    if (scalesTaps && baseConfig.targetTaps) baseConfig.targetTaps = Math.round(baseConfig.targetTaps * 0.91);
  }

  if (sessionPerformance && sessionPerformance.consecutiveLosses >= 4) {
    if (baseConfig.timeLimit) baseConfig.timeLimit *= 1.25;
    if (baseConfig.reactionWindow) baseConfig.reactionWindow *= 1.25;
    if (baseConfig.surviveTime) baseConfig.surviveTime *= 0.80;
    if (scalesTaps && baseConfig.targetTaps) baseConfig.targetTaps = Math.round(baseConfig.targetTaps * 0.80);
  }

  return baseConfig;
}
