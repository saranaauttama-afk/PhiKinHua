// Commands — pure helpers used by reducer
// baseNewState, buildAndShuffleDeck, drawUpTo, startPlayerTurn, applyCardEffect,
// isVictory/isDefeat, endEnemyTurn
import type { CardData, GameState } from './types';
import { HAND_SIZE, START_ENERGY, START_DECK, START_GOLD, START_HP, nextExpForLevel } from './balance';
import { shuffle, type RNG } from './rng';
import { resetBlessingTurnFlags } from './blessingRuntime';
import { enemyCardById } from './pack_enemy_cards';
import type { EnemyCard } from './types';
import { resetEquipmentTurnFlags, runEquipmentTurnHook } from './equipmentRuntime';

// NOTE: We keep state updates pure by working on shallow copies of containers.
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function baseNewState(seed: string): GameState {
  return {
    seed,
    phase: 'menu',
    turn: 0,
    player: {
      hp: START_HP, maxHp: START_HP, block: 0,
      energy: START_ENERGY, gold: START_GOLD,
      level: 1, exp: 0, expToNext: nextExpForLevel(1),
      maxEnergy: START_ENERGY, maxHandSize: HAND_SIZE,
    },
    enemy: undefined,
    piles: { draw: [], hand: [], discard: [], exhaust: [] },
    log: [],
    // ✅ ฟิลด์ที่เพิ่มใน M2
    blessings: [],
    turnFlags: { blessingOnce: {} },
    runCounters: { removed: 0 },
    // rewardOptions: undefined,
    // map: undefined,
    shopStock: undefined,
    event: undefined,
    combatVictoryLock: false,    
    masterDeck: [],               // ✅ ใส่ค่าเริ่มต้นว่างไว้ เดี๋ยว NewRun จะตั้งจริง
    deckOpen: false,
  };
}

function moveCard(from: CardData[], to: CardData[], idx: number) {
  const [c] = from.splice(idx, 1);
  to.push(c);
}

function maybeRefillDraw(state: GameState, rng: RNG): { state: GameState; rng: RNG } {
  if (state.piles.draw.length === 0 && state.piles.discard.length > 0) {
    const out = shuffle(rng, state.piles.discard);
    state.piles.draw = out.array;
    state.piles.discard = [];
    return { state, rng: out.rng };
  }
  return { state, rng };
}

// จั่ว 1 ใบแบบปลอดภัย (ไม่มีไพ่ให้จั่ว -> คืน drew=false)
function drawOne(s: GameState, rng: RNG): { state: GameState; rng: RNG; drew: boolean } {
  let r = rng;
  if (s.piles.draw.length === 0) {
    if (s.piles.discard.length === 0) {
      return { state: s, rng: r, drew: false };
    }
    const sh = shuffle(r, s.piles.discard);
    r = sh.rng;
    s.piles.draw = sh.array;
    s.piles.discard = [];
  }
  const c = s.piles.draw.shift();
  if (!c) return { state: s, rng: r, drew: false };
  s.piles.hand.push(c);
  return { state: s, rng: r, drew: true };
}

export function drawUpTo(s: GameState, rng: RNG, targetHandSize = HAND_SIZE): { state: GameState; rng: RNG } {
  let r = rng;
  let guard = 0;              // ฝากันลูปผิดพลาด
  const GUARD_MAX = 200;
  while (s.piles.hand.length < targetHandSize && guard++ < GUARD_MAX) {
    const res = drawOne(s, r);
    r = res.rng;
    if (!res.drew) break;     // ไม่มีไพ่ให้จั่ว -> ออกทันที
  }
  return { state: s, rng: r };
}

export function buildAndShuffleDeck(_state: GameState, _rng: RNG): { state: GameState; rng: RNG } {
  let state = _state;
  let rng = _rng;
  // ✅ ใช้ masterDeck เป็นแหล่งสร้างกอง ถ้าว่างค่อย fallback ไป START_DECK
  const source = state.masterDeck?.length ? state.masterDeck : START_DECK;
  const out = shuffle(rng, source);
  state.piles = { draw: out.array.slice(), hand: [], discard: [], exhaust: [] };
  rng = out.rng;
  return { state, rng };
}

export function startPlayerTurn(state: GameState, rng: RNG): { state: GameState; rng: RNG } {
  // resetEquipmentTurnFlags(state);
  // state.player.energy = state.player.maxEnergy ?? START_ENERGY;
  // state.player.block = 0;
  // resetBlessingTurnFlags(state); // ✅ ให้พรแบบ once-per-turn ยิงได้ใหม่
  // return drawUpTo(state,rng ,state.player.maxHandSize ?? HAND_SIZE);
  // Import systems
  const { processStatusEffectsOnTurnStart } = require('./statusEffectsRuntime');
  const { applyEnvironmentEnergyModifier, applyEnvironmentDrawModifier, processEnvironmentTurnEffects } = require('./environmentRuntime');
  const { processPlayerTurnMinions } = require('./minionRuntime');

  // ★ รีเซ็ต once-per-turn ของอุปกรณ์สำหรับเทิร์นใหม่นี้
  resetEquipmentTurnFlags(state);

  // ขั้นตอนพื้นฐาน with environment modifications
  const baseEnergy = state.player.maxEnergy ?? START_ENERGY;
  state.player.energy = applyEnvironmentEnergyModifier(state, baseEnergy, 'player');
  state.player.block = 0;

  // Process status effects at start of turn
  processStatusEffectsOnTurnStart('player', state);
  
  // Process environment effects
  processEnvironmentTurnEffects(state);

  // จั่วให้ครบมือก่อน (with environment modifications)
  const baseHandSize = state.player.maxHandSize ?? HAND_SIZE;
  const modifiedHandSize = applyEnvironmentDrawModifier(state, baseHandSize, 'player');
  const out = drawUpTo(state, rng, modifiedHandSize);
  state = out.state; rng = out.rng;

  // ★ ยิง on_turn_start (ฝั่งผู้เล่น)
  runEquipmentTurnHook(state, 'on_turn_start', 'player');

  // Process player minions actions
  processPlayerTurnMinions(state);

  // เดิม: ให้พร reset ที่อื่นด้วย แต่ถ้าจะคงไว้ตรงนี้ก็ได้
  resetBlessingTurnFlags(state);

  return { state, rng };  
}

export function applyCardEffect(state: GameState, idxInHand: number) {
  const card = state.piles.hand[idxInHand];
  if (!card) return;
  
  console.log(`🔥 Playing card: ${card.id} (${card.name})`);
  console.log('🔥 Card object:', JSON.stringify(card, null, 2));
  state.log.push(`🎴 Playing ${card.name} (${card.id})`);
  
  // Import all advanced systems
  const { modifyCardCostForStatusEffects, modifyDamageForStatusEffects, canPlayAttackCards } = require('./statusEffectsRuntime');
  const { applyEnvironmentCardCostModifier, applyEnvironmentDamageModifier, applyEnvironmentBlockModifier } = require('./environmentRuntime');
  const { onPlayerCardPlayed, getAdaptiveDamageMultiplier } = require('./adaptiveAI');
  const { applyComboCardModifiers, onCardPlayedForCombos } = require('./cardComboSystem');
  
  // Check if attack cards can be played (entangle check)
  if (card.type === 'attack' && !canPlayAttackCards(state)) {
    state.log.push(`Cannot play attack cards while entangled`);
    return;
  }
  
  // ★ Apply combo system modifiers first
  const modifiedCard = applyComboCardModifiers(state, card);
  console.log('🔥 Modified card object:', JSON.stringify(modifiedCard, null, 2));
  
  // Note: Energy is already paid by combat handler
  console.log(`🔥 Energy already paid by combat handler`);

  // Effect - Damage with status effect and environment modifications
  if (modifiedCard.dmg && state.enemy) {
    let modifiedDamage = modifyDamageForStatusEffects('player', 'enemy', state, modifiedCard.dmg);
    modifiedDamage = applyEnvironmentDamageModifier(state, modifiedDamage, 'player');
    // Apply adaptive AI damage multiplier  
    const adaptiveMult = getAdaptiveDamageMultiplier();
    const finalDamage = Math.round(modifiedDamage * (1 / adaptiveMult)); // Inverse for player damage
    state.enemy.hp = Math.max(0, state.enemy.hp - finalDamage);
    
    if (finalDamage !== card.dmg) {
      state.log.push(`Damage modified: ${card.dmg} → ${finalDamage}`);
    }
  }
  
  // Block effect with environment modifications
  if (modifiedCard.block) {
    let modifiedBlock = applyEnvironmentBlockModifier(state, modifiedCard.block, 'player');
    state.player.block += modifiedBlock;
    
    if (modifiedBlock !== card.block) {
      state.log.push(`Block modified: ${card.block} → ${modifiedBlock}`);
    }
  }
  
  // ✅ รองรับการ์ดที่ให้พลังงาน (เช่น Focus: energyGain = 1)
  if (modifiedCard.energyGain && modifiedCard.energyGain > 0) {
    state.player.energy += modifiedCard.energyGain;
    state.log.push(`Gained +${modifiedCard.energyGain} energy`);
  }
  
  console.log(`🔥 About to check summonMinion property...`);
  
  try {
    // ✅ รองรับการเรียก minion
    console.log(`🔥 Checking summonMinion property:`, modifiedCard.summonMinion);
    if (modifiedCard.summonMinion) {
      console.log(`🔥 Card ${card.id} has summonMinion:`, modifiedCard.summonMinion);
      const { summonMinion } = require('./minionRuntime');
      summonMinion(state, modifiedCard.summonMinion, 'player', 1);
    } else {
      console.log(`🔥 Card ${card.id} does NOT have summonMinion property`);
    }
    
    // ✅ Special minion effects for specific cards
    if (card.id === 'hell_gate') {
      console.log('🔥 Hell gate special effect triggered');
      const { summonMinion } = require('./minionRuntime');
      summonMinion(state, 'demon_minion', 'player', 2);
    }
  } catch (error) {
    console.log(`🔥 ERROR in minion summoning:`, error);
    state.log.push(`Error in minion summoning: ${error}`);
  }
  
  // ✅ Status Effect cards (direct application)
  if ((modifiedCard as any).statusEffect) {
    const statusConfig = (modifiedCard as any).statusEffect;
    console.log(`🔥 Card ${card.id} applying status:`, statusConfig);
    
    try {
      const { applyStatusEffect } = require('./statusEffectsRuntime');
      const targetType = statusConfig.target; // 'enemy' or 'player'
      
      applyStatusEffect(
        targetType,
        state, 
        statusConfig.effect,    // e.g., 'poison'
        statusConfig.duration,  // e.g., 4
        statusConfig.value      // e.g., 3 stacks
      );
      
      state.log.push(`✨ ${card.name} applies ${statusConfig.effect} (${statusConfig.value} stacks) to ${targetType}`);
    } catch (error) {
      console.log(`🔥 ERROR applying status effect:`, error);
      state.log.push(`Error applying status effect: ${error}`);
    }
  }
  
  // ★ Trigger combo system after card effects
  onCardPlayedForCombos(state, modifiedCard);
  
  // ★ AI learning from player card usage
  onPlayerCardPlayed(state, modifiedCard);
  
  // draw will be handled by reducer after moving the card
}

export function isVictory(state: GameState): boolean {
  return !!state.enemy && state.enemy.hp <= 0;
}

export function isDefeat(state: GameState): boolean {
  return state.player.hp <= 0;
}

function playEnemyCard(s: GameState) {
  if (!s.enemy || !s.enemy.intentCardId) return;
  const card: EnemyCard | undefined = enemyCardById(s.enemy.intentCardId);
  if (!card) { s.log.push(`Enemy tries unknown card: ${s.enemy.intentCardId}`); return; }

  if (card.type === 'attack' && (card.dmg ?? 0) > 0) {
    const atk = Math.max(0, card.dmg!);
    const blockAfter = Math.max(0, s.player.block - atk);
    const hpLoss = Math.max(0, atk - s.player.block);
    s.player.block = blockAfter;
    s.player.hp = Math.max(0, s.player.hp - hpLoss);
    s.log.push(`Enemy plays ${card.name ?? card.id}: Attack ${atk} (${hpLoss} dmg).`);
  } else if (card.type === 'skill' && (card.block ?? 0) > 0) {
    s.enemy.block = (s.enemy.block ?? 0) + (card.block ?? 0);
    s.log.push(`Enemy plays ${card.name ?? card.id}: Block +${card.block}.`);
  } else {
    s.log.push(`Enemy plays ${card.name ?? card.id}.`);
  }
}

// helper เดิน pointer ไปไพ่ถัดไป
function stepNextEnemyCard(s: GameState) {
  const ai = s.enemy?.ai;
  if (!s.enemy || !ai || ai.cycle.length === 0) return;
  ai.index = (ai.index + 1) % ai.cycle.length;
  s.enemy.intentCardId = ai.cycle[ai.index];
}

export function endEnemyTurn(state: GameState) {
  // ★ Process all advanced systems before enemy turn
  const { processEnemyTurnBehaviors } = require('./enemyBehaviorRuntime');  
  const { onTurnEndForCombos } = require('./cardComboSystem');
  const { onPlayerTurnEnd } = require('./adaptiveAI');
  
  // Process combos and AI learning
  onTurnEndForCombos(state);
  onPlayerTurnEnd(state, { energyUsed: 0, blockGained: state.player.block });
  
  // Process environment effects (check if function exists)
  try {
    const { processEnvironmentEndTurn } = require('./environmentRuntime');
    if (typeof processEnvironmentEndTurn === 'function') {
      processEnvironmentEndTurn(state);
    }
  } catch (e) {
    // Environment system not available, skip
  }
  
  // Process enemy minions and behaviors (check if function exists)
  try {
    const { processEnemyMinions } = require('./minionRuntime');
    if (typeof processEnemyMinions === 'function') {
      processEnemyMinions(state);
    }
    processEnemyTurnBehaviors(state);
  } catch (e) {
    // Minion/behavior system not available, skip
  }
  
  // Run standard enemy turn
  const { runEnemyTurn } = require('./engine/handlers/enemy');
  runEnemyTurn(state);  
}
