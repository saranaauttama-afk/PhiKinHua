// src/core/shopRegistry.ts — Shop Registry System for Persistent Shops

import type { GameState, ShopKind, ShopItem, PersistentShop } from './types';

/**
 * สร้าง Persistent Shop ใหม่
 */
export function createPersistentShop(
  kind: ShopKind,
  inventory: ShopItem[]
): PersistentShop {
  return {
    id: `shop_${kind}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    kind,
    inventory: [...inventory], // copy
    boughtItems: [],
    timesEncountered: 1,
    itemsBought: 0,
  };
}

/**
 * เพิ่มร้านใหม่เข้า registry (เมื่อ Leave Shop ครั้งแรก)
 */
export function addShopToRegistry(
  state: GameState,
  kind: ShopKind,
  inventory: ShopItem[],
  boughtItems: ShopItem[],
  shopId?: string
): void {
  if (!state.shopRegistry) {
    state.shopRegistry = [];
  }

  const shop = createPersistentShop(kind, inventory);
  if (shopId) {
    shop.id = shopId; // Use provided static ID
  }
  shop.boughtItems = [...boughtItems];
  shop.itemsBought = boughtItems.length;
  
  state.shopRegistry.push(shop);
  state.log.push(`📝 Shop ${shop.id} registered for future encounters`);
}

/**
 * อัปเดตร้านที่มีอยู่ใน registry
 */
export function updateShopInRegistry(
  state: GameState,
  shopId: string,
  newInventory: ShopItem[],
  newBoughtItems: ShopItem[]
): void {
  if (!state.shopRegistry) return;

  const shop = state.shopRegistry.find(s => s.id === shopId);
  if (!shop) return;

  shop.inventory = [...newInventory];
  shop.boughtItems = [...newBoughtItems];
  shop.itemsBought = newBoughtItems.length;
  shop.timesEncountered += 1;
}

/**
 * ลบร้านออกจาก registry (เมื่อ Delete หรือซื้อครบ)
 */
export function removeShopFromRegistry(
  state: GameState,
  shopId: string
): void {
  if (!state.shopRegistry) return;

  const index = state.shopRegistry.findIndex(s => s.id === shopId);
  if (index >= 0) {
    state.shopRegistry.splice(index, 1);
    state.log.push(`🗑️ Shop removed from registry`);
  }
}

/**
 * หา shops ที่สามารถ re-spawn ได้
 */
export function getAvailableShopsForRespawn(state: GameState): PersistentShop[] {
  if (!state.shopRegistry) return [];
  
  return state.shopRegistry.filter(shop => {
    // ร้านที่ยังมีของเหลืออยู่
    return shop.inventory.length > 0;
  });
}

/**
 * คำนวณโอกาส re-spawn
 */
export function calculateRespawnChance(shop: PersistentShop): number {
  const baseChance = 0.8; // Increased to 80% for testing
  return baseChance / shop.timesEncountered;
}

/**
 * เลือกร้านสำหรับ re-spawn ด้วยความน่าจะเป็น
 */
export function selectShopsForRespawn(
  state: GameState,
  maxShops: number = 2,
  rng: () => number
): PersistentShop[] {
  const availableShops = getAvailableShopsForRespawn(state);
  const selectedShops: PersistentShop[] = [];

  for (const shop of availableShops) {
    if (selectedShops.length >= maxShops) break;
    
    const chance = calculateRespawnChance(shop);
    if (rng() < chance) {
      selectedShops.push(shop);
    }
  }

  return selectedShops;
}