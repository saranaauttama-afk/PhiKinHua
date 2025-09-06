// import type { CardData } from './types';
// import { START_DECK as START_DECK_FROM_PACK, BY_RARITY } from './pack';

// export const START_HP = 50;
// export const START_ENERGY = 3;
// export const HAND_SIZE = 3;
// export const START_GOLD = 80; // ✅ ทองเริ่มต้น
// // ===== Leveling (base) =====
// export const EXP_KILL_NORMAL = 10;
// export const EXP_KILL_ELITE  = 25;
// export const EXP_KILL_BOSS   = 100;
// export function nextExpForLevel(level: number) {
//   // โค้งง่าย ๆ: 20, 50, 90, 140, 200, ...
//   const base = 20;
//   return Math.round(base + 15 * (level - 1) + 5 * (level - 1) * (level - 1));
// }

// // // === Base cards (deck of 5) ===
// // export const CARD_STRIKE: CardData = {
// //   id: 'strike', name: 'Strike', type: 'attack', cost: 1, dmg: 6, rarity: 'Common',
// // };
// // export const CARD_DEFEND: CardData = {
// //   id: 'defend', name: 'Defend', type: 'skill', cost: 1, block: 5, rarity: 'Common',
// // };
// // export const CARD_FOCUS: CardData = {
// //   id: 'focus', name: 'Focus', type: 'skill', cost: 0, draw: 1, energyGain: 1, rarity: 'Uncommon',
// // };
// // export const CARD_BASH: CardData = {
// //   id: 'bash', name: 'Bash', type: 'attack', cost: 2, dmg: 10, rarity: 'Rare',
// // };
// // export const CARD_GUARD: CardData = {
// //   id: 'guard', name: 'Guard', type: 'skill', cost: 1, block: 8, rarity: 'Uncommon',
// // };

// // FROM PACK
// export const START_DECK: CardData[] = START_DECK_FROM_PACK;
// export const POOL_COMMON: CardData[] = BY_RARITY.Common;
// export const POOL_UNCOMMON: CardData[] = BY_RARITY.Uncommon;
// export const POOL_RARE: CardData[] = BY_RARITY.Rare;

// // ✅ ราคาอ้างอิงร้าน (Act 1)
// export const PRICE_COMMON = 35;
// export const PRICE_UNCOMMON = 65;
// export const PRICE_RARE = 120;
// export const SHOP_REROLL_COST = 20;

// // ===== Events balance (Act 1 ชั่วคราว)
// export const REMOVE_CAP_PER_RUN = 2;            // ลบการ์ดได้ไม่เกิน 2 ครั้ง/หนึ่ง run
// export const GAMBLE_WIN_GOLD = 40;
// export const GAMBLE_LOSE_HP = 10;
// export const TREASURE_MIN = 30;
// export const TREASURE_MAX = 80;

// //// === Example enemy ===
// //export const ENEMY_SLIME: EnemyState = {
// //  id: 'slime', name: 'Slime',
// //  hp: 35, maxHp: 35,
// //  dmg: 6,
// //  block: 0,
// //};
export * from './balance/core';
export * from './balance/progression';
export * from './balance/economy';
export * from './balance/events';