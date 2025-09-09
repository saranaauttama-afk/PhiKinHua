// src/core/balance/weights.ts
export const ENABLE_PAGES = false;        // เปิดถาวร (ตอนนี้ปิดไว้ เผื่อยังใช้ UI เดิม)
export const PAGES_TOTAL = 16;
export const SHOP_STOCK_SIZE = 6;
export const SHOP_POWER_BIAS = 1;

export const POOL_DEFAULT = {
  normal: 9,
  elite: 3,
  shopCard: 4,
  shopEquipment: 2,
  shopRemove: 2,
  shopUpgrade: 2,
  wells: 2,
  healingShrine: 2,
  nextEvent: 2, // next_page แบบ event พิเศษ
};

export const WEIGHTS = {
  monsterNormal: 5,
  monsterElite: 2,
  shopCard: 3,
  shopEquipment: 2,
  shopRemove: 2,
  shopUpgrade: 2,
  well: 1,
  healingShrine: 2,
  nextEvent: 1,
  boss: 10, // ใช้เมื่อถึงเวลา spawn บอส (inject)
};

// ===== Pages / MTOM-style =====
export const PAGES_OFFERS_PER_PAGE = 3;

// จำนวนมอนที่ต้องสู้ทั้งรัน (normal ก่อน, หมดแล้วค่อยปล่อย elite)
export const RUN_NORMAL_MONSTERS = 9;
export const RUN_ELITE_MONSTERS  = 3;

// โอกาสใส่ next_event เป็น “ช่องทางลัด” บางหน้า (0..1)
export const NEXT_EVENT_RATE = 0.25;
