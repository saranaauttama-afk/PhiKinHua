// ราคา/เศรษฐศาสตร์ร้านค้า
export const SHOP_REROLL_COST = 20;

export const REMOVE_SHOP_COSTS = [0, 20, 50, 90, 140, 200] as const;
export const UPGRADE_SHOP_COSTS = [0, 30, 60, 100, 150, 200] as const;

const REMOVE_STEP = 60;
const UPGRADE_STEP = 60;

export function removeCostForCount(count: number): number {
  if (count < REMOVE_SHOP_COSTS.length) return REMOVE_SHOP_COSTS[count];
  const last = REMOVE_SHOP_COSTS[REMOVE_SHOP_COSTS.length - 1];
  const extra = count - (REMOVE_SHOP_COSTS.length - 1);
  return last + extra * REMOVE_STEP;
}

export function upgradeCostForCount(count: number): number {
  if (count < UPGRADE_SHOP_COSTS.length) return UPGRADE_SHOP_COSTS[count];
  const last = UPGRADE_SHOP_COSTS[UPGRADE_SHOP_COSTS.length - 1];
  const extra = count - (UPGRADE_SHOP_COSTS.length - 1);
  return last + extra * UPGRADE_STEP;
}

// === Victory Gold Rewards ===
export const GOLD_VICTORY_BASE = {
  normal: 8,    // base gold for normal enemies
  elite: 15,    // base gold for elite enemies  
  boss: 30,     // base gold for bosses
} as const;

export const GOLD_VICTORY_LEVEL_BONUS = 2; // bonus per player level

export function goldRewardForVictory(
  tier: 'normal' | 'elite' | 'boss',
  playerLevel: number = 1,
  rng?: import('../rng').RNG
): { amount: number; rng?: import('../rng').RNG } {
  const base = GOLD_VICTORY_BASE[tier];
  const levelBonus = (playerLevel - 1) * GOLD_VICTORY_LEVEL_BONUS;
  const total = base + levelBonus;
  
  let finalAmount = total;
  let finalRng = rng;
  
  // Add small random variance (±20%) if RNG provided
  if (rng) {
    const { int } = require('../rng');
    const variance = Math.floor(total * 0.2);
    const result = int(rng, variance * 2 + 1);
    finalRng = result.rng;
    const randomBonus = result.value - variance;
    finalAmount = Math.max(1, total + randomBonus);
  }
  
  return { amount: Math.max(1, finalAmount), rng: finalRng };
}
