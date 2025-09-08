// src/core/engine/handlers/run.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { baseNewState } from '../../commands';
import { rollTwoBlessings } from '../../level';
import { START_ENERGY } from '../../balance/core';
import { initPageMap, rollPageOffers } from '../../map/pages';
import { getEquipmentById } from '../../pack';

// Auto-equip equipment cards from starting deck and remove equipped cards from deck
function autoEquipStartingCards(s: GameState) {
  if (!s.masterDeck) return;

  const equipmentCards = s.masterDeck.filter(card => card.type === 'equipment');
  const equippedCardIds: string[] = [];
  
  for (const card of equipmentCards) {
    if (!card.equipmentId) continue;
    
    // Get equipment data from pack
    const equipmentData = getEquipmentById(card.equipmentId);
    if (!equipmentData) continue;
    
    // Check if we have slot space
    const currentSlotUsage = (s.equipped || []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
    const maxSlots = s.equipmentSlotsMax || 1;
    const cardSlotCost = card.slotCost || equipmentData.slotCost || 1;
    
    if (currentSlotUsage + cardSlotCost <= maxSlots) {
      // Check if this equipment is not already equipped
      const alreadyEquipped = (s.equipped || []).some(eq => eq.id === card.equipmentId);
      if (!alreadyEquipped) {
        // Auto-equip the equipment
        s.equipped = s.equipped || [];
        s.equipped.push({
          id: equipmentData.id,
          name: equipmentData.name,
          rarity: equipmentData.rarity,
          slotCost: equipmentData.slotCost,
          desc: equipmentData.desc,
          tags: equipmentData.tags,
          sourceCardId: card.id, // Track which card this came from
          sourceCard: { ...card } // Keep full card data for returning later
        } as any);
        
        // Mark card for removal from deck
        equippedCardIds.push(card.id);
        
        s.log = s.log || [];
        s.log.push(`Starting equipment: ${equipmentData.name || equipmentData.id}`);
      }
    } else {
      // Put excess equipment in backpack
      const equipmentData = getEquipmentById(card.equipmentId);
      if (equipmentData) {
        const alreadyInBackpack = (s.backpack || []).some(eq => eq.id === card.equipmentId);
        if (!alreadyInBackpack) {
          s.backpack = s.backpack || [];
          s.backpack.push({
            id: equipmentData.id,
            name: equipmentData.name,
            rarity: equipmentData.rarity,
            slotCost: equipmentData.slotCost,
            desc: equipmentData.desc,
            tags: equipmentData.tags
          });
          
          s.log = s.log || [];
          s.log.push(`Equipment in backpack: ${equipmentData.name || equipmentData.id}`);
        }
      }
    }
  }

  // Remove equipped equipment cards from masterDeck
  if (equippedCardIds.length > 0) {
    // Remove only the first instance of each equipped card
    const remainingDeck: typeof s.masterDeck = [];
    const toRemove = [...equippedCardIds];
    
    for (const card of s.masterDeck) {
      const removeIndex = toRemove.indexOf(card.id);
      if (removeIndex !== -1) {
        toRemove.splice(removeIndex, 1); // Remove from removal list (only remove first occurrence)
      } else {
        remainingDeck.push(card);
      }
    }
    
    s.masterDeck = remainingDeck;
    s.log = s.log || [];
    s.log.push(`Removed ${equippedCardIds.length} equipped card(s) from deck`);
  }
}

// export function newRun(
//   s: GameState,
//   cmd: Extract<Command, { type: 'NewRun' }>,
//   r: RNG
// ) {
//   // สร้าง state ใหม่ตามปกติ
//   s = baseNewState(cmd.seed);
//   s.blessings = s.blessings ?? [];
//   s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
//   // นับรอบร้านลบ/อัปเกรดไว้ที่นี่ตั้งแต่ต้น run
//   s.runCounters = { removed: 0, removeShopCount: 0, upgradeShopCount: 0 };

//   // เด็คตั้งต้น → masterDeck
//   const { START_DECK } = require('../../balance/core');
//   s.masterDeck = JSON.parse(JSON.stringify(START_DECK));

//   // ✅ Equipment defaults
//   s.equipmentSlotsMax = s.equipmentSlotsMax ?? 1;
//   s.equipped = s.equipped ?? [];
//   s.backpack = s.backpack ?? [];

//   // ✅ ใช้ PAGES MODE เสมอ (ตัดระบบ Map เดิมทิ้ง)
//   s.mapMode = 'pages';
//   //s.map = undefined; // กันหลงเหลือค่าเก่า
//   const init = initPageMap(r); r = init.rng;
//   s.pages = init.map;

//   // Starter blessing (เลือกก่อนเข้าเพจแรก)
//   s.levelUp = null;
//   const bb = rollTwoBlessings(r); r = bb.rng;
//   s.starter = { choices: bb.list, consumed: false };
//   s.phase = 'starter';
//   return { state: s, rng: r };
// }
export function newRun(
  s: GameState,
  cmd: Extract<Command, { type: 'NewRun' }>,
  r: RNG
) {
  s = baseNewState(cmd.seed);
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
  s.runCounters = { removed: 0, removeShopCount: 0, upgradeShopCount: 0 };
  s.turnFlags.equipmentOnce = {};

  const { START_DECK } = require('../../balance/core');
  s.masterDeck = JSON.parse(JSON.stringify(START_DECK));

  // ✅ Equipment defaults
  s.equipmentSlotsMax = 1;
  s.equipped = s.equipped ?? [];
  s.backpack = s.backpack ?? [];

  // ✅ Auto-equip equipment cards from starting deck
  autoEquipStartingCards(s);

  // ✅ ใช้ PAGES MODE เสมอ
  s.mapMode = 'pages';
  const init = initPageMap(r); r = init.rng;
  s.pages = init.map;

  // Starter blessing
  s.levelUp = null;
  const bb = rollTwoBlessings(r); r = bb.rng;
  s.starter = { choices: bb.list, consumed: false };
  s.phase = 'starter';
  return { state: s, rng: r };
}

export function chooseStarter(
  s: GameState,
  cmd: Extract<Command, { type: 'ChooseStarterBlessing' }>,
  r: RNG
) {
  if (s.phase !== 'starter' || !s.starter || s.starter.consumed) {
    return { state: s, rng: r };
  }
  const b = s.starter.choices[cmd.index];
  if (b) {
    s.blessings.push(b);
    s.log.push(`Starter blessing: ${b.name ?? b.id}`);
  }
  s.starter = null;

  // ให้แน่ใจว่ามี pages แล้ว
  if (!s.pages) {
    const init = initPageMap(r); r = init.rng;
    s.pages = init.map;
  }

  // ✅ Roll ข้อเสนอหน้าแรกทันที (3 ช่อง) แล้วไป phase 'map' เพื่อแสดง Pages UI
  const ro = rollPageOffers(s.pages, r, s); r = ro.rng;
  s.pages.current = { offers: ro.offers, resolved: ro.offers.map(() => false) };
  s.pages._activeOfferIndex = undefined;
  s.pages._shopUsed = false;

  s.phase = 'map'; // UI ของคุณใช้ phase 'map' เพื่อโชว์ pages อยู่แล้ว
  s.enemy = undefined;
  s.player.block = 0;
  s.player.energy = s.player.maxEnergy ?? START_ENERGY;
  return { state: s, rng: r };
}
