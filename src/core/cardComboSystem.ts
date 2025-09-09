// src/core/cardComboSystem.ts — Advanced Card Combination System

import type { GameState, CardData } from './types';
import { applyStatusEffect } from './statusEffectsRuntime';
import { summonMinion } from './minionRuntime';

// ===== Combo Definitions =====

export interface CardCombo {
  id: string;
  name: string;
  description: string;
  requiredCards?: string[]; // Card IDs that must be played (optional)
  requiredTags?: string[]; // Tags that cards must have (optional)
  maxTurns: number; // Combo window in turns
  oncePerCombat?: boolean;
  effects: ComboEffect[];
}

export interface ComboEffect {
  type: 'damage' | 'heal' | 'status' | 'energy' | 'draw' | 'summon' | 'special';
  value: number;
  target: 'player' | 'enemy' | 'both';
  statusId?: string;
  minionId?: string;
  description: string;
}

// ===== Thai Shaman Card Combos =====

const THAI_SHAMAN_COMBOS: CardCombo[] = [
  // Basic Combos
  {
    id: 'shaman_meditation',
    name: 'Shaman\'s Focus',
    description: 'Meditation + any Thai card: Extra energy and enlightenment',
    requiredCards: ['meditation'],
    requiredTags: ['thai'],
    maxTurns: 1,
    effects: [
      { type: 'energy', value: 1, target: 'player', description: 'Gain +1 energy' },
      { type: 'draw', value: 1, target: 'player', description: 'Draw +1 card' }
    ]
  },
  
  {
    id: 'ghost_summoning_ritual',
    name: 'Ghost Summoning Ritual',
    description: 'Call Old Ghost + Spirit Whisper: Enhanced ghost ally',
    requiredCards: ['call_old_ghost', 'spirit_whisper'],
    maxTurns: 2,
    effects: [
      { type: 'summon', value: 1, target: 'player', minionId: 'ghost_ally', description: 'Summon enhanced Ghost Ally' },
      { type: 'damage', value: 6, target: 'enemy', description: 'Spiritual energy damages enemy' }
    ]
  },
  
  {
    id: 'curse_amplification',
    name: 'Curse Amplification',
    description: 'Curse Chant + Cursed Needle: Devastating cursed attack',
    requiredCards: ['curse_chant', 'cursed_needle'],
    maxTurns: 2,
    effects: [
      { type: 'status', value: 3, target: 'enemy', statusId: 'curse', description: 'Apply Curse (3 stacks)' },
      { type: 'damage', value: 15, target: 'enemy', description: 'Amplified cursed damage' }
    ]
  },
  
  // Advanced Combos
  {
    id: 'protection_ritual',
    name: 'Complete Protection Ritual',
    description: 'Holy Powder + Cooling Cloth + Bell Sound: Ultimate defense',
    requiredCards: ['holy_powder', 'cooling_cloth', 'bell_sound'],
    maxTurns: 2,
    oncePerCombat: true,
    effects: [
      { type: 'heal', value: 8, target: 'player', description: 'Ritual healing' },
      { type: 'status', value: 3, target: 'player', statusId: 'block_next', description: 'Block next 15 damage' },
      { type: 'status', value: 2, target: 'enemy', statusId: 'weakness', description: 'Enemy weakened' }
    ]
  },
  
  {
    id: 'spirit_possession_combo',
    name: 'Spirit Possession Mastery',
    description: 'Ghost Possession + Ancestral Spirits: Ultimate spiritual power',
    requiredCards: ['ghost_possession', 'ancestral_spirits'],
    maxTurns: 3,
    oncePerCombat: true,
    effects: [
      { type: 'energy', value: 2, target: 'player', description: 'Spiritual energy surge' },
      { type: 'draw', value: 3, target: 'player', description: 'Ancestral wisdom' },
      { type: 'special', value: 0, target: 'player', description: 'Next 3 cards cost 0 energy' }
    ]
  },
  
  {
    id: 'hell_gate_ritual',
    name: 'Hell Gate Ritual',
    description: 'Hell Gate + Soul Drain + Black Magic: Open the ultimate portal',
    requiredCards: ['hell_gate', 'soul_drain', 'black_magic'],
    maxTurns: 4,
    oncePerCombat: true,
    effects: [
      { type: 'damage', value: 25, target: 'enemy', description: 'Hellfire damage' },
      { type: 'summon', value: 3, target: 'player', minionId: 'demon_minion', description: 'Summon 3 Greater Demons' },
      { type: 'heal', value: 15, target: 'player', description: 'Life force absorption' }
    ]
  },
  
  // Legendary Combos
  {
    id: 'divine_intervention',
    name: 'Divine Intervention',
    description: 'Divine Protection + Royal Medicine + Sacred Ritual: Godlike power',
    requiredCards: ['divine_protection', 'royal_medicine', 'sacred_ritual'],
    maxTurns: 5,
    oncePerCombat: true,
    effects: [
      { type: 'heal', value: 999, target: 'player', description: 'Full restoration' },
      { type: 'status', value: 5, target: 'player', statusId: 'strength', description: 'Divine strength' },
      { type: 'status', value: 5, target: 'player', statusId: 'regeneration', description: 'Divine regeneration' },
      { type: 'special', value: 0, target: 'player', description: 'Immunity to all debuffs this combat' }
    ]
  },
  
  {
    id: 'ultimate_thai_mastery',
    name: 'Ultimate Thai Shaman Mastery',
    description: 'Play 7+ different Thai cards in one combat: Transcendence',
    requiredCards: [], // No specific cards required
    requiredTags: ['thai'],
    maxTurns: 999, // Entire combat
    oncePerCombat: true,
    effects: [
      { type: 'damage', value: 30, target: 'enemy', description: 'Transcendent power' },
      { type: 'heal', value: 20, target: 'player', description: 'Spiritual mastery healing' },
      { type: 'energy', value: 3, target: 'player', description: 'Enlightened energy' },
      { type: 'draw', value: 5, target: 'player', description: 'Perfect understanding' }
    ]
  }
];

// ===== Combo Tracking =====

interface ComboProgress {
  comboId: string;
  cardsPlayed: string[];
  turnStarted: number;
  completed: boolean;
}

const activeComboProgress: ComboProgress[] = [];

// ===== Combo Detection System =====

export function checkForCombos(state: GameState, playedCard: CardData): void {
  // Update existing combo progress
  updateComboProgress(state, playedCard);
  
  // Check for new combo starts
  startNewCombos(state, playedCard);
  
  // Process completed combos
  processCompletedCombos(state);
}

function updateComboProgress(state: GameState, playedCard: CardData): void {
  for (const progress of activeComboProgress) {
    if (progress.completed) continue;
    
    const combo = THAI_SHAMAN_COMBOS.find(c => c.id === progress.comboId);
    if (!combo) continue;
    
    // Check if this card contributes to the combo
    const contributesToCombo = 
      (combo.requiredCards && combo.requiredCards.includes(playedCard.id)) ||
      (combo.requiredTags && playedCard.tags?.some(tag => combo.requiredTags!.includes(tag)));
      
    if (contributesToCombo && !progress.cardsPlayed.includes(playedCard.id)) {
      progress.cardsPlayed.push(playedCard.id);
      
      state.log.push(`✨ Combo progress: ${combo.name} (${progress.cardsPlayed.length}/${getComboRequiredCount(combo)})`);
      
      // Check if combo is completed
      if (isComboComplete(combo, progress)) {
        progress.completed = true;
        state.log.push(`🎆 COMBO ACTIVATED: ${combo.name}!`);
        state.log.push(`📖 ${combo.description}`);
      }
    }
  }
}

function startNewCombos(state: GameState, playedCard: CardData): void {
  for (const combo of THAI_SHAMAN_COMBOS) {
    // Skip if combo is already being tracked
    if (activeComboProgress.some(p => p.comboId === combo.id)) continue;
    
    // Skip if combo was already used this combat
    if (combo.oncePerCombat && (state as any).completedCombos?.includes(combo.id)) continue;
    
    // Check if this card can start the combo
    const canStartCombo = 
      (combo.requiredCards && combo.requiredCards.includes(playedCard.id)) ||
      (combo.requiredTags && playedCard.tags?.some(tag => combo.requiredTags!.includes(tag)));
      
    if (canStartCombo) {
      const progress: ComboProgress = {
        comboId: combo.id,
        cardsPlayed: [playedCard.id],
        turnStarted: state.turn,
        completed: false
      };
      
      activeComboProgress.push(progress);
      
      if ((combo.requiredCards && combo.requiredCards.length > 1) || (combo.requiredTags && getComboRequiredCount(combo) > 1)) {
        state.log.push(`✨ Combo started: ${combo.name} (1/${getComboRequiredCount(combo)})`);
      }
    }
  }
}

function getComboRequiredCount(combo: CardCombo): number {
  if (combo.requiredCards && combo.requiredCards.length > 0) {
    return combo.requiredCards.length;
  }
  
  if (combo.id === 'ultimate_thai_mastery') {
    return 7; // Special case
  }
  
  return 2; // Default for tag-based combos
}

function isComboComplete(combo: CardCombo, progress: ComboProgress): boolean {
  if (combo.requiredCards && combo.requiredCards.length > 0) {
    // All specific cards must be played
    return combo.requiredCards.every(cardId => progress.cardsPlayed.includes(cardId));
  }
  
  if (combo.id === 'ultimate_thai_mastery') {
    return progress.cardsPlayed.length >= 7;
  }
  
  // Tag-based combos need minimum cards
  return progress.cardsPlayed.length >= getComboRequiredCount(combo);
}

function processCompletedCombos(state: GameState): void {
  const completedCombos = activeComboProgress.filter(p => p.completed);
  
  for (const progress of completedCombos) {
    const combo = THAI_SHAMAN_COMBOS.find(c => c.id === progress.comboId);
    if (!combo) continue;
    
    // Execute combo effects
    executeComboEffects(state, combo);
    
    // Mark as completed this combat
    if (!((state as any).completedCombos)) {
      (state as any).completedCombos = [];
    }
    ((state as any).completedCombos as string[]).push(combo.id);
    
    // Remove from active progress
    const index = activeComboProgress.indexOf(progress);
    activeComboProgress.splice(index, 1);
  }
}

function executeComboEffects(state: GameState, combo: CardCombo): void {
  state.log.push(`🌟 ${combo.name} effects activate:`);
  
  for (const effect of combo.effects) {
    switch (effect.type) {
      case 'damage':
        if (state.enemy && effect.target === 'enemy') {
          state.enemy.hp = Math.max(0, state.enemy.hp - effect.value);
          state.log.push(`💥 ${effect.description}: ${effect.value} damage!`);
        }
        break;
        
      case 'heal':
        if (effect.target === 'player') {
          const healAmount = Math.min(effect.value, state.player.maxHp - state.player.hp);
          state.player.hp += healAmount;
          state.log.push(`💚 ${effect.description}: ${healAmount} HP restored!`);
        }
        break;
        
      case 'status':
        if (effect.statusId) {
          const target = effect.target === 'player' ? 'player' : 'enemy';
          applyStatusEffect(target, state, effect.statusId as any, undefined, effect.value);
          state.log.push(`✨ ${effect.description}!`);
        }
        break;
        
      case 'energy':
        if (effect.target === 'player') {
          state.player.energy += effect.value;
          state.log.push(`⚡ ${effect.description}: +${effect.value} energy!`);
        }
        break;
        
      case 'draw':
        if (effect.target === 'player') {
          // This would integrate with card drawing system
          state.log.push(`🃏 ${effect.description}: Draw ${effect.value} cards!`);
        }
        break;
        
      case 'summon':
        if (effect.minionId) {
          const owner = effect.target === 'player' ? 'player' : 'enemy';
          summonMinion(state, effect.minionId, owner, effect.value);
          state.log.push(`👹 ${effect.description}!`);
        }
        break;
        
      case 'special':
        executeSpecialComboEffect(state, combo, effect);
        break;
    }
  }
}

function executeSpecialComboEffect(state: GameState, combo: CardCombo, effect: ComboEffect): void {
  switch (combo.id) {
    case 'spirit_possession_combo':
      // Next 3 cards cost 0 energy
      (state as any).freeCardsRemaining = 3;
      state.log.push(`✨ ${effect.description}!`);
      break;
      
    case 'divine_intervention':
      // Immunity to all debuffs this combat
      (state as any).debuffImmunity = true;
      state.log.push(`🛡️ ${effect.description}!`);
      break;
      
    default:
      state.log.push(`✨ ${effect.description}!`);
  }
}

// ===== Combo Expiration =====

export function processComboExpiration(state: GameState): void {
  const currentTurn = state.turn;
  const expiredCombos: ComboProgress[] = [];
  
  for (const progress of activeComboProgress) {
    if (progress.completed) continue;
    
    const combo = THAI_SHAMAN_COMBOS.find(c => c.id === progress.comboId);
    if (!combo) continue;
    
    const turnsSinceStart = currentTurn - progress.turnStarted;
    if (turnsSinceStart >= combo.maxTurns) {
      expiredCombos.push(progress);
      state.log.push(`⏰ Combo expired: ${combo.name}`);
    }
  }
  
  // Remove expired combos
  for (const expired of expiredCombos) {
    const index = activeComboProgress.indexOf(expired);
    activeComboProgress.splice(index, 1);
  }
}

// ===== Special Card Effects Integration =====

export function applyComboCardModifiers(state: GameState, card: CardData): CardData {
  const modifiedCard = { ...card };
  
  // Check for free cards effect
  if ((state as any).freeCardsRemaining > 0) {
    modifiedCard.cost = 0;
    (state as any).freeCardsRemaining -= 1;
    state.log.push(`✨ Spirit Possession: Card played for free!`);
  }
  
  return modifiedCard;
}

export function shouldBlockDebuff(state: GameState, statusId: string): boolean {
  return !!(state as any).debuffImmunity;
}

// ===== Integration Helpers =====

export function initializeCombatCombos(state: GameState): void {
  // Clear combo state
  activeComboProgress.length = 0;
  (state as any).completedCombos = [];
  (state as any).freeCardsRemaining = 0;
  (state as any).debuffImmunity = false;
  
  state.log.push(`✨ Combo system initialized`);
}

export function onCardPlayedForCombos(state: GameState, card: CardData): void {
  checkForCombos(state, card);
}

export function onTurnEndForCombos(state: GameState): void {
  processComboExpiration(state);
}

// ===== Utility Functions =====

export function getActiveComboProgress(): ComboProgress[] {
  return [...activeComboProgress];
}

export function getAllCombos(): CardCombo[] {
  return [...THAI_SHAMAN_COMBOS];
}

export function getComboByName(name: string): CardCombo | undefined {
  return THAI_SHAMAN_COMBOS.find(c => c.name === name);
}

export function debugCombos(state: GameState): void {
  console.log('=== COMBO SYSTEM DEBUG ===');
  console.log('Active Combos:', activeComboProgress);
  console.log('Completed Combos:', (state as any).completedCombos);
  console.log('Free Cards Remaining:', (state as any).freeCardsRemaining);
  console.log('Debuff Immunity:', (state as any).debuffImmunity);
}