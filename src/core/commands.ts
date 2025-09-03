import type { CardData, GameState } from './types';
import { HAND_SIZE, START_ENERGY, START_DECK_IDS, START_GOLD, CARD_BY_ID } from './balance';
import { shuffle, type RNG } from './rng';
import { runBlessingsOnCardPlayed } from './blessingRuntime';

// NOTE: We keep state updates pure by working on shallow copies of containers.
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function baseNewState(seed: string): GameState {
  return {
    seed,
    phase: 'menu',
    turn: 0,
    player: { hp: 50, maxHp: 50, block: 0, energy: START_ENERGY, gold: START_GOLD },
    enemy: undefined,
    piles: { draw: [], hand: [], discard: [], exhaust: [] },
    log: [],
    // ✅ ฟิลด์ที่เพิ่มใน M2
    blessings: [],
    turnFlags: { blessingOnce: {} },
    runCounters: { removed: 0 },
    rewardOptions: undefined,
    map: undefined,
    shopStock: undefined,
    event: undefined,
    combatVictoryLock: false,    
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

export function drawUpTo(state: GameState, rng: RNG, targetHandSize = HAND_SIZE): { state: GameState; rng: RNG } {
  let s = state;
  let r = rng;
  // bonus draw จาก blessing
  const extra = (s as any).turnFlags?.extraDraw ?? 0;
  const target = targetHandSize + extra;
  const pile = s.piles;
  while (pile.hand.length < target && (pile.draw.length || pile.discard.length)) {
    if (pile.draw.length === 0 && pile.discard.length) {
      const sh = shuffle(r, pile.discard.slice());
      r = sh.rng;
      pile.draw = sh.array;
      pile.discard = [];
    }
    if (pile.draw.length) {
      const c = pile.draw.shift()!;
      pile.hand.push(c);
    }
  }
  // ใช้แล้วล้างค่า
  if ((s as any).turnFlags) (s as any).turnFlags.extraDraw = 0;
  return { state: s, rng: r };
}

export function buildAndShuffleDeck(_state: GameState, _rng: RNG): { state: GameState; rng: RNG } {
  let state = _state;
  let rng = _rng;
  // สร้างเด็คจาก id → clone อ็อบเจ็กต์การ์ด ป้องกันอ้างอิงร่วม
  const deck = START_DECK_IDS.map(id => JSON.parse(JSON.stringify(CARD_BY_ID[id])) as CardData);
  const out = shuffle(rng, deck);
  state.piles = { draw: out.array.slice(), hand: [], discard: [], exhaust: [] };
  rng = out.rng;
  return { state, rng };
}

export function startPlayerTurn(state: GameState, rng: RNG): { state: GameState; rng: RNG } {
  state.player.energy = START_ENERGY;
  state.player.block = 0;
  return drawUpTo(state, rng, HAND_SIZE);
}

export function applyCardEffect(state: GameState, rng: RNG, idxInHand: number): { state: GameState; rng: RNG } {
  let s = state;
  let r = rng;
  const card = s.piles.hand[idxInHand];
  if (!card) return { state: s, rng: r };
  // Spend energy
  if (s.player.energy < card.cost) return { state: s, rng: r };
  s.player.energy -= card.cost;

  // Effect
  if (card.dmg && s.enemy) {
    s.enemy.hp = Math.max(0, s.enemy.hp - card.dmg);
  }
  if (card.block) {
    s.player.block = card.block;
  }
  // ✅ รองรับการ์ดที่ให้พลังงาน (เช่น Focus: energyGain = 1)
  if (card.energyGain && card.energyGain > 0) {
    s.player.energy += card.energyGain;
    s.log.push(`Gained +${card.energyGain} energy`);
  }

  // ✅ Blessings: on_card_played ผ่าน runtime กลาง (deterministic)
  ({ state: s, rng: r } = runBlessingsOnCardPlayed(s, r, card));

  // draw will be handled by reducer after moving the card
  return { state: s, rng: r };
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
