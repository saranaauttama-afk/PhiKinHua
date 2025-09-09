// src/core/engine/handlers/combat.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo, applyCardEffect, endEnemyTurn, isVictory, isDefeat, startPlayerTurn } from '../../commands';
import { resetBlessingTurnFlags, runBlessingsTurnHook, getCardPlayedFns } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';
import { grantExpAndQueueLevelUp } from '../shared';
import { runEquipmentCardPlayed, runEquipmentTurnHook } from '../../equipmentRuntime';
import { getEquipmentById } from '../../pack';

export function play(s: GameState, cmd: Extract<Command, { type: 'PlayCard' }>, r: RNG) {
  if (s.phase !== 'combat' || s.combatVictoryLock) return { state: s, rng: r };
  const idx = cmd.index;
  if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
  const played = s.piles.hand[idx];

  // Handle equipment cards - install temporarily
  if (played.type === 'equipment' && played.equipmentId) {
    s.log.push(`DEBUG: Attempting to play equipment card: ${played.name} (ID: ${played.id})`);
    s.log.push(`DEBUG: Equipment ID to install: ${played.equipmentId}`);
    
    const equipmentData = getEquipmentById(played.equipmentId);
    let equipmentInstalled = false;
    
    if (!equipmentData) {
      s.log.push(`DEBUG: Equipment data not found for ID: ${played.equipmentId}`);
    } else {
      s.log.push(`DEBUG: Equipment data found: ${equipmentData.name} (ID: ${equipmentData.id})`);
      
      // Check if already equipped (either permanently or temporarily)
      const alreadyEquipped = (s.equipped || []).some(eq => eq.id === equipmentData.id);
      s.log.push(`DEBUG: Already equipped? ${alreadyEquipped}`);
      s.log.push(`DEBUG: Current equipped: [${(s.equipped || []).map(eq => `${eq.name}(${eq.id})`).join(', ')}]`);
      
      if (!alreadyEquipped) {
        // Calculate slot usage - during combat, we have additional temporary slots
        const currentSlotUsage = (s.equipped || []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
        const baseSlots = s.equipmentSlotsMax || 1;
        const tempSlots = s.equipmentTempSlots || 5; // Default 5 temp slots during combat
        const maxSlots = baseSlots + tempSlots;
        const cardSlotCost = played.slotCost || equipmentData.slotCost || 1;
        
        s.log.push(`DEBUG: Slot check - Current: ${currentSlotUsage}, Base: ${baseSlots}, Temp: ${tempSlots}, Total: ${maxSlots}, Need: ${cardSlotCost}`);
        
        if (currentSlotUsage + cardSlotCost <= maxSlots) {
          // Install temporarily
          s.equipped = s.equipped || [];
          s.equipped.push({
            id: equipmentData.id,
            name: equipmentData.name,
            rarity: equipmentData.rarity,
            slotCost: equipmentData.slotCost,
            desc: equipmentData.desc,
            tags: equipmentData.tags,
            temporary: true // Mark as temporary
          } as any);
          
          equipmentInstalled = true;
          s.log.push(`Temporarily equipped: ${equipmentData.name || equipmentData.id}`);
          s.log.push(`DEBUG: Equipment count now ${s.equipped.length}, temp count: ${s.equipped.filter(eq => eq.temporary).length}`);
        } else {
          s.log.push(`DEBUG: Not enough equipment slots for ${equipmentData.name || equipmentData.id}`);
          s.log.push(`Not enough equipment slots for ${equipmentData.name || equipmentData.id}`);
        }
      } else {
        s.log.push(`DEBUG: ${equipmentData.name || equipmentData.id} is already equipped`);
        s.log.push(`${equipmentData.name || equipmentData.id} is already equipped`);
      }
    }
    
    // Equipment cards are removed from hand
    const [c] = s.piles.hand.splice(idx, 1);
    
    // If equipment was installed, remove the card completely (don't put in discard)
    // If equipment couldn't be installed, put in discard as normal
    if (!equipmentInstalled) {
      s.piles.discard.push(c);
    }
    
    s.log.push(`Played ${played.name}${equipmentInstalled ? ' (consumed)' : ' (failed)'}`);
    s.log.push(`DEBUG: Card ${equipmentInstalled ? 'REMOVED from game' : 'went to discard'}`);
    return { state: s, rng: r };
  }

  // energy paywall (basic=0, special>=1) - only for non-equipment cards
  const base = typeof (played as any).cost === 'number' ? (played as any).cost : 0;
  const cost = Math.max(0, Math.floor(base));
  if (cost > 0) {
    const cur = s.player.energy ?? 0;
    if (cur < cost) {
      s.log.push(`Not enough energy (need ${cost}).`);
      return { state: s, rng: r };
    }
    s.player.energy = cur - cost;
  }

  // effect
  applyCardEffect(s, idx);
// ★ แจ้งอุปกรณ์ว่า “ผู้เล่นเล่นการ์ด”
runEquipmentCardPlayed(s, played, 'player');
  // blessings on_card_played
  try {
    for (const b of (s.blessings ?? [])) {
      const fns = getCardPlayedFns(b, played);
      const tc = { state: s };
      for (const f of fns) f(tc as any, played);
    }
  } catch (e: any) {
    s.log.push(`Blessing error: ${e?.message ?? String(e)}`);
  }

  // move to discard
  const [c] = s.piles.hand.splice(idx, 1);
  s.piles.discard.push(c);
  s.log.push(`Played ${played.name}`);

  // on-play draw
  if ((played as any).draw && (played as any).draw > 0) {
    const target = s.piles.hand.length + (played as any).draw;
    ({ state: s, rng: r } = drawUpTo(s, r, target));
  }

  if (isVictory(s)) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    
    // Check if level up is pending - go to levelup phase first
    if (s.levelUp && !s.levelUp.consumed) {
      s.phase = 'levelup';
      s.log.push('Level Up!');
    } else {
      s.phase = 'victory';
      s.log.push('Victory!');
    }
  }
  return { state: s, rng: r };
}

export function endTurn(s: GameState, _cmd: Extract<Command, { type: 'EndTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };

  // Import status effects system
  const { processStatusEffectsOnTurnEnd } = require('../../statusEffectsRuntime');

  // Process status effects at end of player turn
  processStatusEffectsOnTurnEnd('player', s);

  // ★ ปลายเทิร์นผู้เล่น → ยิงอุปกรณ์ก่อนสลับฝั่ง
runEquipmentTurnHook(s, 'on_turn_end', 'player');

  endEnemyTurn(s);
  if (isDefeat(s)) {
    s.phase = 'defeat';
    s.log.push('Defeat..');
    
    // Clear temporary equipment slots
    s.equipmentTempSlots = 0;
    
    // Remove temporary equipment on defeat
    if (s.equipped) {
      const permanentEquipment = s.equipped.filter(eq => !eq.temporary);
      const removedCount = s.equipped.length - permanentEquipment.length;
      s.equipped = permanentEquipment;
      if (removedCount > 0) {
        s.log.push(`Removed ${removedCount} temporary equipment`);
      }
    }
    
    return { state: s, rng: r };
  }
  runBlessingsTurnHook(s, 'on_turn_end');
  s.turn = 1;
  ({ state: s, rng: r } = startPlayerTurn(s, r));
  resetBlessingTurnFlags(s);
  runBlessingsTurnHook(s, 'on_turn_start');
  return { state: s, rng: r };
}
