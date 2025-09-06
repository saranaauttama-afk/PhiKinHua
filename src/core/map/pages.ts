// src/core/map/pages.ts
import type { RNG } from '../rng';
import { int } from '../rng';
import { PAGES_TOTAL, POOL_DEFAULT, WEIGHTS } from '../balance/weights';
import type { GameState } from '../types';

export type PageOffer =
  | { kind: 'monster', tier: 'normal' | 'elite' }
  | { kind: 'shop_card' }
  | { kind: 'shop_remove' }
  | { kind: 'shop_upgrade' }
  | { kind: 'well' }
  | { kind: 'next_event' } // ไปหน้าถัดไปแบบเหตุการณ์พิเศษ
  | { kind: 'boss' };

export type MapStatePages = {
  totalPages: number;
  pageIndex: number; // 0-based
  pools: {
    normal: number; elite: number;
    shopCard: number; shopRemove: number; shopUpgrade: number;
    wells: number; nextEvent: number;
  };
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
    case 'shop_card':     if (mp.pools.shopCard    > 0) mp.pools.shopCard--;    break;
    case 'shop_remove':   if (mp.pools.shopRemove  > 0) mp.pools.shopRemove--;  break;
    case 'shop_upgrade':  if (mp.pools.shopUpgrade > 0) mp.pools.shopUpgrade--; break;
    case 'well':          if (mp.pools.wells       > 0) mp.pools.wells--;       break;
    case 'next_event':    if (mp.pools.nextEvent   > 0) mp.pools.nextEvent--;   break;
    case 'boss':          break;
  }
}

// สุ่ม 3 ตัวเลือก/หน้า (กฎ: normal ต้องหมดก่อน elite; ต้องเหลือมอนอย่างน้อย 1 สลอตถ้ายังมีมอน; next_event ต้องไม่ทำให้ soft-lock)
export function rollPageOffers(mp: MapStatePages, r: RNG, _s: GameState): { offers: PageOffer[]; rng: RNG } {
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

  // สร้าง candidate ตาม pool+weight
  if (mp.pools.normal   > 0) cand.push({ offer: { kind: 'monster', tier: 'normal' }, w: WEIGHTS.monsterNormal });
  if (allowElite)             cand.push({ offer: { kind: 'monster', tier: 'elite'  }, w: WEIGHTS.monsterElite });
  if (mp.pools.shopCard > 0)  cand.push({ offer: { kind: 'shop_card' },             w: WEIGHTS.shopCard });
  if (mp.pools.shopRemove > 0)cand.push({ offer: { kind: 'shop_remove' },           w: WEIGHTS.shopRemove });
  if (mp.pools.shopUpgrade > 0)cand.push({ offer: { kind: 'shop_upgrade' },         w: WEIGHTS.shopUpgrade });
  if (mp.pools.wells > 0)     cand.push({ offer: { kind: 'well' },                  w: WEIGHTS.well });
  if (allowNext)              cand.push({ offer: { kind: 'next_event' },            w: WEIGHTS.nextEvent });

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
      return true; // ชนิดเดียวกันถือว่าซ้ำ
    });
    if (!dup) offers.push(pick);
  }

  // กันหน้าโล่ง (เชิงปฏิบัติ ถ้า candidate ไม่พอ)
  while (offers.length < 3) {
    if (mp.pools.wells > 0) offers.push({ kind: 'well' });
    else offers.push({ kind: 'shop_card' });
  }

  return { offers, rng: r };
}
