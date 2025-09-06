// src/core/balance/weights.ts
export const ENABLE_PAGES = false;        // เปิดถาวร (ตอนนี้ปิดไว้ เผื่อยังใช้ UI เดิม)
export const PAGES_TOTAL = 12;
export const SHOP_STOCK_SIZE = 6;
export const SHOP_POWER_BIAS = 1;

export const POOL_DEFAULT = {
  normal: 7,
  elite: 1,
  shopCard: 3,
  shopRemove: 2,
  shopUpgrade: 2,
  wells: 2,
  nextEvent: 2, // next_page แบบ event พิเศษ
};

export const WEIGHTS = {
  monsterNormal: 5,
  monsterElite: 2,
  shopCard: 2,
  shopRemove: 2,
  shopUpgrade: 2,
  well: 1,
  nextEvent: 1,
  boss: 10, // ใช้เมื่อถึงเวลา spawn บอส (inject)
};
