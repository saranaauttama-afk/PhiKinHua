// src/core/enemyBehaviorRuntime.ts — Dynamic Enemy AI & Behavior System

import type { GameState, EnemyState } from './types';
import type { 
  EnemyBehavior, 
  BehaviorCondition, 
  BehaviorAction,
  EnemySpell,
  DelayedEffect,
  StatusEffectType 
} from './types_extended';
import { THAI_ENEMIES, getEnemyBehaviors, getEnemySpells } from './thai_enemy_system';
import { applyStatusEffect, hasStatusEffect, getStatusEffectStacks } from './statusEffectsRuntime';

// ===== Behavior Condition Evaluation =====

export function evaluateCondition(
  condition: BehaviorCondition,
  conditionValue: any,
  state: GameState
): boolean {
  if (!state.enemy) return false;

  switch (condition) {
    case 'always':
      return true;
      
    case 'hp_below_50':
      return (state.enemy.hp / state.enemy.maxHp) < 0.5;
      
    case 'hp_below_25':
      return (state.enemy.hp / state.enemy.maxHp) < 0.25;
      
    case 'player_has_curse':
      return hasStatusEffect(state.player, 'curse');
      
    case 'player_hp_below_50':
      return (state.player.hp / state.player.maxHp) < 0.5;
      
    case 'turn_3_or_later':
      return state.turn >= 3;
      
    case 'turn_even':
      return state.turn % 2 === 0;
      
    case 'turn_odd':
      return state.turn % 2 === 1;
      
    case 'has_status_effect':
      if (typeof conditionValue === 'string') {
        return hasStatusEffect(state.enemy, conditionValue as StatusEffectType);
      }
      return false;
      
    case 'enemy_damaged_last_turn':
      // This would require tracking damage history - placeholder for now
      return false;
      
    case 'phase_2':
      const enemyData = THAI_ENEMIES[state.enemy.id];
      return enemyData?.phaseChangeHP ? state.enemy.hp <= enemyData.phaseChangeHP : false;
      
    default:
      return false;
  }
}

// ===== Behavior Action Execution =====

export function executeBehaviorAction(
  action: BehaviorAction,
  actionValue: any,
  state: GameState
): void {
  if (!state.enemy) return;

  switch (action) {
    case 'play_signature_card':
      // Force play a signature card
      const enemyData = THAI_ENEMIES[state.enemy.id];
      if (enemyData?.signatureCards.length > 0) {
        const randomCard = enemyData.signatureCards[Math.floor(Math.random() * enemyData.signatureCards.length)];
        state.log.push(`${state.enemy.name} uses special ability: ${randomCard}`);
        // This would integrate with card playing system
      }
      break;
      
    case 'double_attack':
      // Next attack deals double damage
      applyStatusEffect('enemy', state, 'strength', 1, 2);
      state.log.push(`${state.enemy.name} prepares a devastating attack!`);
      break;
      
    case 'heal_self':
      const healAmount = actionValue?.amount || 10;
      state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + healAmount);
      state.log.push(`${state.enemy.name} heals ${healAmount} HP`);
      break;
      
    case 'apply_status_to_player':
      if (actionValue?.statusId) {
        applyStatusEffect(
          'player', 
          state, 
          actionValue.statusId,
          actionValue.duration,
          actionValue.stacks || 1,
          actionValue.value
        );
      }
      break;
      
    case 'apply_status_to_self':
      if (actionValue?.statusId) {
        applyStatusEffect(
          'enemy', 
          state, 
          actionValue.statusId,
          actionValue.duration,
          actionValue.stacks || 1,
          actionValue.value
        );
      }
      break;
      
    case 'force_draw_cards':
      // This would integrate with card drawing system
      state.log.push(`${state.enemy.name} forces card draw effects`);
      break;
      
    case 'gain_extra_energy':
      const energyGain = actionValue?.amount || 1;
      state.enemyEnergy = (state.enemyEnergy || 0) + energyGain;
      state.log.push(`${state.enemy.name} gains ${energyGain} energy`);
      break;
      
    case 'change_ai_pattern':
      // Change enemy AI behavior
      state.log.push(`${state.enemy.name} changes tactics!`);
      break;
      
    case 'summon_minion':
      // Integrate with minion system
      const { summonMinion } = require('./minionRuntime');
      const minionId = actionValue?.minionId || 'shadow_clone';
      const count = actionValue?.maxCount || 1;
      summonMinion(state, minionId, 'enemy', count);
      break;
      
    case 'cast_spell':
      // Start casting a spell
      const spellId = actionValue;
      if (typeof spellId === 'string') {
        startSpellCasting(state, spellId);
      }
      break;
      
    case 'enter_phase_2':
      state.log.push(`${state.enemy.name} enters Phase 2!`);
      // This would unlock phase 2 behaviors and spells
      break;
  }
}

// ===== Behavior Processing System =====

export function processBehaviors(state: GameState): void {
  if (!state.enemy) return;

  const behaviors = getEnemyBehaviors(state.enemy.id);
  if (!behaviors.length) return;

  // Initialize behavior tracking if not exists
  if (!state.enemy.statusEffects) {
    state.enemy.statusEffects = [];
  }

  // Sort behaviors by priority (highest first)
  const sortedBehaviors = [...behaviors].sort((a, b) => b.priority - a.priority);

  for (const behavior of sortedBehaviors) {
    // Skip if already triggered this combat and marked as once per combat
    if (behavior.oncePerCombat && behavior.triggered) {
      continue;
    }

    // Evaluate condition
    if (evaluateCondition(behavior.condition, behavior.conditionValue, state)) {
      state.log.push(`🎭 ${state.enemy.name} behavior triggered: ${behavior.id}`);
      
      // Execute action
      executeBehaviorAction(behavior.action, behavior.actionValue, state);
      
      // Mark as triggered if once per combat
      if (behavior.oncePerCombat) {
        behavior.triggered = true;
      }
      
      // Only trigger one behavior per turn (highest priority wins)
      break;
    }
  }
}

// ===== Spell Casting System =====

// Global spell tracking (would be better in GameState)
const activeSpells: Map<string, EnemySpell[]> = new Map();

export function startSpellCasting(state: GameState, spellId: string): void {
  if (!state.enemy) return;

  const enemySpells = getEnemySpells(state.enemy.id);
  const spell = enemySpells.find(s => s.id === spellId);
  
  if (!spell) {
    state.log.push(`Unknown spell: ${spellId}`);
    return;
  }

  // Check if spell is already being cast
  const enemyActiveSpells = activeSpells.get(state.enemy.id) || [];
  if (enemyActiveSpells.some(s => s.id === spellId)) {
    return; // Already casting this spell
  }

  // Check if enemy has enough energy
  const enemyEnergy = state.enemyEnergy || 0;
  if (enemyEnergy < spell.cost) {
    state.log.push(`${state.enemy.name} doesn't have enough energy to cast ${spell.name}`);
    return;
  }

  // Start casting
  const castingSpell = { ...spell, currentCharge: 0 };
  enemyActiveSpells.push(castingSpell);
  activeSpells.set(state.enemy.id, enemyActiveSpells);

  // Consume energy
  state.enemyEnergy = enemyEnergy - spell.cost;

  // Apply spell charging status effect for telegraphing
  if (spell.telegraphed) {
    applyStatusEffect('enemy', state, 'spell_charging', spell.castTime);
  }

  state.log.push(`⚡ ${state.enemy.name} begins casting ${spell.name}! (${spell.castTime} turns remaining)`);
}

export function processSpellCasting(state: GameState): void {
  if (!state.enemy) return;

  const enemyActiveSpells = activeSpells.get(state.enemy.id);
  if (!enemyActiveSpells?.length) return;

  const remainingSpells: EnemySpell[] = [];
  const completedSpells: EnemySpell[] = [];

  for (const spell of enemyActiveSpells) {
    spell.currentCharge = (spell.currentCharge || 0) + 1;

    if (spell.currentCharge >= spell.castTime) {
      // Spell is ready to cast
      completedSpells.push(spell);
    } else {
      // Still charging
      remainingSpells.push(spell);
      const turnsLeft = spell.castTime - spell.currentCharge;
      state.log.push(`⚡ ${spell.name} charging... (${turnsLeft} turns remaining)`);
    }
  }

  // Update active spells
  activeSpells.set(state.enemy.id, remainingSpells);

  // Cast completed spells
  for (const spell of completedSpells) {
    castSpell(state, spell);
  }
}

function castSpell(state: GameState, spell: EnemySpell): void {
  if (!state.enemy) return;

  state.log.push(`🔥 ${state.enemy.name} casts ${spell.name}!`);

  for (const effect of spell.effects) {
    executeSpellEffect(state, effect, spell);
  }

  // Mark as used if once per combat
  if (spell.oncePerCombat) {
    // This would need persistent tracking
  }
}

function executeSpellEffect(state: GameState, effect: any, spell: EnemySpell): void {
  switch (effect.type) {
    case 'damage':
      const damage = effect.value;
      const actualDamage = Math.min(damage, state.player.hp);
      state.player.hp -= actualDamage;
      state.log.push(`💥 ${spell.name} deals ${actualDamage} damage!`);
      break;
      
    case 'heal':
      if (state.enemy) {
        const healAmount = effect.value;
        state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + healAmount);
        state.log.push(`💚 ${state.enemy.name} heals ${healAmount} HP`);
      }
      break;
      
    case 'apply_status':
      const target = effect.target === 'player' ? 'player' : 'enemy';
      if (effect.statusEffectId) {
        applyStatusEffect(target, state, effect.statusEffectId, effect.duration, effect.value);
      }
      break;
      
    case 'summon_minion':
      const { summonMinion } = require('./minionRuntime');
      const minionCount = effect.value || 1;
      // Default to shadow_clone for generic summons
      const summonType = effect.target === 'enemy' ? 'shadow_clone' : 'ghost_ally';
      summonMinion(state, summonType, 'enemy', minionCount);
      state.log.push(`👹 ${spell.name} summons ${minionCount} minions!`);
      break;
      
    case 'force_discard':
      state.log.push(`🃏 ${spell.name} forces discard of ${effect.value} cards!`);
      // This would integrate with card system
      break;
      
    case 'drain_energy':
      const energyDrain = Math.min(effect.value, state.player.energy);
      state.player.energy -= energyDrain;
      state.log.push(`⚡ ${spell.name} drains ${energyDrain} energy!`);
      break;
      
    case 'destroy_equipment':
      state.log.push(`🔨 ${spell.name} destroys equipment!`);
      // This would integrate with equipment system
      break;
      
    default:
      state.log.push(`❓ Unknown spell effect: ${effect.type}`);
  }
}

// ===== Integration with Combat System =====

export function processEnemyTurnBehaviors(state: GameState): void {
  // Process behaviors first (they might influence spell casting)
  processBehaviors(state);
  
  // Then process spell casting
  processSpellCasting(state);
}

// ===== Enhanced Enemy Initialization =====

export function initializeEnemyBehaviors(state: GameState): void {
  if (!state.enemy) return;

  const enemyData = THAI_ENEMIES[state.enemy.id];
  if (!enemyData) return;

  // Initialize behavior states
  const behaviors = getEnemyBehaviors(state.enemy.id);
  for (const behavior of behaviors) {
    behavior.triggered = false; // Reset triggered state
  }

  // Apply starting status effects
  if (enemyData.startingStatusEffects) {
    for (const status of enemyData.startingStatusEffects) {
      applyStatusEffect('enemy', state, status.id as StatusEffectType, status.duration, status.stacks);
    }
  }

  state.log.push(`🎭 ${state.enemy.name} behaviors initialized`);
}

// ===== Utility Functions =====

export function getActiveSpells(enemyId: string): EnemySpell[] {
  return activeSpells.get(enemyId) || [];
}

export function cancelSpell(enemyId: string, spellId: string): boolean {
  const enemySpells = activeSpells.get(enemyId) || [];
  const index = enemySpells.findIndex(s => s.id === spellId);
  
  if (index >= 0) {
    enemySpells.splice(index, 1);
    activeSpells.set(enemyId, enemySpells);
    return true;
  }
  
  return false;
}

export function clearAllSpells(enemyId?: string): void {
  if (enemyId) {
    activeSpells.delete(enemyId);
  } else {
    activeSpells.clear();
  }
}

// Export for debugging
export function debugBehaviors(state: GameState): void {
  if (!state.enemy) return;
  
  console.log('=== ENEMY BEHAVIORS DEBUG ===');
  console.log('Enemy:', state.enemy.name);
  console.log('Behaviors:', getEnemyBehaviors(state.enemy.id));
  console.log('Active Spells:', getActiveSpells(state.enemy.id));
  console.log('Status Effects:', state.enemy.statusEffects);
}