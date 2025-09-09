// src/core/adaptiveAI.ts — Advanced Adaptive AI System

import type { GameState } from './types';
import type { StatusEffectType } from './types_extended';

// ===== Player Pattern Analysis =====

export interface PlayerPattern {
  // Card Usage Patterns
  cardTypePreference: { [cardType: string]: number }; // attack, skill, equipment
  costDistribution: { [cost: number]: number }; // 0, 1, 2, 3+
  playStyle: 'aggressive' | 'defensive' | 'balanced' | 'combo';
  
  // Strategic Patterns
  blockingFrequency: number; // 0-1, how often player prioritizes defense
  energyEfficiency: number; // average energy used per turn
  cardDrawPreference: number; // preference for card draw effects
  
  // Status Effect Patterns
  statusUsage: { [statusId: string]: number };
  statusCountering: { [statusId: string]: number };
  
  // Combat Timing
  earlyGameStrategy: 'rush' | 'setup' | 'reactive';
  midGameStrategy: 'pressure' | 'control' | 'combo';
  lateGameStrategy: 'burst' | 'sustain' | 'desperation';
  
  // Weaknesses Identified
  weakToStatusTypes: StatusEffectType[];
  vulnerableToRush: boolean;
  overReliantOnBlock: boolean;
  lowHealthPanic: boolean;
}

export interface AIAdaptation {
  // Counter Strategies
  priorityBehaviors: string[]; // Behavior IDs to prioritize
  prioritySpells: string[]; // Spell IDs to prioritize
  statusFocus: StatusEffectType[]; // Status effects to emphasize
  
  // Tactical Adjustments
  aggressionLevel: number; // 0-100, how aggressive to be
  spellCastingPreference: number; // 0-100, preference for spells vs cards
  minionUsage: number; // 0-100, how often to summon minions
  
  // Difficulty Modifiers
  damageMultiplier: number; // 0.8-1.5
  healthMultiplier: number; // 0.8-1.3
  energyBonus: number; // 0-2 extra energy per turn
  spellChargeReduction: number; // 0-2 turns off spell casting time
  
  // Pattern Counters
  antiRushTactics: boolean;
  antiComboDisruption: boolean;
  blockCounters: boolean;
  statusCleansing: boolean;
}

// ===== Global AI State =====

const playerPatterns: PlayerPattern = {
  cardTypePreference: { attack: 0, skill: 0, equipment: 0 },
  costDistribution: { 0: 0, 1: 0, 2: 0, 3: 0 },
  playStyle: 'balanced',
  blockingFrequency: 0,
  energyEfficiency: 0,
  cardDrawPreference: 0,
  statusUsage: {},
  statusCountering: {},
  earlyGameStrategy: 'reactive',
  midGameStrategy: 'control',
  lateGameStrategy: 'sustain',
  weakToStatusTypes: [],
  vulnerableToRush: false,
  overReliantOnBlock: false,
  lowHealthPanic: false
};

const currentAdaptation: AIAdaptation = {
  priorityBehaviors: [],
  prioritySpells: [],
  statusFocus: [],
  aggressionLevel: 50,
  spellCastingPreference: 50,
  minionUsage: 30,
  damageMultiplier: 1.0,
  healthMultiplier: 1.0,
  energyBonus: 0,
  spellChargeReduction: 0,
  antiRushTactics: false,
  antiComboDisruption: false,
  blockCounters: false,
  statusCleansing: false
};

// ===== Player Pattern Learning =====

export function learnFromPlayerAction(
  state: GameState,
  actionType: 'card_played' | 'turn_end' | 'status_applied' | 'damage_taken',
  actionData: any
): void {
  const turnPhase = getTurnPhase(state);
  
  switch (actionType) {
    case 'card_played':
      learnCardUsagePattern(actionData.card, turnPhase);
      break;
      
    case 'turn_end':
      learnTurnPattern(state, actionData);
      break;
      
    case 'status_applied':
      learnStatusPattern(actionData.statusId, actionData.target);
      break;
      
    case 'damage_taken':
      learnDefensivePattern(state, actionData.damage, actionData.blocked);
      break;
  }
  
  // Update play style based on patterns
  updatePlayStyleClassification();
  
  // Adapt AI based on learned patterns
  adaptAIStrategy(state);
}

function getTurnPhase(state: GameState): 'early' | 'mid' | 'late' {
  const turn = state.turn;
  if (turn <= 3) return 'early';
  if (turn <= 8) return 'mid';
  return 'late';
}

function learnCardUsagePattern(card: any, phase: 'early' | 'mid' | 'late'): void {
  // Track card type preferences
  const cardType = card.type as string;
  playerPatterns.cardTypePreference[cardType] = (playerPatterns.cardTypePreference[cardType] || 0) + 1;
  
  // Track cost distribution
  const cost = Math.min(card.cost || 0, 3);
  playerPatterns.costDistribution[cost] = (playerPatterns.costDistribution[cost] || 0) + 1;
  
  // Learn phase-specific strategies
  if (phase === 'early' && card.type === 'attack' && card.cost <= 1) {
    // Player prefers early aggression
    if (playerPatterns.earlyGameStrategy !== 'rush') {
      playerPatterns.earlyGameStrategy = 'rush';
    }
  }
  
  if (card.draw && card.draw > 0) {
    playerPatterns.cardDrawPreference += 1;
  }
}

function learnTurnPattern(state: GameState, turnData: any): void {
  // Calculate energy efficiency
  const energyUsed = turnData.energyUsed || 0;
  const maxEnergy = state.player.maxEnergy || 3;
  const efficiency = energyUsed / maxEnergy;
  
  playerPatterns.energyEfficiency = (playerPatterns.energyEfficiency + efficiency) / 2;
  
  // Learn defensive patterns
  const blockGained = turnData.blockGained || 0;
  if (blockGained > 0) {
    playerPatterns.blockingFrequency += 0.1;
  }
  
  // Detect panic patterns
  if (state.player.hp < state.player.maxHp * 0.25 && blockGained > 6) {
    playerPatterns.lowHealthPanic = true;
  }
}

function learnStatusPattern(statusId: string, target: 'player' | 'enemy'): void {
  if (target === 'enemy') {
    playerPatterns.statusUsage[statusId] = (playerPatterns.statusUsage[statusId] || 0) + 1;
  } else {
    playerPatterns.statusCountering[statusId] = (playerPatterns.statusCountering[statusId] || 0) + 1;
  }
}

function learnDefensivePattern(state: GameState, damage: number, blocked: number): void {
  const blockRatio = blocked / (damage + blocked);
  playerPatterns.blockingFrequency = (playerPatterns.blockingFrequency + blockRatio) / 2;
  
  // Detect over-reliance on block
  if (blockRatio > 0.7 && damage < 3) {
    playerPatterns.overReliantOnBlock = true;
  }
}

function updatePlayStyleClassification(): void {
  const attackPreference = (playerPatterns.cardTypePreference as any).attack || 0;
  const skillPreference = (playerPatterns.cardTypePreference as any).skill || 0;
  const totalCards = attackPreference + skillPreference + ((playerPatterns.cardTypePreference as any).equipment || 0);
  
  if (totalCards === 0) return;
  
  const attackRatio = attackPreference / totalCards;
  const blockFreq = playerPatterns.blockingFrequency;
  
  if (attackRatio > 0.6 && blockFreq < 0.3) {
    playerPatterns.playStyle = 'aggressive';
  } else if (attackRatio < 0.4 && blockFreq > 0.6) {
    playerPatterns.playStyle = 'defensive';
  } else if (playerPatterns.cardDrawPreference > 5) {
    playerPatterns.playStyle = 'combo';
  } else {
    playerPatterns.playStyle = 'balanced';
  }
}

// ===== AI Adaptation Logic =====

function adaptAIStrategy(state: GameState): void {
  // Reset adaptation
  resetAdaptation();
  
  // Counter player's play style
  counterPlayStyle();
  
  // Counter specific patterns
  counterPlayerWeaknesses();
  
  // Adjust difficulty based on player performance
  adjustDifficulty(state);
  
  // Apply adaptations to current enemy
  applyAdaptationsToEnemy(state);
}

function resetAdaptation(): void {
  currentAdaptation.priorityBehaviors = [];
  currentAdaptation.prioritySpells = [];
  currentAdaptation.statusFocus = [];
  currentAdaptation.aggressionLevel = 50;
  currentAdaptation.spellCastingPreference = 50;
}

function counterPlayStyle(): void {
  switch (playerPatterns.playStyle) {
    case 'aggressive':
      // Counter aggression with defense and punishment
      currentAdaptation.aggressionLevel = 30;
      currentAdaptation.statusFocus.push('weakness', 'vulnerable');
      currentAdaptation.priorityBehaviors.push('defensive_stance', 'counter_attack');
      break;
      
    case 'defensive':
      // Counter defense with pressure and inevitability
      currentAdaptation.aggressionLevel = 80;
      currentAdaptation.minionUsage = 60;
      currentAdaptation.statusFocus.push('poison', 'curse');
      currentAdaptation.prioritySpells.push('long_term_damage');
      break;
      
    case 'combo':
      // Disrupt combos with forced actions and card destruction
      currentAdaptation.antiComboDisruption = true;
      currentAdaptation.statusFocus.push('corruption', 'entangle');
      currentAdaptation.priorityBehaviors.push('disrupt_hand', 'force_discard');
      break;
      
    case 'balanced':
      // Vary tactics to keep player guessing
      currentAdaptation.aggressionLevel = 40 + Math.random() * 40;
      currentAdaptation.spellCastingPreference = 60;
      break;
  }
}

function counterPlayerWeaknesses(): void {
  // Counter over-reliance on block
  if (playerPatterns.overReliantOnBlock) {
    currentAdaptation.blockCounters = true;
    currentAdaptation.statusFocus.push('vulnerable');
    currentAdaptation.priorityBehaviors.push('unblockable_attack', 'block_destruction');
  }
  
  // Exploit low health panic
  if (playerPatterns.lowHealthPanic) {
    currentAdaptation.priorityBehaviors.push('pressure_when_low', 'false_security');
  }
  
  // Counter rush vulnerability
  if (playerPatterns.vulnerableToRush) {
    currentAdaptation.aggressionLevel = 90;
    currentAdaptation.priorityBehaviors.push('early_aggression', 'overwhelming_start');
  }
  
  // Apply status counters
  for (const statusType of playerPatterns.weakToStatusTypes) {
    currentAdaptation.statusFocus.push(statusType);
  }
}

function adjustDifficulty(state: GameState): void {
  // Calculate player performance
  const playerHpRatio = state.player.hp / state.player.maxHp;
  const turnNumber = state.turn;
  const enemyHpRatio = state.enemy ? (state.enemy.hp / state.enemy.maxHp) : 1;
  
  // Dynamic difficulty scaling
  if (playerHpRatio > 0.8 && turnNumber > 5) {
    // Player is doing well, increase difficulty
    currentAdaptation.damageMultiplier = 1.2;
    currentAdaptation.healthMultiplier = 1.1;
    currentAdaptation.energyBonus = 1;
    currentAdaptation.spellChargeReduction = 1;
  } else if (playerHpRatio < 0.3 && enemyHpRatio > 0.7) {
    // Player is struggling, decrease difficulty slightly
    currentAdaptation.damageMultiplier = 0.9;
    currentAdaptation.healthMultiplier = 0.95;
  }
}

function applyAdaptationsToEnemy(state: GameState): void {
  if (!state.enemy) return;
  
  // Apply damage and health modifiers
  if (currentAdaptation.damageMultiplier !== 1.0) {
    // This would be applied to enemy attacks
    state.log.push(`🤖 AI adapts: damage ${currentAdaptation.damageMultiplier > 1 ? 'increased' : 'decreased'}`);
  }
  
  if (currentAdaptation.energyBonus > 0) {
    const currentEnergy = (state as any).enemyEnergy || 0;
    (state as any).enemyEnergy = currentEnergy + currentAdaptation.energyBonus;
    state.log.push(`🤖 AI adapts: gains ${currentAdaptation.energyBonus} extra energy`);
  }
  
  // Log adaptation summary
  state.log.push(`🧠 AI analyzing... play style: ${playerPatterns.playStyle}, aggression: ${currentAdaptation.aggressionLevel}`);
}

// ===== Advanced Behavior Modifications =====

export function getAdaptiveBehaviorPriority(behaviorId: string): number {
  const basePriority = 5; // Default priority
  
  if (currentAdaptation.priorityBehaviors.includes(behaviorId)) {
    return basePriority + 3; // Higher priority
  }
  
  // Contextual priority adjustments
  switch (behaviorId) {
    case 'aggressive_rush':
      return currentAdaptation.aggressionLevel > 70 ? basePriority + 2 : basePriority - 1;
      
    case 'defensive_stance':
      return currentAdaptation.aggressionLevel < 40 ? basePriority + 2 : basePriority - 1;
      
    case 'spell_focus':
      return currentAdaptation.spellCastingPreference > 60 ? basePriority + 1 : basePriority;
      
    case 'summon_minions':
      return currentAdaptation.minionUsage > 50 ? basePriority + 1 : basePriority;
      
    default:
      return basePriority;
  }
}

export function getAdaptiveSpellPriority(spellId: string): number {
  const basePriority = 5;
  
  if (currentAdaptation.prioritySpells.includes(spellId)) {
    return basePriority + 3;
  }
  
  return basePriority;
}

export function shouldApplyAdaptiveStatusFocus(statusId: StatusEffectType): boolean {
  return currentAdaptation.statusFocus.includes(statusId);
}

export function getAdaptiveDamageMultiplier(): number {
  return currentAdaptation.damageMultiplier;
}

export function getAdaptiveSpellChargeReduction(): number {
  return currentAdaptation.spellChargeReduction;
}

// ===== Combat Integration Hooks =====

export function onPlayerCardPlayed(state: GameState, card: any): void {
  learnFromPlayerAction(state, 'card_played', { card });
}

export function onPlayerTurnEnd(state: GameState, turnData: any): void {
  learnFromPlayerAction(state, 'turn_end', turnData);
}

export function onStatusEffectApplied(state: GameState, statusId: string, target: 'player' | 'enemy'): void {
  learnFromPlayerAction(state, 'status_applied', { statusId, target });
}

export function onDamageTaken(state: GameState, damage: number, blocked: number): void {
  learnFromPlayerAction(state, 'damage_taken', { damage, blocked });
}

// ===== Utility Functions =====

export function getPlayerPattern(): PlayerPattern {
  return { ...playerPatterns };
}

export function getCurrentAdaptation(): AIAdaptation {
  return { ...currentAdaptation };
}

export function resetAILearning(): void {
  // Reset patterns
  Object.keys(playerPatterns.cardTypePreference).forEach(key => {
    (playerPatterns.cardTypePreference as any)[key] = 0;
  });
  Object.keys(playerPatterns.costDistribution).forEach(key => {
    (playerPatterns.costDistribution as any)[key] = 0;
  });
  
  playerPatterns.playStyle = 'balanced';
  playerPatterns.blockingFrequency = 0;
  playerPatterns.energyEfficiency = 0;
  playerPatterns.cardDrawPreference = 0;
  playerPatterns.statusUsage = {};
  playerPatterns.statusCountering = {};
  playerPatterns.weakToStatusTypes = [];
  playerPatterns.vulnerableToRush = false;
  playerPatterns.overReliantOnBlock = false;
  playerPatterns.lowHealthPanic = false;
  
  // Reset adaptations
  resetAdaptation();
}

export function debugAdaptiveAI(state: GameState): void {
  console.log('=== ADAPTIVE AI DEBUG ===');
  console.log('Player Pattern:', playerPatterns);
  console.log('Current Adaptation:', currentAdaptation);
  console.log('Turn:', state.turn);
  if (state.enemy) {
    console.log('Enemy HP:', `${state.enemy.hp}/${state.enemy.maxHp}`);
  }
  console.log('Player HP:', `${state.player.hp}/${state.player.maxHp}`);
}