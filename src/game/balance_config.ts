// balance_config.ts
// Global Variables for Balance Changes

export const PIECE_POWER = {
  GENERAL: 25,
  MAGE: 20,
  SEPOY: 10,
};

export const PIECE_NAMES = {
  GENERAL: { full: 'General', initial: 'G' },
  MAGE: { full: 'Mage', initial: 'M' },
  SEPOY: { full: 'Sepoy', initial: 'S' },
};

export const CARD_NAMES = {
  MINE: 'Mine',
  SURGE: 'Surge',
  DISPLACE: 'Displace',
  DEFUSAL_KIT: 'Defusal Kit',
  SKILL_ISSUE: 'Skill Issue',
  TOUCH_ME_NOT: 'Touch-Me-Not',
  BLANK: 'Blank',
  UNDYING: 'Undying',
};

export const DECK_COMPOSITION = {
  POWER_CARDS: {
    DEFUSAL_KIT: 4,
    SURGE: 3,
    MINE: 3,
    TOUCH_ME_NOT: 2,
    DISPLACE: 2,
    UNDYING: 2,
  },
  RISK_CARDS: {
    BLANK: 15,
    SKILL_ISSUE: 1,
  },
};

// Vault mechanics
export const VAULT_LOCATIONS = [
  { x: 0, y: 0 }, // Top-Left (A1)
  { x: 3, y: 3 }, // D4
  { x: 4, y: 4 }, // E5
  { x: 7, y: 7 }, // Bottom-Right (H8)
];

export const BOARD_SIZE = 8;
