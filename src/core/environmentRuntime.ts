// src/core/environmentRuntime.ts — Battle Environment System

import type { GameState } from './types';
import type { BattleEnvironment, EnvironmentEffect } from './types_extended';
import { THAI_ENVIRONMENTS } from './thai_enemy_system';

// ===== Environment State Management =====

let currentEnvironment: BattleEnvironment | null = null;

export function setEnvironment(state: GameState, environmentId: string): void {
  const environment = THAI_ENVIRONMENTS[environmentId];
  if (!environment) {
    state.log.push(`Unknown environment: ${environmentId}`);
    return;
  }

  currentEnvironment = { ...environment };
  
  // Apply initial environment effects
  applyEnvironmentEffects(state);
  
  state.log.push(`🌍 Environment changed to: ${environment.name}`);
  state.log.push(`📖 ${environment.description}`);
}

export function clearEnvironment(state: GameState): void {
  if (currentEnvironment) {
    state.log.push(`🌍 Environment cleared: ${currentEnvironment.name}`);
    currentEnvironment = null;
  }
}

export function getCurrentEnvironment(): BattleEnvironment | null {
  return currentEnvironment;
}

// ===== Environment Effects Application =====

function applyEnvironmentEffects(state: GameState): void {
  if (!currentEnvironment) return;

  // Log environment effects for player awareness
  for (const effect of currentEnvironment.playerEffects) {
    state.log.push(`🔵 Player: ${effect.description}`);
  }
  
  for (const effect of currentEnvironment.enemyEffects) {
    state.log.push(`🔴 Enemy: ${effect.description}`);
  }
}

// ===== Combat Modifier Functions =====

export function applyEnvironmentDamageModifier(
  state: GameState, 
  baseDamage: number, 
  source: 'player' | 'enemy'
): number {
  if (!currentEnvironment) return baseDamage;
  
  const effects = source === 'player' ? currentEnvironment.playerEffects : currentEnvironment.enemyEffects;
  let modifier = 1.0;
  
  for (const effect of effects) {
    if (effect.type === 'damage_bonus') {
      modifier += (effect.value || 0.2);
    } else if (effect.type === 'damage_penalty') {
      modifier -= (effect.value || 0.2);
    }
  }
  
  return Math.round(baseDamage * modifier);
}

export function applyEnvironmentBlockModifier(
  state: GameState, 
  baseBlock: number, 
  source: 'player' | 'enemy'
): number {
  if (!currentEnvironment) return baseBlock;
  
  const effects = source === 'player' ? currentEnvironment.playerEffects : currentEnvironment.enemyEffects;
  let modifier = 1.0;
  
  for (const effect of effects) {
    if (effect.type === 'block_bonus') {
      modifier += (effect.value || 0.2);
    } else if (effect.type === 'block_penalty') {
      modifier -= (effect.value || 0.2);
    }
  }
  
  return Math.round(baseBlock * modifier);
}

export function applyEnvironmentCardCostModifier(
  state: GameState, 
  baseCost: number, 
  source: 'player' | 'enemy'
): number {
  if (!currentEnvironment) return baseCost;
  
  const effects = source === 'player' ? currentEnvironment.playerEffects : currentEnvironment.enemyEffects;
  let modifier = 0;
  
  for (const effect of effects) {
    if (effect.type === 'cost_reduction') {
      modifier -= (effect.value || 1);
    } else if (effect.type === 'cost_increase') {
      modifier += (effect.value || 1);
    }
  }
  
  return Math.max(0, baseCost + modifier);
}

export function applyEnvironmentEnergyModifier(
  state: GameState, 
  baseEnergy: number, 
  source: 'player' | 'enemy'
): number {
  if (!currentEnvironment) return baseEnergy;
  
  const effects = source === 'player' ? currentEnvironment.playerEffects : currentEnvironment.enemyEffects;
  let modifier = 0;
  
  for (const effect of effects) {
    if (effect.type === 'energy_bonus') {
      modifier += (effect.value || 1);
    } else if (effect.type === 'energy_penalty') {
      modifier -= (effect.value || 1);
    }
  }
  
  return Math.max(1, baseEnergy + modifier);
}

export function applyEnvironmentDrawModifier(
  state: GameState, 
  baseDrawCount: number, 
  source: 'player' | 'enemy'
): number {
  if (!currentEnvironment) return baseDrawCount;
  
  const effects = source === 'player' ? currentEnvironment.playerEffects : currentEnvironment.enemyEffects;
  let modifier = 0;
  
  for (const effect of effects) {
    if (effect.type === 'draw_bonus') {
      modifier += (effect.value || 1);
    } else if (effect.type === 'draw_penalty') {
      modifier -= (effect.value || 1);
    }
  }
  
  return Math.max(1, baseDrawCount + modifier);
}

// ===== Turn Processing =====

function processEnvironmentDuration(state: GameState): void {
  if (!currentEnvironment || !currentEnvironment.duration) return;
  
  currentEnvironment.duration--;
  
  if (currentEnvironment.duration <= 0) {
    state.log.push(`🌍 ${currentEnvironment.name} effect expires`);
    currentEnvironment = null;
  } else {
    state.log.push(`🌍 ${currentEnvironment.name} lasts ${currentEnvironment.duration} more turns`);
  }
}

function processThaiEnvironmentEffects(state: GameState): void {
  if (!currentEnvironment) return;
  
  // Special Thai environment effects
  switch (currentEnvironment.id) {
    case 'haunted_temple':
      // Spiritual energy restoration for both sides
      if (Math.random() < 0.3) {
        state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + 1);
        state.log.push(`🏯 Temple spirits grant energy`);
      }
      break;
      
    case 'cursed_forest':
      // Random cursing effects
      if (Math.random() < 0.2) {
        state.log.push(`🌲 Dark forest whispers cause unease`);
      }
      break;
      
    case 'ancient_graveyard':
      // Undead resurrection effects
      if (Math.random() < 0.25) {
        state.log.push(`⚰️ Ancient spirits stir restlessly`);
      }
      break;
      
    case 'spirit_realm':
      // Reality distortion
      if (Math.random() < 0.15) {
        state.log.push(`👻 Reality shifts unexpectedly`);
      }
      break;
  }
}

// ===== Enemy Integration =====

export function selectEnvironmentForEnemy(state: GameState): void {
  if (!state.enemy) return;
  
  const { THAI_ENEMIES } = require('./thai_enemy_system');
  const enemyData = THAI_ENEMIES[state.enemy.id];
  
  if (enemyData?.preferredEnvironments?.length > 0) {
    const randomEnv = enemyData.preferredEnvironments[Math.floor(Math.random() * enemyData.preferredEnvironments.length)];
    setEnvironment(state, randomEnv);
  } else {
    // Random Thai environment
    const envIds = Object.keys(THAI_ENVIRONMENTS);
    const randomEnv = envIds[Math.floor(Math.random() * envIds.length)];
    setEnvironment(state, randomEnv);
  }
}

// ===== Integration Functions =====

export function initializeCombatEnvironment(state: GameState): void {
  // Clear any existing environment
  clearEnvironment(state);
  
  // Select environment based on enemy if they have preferences
  selectEnvironmentForEnemy(state);
}

export function processEnvironmentTurnEffects(state: GameState): void {
  processEnvironmentDuration(state);
  processThaiEnvironmentEffects(state);
}

export function processEnvironmentEndTurn(state: GameState): void {
  const currentEnv = getCurrentEnvironment();
  if (!currentEnv) return;
  
  // Process any end-of-turn environment effects
  state.log.push(`🌿 ${currentEnv.name} end-turn effects processed`);
}

// ===== Utility Functions =====

export function getAllEnvironments(): Record<string, BattleEnvironment> {
  return THAI_ENVIRONMENTS;
}

export function getEnvironmentDescription(environmentId: string): string {
  const env = THAI_ENVIRONMENTS[environmentId];
  return env ? `${env.name}: ${env.description}` : 'Unknown environment';
}

export function debugEnvironment(state: GameState): void {
  console.log('=== ENVIRONMENT DEBUG ===');
  console.log('Current Environment:', currentEnvironment);
  if (state.enemy) {
    const { THAI_ENEMIES } = require('./thai_enemy_system');
    const enemyData = THAI_ENEMIES[state.enemy.id];
    console.log('Enemy Preferences:', enemyData?.preferredEnvironments);
    console.log('Enemy Bonuses:', enemyData?.environmentBonuses);
  }
}