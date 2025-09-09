// src/core/statusEffectsRuntime.ts — Status Effects Processing System

import type { GameState, PlayerState, EnemyState } from './types';
import type { StatusEffect, StatusEffectType, StatusEffectDefinition } from './types_extended';
import { STATUS_EFFECTS, createStatusEffect } from './thai_enemy_system';

// ===== Status Effects Management =====

export function applyStatusEffect(
  target: 'player' | 'enemy',
  state: GameState,
  statusId: StatusEffectType,
  duration?: number,
  stacks = 1,
  value?: number
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState) return;

  // Initialize status effects array if doesn't exist
  if (!targetState.statusEffects) {
    targetState.statusEffects = [];
  }

  const statusDef = STATUS_EFFECTS[statusId];
  if (!statusDef) {
    state.log.push(`Unknown status effect: ${statusId}`);
    return;
  }

  // Check if status already exists
  const existingIndex = targetState.statusEffects.findIndex(s => s.id === statusId);
  
  if (existingIndex >= 0) {
    const existing = targetState.statusEffects[existingIndex];
    
    if (statusDef.stackable) {
      // Add stacks, respecting max stacks
      const newStacks = Math.min(
        (existing.stacks || 1) + stacks,
        statusDef.maxStacks || 99
      );
      existing.stacks = newStacks;
      
      // Refresh duration to longer of the two
      existing.duration = Math.max(
        existing.duration,
        duration ?? statusDef.defaultDuration
      );
      
      state.log.push(`${statusDef.name} increased to ${newStacks} stacks`);
    } else {
      // Refresh duration for non-stackable effects
      existing.duration = Math.max(
        existing.duration,
        duration ?? statusDef.defaultDuration
      );
      
      state.log.push(`${statusDef.name} duration refreshed`);
    }
  } else {
    // Apply new status effect
    const newStatus = createStatusEffect(statusId, duration, stacks, value);
    targetState.statusEffects.push(newStatus);
    
    state.log.push(`${target === 'player' ? 'Player' : 'Enemy'} gains ${statusDef.name}${stacks > 1 ? ` (${stacks})` : ''}`);
    
    // Trigger onApply effect if defined
    if (statusDef.onApply) {
      statusDef.onApply(target, stacks);
    }
  }
}

export function removeStatusEffect(
  target: 'player' | 'enemy',
  state: GameState,
  statusId: StatusEffectType
): boolean {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return false;

  const index = targetState.statusEffects.findIndex(s => s.id === statusId);
  if (index >= 0) {
    const removed = targetState.statusEffects.splice(index, 1)[0];
    const statusDef = STATUS_EFFECTS[statusId];
    
    if (statusDef?.onRemove) {
      statusDef.onRemove(target, removed.stacks || 1);
    }
    
    state.log.push(`${statusDef?.name || statusId} removed from ${target}`);
    return true;
  }
  return false;
}

export function hasStatusEffect(
  targetState: PlayerState | EnemyState | undefined,
  statusId: StatusEffectType
): boolean {
  if (!targetState?.statusEffects) return false;
  return targetState.statusEffects.some(s => s.id === statusId);
}

export function getStatusEffectStacks(
  targetState: PlayerState | EnemyState | undefined,
  statusId: StatusEffectType
): number {
  if (!targetState?.statusEffects) return 0;
  const effect = targetState.statusEffects.find(s => s.id === statusId);
  return effect?.stacks || 0;
}

// ===== Turn-based Status Processing =====

export function processStatusEffectsOnTurnStart(
  target: 'player' | 'enemy',
  state: GameState
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return;

  const effectsToProcess = [...targetState.statusEffects]; // Copy to avoid mutation during iteration

  for (const effect of effectsToProcess) {
    const statusDef = STATUS_EFFECTS[effect.id as StatusEffectType];
    if (!statusDef) continue;

    // Process turn start effects
    if (statusDef.onTurnStart) {
      statusDef.onTurnStart(target, effect.stacks || 1);
    }

    // Handle specific status effects
    processSpecificStatusEffect(target, state, effect);
  }
}

export function processStatusEffectsOnTurnEnd(
  target: 'player' | 'enemy', 
  state: GameState
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return;

  const remainingEffects: StatusEffect[] = [];

  for (const effect of targetState.statusEffects) {
    const statusDef = STATUS_EFFECTS[effect.id as StatusEffectType];
    if (!statusDef) {
      remainingEffects.push(effect);
      continue;
    }

    // Process turn end effects
    if (statusDef.onTurnEnd) {
      statusDef.onTurnEnd(target, effect.stacks || 1);
    }

    // Handle specific end-of-turn effects (like poison damage)
    processEndOfTurnStatusEffect(target, state, effect);

    // Decrease duration
    effect.duration -= 1;

    // Keep effect if duration > 0 or if it's permanent (duration 0)
    if (effect.duration > 0 || (effect.duration === 0 && statusDef.defaultDuration === 0)) {
      remainingEffects.push(effect);
    } else {
      // Effect expires
      if (statusDef.onRemove) {
        statusDef.onRemove(target, effect.stacks || 1);
      }
      state.log.push(`${statusDef.name} expires on ${target}`);
    }
  }

  targetState.statusEffects = remainingEffects;
}

// ===== Specific Status Effect Implementations =====

function processSpecificStatusEffect(
  target: 'player' | 'enemy',
  state: GameState,
  effect: StatusEffect
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState) return;

  const stacks = effect.stacks || 1;

  switch (effect.id) {
    case 'fear':
      // Reduce energy and force discard
      if (target === 'player') {
        const player = targetState as GameState['player'];
        const energyLoss = Math.min(stacks, player.energy);
        player.energy -= energyLoss;
        
        // Force discard (would need to be implemented in card system)
        state.log.push(`Fear: Lost ${energyLoss} energy`);
      } else if (target === 'enemy') {
        // For enemy, reduce enemy energy from state
        const currentEnemyEnergy = state.enemyEnergy || 0;
        const energyLoss = Math.min(stacks, currentEnemyEnergy);
        state.enemyEnergy = currentEnemyEnergy - energyLoss;
        state.log.push(`Fear: ${getEntityName(targetState)} lost ${energyLoss} energy`);
      }
      break;

    case 'regeneration':
      // Heal at start of turn
      const healAmount = stacks * 2; // 2 HP per stack
      targetState.hp = Math.min(targetState.maxHp, targetState.hp + healAmount);
      state.log.push(`Regeneration: ${target} heals ${healAmount} HP`);
      break;

    case 'strength':
      // Damage bonus handled in combat calculations
      break;

    case 'energy_boost':
      if (target === 'player') {
        const player = targetState as GameState['player'];
        player.energy += stacks;
        state.log.push(`Energy Boost: Gained ${stacks} energy`);
      } else if (target === 'enemy') {
        // For enemy, add to enemy energy in state
        state.enemyEnergy = (state.enemyEnergy || 0) + stacks;
        state.log.push(`Energy Boost: ${getEntityName(targetState)} gained ${stacks} energy`);
      }
      break;
  }
}

function processEndOfTurnStatusEffect(
  target: 'player' | 'enemy',
  state: GameState,
  effect: StatusEffect
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState) return;

  const stacks = effect.stacks || 1;

  switch (effect.id) {
    case 'poison':
      // Deal poison damage
      const poisonDamage = stacks * 2; // 2 damage per stack
      const actualDamage = Math.min(poisonDamage, targetState.hp);
      targetState.hp -= actualDamage;
      state.log.push(`Poison: ${target} takes ${actualDamage} damage`);
      break;
  }
}

// ===== Combat Integration Helpers =====

export function modifyDamageForStatusEffects(
  dealer: 'player' | 'enemy',
  receiver: 'player' | 'enemy',
  state: GameState,
  baseDamage: number
): number {
  let modifiedDamage = baseDamage;
  
  const dealerState = dealer === 'player' ? state.player : state.enemy;
  const receiverState = receiver === 'player' ? state.player : state.enemy;
  
  // Dealer modifications
  if (dealerState?.statusEffects) {
    for (const effect of dealerState.statusEffects) {
      switch (effect.id) {
        case 'strength':
          modifiedDamage += (effect.stacks || 1);
          break;
        case 'weakness':
          modifiedDamage = Math.floor(modifiedDamage * 0.5);
          break;
      }
    }
  }

  // Receiver modifications
  if (receiverState?.statusEffects) {
    for (const effect of receiverState.statusEffects) {
      switch (effect.id) {
        case 'vulnerable':
          modifiedDamage = Math.floor(modifiedDamage * 1.5);
          break;
        case 'curse':
          modifiedDamage += (effect.stacks || 1);
          break;
      }
    }
  }

  return Math.max(0, modifiedDamage);
}

export function modifyCardCostForStatusEffects(
  state: GameState,
  baseCost: number
): number {
  let modifiedCost = baseCost;
  
  if (state.player.statusEffects) {
    for (const effect of state.player.statusEffects) {
      switch (effect.id) {
        case 'corruption':
          modifiedCost += 1;
          break;
      }
    }
  }

  return Math.max(0, modifiedCost);
}

export function canPlayAttackCards(state: GameState): boolean {
  if (!state.player.statusEffects) return true;
  
  return !state.player.statusEffects.some(effect => effect.id === 'entangle');
}

// ===== Utility Functions =====

export function getAllStatusEffects(targetState: PlayerState | EnemyState | undefined): StatusEffect[] {
  return targetState?.statusEffects || [];
}

export function clearAllStatusEffects(
  target: 'player' | 'enemy',
  state: GameState
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (targetState) {
    targetState.statusEffects = [];
    state.log.push(`All status effects cleared from ${target}`);
  }
}

export function getStatusEffectDescription(statusId: StatusEffectType): string {
  const def = STATUS_EFFECTS[statusId];
  return def?.description || 'Unknown status effect';
}

// Helper function to get entity name  
function getEntityName(entity: GameState['player'] | GameState['enemy']): string {
  if (entity && 'name' in entity && typeof (entity as any).name === 'string') {
    return (entity as any).name;
  }
  return entity ? 'Enemy' : 'Player';
}

// Export for debugging/testing
export function debugStatusEffects(state: GameState): void {
  console.log('=== STATUS EFFECTS DEBUG ===');
  console.log('Player:', state.player.statusEffects);
  console.log('Enemy:', state.enemy?.statusEffects);
}