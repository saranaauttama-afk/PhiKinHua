import type { CardData, GameState } from './types';
import { HAND_SIZE, START_ENERGY, START_DECK } from './balance';
import { shuffle, type RNG } from './rng';

// NOTE: We keep state updates pure by working on shallow copies of containers.
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function baseNewState(seed: string): GameState {
  return {
    seed,
    phase: 'menu',
    turn: 0,
    player: { hp: 50, maxHp: 50, block: 0, energy: START_ENERGY },
    enemy: undefined,
    piles: { draw: [], hand: [], discard: [], exhaust: [] },
    log: [],
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

export function drawOne(_state: GameState, _rng: RNG): { state: GameState; rng: RNG } {
  let state = _state;
  let rng = _rng;
  ({ state, rng } = maybeRefillDraw(state, rng));
  if (state.piles.draw.length > 0) {
    const card = state.piles.draw.shift()!;
    state.piles.hand.push(card);
  }
  return { state, rng };
}

export function drawUpTo(_state: GameState, _rng: RNG, handSize = HAND_SIZE): { state: GameState; rng: RNG } {
  let state = _state;
  let rng = _rng;
  while (state.piles.hand.length < handSize) {
    const before = state.piles.hand.length;
    ({ state, rng } = drawOne(state, rng));
    if (state.piles.hand.length === before) break; // cannot draw more
  }
  return { state, rng };
}

export function buildAndShuffleDeck(_state: GameState, _rng: RNG): { state: GameState; rng: RNG } {
  let state = _state;
  let rng = _rng;
  const out = shuffle(rng, START_DECK);
  state.piles = { draw: out.array.slice(), hand: [], discard: [], exhaust: [] };
  rng = out.rng;
  return { state, rng };
}

export function startPlayerTurn(state: GameState, rng: RNG): { state: GameState; rng: RNG } {
  state.player.energy = START_ENERGY;
  state.player.block = 0;
  return drawUpTo(state, rng, HAND_SIZE);
}

export function applyCardEffect(state: GameState, idxInHand: number) {
  const card = state.piles.hand[idxInHand];
  if (!card) return;
  // Spend energy
  if (state.player.energy < card.cost) return;
  state.player.energy -= card.cost;

  // Effect
  if (card.dmg && state.enemy) {
    state.enemy.hp = Math.max(0, state.enemy.hp - card.dmg);
  }
  if (card.block) {
    state.player.block = card.block;
  }
  if (card.energyGain) {
    state.player.energy = card.energyGain;
  }
  // draw will be handled by reducer after moving the card
}

export function isVictory(state: GameState): boolean {
  return !!state.enemy && state.enemy.hp <= 0;
}

export function isDefeat(state: GameState): boolean {
  return state.player.hp <= 0;
}

export function endEnemyTurn(state: GameState) {
  if (!state.enemy) return;
  const dmg = Math.max(0, state.enemy.dmg - state.player.block);
  state.player.hp = Math.max(0, state.player.hp - dmg);
  state.player.block = 0;
}
