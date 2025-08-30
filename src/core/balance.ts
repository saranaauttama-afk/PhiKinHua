import type { CardData, EnemyState } from './types';

export const START_HP = 50;
export const START_ENERGY = 3;
export const HAND_SIZE = 5;
export const START_GOLD = 80; // ✅ ทองเริ่มต้น

// === Base cards (deck of 5) ===
export const CARD_STRIKE: CardData = {
  id: 'strike', name: 'Strike', type: 'attack', cost: 1, dmg: 6, rarity: 'Common',
};
export const CARD_DEFEND: CardData = {
  id: 'defend', name: 'Defend', type: 'skill', cost: 1, block: 5, rarity: 'Common',
};
export const CARD_FOCUS: CardData = {
  id: 'focus', name: 'Focus', type: 'skill', cost: 0, draw: 1, energyGain: 1, rarity: 'Uncommon',
};
export const CARD_BASH: CardData = {
  id: 'bash', name: 'Bash', type: 'attack', cost: 2, dmg: 10, rarity: 'Rare',
};
export const CARD_GUARD: CardData = {
  id: 'guard', name: 'Guard', type: 'skill', cost: 1, block: 8, rarity: 'Uncommon',
};

export const START_DECK: CardData[] = [
  CARD_STRIKE, CARD_STRIKE, CARD_STRIKE, CARD_DEFEND, CARD_FOCUS,
];

export const POOL_COMMON: CardData[] = [CARD_STRIKE, CARD_DEFEND];
export const POOL_UNCOMMON: CardData[] = [CARD_FOCUS, CARD_GUARD];
export const POOL_RARE: CardData[] = [CARD_BASH];

// ✅ ราคาอ้างอิงร้าน (Act 1)
export const PRICE_COMMON = 35;
export const PRICE_UNCOMMON = 65;
export const PRICE_RARE = 120;
export const SHOP_REROLL_COST = 20;

// ===== Events balance (Act 1 ชั่วคราว)
export const REMOVE_CAP_PER_RUN = 2;            // ลบการ์ดได้ไม่เกิน 2 ครั้ง/หนึ่ง run
export const GAMBLE_WIN_GOLD = 40;
export const GAMBLE_LOSE_HP = 10;
export const TREASURE_MIN = 30;
export const TREASURE_MAX = 80;

// === Example enemy ===
export const ENEMY_SLIME: EnemyState = {
  id: 'slime', name: 'Slime',
  hp: 35, maxHp: 35,
  dmg: 6,
  block: 0,
};
