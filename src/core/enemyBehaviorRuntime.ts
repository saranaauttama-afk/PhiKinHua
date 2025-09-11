// src/core/enemyBehaviorRuntime.ts — Simple Enemy AI (Night of the Full Moon style)

import type { GameState, EnemyState } from './types';

// ===== Simple Enemy AI Behaviors =====
// Night of the Full Moon style: simple attack/defend patterns only

/**
 * Simple defensive behavior - enemy blocks when low HP
 */
export function shouldDefend(state: GameState): boolean {
  if (!state.enemy) return false;
  
  // Defend when HP is below 50%
  const hpPercent = state.enemy.hp / state.enemy.maxHp;
  return hpPercent < 0.5;
}

/**
 * Simple aggressive behavior - enemy attacks more when player is low HP
 */
export function shouldAttackAggressively(state: GameState): boolean {
  if (!state.enemy) return false;
  
  // Attack aggressively when player HP is below 30%
  const playerHpPercent = state.player.hp / state.player.maxHp;
  return playerHpPercent < 0.3;
}

/**
 * Simple action: Enemy gains extra block for defense
 */
export function executeDefensiveAction(state: GameState): void {
  if (!state.enemy) return;
  
  // Simple defensive boost - gain some extra block
  const extraBlock = Math.floor(state.enemy.maxHp * 0.1); // 10% of max HP as block
  state.enemy.block = (state.enemy.block || 0) + extraBlock;
  state.log.push(`${state.enemy.name} takes a defensive stance (+${extraBlock} block)`);
}

/**
 * Simple action: Enemy prepares for stronger attack next turn
 */
export function executeAggressiveAction(state: GameState): void {
  if (!state.enemy) return;
  
  // Simple aggressive boost - prepare for next attack (cosmetic for now)
  state.log.push(`${state.enemy.name} prepares for a powerful attack!`);
}

/**
 * Simple behavior processing - just check for basic defensive/aggressive patterns
 */
export function processSimpleBehaviors(state: GameState): void {
  if (!state.enemy) return;

  // Simple defensive behavior
  if (shouldDefend(state)) {
    executeDefensiveAction(state);
    return; // Only one behavior per turn
  }

  // Simple aggressive behavior  
  if (shouldAttackAggressively(state)) {
    executeAggressiveAction(state);
    return; // Only one behavior per turn
  }

  // No special behavior - enemy will just use normal cards
}

// ===== Integration with Combat System =====

/**
 * Simple enemy turn processing - Night of the Full Moon style
 * Just process simple behaviors, no complex spells or multi-turn effects
 */
export function processEnemyTurnBehaviors(state: GameState): void {
  // Process simple behaviors only (defend when low HP, attack aggressively when player low HP)
  processSimpleBehaviors(state);
}

/**
 * Simple enemy initialization - no complex setup needed
 */
export function initializeEnemyBehaviors(state: GameState): void {
  if (!state.enemy) return;
  
  // Simple enemies don't need complex initialization
  state.log.push(`${state.enemy.name} enters combat`);
}