// src/core/minionRuntime.ts — Minion Combat System

import type { GameState } from './types';
import type { MinionData } from './types_extended';
import { THAI_MINIONS } from './thai_enemy_system';
import { applyStatusEffect } from './statusEffectsRuntime';

// ===== Global Minion State =====

const activeMinions: MinionData[] = [];

export function getActiveMinions(): MinionData[] {
  return [...activeMinions];
}

export function getPlayerMinions(): MinionData[] {
  return activeMinions.filter(m => m.owner === 'player');
}

export function getEnemyMinions(): MinionData[] {
  return activeMinions.filter(m => m.owner === 'enemy');
}

// ===== Minion Summoning =====

export function summonMinion(
  state: GameState,
  minionId: string,
  owner: 'player' | 'enemy',
  count: number = 1
): void {
  const minionTemplate = THAI_MINIONS[minionId];
  if (!minionTemplate) {
    state.log.push(`❌ Unknown minion: ${minionId}`);
    console.log('Available minions:', Object.keys(THAI_MINIONS));
    return;
  }
  
  console.log(`🔄 Summoning ${count}x ${minionId} for ${owner}`);
  state.log.push(`🔄 Attempting to summon ${count}x ${minionTemplate.name} for ${owner}`);

  for (let i = 0; i < count; i++) {
    // Create unique minion instance
    const minion: MinionData = {
      ...minionTemplate,
      id: `${minionId}_${Date.now()}_${i}`, // Unique ID for this instance
      owner,
      statusEffects: []
    };

    activeMinions.push(minion);
    
    const ownerName = owner === 'player' ? 'Player' : state.enemy?.name || 'Enemy';
    const abilitySummary = minion.abilities.map(a => a.description).join(', ');
    state.log.push(`✨ ${ownerName} summons ${minion.name}! (${minion.duration} turns, ${abilitySummary})`);
  }

  // Check summoning limits
  const ownerMinions = activeMinions.filter(m => m.owner === owner);
  const maxMinions = owner === 'player' ? 3 : (state.enemy ? getEnemyMaxMinions(state) : 2); // Reduced limits
  
  if (ownerMinions.length > maxMinions) {
    // Remove oldest minions if over limit
    const excessCount = ownerMinions.length - maxMinions;
    const toRemove = ownerMinions.slice(0, excessCount);
    
    for (const minion of toRemove) {
      removeMinion(state, minion.id);
      state.log.push(`💀 ${minion.name} is dismissed due to minion limit (${maxMinions} max)`);
    }
  }
  
  // ★ Sync minions to state for UI
  syncMinionsToState(state);
}

function getEnemyMaxMinions(state: GameState): number {
  if (!state.enemy) return 3;
  
  const { THAI_ENEMIES } = require('./thai_enemy_system');
  const enemyData = THAI_ENEMIES[state.enemy.id];
  return enemyData?.maxMinions || 3;
}

// ===== Minion Management =====

export function removeMinion(state: GameState, minionId: string): boolean {
  const index = activeMinions.findIndex(m => m.id === minionId);
  if (index >= 0) {
    const removed = activeMinions.splice(index, 1)[0];
    state.log.push(`💀 ${removed.name} is removed from battle`);
    syncMinionsToState(state);
    return true;
  }
  return false;
}

export function clearAllMinions(state: GameState, owner?: 'player' | 'enemy'): void {
  const toRemove = owner ? 
    activeMinions.filter(m => m.owner === owner) : 
    [...activeMinions];
    
  if (toRemove.length > 0) {
    // Clear without individual logging to avoid spam
    if (owner) {
      activeMinions.splice(0, activeMinions.length, ...activeMinions.filter(m => m.owner !== owner));
    } else {
      activeMinions.length = 0;
    }
    
    const ownerText = owner ? `${owner} ` : '';
    state.log.push(`🧹 All ${ownerText}minions cleared from battle`);
    syncMinionsToState(state);
  }
}

// ===== Minion Combat Actions =====

export function processMinionTurn(state: GameState, owner: 'player' | 'enemy'): void {
  const minions = activeMinions.filter(m => m.owner === owner);
  if (!minions.length) return;

  const targetOwner = owner === 'player' ? 'enemy' : 'player';
  const target = targetOwner === 'player' ? state.player : state.enemy;
  
  if (!target) return;

  state.log.push(`⚔️ ${owner === 'player' ? 'Player' : 'Enemy'} minions attack!`);

  for (const minion of minions) {
    processMinionAction(state, minion, target, targetOwner);
  }
}

function processMinionAction(
  state: GameState,
  minion: MinionData,
  target: any,
  targetType: 'player' | 'enemy'
): void {
  console.log(`🔥 Processing ${minion.name} with ${minion.abilities.length} abilities`);
  
  // Process all minion abilities
  for (const ability of minion.abilities) {
    if (ability.trigger === 'turn_start') {
      processMinionAbility(state, minion, ability, target, targetType);
    }
  }
}

function processMinionAbility(
  state: GameState,
  minion: MinionData,
  ability: any,
  target: any,
  targetType: 'player' | 'enemy'
): void {
  console.log(`🔥 Processing ability: ${ability.type} -> ${ability.target} (value: ${ability.value})`);
  
  // Determine actual target based on ability.target and minion.owner
  let actualTarget = target;
  let actualTargetType = targetType;
  
  if (ability.target === 'owner') {
    actualTarget = minion.owner === 'player' ? state.player : state.enemy;
    actualTargetType = minion.owner;
  }
  
  switch (ability.type) {
    case 'attack':
      const damage = ability.value;
      if (ability.ignores_block) {
        actualTarget.hp = Math.max(0, actualTarget.hp - damage);
        state.log.push(`👻 ${minion.name} phases through defenses for ${damage} damage!`);
      } else {
        dealMinionDamage(state, minion, actualTarget, actualTargetType, damage);
      }
      break;
      
    case 'heal':
      if (actualTarget.hp !== undefined && actualTarget.maxHp !== undefined) {
        const oldHp = actualTarget.hp;
        actualTarget.hp = Math.min(actualTarget.maxHp, actualTarget.hp + ability.value);
        const healed = actualTarget.hp - oldHp;
        state.log.push(`💚 ${minion.name} ${ability.description} (+${healed} HP)`);
      }
      break;
      
    case 'energy':
      if (actualTargetType === 'player') {
        state.player.energy += ability.value;
        state.log.push(`⚡ ${minion.name} grants ${ability.value} energy`);
      }
      break;
      
    case 'draw':
      if (actualTargetType === 'player') {
        state.log.push(`🎴 ${minion.name} grants card draw (${ability.value})`);
        // TODO: Implement card draw
      }
      break;
      
    case 'block':
      if (actualTargetType === 'player') {
        state.player.block += ability.value;
        state.log.push(`🛡️ ${minion.name} grants ${ability.value} block`);
      }
      break;
      
    case 'status':
      if (ability.effect) {
        const { applyStatusEffect } = require('./statusEffectsRuntime');
        applyStatusEffect(actualTargetType, state, ability.effect, ability.duration || 1, ability.value);
        state.log.push(`✨ ${minion.name} applies ${ability.effect} to ${actualTargetType}`);
      }
      break;
  }
}

function dealMinionDamage(
  state: GameState,
  minion: MinionData,
  target: any,
  targetType: 'player' | 'enemy',
  damage: number
): void {
  
  // Apply environment modifiers if minion is attacking
  const { applyEnvironmentDamageModifier } = require('./environmentRuntime');
  damage = applyEnvironmentDamageModifier(state, damage, minion.owner);
  
  // Apply block for player targets
  if (targetType === 'player' && target.block > 0) {
    const blockedDamage = Math.min(damage, target.block);
    target.block -= blockedDamage;
    damage -= blockedDamage;
    
    if (blockedDamage > 0) {
      state.log.push(`🛡️ Player blocks ${blockedDamage} damage from ${minion.name}`);
    }
  }
  
  // Apply remaining damage
  if (damage > 0) {
    target.hp = Math.max(0, target.hp - damage);
    state.log.push(`⚔️ ${minion.name} deals ${damage} damage to ${targetType}!`);
  }
}

// Legacy function - no longer used with new abilities system

// ===== Minion Duration & Status Processing =====

export function processMinionsEndTurn(state: GameState): void {
  const remainingMinions: MinionData[] = [];
  
  for (const minion of activeMinions) {
    // Process status effects on minions
    if (minion.statusEffects?.length) {
      // Simplified status processing for minions
      minion.statusEffects = minion.statusEffects.filter(effect => {
        effect.duration -= 1;
        return effect.duration > 0;
      });
    }
    
    // Check duration (all minions now have duration)
    minion.duration -= 1;
    
    if (minion.duration <= 0) {
      state.log.push(`⏰ ${minion.name} duration expires and fades away`);
      continue; // Don't add to remaining minions
    } else if (minion.duration <= 2) {
      state.log.push(`⏰ ${minion.name} will fade in ${minion.duration} turns`);
    }
    
    remainingMinions.push(minion);
  }
  
  // Update active minions
  activeMinions.length = 0;
  activeMinions.push(...remainingMinions);
  syncMinionsToState(state);
}

// ===== Minion Damage Taking =====
// Note: Minions now use duration instead of HP system

export function damageMinionsByOwner(
  state: GameState,
  owner: 'player' | 'enemy',
  damage: number
): void {
  const minions = activeMinions.filter(m => m.owner === owner);
  if (!minions.length) return;
  
  // Reduce duration of random minion instead of HP
  const targetMinion = minions[Math.floor(Math.random() * minions.length)];
  const durationLoss = Math.min(damage, targetMinion.duration);
  targetMinion.duration = Math.max(0, targetMinion.duration - durationLoss);
  
  state.log.push(`💥 ${targetMinion.name} is disrupted, losing ${durationLoss} turn(s)! (${targetMinion.duration} turns remaining)`);
  
  if (targetMinion.duration <= 0) {
    state.log.push(`💀 ${targetMinion.name} is disrupted and fades away!`);
  }
}

// ===== Integration Helpers =====

export function syncMinionsToState(state: GameState): void {
  // Sync global activeMinions to state for UI
  (state as any).playerMinions = getPlayerMinions();
  (state as any).enemyMinions = getEnemyMinions();
}

export function initializeCombatMinions(state: GameState): void {
  // Clear all minions at start of combat
  activeMinions.length = 0;
  syncMinionsToState(state);
  state.log.push('🧹 Combat area cleared of minions');
}

export function processPlayerTurnMinions(state: GameState): void {
  console.log(`🔥 processPlayerTurnMinions called`);
  const playerMinions = getPlayerMinions();
  console.log(`🔥 Player minions count: ${playerMinions.length}`);
  playerMinions.forEach((minion, i) => {
    console.log(`🔥 Minion ${i}: ${minion.name} (${minion.id}), Owner: ${minion.owner}`);
  });
  
  processMinionTurn(state, 'player');
  syncMinionsToState(state);
}

export function processEnemyTurnMinions(state: GameState): void {
  processMinionTurn(state, 'enemy');
  syncMinionsToState(state);
}

// ===== Utility Functions =====

export function getMinionCount(owner?: 'player' | 'enemy'): number {
  if (owner) {
    return activeMinions.filter(m => m.owner === owner).length;
  }
  return activeMinions.length;
}

export function getMinionById(minionId: string): MinionData | undefined {
  return activeMinions.find(m => m.id === minionId);
}

export function getAllMinionTypes(): Record<string, MinionData> {
  return THAI_MINIONS;
}

export function debugMinions(state: GameState): void {
  console.log('=== MINIONS DEBUG ===');
  console.log('Active Minions:', activeMinions.length);
  console.log('Player Minions:', getPlayerMinions().map(m => `${m.name}(${m.duration} turns)`));
  console.log('Enemy Minions:', getEnemyMinions().map(m => `${m.name}(${m.duration} turns)`));
}

export function processEnemyMinions(state: GameState): void {
  const enemyMinions = getEnemyMinions();
  if (!enemyMinions?.length) return;
  
  // Process enemy minion actions using abilities instead of direct attacks
  for (const minion of enemyMinions) {
    // Process minion abilities that trigger during enemy turn
    for (const ability of minion.abilities) {
      if (ability.trigger === 'turn_start' && ability.type === 'attack') {
        const damage = ability.value;
        const actualDamage = Math.min(damage, state.player.hp);
        state.player.hp = Math.max(0, state.player.hp - actualDamage);
        state.log.push(`👿 ${minion.name} ${ability.description} for ${actualDamage} damage`);
      }
    }
  }
}