// src/core/engine/handlers/qa.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { drawUpTo, buildAndShuffleDeck } from '../../commands';
import { grantExpAndQueueLevelUp } from '../shared';
import { buildAndShuffleEnemyDeck } from './enemy';
import { runEquipmentOnBattleStart } from '../../equipmentRuntime';
import { resetBlessingTurnFlags, runBlessingsTurnHook } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';

export function qaKillEnemy(s: GameState, _cmd: Extract<Command, { type: 'QA_KillEnemy' }>, r: RNG) {
  if (s.phase !== 'combat' || !s.enemy) return { state: s, rng: r };
  s.enemy.hp = 0;
  s.log.push('QA: kill enemy');
  if (s.enemy.hp <= 0) {
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

export function qaDraw(s: GameState, cmd: Extract<Command, { type: 'QA_Draw' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  for (let i = 0; i < (cmd.count ?? 1); i++) {
    ({ state: s, rng: r } = drawUpTo(s, r, s.piles.hand.length + 1));
  }
  s.log.push(`QA: draw ${cmd.count}`);
  return { state: s, rng: r };
}

export function qaSetEnergy(s: GameState, cmd: Extract<Command, { type: 'QA_SetEnergy' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  s.player.energy = cmd.value;
  s.log.push(`QA: set energy ${cmd.value}`);
  return { state: s, rng: r };
}

export function qaAddBlessingDemo(s: GameState, _cmd: Extract<Command, { type: 'QA_AddBlessingDemo' }>, r: RNG) {
  const demo = { id: 'bl_energy_first', name: 'Battle Rhythm', desc: '+1 energy on the first card each turn.' };
     if (!s.blessings.find(b => b.id === demo.id)) s.blessings.push(demo);
  s.log.push('QA: added blessing "Battle Rhythm"');
  return { state: s, rng: r };
}

export function qaOpenShop(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenShopHere' }>, r: RNG) {
  const { rollShopStock } = require('../../shop');
  const { SHOP_STOCK_SIZE, SHOP_POWER_BIAS } = require('../../balance/weights');
  const stock = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS); r = stock.rng;
  s.shopStock = stock.items;
  s.phase = 'shop';
  s.shopKind = 'card';
  s.log.push('QA: opened Shop here');
  return { state: s, rng: r };
}

export function qaOpenShrine(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenShrine' }>, r: RNG) {
  const { rollShrine } = require('../../events');
  const sh = rollShrine(r, s, 3); r = sh.rng;
  s.event = sh.event;
  s.phase = 'event';
  s.log.push('QA: opened Shrine');
  return { state: s, rng: r };
}

export function qaOpenRemove(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenRemove' }>, r: RNG) {
  const { openRemoveEvent } = require('../../events');
  s.event = openRemoveEvent();
  s.phase = 'event';
  s.log.push('QA: opened Remove');
  return { state: s, rng: r };
}

export function qaOpenGamble(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenGamble' }>, r: RNG) {
  s.event = { type: 'gamble' } as any;
  s.phase = 'event';
  s.log.push('QA: opened Gamble');
  return { state: s, rng: r };
}

export function qaOpenTreasure(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenTreasure' }>, r: RNG) {
  s.event = { type: 'treasure' } as any;
  s.phase = 'event';
  s.log.push('QA: opened Treasure');
  return { state: s, rng: r };
}

// tail of src/core/engine/handlers/qa.ts (เพิ่มสองฟังก์ชัน)
export function qaInitPages(s: GameState, _cmd: Extract<Command, { type: 'QA_InitPages' }>, r: RNG) {
  const { initPageMap } = require('../../map/pages');
  s.mapMode = 'pages';
  const init = initPageMap(r); r = init.rng; s.pages = init.map;
  s.phase = 'map';
  const mapPages = require('./map_pages');
  return mapPages.open(s, { type: 'OpenPage' } as any, r);
}

export function qaPrintPage(s: GameState, _cmd: Extract<Command, { type: 'QA_PrintPage' }>, r: RNG) {
  if (!s.pages?.current) { s.log.push('No page open.'); return { state: s, rng: r }; }
  const list = s.pages.current.offers.map((o: any) => o.kind === 'monster' ? `monster:${o.tier}` : o.kind);
  s.log.push(`Offers: ${list.join(' | ')}`);
  return { state: s, rng: r };
}

export function qaSpawnEquippedEnemy(s: GameState, cmd: Extract<Command, { type: 'QA_SpawnEquippedEnemy' }>, r: RNG) {
  const enemyId = cmd.enemyId || 'phi_pong';
  
  // โหลด enemy data จากระบบไทยใหม่
  const { getEnemyById } = require('../../enemies/thai/data');
  const thaiEnemyTemplate = getEnemyById(enemyId);
  
  if (!thaiEnemyTemplate) {
    s.log.push(`QA: Enemy ${enemyId} not found`);
    return { state: s, rng: r };
  }
  
  // แปลงจาก EnhancedEnemyData เป็น EnemyState (legacy format)
  const enemyTemplate = {
    id: thaiEnemyTemplate.id,
    name: thaiEnemyTemplate.name,
    hp: thaiEnemyTemplate.hp,
    maxHp: thaiEnemyTemplate.maxHp,
    dmg: thaiEnemyTemplate.dmg || 2,
    block: thaiEnemyTemplate.block,
    ai: {
      cycle: thaiEnemyTemplate.signatureCards || ['claw', 'guard'],
      index: 0
    },
    intentCardId: (thaiEnemyTemplate.signatureCards && thaiEnemyTemplate.signatureCards[0]) || 'claw'
  };

  // ตั้งค่าการต่อสู้
  s.phase = 'combat';
  (s as any).nodePhase = 'in_combat';
  s.turn = 1;
  s.combatVictoryLock = false;
  
  // เคลียร์สเตต
  (s as any).enemyPiles = undefined;
  (s as any).playerPiles = undefined;
  (s as any).enemyIntentCardId = null;
  s.player.block = 0;
  s.player.energy = s.player.maxEnergy ?? START_ENERGY;
  
  // Set temporary equipment slots during combat  
  s.equipmentTempSlots = 5;

  // สร้างศัตรู
  s.enemy = JSON.parse(JSON.stringify(enemyTemplate));
  ({ state: s, rng: r } = buildAndShuffleEnemyDeck(s, r));
  (s as any).enemyIntentCardId = (s as any).enemyPiles?.draw?.[0] ?? null;

  // สร้างเด็คผู้เล่น
  ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
  ({ state: s, rng: r } = drawUpTo(s, r, s.player.maxHandSize));

  // Equipment battle-start hooks
  runEquipmentOnBattleStart(s, 'player');
  runEquipmentOnBattleStart(s, 'enemy');

  // Blessing hooks
  resetBlessingTurnFlags(s);
  runBlessingsTurnHook(s, 'on_turn_start');

  s.log.push(`QA: Spawned ${s.enemy?.name} with ${s.enemy?.equipped?.length || 0} equipment`);
  if (s.enemy?.equipped) {
    s.log.push(`QA: Enemy equipment: ${s.enemy.equipped.map(eq => eq.name || eq.id).join(', ')}`);
  }
  
  return { state: s, rng: r };
}

// ===== Phase 1 Debug Commands: Status Effects =====

export function qaApplyStatusToPlayer(state: GameState, cmd: Command & { type: 'QA_ApplyStatusToPlayer' }, rng: RNG) {
  const { applyStatusEffect } = require('../../statusEffectsRuntime');
  const statusId = cmd.statusId;
  const stacks = cmd.stacks || 1;
  const duration = cmd.duration || 3;
  
  applyStatusEffect('player', state, statusId as any, duration, stacks);
  state.log.push(`🧪 Applied ${statusId} to player (${stacks} stacks, ${duration} duration)`);
  return { state, rng };
}

export function qaApplyStatusToEnemy(state: GameState, cmd: Command & { type: 'QA_ApplyStatusToEnemy' }, rng: RNG) {
  if (!state.enemy) {
    state.log.push(`❌ No enemy to apply status to`);
    return { state, rng };
  }
  
  const { applyStatusEffect } = require('../../statusEffectsRuntime');
  const statusId = cmd.statusId;
  const stacks = cmd.stacks || 1;
  const duration = cmd.duration || 3;
  
  applyStatusEffect('enemy', state, statusId as any, duration, stacks);
  state.log.push(`🧪 Applied ${statusId} to ${state.enemy.name} (${stacks} stacks, ${duration} duration)`);
  return { state, rng };
}

export function qaClearPlayerStatus(state: GameState, cmd: Command & { type: 'QA_ClearPlayerStatus' }, rng: RNG) {
  state.player.statusEffects = [];
  state.log.push(`🧹 Cleared all player status effects`);
  return { state, rng };
}

export function qaClearEnemyStatus(state: GameState, cmd: Command & { type: 'QA_ClearEnemyStatus' }, rng: RNG) {
  if (!state.enemy) {
    state.log.push(`❌ No enemy to clear status from`);
    return { state, rng };
  }
  
  state.enemy.statusEffects = [];
  state.log.push(`🧹 Cleared all ${state.enemy.name} status effects`);
  return { state, rng };
}

// ===== Phase 2 Debug Commands: Enemy Behavior & Spells =====

export function qaTriggerEnemyBehavior(state: GameState, cmd: Command & { type: 'QA_TriggerEnemyBehavior' }, rng: RNG) {
  if (!state.enemy) {
    state.log.push(`❌ No enemy to trigger behavior`);
    return { state, rng };
  }
  
  const { processBehaviors } = require('../../enemyBehaviorRuntime');
  processBehaviors(state);
  state.log.push(`🎭 Triggered enemy behaviors for ${state.enemy.name}`);
  return { state, rng };
}

export function qaStartSpellCasting(state: GameState, cmd: Command & { type: 'QA_StartSpellCasting' }, rng: RNG) {
  if (!state.enemy) {
    state.log.push(`❌ No enemy to cast spells`);
    return { state, rng };
  }
  
  const { startSpellCasting } = require('../../enemyBehaviorRuntime');
  const spellId = cmd.spellId || 'shadow_bolt';
  startSpellCasting(state, spellId);
  state.log.push(`⚡ Started spell casting: ${spellId}`);
  return { state, rng };
}

export function qaForcePhase2(state: GameState, cmd: Command & { type: 'QA_ForcePhase2' }, rng: RNG) {
  if (!state.enemy) {
    state.log.push(`❌ No enemy to force Phase 2`);
    return { state, rng };
  }
  
  // Reduce enemy HP to trigger Phase 2
  state.enemy.hp = Math.floor(state.enemy.maxHp * 0.3);
  state.log.push(`🔥 Forced ${state.enemy.name} into Phase 2 (HP: ${state.enemy.hp}/${state.enemy.maxHp})`);
  return { state, rng };
}

// ===== Phase 3 Debug Commands: Environment & Minions =====

export function qaSetEnvironment(state: GameState, cmd: Command & { type: 'QA_SetEnvironment' }, rng: RNG) {
  const { setEnvironment } = require('../../environmentRuntime');
  const environmentId = cmd.environmentId || 'haunted_temple';
  
  setEnvironment(state, environmentId);
  state.log.push(`🌿 Environment set to: ${environmentId}`);
  return { state, rng };
}

export function qaSummonPlayerMinion(state: GameState, cmd: Command & { type: 'QA_SummonPlayerMinion' }, rng: RNG) {
  const { summonMinion } = require('../../minionRuntime');
  const minionId = cmd.minionId || 'ghost_ally';
  
  summonMinion(state, minionId, 'player', 1);
  state.log.push(`🤝 Summoned player minion: ${minionId}`);
  return { state, rng };
}

export function qaSummonEnemyMinion(state: GameState, cmd: Command & { type: 'QA_SummonEnemyMinion' }, rng: RNG) {
  const { summonMinion } = require('../../minionRuntime');
  const minionId = cmd.minionId || 'shadow_clone';
  
  summonMinion(state, minionId, 'enemy', 1);
  state.log.push(`👿 Summoned enemy minion: ${minionId}`);
  return { state, rng };
}

export function qaClearAllMinions(state: GameState, cmd: Command & { type: 'QA_ClearAllMinions' }, rng: RNG) {
  const { clearAllMinions } = require('../../minionRuntime');
  clearAllMinions(state);
  state.log.push(`💨 Cleared all minions from battlefield`);
  return { state, rng };
}

// ===== Phase 4 Debug Commands: Adaptive AI & Combos =====

export function qaDebugAdaptiveAI(state: GameState, cmd: Command & { type: 'QA_DebugAdaptiveAI' }, rng: RNG) {
  const { debugAdaptiveAI } = require('../../adaptiveAI');
  debugAdaptiveAI(state);
  state.log.push('🧠 Adaptive AI debug info logged to console');
  return { state, rng };
}

export function qaResetAILearning(state: GameState, cmd: Command & { type: 'QA_ResetAILearning' }, rng: RNG) {
  const { resetAILearning } = require('../../adaptiveAI');
  resetAILearning();
  state.log.push('🔄 AI learning patterns reset');
  return { state, rng };
}

export function qaDebugCombos(state: GameState, cmd: Command & { type: 'QA_DebugCombos' }, rng: RNG) {
  const { debugCombos } = require('../../cardComboSystem');
  debugCombos(state);
  state.log.push('✨ Combo system debug info logged to console');
  return { state, rng };
}

export function qaTriggerCombo(state: GameState, cmd: Command & { type: 'QA_TriggerCombo' }, rng: RNG) {
  const { getAllCombos } = require('../../cardComboSystem');
  const allCombos = getAllCombos();
  const combo = allCombos.find((c: any) => c.id === cmd.comboId);
  
  if (!combo) {
    state.log.push(`❌ Unknown combo: ${cmd.comboId}`);
    state.log.push(`Available combos: ${allCombos.map((c: any) => c.id).join(', ')}`);
    return { state, rng };
  }

  // Force trigger combo
  const { executeComboEffects } = require('../../cardComboSystem');
  executeComboEffects(state, combo);
  state.log.push(`🎆 Force triggered combo: ${combo.name}`);
  return { state, rng };
}

export function qaClearCombos(state: GameState, cmd: Command & { type: 'QA_ClearCombos' }, rng: RNG) {
  const { initializeCombatCombos } = require('../../cardComboSystem');
  initializeCombatCombos(state);
  state.log.push('🧹 All combo progress cleared');
  return { state, rng };
}

export function qaLevelUp(state: GameState, cmd: Command & { type: 'QA_LevelUp' }, rng: RNG) {
  const { grantExpAndQueueLevelUp } = require('../shared');
  rng = grantExpAndQueueLevelUp(state, rng);
  state.phase = 'levelup';
  state.log.push('🎯 QA: Level up triggered');
  return { state, rng };
}
