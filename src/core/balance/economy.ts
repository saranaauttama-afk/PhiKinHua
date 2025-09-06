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
