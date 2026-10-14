// ============================================
// CONSTANTS - Global game constants
// ============================================

// ---- The STAGE: the authored design space ----
// Every coordinate in this codebase is in stage space, including every hand-measured gameplay
// field. It is 667x375 and it never changes.
const GAME_WIDTH = 667;
const GAME_HEIGHT = 375;

// ---- The CANVAS: what the device actually gets ----
// Phaser.Scale.FIT against a fixed 667x375 (aspect 1.78) letterboxes on anything that is not an
// iPhone SE. Measured: modern phones in landscape are 2.16-2.22, so they filled 80-82% of the
// screen with 75-91px of black down each side; tablets at 1.33 were worse again.
//
// So the canvas is sized to the DEVICE's aspect at boot and the stage is centred inside it. FIT
// then has nothing to letterbox. The stage keeps its exact size and position in world space, so
// every measured field and every HUD coordinate still means what it meant; the extra area around
// it is bleed, filled with the scene's own backdrop.
//
// These are `let` because they are computed once at boot, in computeCanvasSize() below.
let CANVAS_WIDTH = GAME_WIDTH;
let CANVAS_HEIGHT = GAME_HEIGHT;
let STAGE_X = 0;      // where the stage's left edge sits inside the canvas
let STAGE_Y = 0;      // and its top edge

// Clamps on how far the canvas may be stretched past the stage. Without them a freak viewport --
// a desktop window dragged very wide, a foldable half-open -- would demand an enormous bleed and
// shrink the playable area to a stripe in the middle.
const CANVAS_MAX_ASPECT = 2.40;   // wider than a Galaxy Fold's outer screen
const CANVAS_MIN_ASPECT = 1.25;   // narrower than a 4:3 tablet

function computeCanvasSize(viewW, viewH) {
  const stageAspect = GAME_WIDTH / GAME_HEIGHT;
  let aspect = (viewW && viewH) ? viewW / viewH : stageAspect;
  aspect = Math.max(CANVAS_MIN_ASPECT, Math.min(CANVAS_MAX_ASPECT, aspect));

  if (aspect > stageAspect) {          // wider than the stage: grow sideways
    CANVAS_HEIGHT = GAME_HEIGHT;
    CANVAS_WIDTH = Math.round(GAME_HEIGHT * aspect);
  } else {                             // taller than the stage: grow downwards
    CANVAS_WIDTH = GAME_WIDTH;
    CANVAS_HEIGHT = Math.round(GAME_WIDTH / aspect);
  }
  STAGE_X = Math.round((CANVAS_WIDTH - GAME_WIDTH) / 2);
  STAGE_Y = Math.round((CANVAS_HEIGHT - GAME_HEIGHT) / 2);
}

const COLORS = {
  SKY_BLUE: 0x4A90E2,
  SUNSHINE_YELLOW: 0xFFD93D,
  GRASS_GREEN: 0x6BCF7F,
  SUNSET_ORANGE: 0xFF9F43,
  DEEP_PURPLE: 0x6C5CE7,
  SOFT_RED: 0xE74C3C,
  WHITE: 0xFFFFFF,
  BLACK: 0x000000,
  DARK_BG: 0x1a1a2e,
  CARD_BACK: 0x3D5A80,
  CARD_FACE: 0xF0E6D3,
  GOLD: 0xFFD700,
  HEART_RED: 0xFF4757,
  HEART_EMPTY: 0x555555,
  TOWER_BROWN: 0x8B6914,
  TOWER_DARK: 0x6B4F12,
  SAND: 0xF4D03F,
  SUCCESS_GREEN: 0x2ECC71,
  FAIL_RED: 0xE74C3C,
  OVERLAY_BLACK: 0x000000,
};

const FONTS = {
  TITLE: { fontFamily: 'Arial Black, Arial', fontSize: '28px', color: '#ffffff', fontStyle: 'bold' },
  SUBTITLE: { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' },
  BODY: { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' },
  SMALL: { fontFamily: 'Arial', fontSize: '13px', color: '#ffffff' },
  HUD: { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' },
  BUTTON: { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' },
  SCORE: { fontFamily: 'Arial Black, Arial', fontSize: '36px', color: '#FFD700', fontStyle: 'bold' },
  COMBO: { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#FF9F43', fontStyle: 'bold' },
  TIMER: { fontFamily: 'Arial Black, Arial', fontSize: '32px', color: '#ffffff', fontStyle: 'bold' },
  STORY: { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#ffffff', wordWrap: { width: 550 }, align: 'center' },
  VERSE: { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#FFD93D', fontStyle: 'italic' },
};

const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

const GAME_KEYS = {
  LET_THERE_BE_LIGHT: 'LetThereBeLightGame',
  NOAHS_ARK: 'NoahsArkGame',
  TOWER_OF_BABEL: 'TowerOfBabelGame',
  WRESTLE_THE_ANGEL: 'WrestleTheAngelGame',
  WATER_TO_WINE: 'WaterToWineGame',
  ROLL_THE_STONE: 'RollTheStoneGame',
  DANIEL_LIONS_DEN: 'DanielLionsDenGame',
  FIERY_FURNACE: 'FieryFurnaceGame',
  HOUSE_ON_ROCK: 'HouseOnRockGame',
  DAVID_VS_GOLIATH: 'DavidVsGoliathGame',
  WALK_AROUND_JERICHO: 'WalkAroundJerichoGame',
  HE_MUST_INCREASE: 'HeMustIncreaseGame',
  LOST_SHEEP: 'LostSheepGame',
  SAMSON_JAWBONE: 'SamsonJawboneGame',
  BABY_MOSES: 'BabyMosesGame',
  PETER_WATER: 'PeterWaterGame',
  JOSEPH_COAT: 'JosephCoatGame',
  FEEDING_5000: 'FeedingFiveThousandGame',
  RED_SEA: 'RedSeaGame',
  NEHEMIAH_WALL: 'NehemiahWallGame',
  ZACCHAEUS: 'ZacchaeusTreeGame',
};

const GAME_NAMES = {
  [GAME_KEYS.LET_THERE_BE_LIGHT]: 'Let There Be Light',
  [GAME_KEYS.NOAHS_ARK]: "Noah's Ark",
  [GAME_KEYS.TOWER_OF_BABEL]: 'Tower of Babel',
  [GAME_KEYS.WRESTLE_THE_ANGEL]: 'Wrestle the Angel',
  [GAME_KEYS.WATER_TO_WINE]: 'Water to Wine',
  [GAME_KEYS.ROLL_THE_STONE]: 'Roll the Stone Away',
  [GAME_KEYS.DANIEL_LIONS_DEN]: "Daniel in the Lions' Den",
  [GAME_KEYS.FIERY_FURNACE]: 'Fiery Furnace',
  [GAME_KEYS.HOUSE_ON_ROCK]: 'House on Rock vs Sand',
  [GAME_KEYS.DAVID_VS_GOLIATH]: 'David vs Goliath',
  [GAME_KEYS.WALK_AROUND_JERICHO]: 'Walk Around Jericho',
  [GAME_KEYS.HE_MUST_INCREASE]: 'He Must Increase',
  [GAME_KEYS.LOST_SHEEP]: 'Find the Lost Sheep',
  [GAME_KEYS.SAMSON_JAWBONE]: 'Samson and the Jawbone',
  [GAME_KEYS.BABY_MOSES]: 'Baby Moses in the Basket',
  [GAME_KEYS.PETER_WATER]: 'Peter Walks on Water',
  [GAME_KEYS.JOSEPH_COAT]: "Joseph's Coat of Many Colors",
  [GAME_KEYS.FEEDING_5000]: 'Feeding the 5,000',
  [GAME_KEYS.RED_SEA]: 'Moses Parts the Red Sea',
  [GAME_KEYS.NEHEMIAH_WALL]: 'Nehemiah Rebuilds the Wall',
  [GAME_KEYS.ZACCHAEUS]: 'Zacchaeus Climbs the Tree',
};

const ALL_GAME_KEYS = [
  GAME_KEYS.LET_THERE_BE_LIGHT,
  GAME_KEYS.NOAHS_ARK,
  GAME_KEYS.TOWER_OF_BABEL,
  GAME_KEYS.WRESTLE_THE_ANGEL,
  GAME_KEYS.WATER_TO_WINE,
  GAME_KEYS.ROLL_THE_STONE,
  GAME_KEYS.DANIEL_LIONS_DEN,
  GAME_KEYS.FIERY_FURNACE,
  GAME_KEYS.HOUSE_ON_ROCK,
  GAME_KEYS.DAVID_VS_GOLIATH,
  GAME_KEYS.WALK_AROUND_JERICHO,
  GAME_KEYS.HE_MUST_INCREASE,
  GAME_KEYS.LOST_SHEEP,
  GAME_KEYS.SAMSON_JAWBONE,
  GAME_KEYS.BABY_MOSES,
  GAME_KEYS.PETER_WATER,
  GAME_KEYS.JOSEPH_COAT,
  GAME_KEYS.FEEDING_5000,
  GAME_KEYS.RED_SEA,
  GAME_KEYS.NEHEMIAH_WALL,
  GAME_KEYS.ZACCHAEUS,
];

// Games pulled from play on 2026-10-08. Their scenes, art and config all stay in the build and
// stay registered in main.js — this list only decides what the picker offers and what the random
// chooser is allowed to land on, so putting one back is deleting a line here.
//
// Deliberately NOT done by deleting them from ALL_GAME_KEYS: dataManager keys every saved
// profile's miniGameStats off that list, so dropping a key there would strand the history of
// anyone who had already played these.
const RETIRED_GAME_KEYS = [
  GAME_KEYS.TOWER_OF_BABEL,
  GAME_KEYS.HOUSE_ON_ROCK,
  GAME_KEYS.HE_MUST_INCREASE,
];

// What a player can actually reach. ALL_GAME_KEYS stays complete; this is the playable subset.
const PLAYABLE_GAME_KEYS = ALL_GAME_KEYS.filter(function (k) {
  return RETIRED_GAME_KEYS.indexOf(k) === -1;
});

const DEBUG_MODE = false; // Set true during development
let adminMode = false; // Set by game picker — returns to picker after each game
let adminDifficulty = DIFFICULTY.EASY; // Set by the game picker's difficulty toggle; applied on every admin round
