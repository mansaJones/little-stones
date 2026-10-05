// ============================================
// CONSTANTS - Global game constants
// ============================================

const GAME_WIDTH = 667;
const GAME_HEIGHT = 375;

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
];

const DEBUG_MODE = false; // Set true during development
let adminMode = false; // Set by game picker — returns to picker after each game
let adminDifficulty = DIFFICULTY.EASY; // Set by the game picker's difficulty toggle; applied on every admin round
