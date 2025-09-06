// src/core/engine/handlers/map_pages.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { initPageMap, rollPageOffers, consumeToken, MapStatePages } from '../../map/pages';
import { resetBlessingTurnFlags, runBlessingsTurnHook } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';

function ensureInit(s: GameState, r: RNG) {
  if (!s.pages) {
    const init = initPageMap(r);
    s.pages = init.map;
    r = init.rng;
  }
  return r;
}

export function open(s: GameState, _cmd: Extract<Command, { type: 'OpenPage' }>, r: RNG) {
  r = ensureInit(s, r);
  if (s.pages?.current && !s.pages.current.resolved?.every(Boolean)) {
    // มีหน้าเปิดอยู่และยังไม่เคลียร์ทั้งหมด
    return { state: s, rng: r };
  }
  const { offers, rng } = rollPageOffers(s.pages as MapStatePages, r, s); r = rng;
  s.pages!.current = { offers, resolved: offers.map(() => false) };
  s.phase = 'map';
  s.log.push(`Page ${s.pages!.pageIndex + 1}/${s.pages!.totalPages}: ${offers.map(formatOffer).join(', ')}`);
  return { state: s, rng: r };
}

 import { int } from '../../rng';

 function fallbackShopStock(r: RNG, size: number) {
   // โหลด pool จาก base pack โดยตรง (กันกรณี pack/registry ยังไม่พร้อม)
   let cards: any[] = [];
  try {
    // จาก engine/handlers → ../.. (core) → ../.. (src) → data/...
    cards = require('../../../data/packs/base/cards.json');
  } catch {
    cards = [];
  }
  const arr = Array.isArray(cards) ? cards : [];
  const pool = arr.filter((c: any) => c && (c.inShop === true || typeof c.cost === 'number'));
   const items: { card: any; price: number }[] = [];
   let rr = r;
   // sample แบบไม่ซ้ำ
   const bag = pool.slice();
   for (let k = 0; k < size && bag.length > 0; k++) {
     const ro = int(rr, 0, bag.length - 1);
     rr = ro.rng;
     const pick = bag.splice(ro.value, 1)[0];
     // ราคาอย่างง่าย (พอเทสต์): ยึด cost + ค่าสถานะ
     const price =
       Math.max(
         10,
         (pick.cost ?? 0) * 20 +
           (pick.dmg ?? 0) * 2 +
           (pick.block ?? 0) * 2 +
           (pick.draw ?? 0) * 10 +
           (pick.energyGain ?? 0) * 25
       );
     items.push({ card: pick, price });
   }
   return { rng: rr, items };
 }

 export function choose(s: GameState, cmd: Extract<Command, { type: 'ChooseOffer' }>, r: RNG) {
  if (!s.pages?.current) return { state: s, rng: r };
  const offer = s.pages.current.offers[cmd.index];
  if (!offer) return { state: s, rng: r };

  switch (offer.kind) {
    case 'shop_remove': {
      s.shopStock = undefined;
      s.shopKind = 'remove';
      s.phase = 'shop';
      s.pages!._activeOfferIndex = cmd.index;
      s.pages!._shopUsed = false;
      s.log.push('Opened shop_remove.');
      return { state: s, rng: r };
    }
    case 'shop_upgrade': {
      s.shopStock = undefined;
      s.shopKind = 'upgrade';
      s.phase = 'shop';
      s.pages!._activeOfferIndex = cmd.index;
      s.pages!._shopUsed = false;
      s.log.push('Opened shop_upgrade.');
      return { state: s, rng: r };
    }    
    case 'shop_card': {
      // เปิด Shop: พยายามใช้ rollShopStock ก่อน ถ้าพังใช้ fallback
      let items: any[] | undefined;
      try {
        const { rollShopStock } = require('../../shop');
        const { SHOP_STOCK_SIZE, SHOP_POWER_BIAS } = require('../../balance/weights');
        const out = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS);
        r = out.rng;
        items = out?.items;
      } catch (e: any) {
        s.log.push('Shop: roll failed, using fallback.');
      }
      if (!items || !Array.isArray(items)) {
        const { SHOP_STOCK_SIZE } = require('../../balance/weights');
        const fb = fallbackShopStock(r, SHOP_STOCK_SIZE);
        r = fb.rng;
        items = fb.items;
      }
      s.shopStock = items;
      s.phase = 'shop';
      s.shopKind = 'card';
      // ผูกช่องร้านนี้ไว้ เพื่อตัดสิน resolve ตอนปิดร้าน
      s.pages!._activeOfferIndex = cmd.index;
      s.pages!._shopUsed = false;
      s.log.push('Opened shop_card.');
      return { state: s, rng: r };
    }
    case 'well': {
      // เปิดเป็น event modal (Use/Dismiss) ปิดด้วย CompleteNode เท่านั้น
      s.event = { type: 'well', used: false, dismissed: false } as any;
      s.phase = 'event';
      s.pages!._activeOfferIndex = cmd.index;
      s.log.push('Well event opened.');
      return { state: s, rng: r };
    }
    case 'monster': {
      // ใช้โทเคนทันที
      consumeToken(s.pages, offer);
      // เริ่มคอมแบตแบบเลือก tier
      const { pickEnemy } = require('../../pack');
      const { buildAndShuffleDeck, drawUpTo } = require('../../commands');

      s.phase = 'combat';
      s.turn = 1;

      const tier: 'normal' | 'elite' | 'boss' = offer.tier;
      const res = pickEnemy(r, tier); r = res.rng;
      s.enemy = res.enemy;

      s.player.energy = START_ENERGY;
      ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
      ({ state: s, rng: r } = drawUpTo(s, r));
      resetBlessingTurnFlags(s);
      runBlessingsTurnHook(s, 'on_turn_start');
      s.pages!._closeAfterCombat = true; // ชนะแล้วปิดหน้า/ไปหน้าถัดไป
      s.log.push(`Page combat vs ${s.enemy?.name ?? 'Enemy'}`);
      return { state: s, rng: r };
    }
    case 'boss': {
      const { pickEnemy } = require('../../pack');
      const { buildAndShuffleDeck, drawUpTo } = require('../../commands');
      s.phase = 'combat';
      s.turn = 1;
      const res = pickEnemy(r, 'boss'); r = res.rng;
      s.enemy = res.enemy;
      s.player.energy = START_ENERGY;
      ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
      ({ state: s, rng: r } = drawUpTo(s, r));
      resetBlessingTurnFlags(s);
      runBlessingsTurnHook(s, 'on_turn_start');
      s.pages!._closeAfterCombat = true;
      s.log.push('Boss fight!');
      return { state: s, rng: r };
    }
    case 'next_event': {
      consumeToken(s.pages, offer);
      s.pages.pageIndex = Math.min(s.pages.pageIndex + 1, s.pages.totalPages);
      s.pages.current = undefined;
      s.log.push('Proceed via next_event');
      return open(s, { type: 'OpenPage' } as any, r);
    }
    // case 'shop_card':
    case 'shop_remove':
    case 'shop_upgrade':
    // case 'well': {
    // : {
      // Core เท่านั้น — ยังไม่เปิด modal จริง (จะทำใน PR ถัดไป)
      s.log.push(`Opened ${offer.kind} (core only). Use DismissOffer to clear.`);
      return { state: s, rng: r };
    //  }
  }
}

export function dismiss(s: GameState, cmd: Extract<Command, { type: 'DismissOffer' }>, r: RNG) {
  if (!s.pages?.current) return { state: s, rng: r };
  const offer = s.pages.current.offers[cmd.index];
  if (!offer) return { state: s, rng: r };
  if (!s.pages.current.resolved[cmd.index]) {
    s.pages.current.resolved[cmd.index] = true;
    consumeToken(s.pages, offer); // “กดลบ” = โทเคนหาย ไม่สุ่มซ้ำ
    s.log.push(`Dismissed ${formatOffer(offer)}`);
  }
  return { state: s, rng: r };
}

export function proceed(s: GameState, _cmd: Extract<Command, { type: 'Proceed' }>, r: RNG) {
  if (!s.pages?.current) return { state: s, rng: r };
  const ok = s.pages.current.resolved.every(Boolean);
  if (!ok) { s.log.push('Cannot proceed: page not cleared.'); return { state: s, rng: r }; }
  s.pages.pageIndex = Math.min(s.pages.pageIndex + 1, s.pages.totalPages);
  s.pages.current = undefined;
  return open(s, { type: 'OpenPage' } as any, r);
}

export function completeNode(s: GameState, _cmd: Extract<Command, { type: 'CompleteNode' }>, r: RNG) {
  // ปิดร้าน (pages-mode): ถ้าซื้อของ ≥1 ครั้ง ให้ resolve ช่อง + consume token
  // ปิด "shop" ใน pages-mode
  if (s.phase === 'shop' && s.mapMode === 'pages' && s.pages?.current) {
    const idx = s.pages._activeOfferIndex;
    if (typeof idx === 'number') {
      if (s.pages._shopUsed && !s.pages.current.resolved[idx]) {
        s.pages.current.resolved[idx] = true;
        const offer = s.pages.current.offers[idx];
        const { consumeToken } = require('../../map/pages');
        consumeToken(s.pages, offer);
        s.log.push('Shop resolved (purchased).');
      } else {
        s.log.push('Shop closed (no purchase).');
      }
    }
    s.shopStock = undefined;
    s.shopKind = undefined;
    s.pages._activeOfferIndex = undefined;
    s.pages._shopUsed = false;
    s.phase = 'map';
    return { state: s, rng: r };
  }

  // ปิด "event: well" ใน pages-mode
  if (s.phase === 'event' && (s.event as any)?.type === 'well' && s.mapMode === 'pages' && s.pages?.current) {
    const idx = s.pages._activeOfferIndex;
    if (typeof idx === 'number' && !s.pages.current.resolved[idx]) {
      const wasUsed = (s.event as any).used === true;
      const wasDismiss = (s.event as any).dismissed === true;
      if (wasUsed || wasDismiss) {
        s.pages.current.resolved[idx] = true;
        const offer = s.pages.current.offers[idx];
        const { consumeToken } = require('../../map/pages');
        consumeToken(s.pages, offer);
        s.log.push(wasUsed ? 'Well resolved (used).' : 'Well resolved (dismissed).');
      } else {
        s.log.push('Well closed (no action).');
      }
    }
    s.event = undefined;
    s.pages._activeOfferIndex = undefined;
    s.phase = 'map';
    return { state: s, rng: r };
  }
 
  // ชนะไฟต์ → อาจมี LevelUp ก่อน, จากนั้นค่อยปิดหน้าและไปต่อ
  if (s.phase === 'victory') {
    if (s.levelUp && !s.levelUp.consumed) {
      s.pages!._advanceAfterLevelup = true;
      s.phase = 'levelup';
      return { state: s, rng: r };
    }
    if (s.pages?._closeAfterCombat) {
      s.pages.pageIndex = Math.min(s.pages.pageIndex + 1, s.pages.totalPages);
      s.pages.current = undefined;
      s.pages._closeAfterCombat = false;
      s.phase = 'map';
      s.log.push('Page closed after combat.');
      return open(s, { type: 'OpenPage' } as any, r);
    }
    s.phase = 'map';
    return { state: s, rng: r };
  }

  if (s.phase === 'levelup') {
    if (s.pages?._advanceAfterLevelup) {
      s.levelUp = null;
      s.pages.pageIndex = Math.min(s.pages.pageIndex + 1, s.pages.totalPages);
      s.pages.current = undefined;
      s.pages._advanceAfterLevelup = false;
      s.phase = 'map';
      return open(s, { type: 'OpenPage' } as any, r);
    }
    s.levelUp = null;
    s.phase = 'map';
    return { state: s, rng: r };
  }

  return { state: s, rng: r };
}

function formatOffer(o: any) {
  return o.kind === 'monster' ? `monster:${o.tier}` : o.kind;
}
