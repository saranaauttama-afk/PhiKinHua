// src/core/map/pages.ts
import type { RNG } from '../rng';
import { int } from '../rng';
import { PAGES_TOTAL, POOL_DEFAULT, WEIGHTS } from '../balance/weights';
import type { GameState } from '../types';

export type PageOffer =
  | { kind: 'monster', tier: 'normal' | 'elite' }
  | { kind: 'shop_card'; shopId: string }
  | { kind: 'shop_equipment'; shopId: string }
  | { kind: 'shop_remove'; shopId: string; phase: 1 | 2 }
  | { kind: 'shop_upgrade'; shopId: string; phase: 1 | 2 }
  | { kind: 'well' }
  | { kind: 'healing_shrine' }
  | { kind: 'next_event' } // ไปหน้าถัดไปแบบเหตุการณ์พิเศษ
  | { kind: 'boss' };

export type MapStatePages = {
  totalPages: number;
  pageIndex: number; // 0-based
  pools: {
    normal: number; elite: number;
    shopCard: number; shopEquipment: number; 
    shopRemove1: number; shopRemove2: number;
    shopUpgrade1: number; shopUpgrade2: number;
    wells: number; healingShrine: number; nextEvent: number;
  };
  // Track deleted shops for sequential logic
  deletedShops: string[];
  current?: { offers: PageOffer[]; resolved: boolean[] };
  _closeAfterCombat?: boolean;
  _advanceAfterLevelup?: boolean;
  _activeOfferIndex?: number;  // index ของช่องที่เปิดร้านอยู่
  _shopUsed?: boolean;         // ซื้อของอย่างน้อย 1 ครั้งในร้านนี้แล้ว
};

export function initPageMap(r: RNG) {
  const map: MapStatePages = {
    totalPages: PAGES_TOTAL,
    pageIndex: 0,
    pools: { ...POOL_DEFAULT },
    deletedShops: [],
  };
  return { map, rng: r };
}

export function pagesLeft(mp: MapStatePages) { return Math.max(0, mp.totalPages - mp.pageIndex); }
export function monstersLeft(mp: MapStatePages) { return Math.max(0, mp.pools.normal + mp.pools.elite); }

export function consumeToken(mp: MapStatePages, offer: PageOffer) {
  switch (offer.kind) {
    case 'monster':
      if (offer.tier === 'normal' && mp.pools.normal > 0) mp.pools.normal--;
      if (offer.tier === 'elite' && mp.pools.elite > 0) mp.pools.elite--;
      break;
    case 'shop_card':       if (mp.pools.shopCard      > 0) mp.pools.shopCard--;      break;
    case 'shop_equipment':  if (mp.pools.shopEquipment > 0) mp.pools.shopEquipment--; break;
    case 'shop_remove':     
      if (offer.phase === 1 && mp.pools.shopRemove1 > 0) mp.pools.shopRemove1--;
      if (offer.phase === 2 && mp.pools.shopRemove2 > 0) mp.pools.shopRemove2--;
      break;
    case 'shop_upgrade':    
      if (offer.phase === 1 && mp.pools.shopUpgrade1 > 0) mp.pools.shopUpgrade1--;
      if (offer.phase === 2 && mp.pools.shopUpgrade2 > 0) mp.pools.shopUpgrade2--;
      break;
    case 'well':            if (mp.pools.wells          > 0) mp.pools.wells--;          break;
    case 'healing_shrine':  if (mp.pools.healingShrine > 0) mp.pools.healingShrine--;  break;
    case 'next_event':      if (mp.pools.nextEvent     > 0) mp.pools.nextEvent--;      break;
    case 'boss':            break;
  }
}

// Generate shop offers with static IDs and sequential logic
export function rollPageOffers(mp: MapStatePages, r: RNG, s: GameState): { offers: PageOffer[]; rng: RNG } {
  const offers: PageOffer[] = [];
  const cand: Array<{ offer: PageOffer; w: number }> = [];

  const monsLeft = monstersLeft(mp);
  const pLeft    = pagesLeft(mp);
  const allowElite = (mp.pools.normal <= 0) && (mp.pools.elite > 0);
  const allowNext  = (mp.pools.nextEvent > 0) && (pLeft > monsLeft + 1);

  // inject boss เมื่อไม่มีมอนเหลือ
  if (monsLeft <= 0) {
    offers.push({ kind: 'boss' });
  }

  // บังคับมีมอนอย่างน้อย 1 ถ้ายังมีมอน
  if (monsLeft > 0) {
    if (mp.pools.normal > 0) offers.push({ kind: 'monster', tier: 'normal' });
    else if (allowElite)     offers.push({ kind: 'monster', tier: 'elite'  });
  }

  // Ensure deletedShops exists (fallback for existing saves) - MUST BE FIRST
  if (!mp.deletedShops) {
    mp.deletedShops = [];
  }

  // Generate static shop IDs based on page and position
  const pageId = mp.pageIndex + 1;
  let slotId = 0; // Counter for generating unique shop IDs

  // สร้าง candidate ตาม pool+weight with static IDs
  if (mp.pools.normal > 0)        cand.push({ offer: { kind: 'monster', tier: 'normal' }, w: WEIGHTS.monsterNormal });
  if (allowElite)                 cand.push({ offer: { kind: 'monster', tier: 'elite'  }, w: WEIGHTS.monsterElite });
  
  // Shop candidates with static IDs
  if (mp.pools.shopCard > 0) {
    cand.push({ offer: { kind: 'shop_card', shopId: `card_${pageId}_${++slotId}` }, w: WEIGHTS.shopCard });
  }
  if (mp.pools.shopEquipment > 0) {
    cand.push({ offer: { kind: 'shop_equipment', shopId: `equipment_${pageId}_${++slotId}` }, w: WEIGHTS.shopEquipment });
  }

  // Sequential remove shops
  if (mp.pools.shopRemove1 > 0 && !mp.deletedShops.includes('remove_1')) {
    cand.push({ offer: { kind: 'shop_remove', shopId: 'remove_1', phase: 1 }, w: WEIGHTS.shopRemove1 });
  }
  if (mp.pools.shopRemove2 > 0 && mp.deletedShops.includes('remove_1') && !mp.deletedShops.includes('remove_2')) {
    cand.push({ offer: { kind: 'shop_remove', shopId: 'remove_2', phase: 2 }, w: WEIGHTS.shopRemove2 });
  }
  
  // Sequential upgrade shops
  if (mp.pools.shopUpgrade1 > 0 && !mp.deletedShops.includes('upgrade_1')) {
    cand.push({ offer: { kind: 'shop_upgrade', shopId: 'upgrade_1', phase: 1 }, w: WEIGHTS.shopUpgrade1 });
  }
  if (mp.pools.shopUpgrade2 > 0 && mp.deletedShops.includes('upgrade_1') && !mp.deletedShops.includes('upgrade_2')) {
    cand.push({ offer: { kind: 'shop_upgrade', shopId: 'upgrade_2', phase: 2 }, w: WEIGHTS.shopUpgrade2 });
  }
  
  if (mp.pools.wells > 0)         cand.push({ offer: { kind: 'well' },                    w: WEIGHTS.well });
  if (mp.pools.healingShrine > 0) cand.push({ offer: { kind: 'healing_shrine' },          w: WEIGHTS.healingShrine });
  if (allowNext)                  cand.push({ offer: { kind: 'next_event' },              w: WEIGHTS.nextEvent });

  // เติมจนได้ 3 (no replacement โดยกันชนิดซ้ำ ยกเว้น monster ต่าง tier ถือว่าคนละชนิด)
  while (offers.length < 3 && cand.length > 0) {
    const total = cand.reduce((a, c) => a + c.w, 0);
    const rollOut = int(r, 0, Math.max(0, total - 1));
    r = rollOut.rng;
    const roll = rollOut.value;
    let acc = 0, idx = 0;
    for (let i = 0; i < cand.length; i++) { acc += cand[i].w; if (roll < acc) { idx = i; break; } }
    const pick = cand.splice(idx, 1)[0].offer;

    const dup = offers.some(o => {
      if (o.kind !== pick.kind) return false;
      if (o.kind === 'monster') return (o as any).tier === (pick as any).tier; // ซ้ำ tier = ไม่เอา
      if (o.kind === 'shop_remove' || o.kind === 'shop_upgrade') {
        return (o as any).shopId === (pick as any).shopId; // ซ้ำ shopId = ไม่เอา
      }
      if (o.kind === 'shop_card' || o.kind === 'shop_equipment') {
        return (o as any).shopId === (pick as any).shopId; // ซ้ำ shopId = ไม่เอา
      }
      return o.kind === pick.kind; // ชนิดเดียวกันถือว่าซ้ำ (สำหรับ events)
    });
    if (!dup) offers.push(pick);
  }

  // กันหน้าโล่ง (เชิงปฏิบัติ ถ้า candidate ไม่พอ)
  while (offers.length < 3) {
    if (mp.pools.wells > 0) offers.push({ kind: 'well' });
    else offers.push({ kind: 'shop_card', shopId: `card_fallback_${pageId}_${++slotId}` });
  }

  return { offers, rng: r };
}
