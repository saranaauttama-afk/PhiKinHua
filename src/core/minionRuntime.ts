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
    state.log.push(`Unknown minion: ${minionId}`);
    return;
  }

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
    state.log.push(`✨ ${ownerName} summons ${minion.name}! (${minion.hp}/${minion.maxHp} HP, ${minion.attack} ATK)`);
  }

  // Check summoning limits
  const ownerMinions = activeMinions.filter(m => m.owner === owner);
  const maxMinions = owner === 'player' ? 5 : (state.enemy ? getEnemyMaxMinions(state) : 3);
  
  if (ownerMinions.length > maxMinions) {
    // Remove oldest minions if over limit
    const excessCount = ownerMinions.length - maxMinions;
    const toRemove = ownerMinions.slice(0, excessCount);
    
    for (const minion of toRemove) {
      removeMinion(state, minion.id);
      state.log.push(`💀 ${minion.name} is dismissed due to minion limit`);
    }
  }
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
    return true;
  }
  return false;
}

export function clearAllMinions(state: GameState, owner?: 'player' | 'enemy'): void {
  const toRemove = owner ? 
    activeMinions.filter(m => m.owner === owner) : 
    [...activeMinions];
    
  for (const minion of toRemove) {
    removeMinion(state, minion.id);
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
  // Process minion abilities first
  if (minion.abilities?.length) {
    for (const ability of minion.abilities) {
      processMinionAbility(state, minion, ability, target, targetType);
    }
  }

  // Basic attack based on AI type
  switch (minion.ai) {
    case 'aggressive':
      // Direct attack
      dealMinionDamage(state, minion, target, targetType);
      break;
      
    case 'defensive':
      // Defensive minions might not attack every turn, or provide buffs
      if (Math.random() < 0.7) { // 70% chance to attack
        dealMinionDamage(state, minion, target, targetType);
      } else {
        state.log.push(`🛡️ ${minion.name} takes a defensive stance`);
      }
      break;
      
    case 'support':
      // Support minions focus on helping their owner
      provideMinionSupport(state, minion);
      break;
  }
}

function processMinionAbility(
  state: GameState,
  minion: MinionData,
  ability: string,
  target: any,
  targetType: 'player' | 'enemy'
): void {
  switch (ability) {
    case 'phase_attack':
      // Ignores block
      const phaseDamage = minion.attack;
      target.hp = Math.max(0, target.hp - phaseDamage);
      state.log.push(`👻 ${minion.name} phases through defenses for ${phaseDamage} damage!`);
      return; // Skip normal attack
      
    case 'heal_player_2':
      if (minion.owner === 'player') {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
        state.log.push(`💚 ${minion.name} heals player for 2 HP`);
      }
      break;
      
    case 'copy_enemy_attacks':
      // Copy the last enemy attack (simplified)
      if (minion.owner === 'enemy' && state.enemy) {
        const copyDamage = Math.floor(minion.attack * 1.5);
        dealMinionDamage(state, { ...minion, attack: copyDamage }, target, targetType);
        state.log.push(`🔄 ${minion.name} copies master's technique!`);
        return; // Skip normal attack
      }
      break;
      
    case 'root_entangle':
      if (Math.random() < 0.3) { // 30% chance
        applyStatusEffect(targetType, state, 'entangle', 2, 1);
        state.log.push(`🌿 ${minion.name} entangles the ${targetType}!`);
      }
      break;
  }
}

function dealMinionDamage(
  state: GameState,
  minion: MinionData,
  target: any,
  targetType: 'player' | 'enemy'
): void {
  let damage = minion.attack;
  
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

function provideMinionSupport(state: GameState, minion: MinionData): void {
  switch (minion.id.split('_')[0]) { // Get base minion type
    case 'kuman':
      // Kuman provides healing
      if (minion.owner === 'player') {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
        state.log.push(`💚 ${minion.name} channels healing energy (+2 HP)`);
      }
      break;
      
    default:
      state.log.push(`✨ ${minion.name} provides support`);
  }
}

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
    
    // Check duration
    if (minion.duration !== undefined && minion.duration > 0) {
      minion.duration -= 1;
      
      if (minion.duration <= 0) {
        state.log.push(`⏰ ${minion.name} duration expires and fades away`);
        continue; // Don't add to remaining minions
      } else if (minion.duration <= 2) {
        state.log.push(`⏰ ${minion.name} will fade in ${minion.duration} turns`);
      }
    }
    
    // Check if minion is still alive
    if (minion.hp <= 0) {
      state.log.push(`💀 ${minion.name} is defeated!`);
      continue; // Don't add to remaining minions
    }
    
    remainingMinions.push(minion);
  }
  
  // Update active minions
  activeMinions.length = 0;
  activeMinions.push(...remainingMinions);
}

// ===== Minion Damage Taking =====

export function damageMinionsByOwner(
  state: GameState,
  owner: 'player' | 'enemy',
  damage: number
): void {
  const minions = activeMinions.filter(m => m.owner === owner);
  if (!minions.length) return;
  
  // Distribute damage among minions (or target specific minion)
  const targetMinion = minions[Math.floor(Math.random() * minions.length)];
  targetMinion.hp = Math.max(0, targetMinion.hp - damage);
  
  state.log.push(`💥 ${targetMinion.name} takes ${damage} damage! (${targetMinion.hp}/${targetMinion.maxHp} HP)`);
  
  if (targetMinion.hp <= 0) {
    state.log.push(`💀 ${targetMinion.name} is defeated!`);
  }
}

// ===== Integration Helpers =====

export function initializeCombatMinions(state: GameState): void {
  // Clear all minions at start of combat
  activeMinions.length = 0;
  state.log.push('🧹 Combat area cleared of minions');
}

export function processPlayerTurnMinions(state: GameState): void {
  processMinionTurn(state, 'player');
}

export function processEnemyTurnMinions(state: GameState): void {
  processMinionTurn(state, 'enemy');
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
  console.log('Player Minions:', getPlayerMinions().map(m => `${m.name}(${m.hp}/${m.maxHp})`));
  console.log('Enemy Minions:', getEnemyMinions().map(m => `${m.name}(${m.hp}/${m.maxHp})`));
}

export function processEnemyMinions(state: GameState): void {
  const enemyMinions = getEnemyMinions();
  if (!enemyMinions?.length) return;
  
  // Process enemy minion actions
  for (const minion of enemyMinions) {
    if (minion.hp > 0) {
      // Simple AI: attack player
      const damage = minion.attack || 2;
      const actualDamage = Math.min(damage, state.player.hp);
      state.player.hp = Math.max(0, state.player.hp - actualDamage);
      state.log.push(`👿 ${minion.name} attacks for ${actualDamage} damage`);
    }
  }
}