// src/core/engine/handlers/map_pages.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import * as ShopEv from './shops_events';

import {
  initPageMap,
  rollPageOffers,
  consumeToken,
  type MapStatePages,
  type PageOffer,
} from '../../map/pages';

import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo, startPlayerTurn } from '../../commands';
import { resetBlessingTurnFlags, runBlessingsTurnHook } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';
import { buildAndShuffleEnemyDeck } from './enemy';
import { runEquipmentOnEquip } from '../../equipmentRuntime';
import { getEquipmentById } from '../../pack';

type ShopOpenFn = (s: GameState, r: RNG) => { state: GameState; rng: RNG };

// Remove temporary equipment after combat
function removeTemporaryEquipment(s: GameState) {
  if (!s.equipped) return;
  
  const permanentEquipment = s.equipped.filter(eq => !eq.temporary);
  const removedCount = s.equipped.length - permanentEquipment.length;
  
  s.equipped = permanentEquipment;
  
  if (removedCount > 0) {
    s.log.push(`Removed ${removedCount} temporary equipment`);
  }
}

function resolveShops(): {
  openShopCard?: ShopOpenFn;
  openShopRemove?: ShopOpenFn;
  openShopUpgrade?: ShopOpenFn;
  openWell?: ShopOpenFn;
} {
  const mod = require('./shops_events') || {};
  return {
    // พยายามรองรับหลายชื่อที่ทีมอาจใช้
    openShopCard: mod.openShopCard ?? mod.openCardShop ?? mod.openShopCards ?? mod.openShop,
    openShopRemove: mod.openShopRemove ?? mod.openRemoveShop ?? mod.openShopRemoveFn,
    openShopUpgrade: mod.openShopUpgrade ?? mod.openUpgradeShop ?? mod.openShopUpgradeFn,
    openWell: mod.openWell ?? mod.openEventWell ?? mod.openWellEvent,
  };
}

function callOrLog(
  fn: ShopOpenFn | undefined,
  name: string,
  s: GameState,
  r: RNG
): { state: GameState; rng: RNG } {
  if (!fn) {
    s.log.push(`Shop/Event resolver: "${name}" undefined (check exports in shops_events.ts)`);
    return { state: s, rng: r };
  }
  return fn(s, r);
}

// -------------------------------------------------
// Helpers
// -------------------------------------------------
function ensurePages(s: GameState, r: RNG): { rng: RNG; mp: MapStatePages } {
  if (!s.pages) {
    const out = initPageMap(r);
    s.mapMode = 'pages';
    s.pages = out.map;
    return { rng: out.rng, mp: s.pages };
  }
  return { rng: r, mp: s.pages };
}

function formatOffer(o: PageOffer): string {
  return o.kind === 'monster' ? `monster:${o.tier}` : o.kind;
}

function openPageInternal(s: GameState, mp: MapStatePages, r: RNG) {
  const out = rollPageOffers(mp, r, s);
  r = out.rng;
  const offers: PageOffer[] = out.offers as PageOffer[];
  mp.current = { offers, resolved: offers.map(() => false) };
  mp._activeOfferIndex = undefined;
  mp._shopUsed = false;
  s.phase = 'map';
  (s as any).nodePhase = 'map_ready';
  s.log.push(
    `Page ${mp.pageIndex + 1}/${mp.totalPages}: ${offers
      .map((o: PageOffer) => formatOffer(o))
      .join(', ')}`
  );
  return { state: s, rng: r };
}

// -------------------------------------------------
// Commands
// -------------------------------------------------
export function qaInitPages(s: GameState, _cmd: Extract<Command, { type: 'QA_InitPages' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;
  mp.pageIndex = 0;
  return openPageInternal(s, mp, rng);
}

export function open(s: GameState, _cmd: Extract<Command, { type: 'OpenPage' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;
  // ถ้ายังเคลียร์หน้าเดิมไม่ครบ อย่า roll ใหม่
  if (mp.current && !mp.current.resolved.every(Boolean)) {
    return { state: s, rng };
  }
  return openPageInternal(s, mp, rng);
}

export function qaPrintPage(s: GameState, _cmd: Extract<Command, { type: 'QA_PrintPage' }>, r: RNG) {
  const got = ensurePages(s, r);
  const { rng, mp } = got;
  if (!mp.current) return { state: s, rng };
  const offers: PageOffer[] = mp.current.offers as PageOffer[];
  const { resolved } = mp.current;
  s.log.push(
    offers
      .map((o: PageOffer, i: number) => `${i}:${formatOffer(o)}${resolved[i] ? '✓' : ''}`)
      .join(' | ')
  );
  return { state: s, rng };
}

export function choose(s: GameState, cmd: Extract<Command, { type: 'ChooseOffer' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;

  if (!mp.current) return { state: s, rng };
  const ix = cmd.index;
  const offers: PageOffer[] = mp.current.offers as PageOffer[];
  const offer: PageOffer | undefined = offers[ix];
  if (!offer || mp.current.resolved[ix]) return { state: s, rng };

  switch (offer.kind) {
    case 'monster': {
      // เริ่มคอมแบต (normal/elite)
      s.phase = 'combat';
      (s as any).nodePhase = 'in_combat';
      s.turn = 1;
      // PATCH: กัน PlayCard ไม่ทำงานเพราะ lock ค้างจากไฟต์ก่อน
      s.combatVictoryLock = false;
      // เคลียร์สเตตคอมแบตก่อนทุกครั้ง (ป้องกันหลงเหลือจากไฟต์ก่อน)
      (s as any).enemyPiles = undefined;
      (s as any).playerPiles = undefined;
      (s as any).enemyIntentCardId = null;
      s.player.block = 0;
      s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      
      // Set temporary equipment slots during combat  
      s.equipmentTempSlots = 5; // Allow 5 additional equipment during combat

      // เลือกศัตรู + สร้างเด็คศัตรู
      const res = pickEnemy(rng, offer.tier);
      rng = res.rng;
      s.enemy = res.enemy;
      ({ state: s, rng } = buildAndShuffleEnemyDeck(s, rng));
      
      // Initialize enemy behaviors and minions
      const { initializeEnemyBehaviors } = require('../../enemyBehaviorRuntime');
      const { syncMinionsToState } = require('../../minionRuntime');
      
      initializeEnemyBehaviors(s);
      // Don't clear minions on combat start - let them persist from previous summons
      syncMinionsToState(s);
      
      // ตั้ง intent แสดงล่วงหน้า (ไพ่บนสุดของ draw)
      (s as any).enemyIntentCardId = (s as any).enemyPiles?.draw?.[0] ?? null;

      // สร้างเด็คผู้เล่น + จั่วมือแรก
      ({ state: s, rng } = buildAndShuffleDeck(s, rng));
      ({ state: s, rng } = drawUpTo(s, rng, s.player.maxHandSize));

      // ★ Equipment: battle-start hook (NOTM-style)
      runEquipmentOnEquip(s); // Player equipment
      runEquipmentOnEquip(s, 'enemy'); // Enemy equipment

      // start-of-turn blessing hooks
      resetBlessingTurnFlags(s);
      runBlessingsTurnHook(s, 'on_turn_start');

      mp._activeOfferIndex = ix;
      mp._shopUsed = false;
      s.log.push(`ChooseOffer → combat (${offer.tier}) vs ${s.enemy?.id ?? s.enemy?.name ?? 'Enemy'}`);
      return { state: s, rng };
    }

    case 'boss': {
      s.phase = 'combat';
      (s as any).nodePhase = 'in_combat';
      s.turn = 1;
      // PATCH: กัน PlayCard ไม่ทำงานเพราะ lock ค้างจากไฟต์ก่อน
      s.combatVictoryLock = false;
      (s as any).enemyPiles = undefined;
      (s as any).playerPiles = undefined;
      (s as any).enemyIntentCardId = null;
      s.player.block = 0;
      s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      
      // Set temporary equipment slots during combat  
      s.equipmentTempSlots = 5; // Allow 5 additional equipment during combat

      const res = pickEnemy(rng, 'boss');
      rng = res.rng;
      s.enemy = res.enemy;
      ({ state: s, rng } = buildAndShuffleEnemyDeck(s, rng));
      
      // Initialize boss behaviors and minions
      const { initializeEnemyBehaviors } = require('../../enemyBehaviorRuntime');
      const { syncMinionsToState } = require('../../minionRuntime');
      
      initializeEnemyBehaviors(s);
      // Don't clear minions on combat start - let them persist from previous summons
      syncMinionsToState(s);
      
      (s as any).enemyIntentCardId = (s as any).enemyPiles?.draw?.[0] ?? null;

      ({ state: s, rng } = buildAndShuffleDeck(s, rng));
      ({ state: s, rng } = drawUpTo(s, rng, s.player.maxHandSize));

      // ★ Equipment: battle-start hook (NOTM-style)
      runEquipmentOnEquip(s); // Player equipment
      runEquipmentOnEquip(s, 'enemy'); // Enemy equipment      

      resetBlessingTurnFlags(s);
      runBlessingsTurnHook(s, 'on_turn_start');

      mp._activeOfferIndex = ix;
      mp._shopUsed = false;
      s.log.push('ChooseOffer → combat (boss)');
      return { state: s, rng };
    }

    case 'shop_card': {
      console.log('🛒 Shop_card handler debug:', {
        hasRespawnId: !!offer.respawnShopId,
        respawnId: offer.respawnShopId,
        registryLength: s.shopRegistry?.length || 0
      });
      
      // Check if this is a respawn shop
      if (offer.respawnShopId) {
        const shop = s.shopRegistry?.find(shop => shop.id === offer.respawnShopId);
        console.log('🛒 Found respawn shop:', shop ? 'YES' : 'NO', shop?.inventory.length);
        if (shop) {
          // Use existing shop inventory
          s.shopStock = shop.inventory.map(item => ({ card: item.card, price: item.price }));
          s.shopKind = 'card';
          s.shopBoughtItems = []; // Reset bought items tracker
          s.phase = 'shop';
          mp._activeOfferIndex = ix; mp._shopUsed = false;
          s.log.push(`ChooseOffer → respawn shop_card (${shop.inventory.length} items)`);
          return { state: s, rng };
        }
      }
      
      if (typeof ShopEv.openShopCard !== 'function') {
        s.log.push('openShopCard missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopCard(s, rng);
      s = out.state; rng = out.rng;
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      s.log.push('ChooseOffer → shop_card');
      return { state: s, rng };
    }

    case 'shop_remove': {
      // Check if this is a respawn shop
      if (offer.respawnShopId) {
        const shop = s.shopRegistry?.find(shop => shop.id === offer.respawnShopId);
        if (shop) {
          s.shopKind = 'remove';
          s.shopBoughtItems = []; // Reset bought items tracker
          s.phase = 'shop';
          mp._activeOfferIndex = ix; mp._shopUsed = false;
          s.log.push(`ChooseOffer → respawn shop_remove`);
          return { state: s, rng };
        }
      }
      
      if (typeof ShopEv.openShopRemove !== 'function') {
        s.log.push('openShopRemove missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopRemove(s, rng);
      s = out.state; rng = out.rng;
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      s.log.push('ChooseOffer → shop_remove');
      return { state: s, rng };
    }

    case 'shop_upgrade': {
      // Check if this is a respawn shop
      if (offer.respawnShopId) {
        const shop = s.shopRegistry?.find(shop => shop.id === offer.respawnShopId);
        if (shop) {
          s.shopKind = 'upgrade';
          s.shopBoughtItems = []; // Reset bought items tracker
          s.phase = 'shop';
          mp._activeOfferIndex = ix; mp._shopUsed = false;
          s.log.push(`ChooseOffer → respawn shop_upgrade`);
          return { state: s, rng };
        }
      }
      
      if (typeof ShopEv.openShopUpgrade !== 'function') {
        s.log.push('openShopUpgrade missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopUpgrade(s, rng);
      s = out.state; rng = out.rng;
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      s.log.push('ChooseOffer → shop_upgrade');
      return { state: s, rng };
    }

    case 'shop_equipment': {
      // Check if this is a respawn shop
      if (offer.respawnShopId) {
        const shop = s.shopRegistry?.find(shop => shop.id === offer.respawnShopId);
        if (shop) {
          // Use existing shop inventory for equipment
          s.shopStock = shop.inventory.map(item => ({ equipment: item.equipment, price: item.price }));
          s.shopKind = 'equipment';
          s.shopBoughtItems = []; // Reset bought items tracker
          s.phase = 'shop';
          mp._activeOfferIndex = ix; mp._shopUsed = false;
          s.log.push(`ChooseOffer → respawn shop_equipment (${shop.inventory.length} items)`);
          return { state: s, rng };
        }
      }
      
      if (typeof ShopEv.openShopEquipment !== 'function') {
        s.log.push('openShopEquipment missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopEquipment(s, rng);
      s = out.state; rng = out.rng;
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      s.log.push('ChooseOffer → shop_equipment');
  return { state: s, rng };
    }

    case 'well': {
  if (typeof ShopEv.openWell !== 'function') {
    s.log.push('openWell missing export in shops_events.ts');
    return { state: s, rng };
  }
  const out = ShopEv.openWell(s, rng);
  s = out.state; rng = out.rng;
  mp._activeOfferIndex = ix; mp._shopUsed = false;
  s.log.push('ChooseOffer → well');
  return { state: s, rng };
    }

    case 'healing_shrine': {
  if (typeof ShopEv.openHealingShrine !== 'function') {
    s.log.push('openHealingShrine missing export in shops_events.ts');
    return { state: s, rng };
  }
  const out = ShopEv.openHealingShrine(s, rng);
  s = out.state; rng = out.rng;
  mp._activeOfferIndex = ix; mp._shopUsed = false;
  s.log.push('ChooseOffer → healing_shrine');
  return { state: s, rng };
    }

    case 'next_event': {
      // ใช้ token แล้วข้ามหน้าเลย
      consumeToken(mp, offer);
      mp.current.resolved[ix] = true;
      s.log.push('ChooseOffer → next_event (proceed)');
      return proceed(s, { type: 'Proceed' } as any, rng);
    }

    default:
      return { state: s, rng };
  }
}

export function dismiss(s: GameState, cmd: Extract<Command, { type: 'DismissOffer' }>, r: RNG) {
  const got = ensurePages(s, r);
  const { rng, mp } = got;
  if (!mp.current) return { state: s, rng };

  const ix = cmd.index;
  const offer: PageOffer | undefined = (mp.current.offers as PageOffer[])[ix];
  if (!offer || mp.current.resolved[ix]) return { state: s, rng };

  mp.current.resolved[ix] = true;
  consumeToken(mp, offer);
  s.log.push(`DismissOffer: ${formatOffer(offer)}`);
  return { state: s, rng };
}

export function proceed(s: GameState, _cmd: Extract<Command, { type: 'Proceed' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;

  if (mp.pageIndex + 1 >= mp.totalPages) {
    s.log.push('Proceed: already at last page');
    return { state: s, rng };
  }
  mp.pageIndex += 1;
  mp.current = undefined;
  return open(s, { type: 'OpenPage' } as any, rng);
}

export function completeNode(s: GameState, _cmd: Extract<Command, { type: 'CompleteNode' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;

  if (!mp.current) return { state: s, rng };
  const ix = mp._activeOfferIndex;

  if (ix != null && (mp.current.offers as PageOffer[])[ix]) {
    const offer: PageOffer = (mp.current.offers as PageOffer[])[ix] as PageOffer;

    if (s.phase === 'victory') {
      // จบคอมแบต → resolve + consume token
      mp.current.resolved[ix] = true;
      consumeToken(mp, offer);

      if (offer.kind === 'boss') {
        s.log.push('Boss defeated! Act cleared.');
        // Clear temporary equipment slots
        s.equipmentTempSlots = 0;
        // Remove temporary equipment after boss combat too
        removeTemporaryEquipment(s);
        // คง phase='victory' ให้ UI แสดงจบแอค
        return { state: s, rng };
      }

      // คอมแบตธรรมดา → กลับหน้า map
      s.phase = 'map';
      (s as any).nodePhase = 'map_ready';
      s.enemy = undefined;
      (s as any).enemyPiles = undefined;
      (s as any).playerPiles = undefined;
      (s as any).enemyIntentCardId = null;
      s.player.block = 0;
      s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      
      // Clear temporary equipment slots
      s.equipmentTempSlots = 0;
      
      // Remove temporary equipment after combat
      removeTemporaryEquipment(s);
    }
    else if (s.phase === 'shop') {
      // Leave Shop - save to registry for persistence
      const offer = mp.current.offers[ix] as PageOffer;
      
      console.log('🛒 Leave shop debug:', {
        hasOffer: !!offer,
        hasRespawnId: offer && 'respawnShopId' in offer && !!offer.respawnShopId,
        respawnId: offer && 'respawnShopId' in offer ? offer.respawnShopId : null,
        shopUsed: mp._shopUsed,
        shopKind: s.shopKind,
        stockCount: s.shopStock?.length || 0,
        boughtCount: s.shopBoughtItems?.length || 0
      });
      
      if (offer && 'respawnShopId' in offer && offer.respawnShopId) {
        // Update existing registry shop
        const { updateShopInRegistry } = require('../../shopRegistry');
        const boughtItems = s.shopBoughtItems || [];
        updateShopInRegistry(s, offer.respawnShopId, s.shopStock || [], boughtItems);
        console.log('🛒 Updated existing shop in registry');
      } else if (s.shopStock && s.shopKind && mp._shopUsed) {
        // First time leaving shop that was used - add to registry
        const { addShopToRegistry } = require('../../shopRegistry');
        const boughtItems = s.shopBoughtItems || [];
        addShopToRegistry(s, s.shopKind as any, s.shopStock, boughtItems);
        console.log('🛒 Added new shop to registry');
      } else {
        console.log('🛒 Shop not saved to registry (not used or missing data)');
      }
      
      s.shopStock = undefined;
      s.shopKind = undefined;
      s.shopBoughtItems = undefined; // Clear bought items tracker
      s.phase = 'map';
    }
    else if (s.phase === 'event') {
      // well: ต้องใช้หรือกดปิดให้ถูก flag ถึง resolve; event ชนิดอื่น resolve ได้ตรง ๆ
      const ok =
        (s.event?.type === 'well' && ((s.event.used ?? false) || (s.event.dismissed ?? false))) ||
        (s.event?.type && s.event.type !== 'well');

      if (ok) {
        mp.current.resolved[ix] = true;
        consumeToken(mp, offer);
      }
      s.event = undefined;
      s.phase = 'map';
    }

    // reset flags
    mp._activeOfferIndex = undefined;
    mp._shopUsed = false;
  }

  // เคลียร์ครบ 3 ช่อง → ไปหน้าถัดไป auto
  if (s.pages?.current?.resolved.every(Boolean)) {
    return proceed(s, { type: 'Proceed' } as any, rng);
  }
  return { state: s, rng };
}

export function deleteShop(s: GameState, _cmd: Extract<Command, { type: 'DeleteShop' }>, rng: RNG) {
  if (s.phase !== 'shop' || s.mapMode !== 'pages' || !s.pages) {
    return { state: s, rng };
  }

  const mp = s.pages;
  const ix = mp._activeOfferIndex;
  
  if (ix === undefined || !mp.current?.offers[ix]) {
    return { state: s, rng };
  }

  const offer = mp.current.offers[ix];

  // Delete shop - resolve ทันที
  mp.current.resolved[ix] = true;
  consumeToken(mp, offer);
  
  s.shopStock = undefined;
  s.shopKind = undefined;
  s.phase = 'map';
  s.log.push('🗑️ Shop deleted permanently');

  // reset flags
  mp._activeOfferIndex = undefined;
  mp._shopUsed = false;

  // เคลียร์ครบ 3 ช่อง → ไปหน้าถัดไป auto
  if (s.pages?.current?.resolved.every(Boolean)) {
    return proceed(s, { type: 'Proceed' } as any, rng);
  }

  return { state: s, rng };
}

/**
 * ตรวจสอบว่าสามารถไปหน้าถัดไปได้หรือไม่
 * เงื่อนไข:
 * 1. Combat ต้องเสร็จ (resolved = true)  
 * 2. Shop/Event ไม่บังคับ แต่ถ้ายังไม่ resolved ก็ยังไปไม่ได้
 */
function canProceedToNextMap(s: GameState): boolean {
  if (s.mapMode !== 'pages' || !s.pages?.current) return false;
  
  const mp = s.pages;
  const offers = mp.current.offers;
  const resolved = mp.current.resolved;
  
  let hasCombat = false;
  let combatCompleted = false;
  
  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const isResolved = resolved[i];
    
    if (offer.kind === 'monster') {
      hasCombat = true;
      if (isResolved) {
        combatCompleted = true;
      }
    }
  }
  
  // Must have combat and complete it
  if (hasCombat && !combatCompleted) {
    return false;
  }
  
  // Combat completed - check if we can proceed
  // All resolved = proceed (traditional way)
  // OR Combat done + no mandatory unresolved slots = proceed 
  return resolved.every(Boolean);
}
