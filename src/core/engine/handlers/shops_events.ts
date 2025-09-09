// src/core/engine/handlers/shops_events.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { rollShopStock } from '../../shop';
import { applyRemoveCard, rollGamble, rollTreasure } from '../../events';
import { START_ENERGY } from '../../balance/core';
import { removeCostForCount, upgradeCostForCount } from '../../balance/economy';
import { SHOP_REROLL_COST } from '../../balance/economy';
import { SHOP_STOCK_SIZE, SHOP_POWER_BIAS } from '../../balance/weights';
import { upgradeCard } from '../shared';
// ===== Fallback stock (ใช้เมื่อ rollShopStock พัง/ยังไม่พร้อม) =====
import { int } from '../../rng';
const cardsBase = require('../../../data/packs/base/cards.json'); // top-level ให้ Metro bundle
function fallbackShopStock(r: RNG, size: number) {
  const arr: any[] = Array.isArray(cardsBase) ? cardsBase : [];
  const pool = arr.filter((c) => c && (c.inShop === true || typeof c.cost === 'number'));
  const items: { card: any; price: number }[] = [];
  let rr = r;
  const bag = pool.slice();
  for (let k = 0; k < size && bag.length > 0; k++) {
    const ro = int(rr, 0, bag.length - 1);
    rr = ro.rng;
    const pick = bag.splice(ro.value, 1)[0];
    const price = Math.max(
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

export function shopReroll(s: GameState, _cmd: Extract<Command, { type: 'ShopReroll' }>, r: RNG) {
  if (s.phase !== 'shop') return { state: s, rng: r };
  if ((s.player.gold ?? 0) < SHOP_REROLL_COST) {
    s.log.push('Shop: Not enough gold to reroll');
    return { state: s, rng: r };
  }
  s.player.gold -= SHOP_REROLL_COST;
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS);
    r = out.rng;
    s.shopStock = out.items;
  } catch {
    const fb = fallbackShopStock(r, SHOP_STOCK_SIZE);
    r = fb.rng;
    s.shopStock = fb.items;
    s.log.push('Shop: reroll fallback stock.');
  }
  s.log.push(`Shop: rerolled (-${SHOP_REROLL_COST}g)`);
  return { state: s, rng: r };
}

export function qaOpenShopHere(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenShopHere' }>, r: RNG) {
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS);
    r = out.rng;
    s.shopStock = out.items;
  } catch {
    const fb = fallbackShopStock(r, SHOP_STOCK_SIZE);
    r = fb.rng;
    s.shopStock = fb.items;
    s.log.push('QA: fallback shop stock.');
  }
  s.phase = 'shop';
  s.shopKind = 'card';
  return { state: s, rng: r };
}

// export function takeReward(s: GameState, cmd: Extract<Command, { type: 'TakeReward' }>, r: RNG) {
//   if (s.phase !== 'reward' || !s.rewardOptions) return { state: s, rng: r };
//   const idx = cmd.index;
//   const chosen = s.rewardOptions[idx];
//   if (!chosen) return { state: s, rng: r };
//   s.masterDeck.push(JSON.parse(JSON.stringify(chosen)));
//   s.log.push(`Took reward: ${chosen.name}`);
//   s.rewardOptions = undefined;
//   return { state: s, rng: r };
// }

export function takeShop(s: GameState, cmd: Extract<Command, { type: 'TakeShop' }>, r: RNG) {
  if (s.phase !== 'shop' || !s.shopStock) return { state: s, rng: r };
  const i = cmd.index;
  const item = s.shopStock[i];
  if (!item) return { state: s, rng: r };
  if (s.player.gold < item.price) {
    s.log.push('Shop: Not enough gold');
    return { state: s, rng: r };
  }
  s.player.gold -= item.price;
  s.masterDeck.push(JSON.parse(JSON.stringify(item.card)));
  s.shopStock.splice(i, 1);
  s.log.push(`Shop: bought ${item.card.name} for ${item.price}g`);
  // โหมด pages: ถือว่า "ใช้ร้าน" แล้ว (จะ resolve ตอนปิดร้าน)
  if (s.mapMode === 'pages' && s.pages) {
    s.pages._shopUsed = true;
  }  
  return { state: s, rng: r };
}

export function shopRemoveBuy(s: GameState, cmd: Extract<Command, { type: 'ShopRemoveBuy' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'remove') return { state: s, rng: r };
  const count = (s.runCounters?.removeShopCount ?? 0);
  const price = removeCostForCount(count);
  if ((s.player.gold ?? 0) < price) {
    s.log.push(`Remove shop: Not enough gold (${price}g).`);
    return { state: s, rng: r };
  }
  const i = cmd.index;
  if (i < 0 || i >= (s.masterDeck?.length ?? 0)) return { state: s, rng: r };
  s.player.gold -= price;
  s.masterDeck.splice(i, 1);
  s.runCounters = s.runCounters || ({} as any);
  (s.runCounters as any).removeShopCount = count + 1;
  s.log.push(`Remove shop: removed card #${i} (-${price}g).`);
  if (s.mapMode === 'pages' && s.pages) s.pages._shopUsed = true;
  return { state: s, rng: r };
}

export function doWellUse(s: GameState, _cmd: Extract<Command, { type: 'DoWellUse' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'well') return { state: s, rng: r };
  if (!(s.event as any).used) {
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
    (s.event as any).used = true;
    (s.event as any).dismissed = false;
    s.log.push('Well: used (+10 HP).');
  }
  return { state: s, rng: r };
}

export function doWellDismiss(s: GameState, _cmd: Extract<Command, { type: 'DoWellDismiss' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'well') return { state: s, rng: r };
  (s.event as any).dismissed = true;
  (s.event as any).used = false;
  s.log.push('Well: dismissed.');
  return { state: s, rng: r };
}

export function shopUpgradeBuy(s: GameState, cmd: Extract<Command, { type: 'ShopUpgradeBuy' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'upgrade') return { state: s, rng: r };
  const count = (s.runCounters?.upgradeShopCount ?? 0);
  const price = upgradeCostForCount(count);
  if ((s.player.gold ?? 0) < price) {
    s.log.push(`Upgrade shop: Not enough gold (${price}g).`);
    return { state: s, rng: r };
  }
  const i = cmd.index;
  if (i < 0 || i >= (s.masterDeck?.length ?? 0)) return { state: s, rng: r };
  s.player.gold -= price;
  s.masterDeck[i] = upgradeCard(s.masterDeck[i]);
  s.runCounters = s.runCounters || ({} as any);
  (s.runCounters as any).upgradeShopCount = count + 1;
  s.log.push(`Upgrade shop: upgraded card #${i} (-${price}g).`);
  if (s.mapMode === 'pages' && s.pages) s.pages._shopUsed = true;
  return { state: s, rng: r };
}

export function doBonfireHeal(s: GameState, _cmd: Extract<Command, { type: 'DoBonfireHeal' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'bonfire') return { state: s, rng: r };
  if (!s.event.healed) {
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
    s.event.healed = true;
    s.log.push('Bonfire: healed +10');
  }
  return { state: s, rng: r };
}

export function eventChooseBlessing(s: GameState, cmd: Extract<Command, { type: 'EventChooseBlessing' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'shrine') return { state: s, rng: r };
  const idx = cmd.index;
  const pick = s.event.options[idx];
  if (!pick) return { state: s, rng: r };
  if (!s.blessings.find(b => b.id === pick.id)) {
    s.blessings.push(pick);
    s.event.chosenId = pick.id;
    s.log.push(`Shrine: took ${pick.name}`);
  } else {
    s.log.push('Shrine: already owned');
  }
  return { state: s, rng: r };
}

export function eventRemoveCard(s: GameState, cmd: Extract<Command, { type: 'EventRemoveCard' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'remove') return { state: s, rng: r };
  const ok = applyRemoveCard(s, cmd.pile, cmd.index);
  if (!ok) s.log.push('Remove: failed or cap reached');
  return { state: s, rng: r };
}

export function eventGambleRoll(s: GameState, _cmd: Extract<Command, { type: 'EventGambleRoll' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'gamble') return { state: s, rng: r };
  if (!s.event.resolved) {
    const g = rollGamble(r); r = g.rng;
    s.event.resolved = g.resolved;
    if (g.resolved.outcome === 'win') {
      s.player.gold += g.resolved.gold ?? 0;
      s.log.push(`Gamble: WIN +${g.resolved.gold}g`);
    } else {
      s.player.hp = Math.max(0, s.player.hp - (g.resolved.hpLoss ?? 0));
      s.log.push(`Gamble: LOSE -${g.resolved.hpLoss} HP`);
      if (s.player.hp === 0) { s.phase = 'defeat'; }
    }
  }
  return { state: s, rng: r };
}

export function eventTreasureOpen(s: GameState, _cmd: Extract<Command, { type: 'EventTreasureOpen' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'treasure') return { state: s, rng: r };
  if (s.event.amount == null) {
    const t = rollTreasure(r); r = t.rng;
    s.event.amount = t.amount;
    s.player.gold += t.amount;
    s.log.push(`Treasure: +${t.amount}g`);
  }
  return { state: s, rng: r };
}

// === Openers used by map_pages ==============================================
export function openShopCard(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS);
    r = out.rng;
    s.shopStock = out.items;
  } catch {
    const fb = fallbackShopStock(r, SHOP_STOCK_SIZE);
    r = fb.rng;
    s.shopStock = fb.items;
    s.log.push('Shop(card): fallback stock.');
  }
  s.shopKind = 'card';
  s.phase = 'shop';
  s.log.push(`Shop(card): ${s.shopStock?.length ?? 0} items`);
  return { state: s, rng: r };
}

export function openShopRemove(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  s.shopKind = 'remove';
  s.phase = 'shop';
  // ไม่จำเป็นต้องคำนวณราคา ณ จุดเปิดร้าน เพราะ UI อาจอ่านจาก removeCostForCount ตอนกดซื้อ
  s.log.push(`Shop(remove): cost now = ${removeCostForCount(s.runCounters?.removeShopCount ?? 0)}g`);
  return { state: s, rng: r };
}

export function openShopUpgrade(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  s.shopKind = 'upgrade';
  s.phase = 'shop';
  s.log.push(`Shop(upgrade): cost now = ${upgradeCostForCount(s.runCounters?.upgradeShopCount ?? 0)}g`);
  return { state: s, rng: r };
}

export function openShopEquipment(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // สร้าง equipment shop stock
  const equipmentBase = require('../../../data/packs/base/equipment.json');
  const arr: any[] = Array.isArray(equipmentBase) ? equipmentBase : [];
  const pool = arr.filter((e) => e && e.slotCost >= 0);
  
  const items: { equipment: any; price: number }[] = [];
  let rr = r;
  const bag = pool.slice();
  
  for (let k = 0; k < Math.min(3, bag.length); k++) {
    const ro = int(rr, 0, bag.length - 1);
    rr = ro.rng;
    const pick = bag.splice(ro.value, 1)[0];
    
    // ราคาตาม rarity
    const rarityPrice: { [key: string]: number } = {
      'Common': 80,
      'Uncommon': 120,
      'Rare': 180,
      'Legendary': 250
    };
    const price = rarityPrice[pick.rarity] || 100;
    items.push({ equipment: pick, price });
  }
  
  s.shopStock = items as any;
  s.shopKind = 'equipment';
  s.phase = 'shop';
  s.log.push(`Shop(equipment): ${items.length} items`);
  return { state: s, rng: rr };
}

export function openWell(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // event แบบ well (ใช้/ปฏิเสธได้ 1 ครั้ง)
  s.event = { type: 'well', used: false, dismissed: false } as any;
  s.phase = 'event';
  s.log.push('Event: well open');
  return { state: s, rng: r };
}

export function openHealingShrine(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // event แบบ healing shrine (ฟื้นฟู HP)
  s.event = { type: 'healing_shrine', used: false, dismissed: false } as any;
  s.phase = 'event';
  s.log.push('Event: healing shrine open');
  return { state: s, rng: r };
}

export function doHealingShrineUse(s: GameState, _cmd: Extract<Command, { type: 'DoHealingShrineUse' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'healing_shrine') return { state: s, rng: r };
  if (!(s.event as any).used) {
    const healAmount = 15; // ฟื้นฟูมากกว่า well
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + healAmount);
    (s.event as any).used = true;
    (s.event as any).dismissed = false;
    s.log.push(`Healing Shrine: used (+${healAmount} HP).`);
  }
  return { state: s, rng: r };
}

export function doHealingShrineDismiss(s: GameState, _cmd: Extract<Command, { type: 'DoHealingShrineDismiss' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'healing_shrine') return { state: s, rng: r };
  (s.event as any).dismissed = true;
  (s.event as any).used = false;
  s.log.push('Healing Shrine: dismissed.');
  return { state: s, rng: r };
}

export function takeShopEquipment(s: GameState, cmd: Extract<Command, { type: 'TakeShopEquipment' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'equipment' || !s.shopStock) return { state: s, rng: r };
  const i = cmd.index;
  const item = s.shopStock[i];
  if (!item) return { state: s, rng: r };
  if (s.player.gold < item.price) {
    s.log.push('Equipment Shop: Not enough gold');
    return { state: s, rng: r };
  }
  
  // เพิ่ม equipment เข้า inventory (ยังไม่ equip)
  s.player.gold -= item.price;
  s.equipment = s.equipment || [];
  s.equipment.push(JSON.parse(JSON.stringify(item.equipment)));
  s.shopStock.splice(i, 1);
  s.log.push(`Equipment Shop: bought ${item.equipment.name} for ${item.price}g`);
  
  if (s.mapMode === 'pages' && s.pages) {
    s.pages._shopUsed = true;
  }
  return { state: s, rng: r };
}
// ============================================================================
