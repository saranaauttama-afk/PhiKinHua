//*** NEW: src/core/events.ts
import type { BlessingDef, CardData, EventState, GameState, Rarity } from './types';
import type { RNG } from './rng';
import { int, shuffle } from './rng';
import { GAMBLE_LOSE_HP, GAMBLE_WIN_GOLD, REMOVE_CAP_PER_RUN, TREASURE_MAX, TREASURE_MIN } from './balance';
import { BLESSINGS_BY_RARITY } from './pack';

// ===== Blessings pool (ตัวอย่างเล็ก ๆ ใช้งานได้เลย)
const BLESSINGS: BlessingDef[] = [
  {
    id: 'bl_energy_first',
    name: 'Battle Rhythm',
    desc: 'First card each turn grants +1 energy.',
    oncePerTurn: true,
    rarity: 'Common',
    on_card_played: (tc) => { tc.state.player.energy += 1; },
  },
  {
    id: 'bl_start_block',
    name: 'Guarded Start',
    desc: '+3 Block at turn start.',
    rarity: 'Common',
    on_turn_start: (tc) => { tc.state.player.block += 3; },
  },
  {
    id: 'bl_attack_block',
    name: 'Counter Edge',
    desc: 'When playing an attack, gain +2 Block.',
    rarity: 'Uncommon',
    on_card_played: { tag: 'attack', once_per_turn: false, effects: [ (tc) => { tc.state.player.block += 2; } ] },
  },
  {
    id: 'bl_end_heal',
    name: 'Second Wind',
    desc: 'On turn end, heal 1.',
    rarity: 'Uncommon',
    on_turn_end: (tc) => { tc.state.player.hp = Math.min(tc.state.player.maxHp, tc.state.player.hp + 1); },
  },
  {
    id: 'bl_big_energy_first',
    name: 'Battle Frenzy',
    desc: 'First card each turn grants +2 energy.',
    rarity: 'Rare',
    oncePerTurn: true,
    on_card_played: (tc) => { tc.state.player.energy += 2; },
  },
];

//const byRarity: Record<Rarity, BlessingDef[]> = {
//  Common: BLESSINGS.filter(b => b.rarity === 'Common'),
//  Uncommon: BLESSINGS.filter(b => b.rarity === 'Uncommon'),
//  Rare: BLESSINGS.filter(b => b.rarity === 'Rare'),
//};
const byRarity: Record<Rarity, BlessingDef[]> = BLESSINGS_BY_RARITY;

function chooseRarity(rng: RNG, weights: Record<Rarity, number>): { rng: RNG; rarity: Rarity } {
  let r = rng;
  const total = weights.Common + weights.Uncommon + weights.Rare;
  const roll = int(r, 1, total); r = roll.rng;
  let v = roll.value;
  if ((v -= weights.Common) <= 0) return { rng: r, rarity: 'Common' };
  if ((v -= weights.Uncommon) <= 0) return { rng: r, rarity: 'Uncommon' };
  return { rng: r, rarity: 'Rare' };
}

export function rollShrine(rng: RNG, s: GameState, count = 3): { rng: RNG; event: EventState } {
  let r = rng;
  // น้ำหนัก 70/25/5 และ no-dup (เทียบกับพรที่มีอยู่)
  const weights: Record<Rarity, number> = { Common: 70, Uncommon: 25, Rare: 5 };
  const owned = new Set((s.blessings ?? []).map(b => b.id));
  const out: BlessingDef[] = [];
  let guard = 0;
  while (out.length < count && guard++ < 50) {
    const rarPick = chooseRarity(r, weights); r = rarPick.rng;
    const pool = byRarity[rarPick.rarity].filter(b => !owned.has(b.id) && !out.find(x => x.id === b.id));
    if (pool.length === 0) continue;
    const p = int(r, 0, pool.length - 1); r = p.rng;
    out.push(pool[p.value]);
  }
  // ถ้าหาได้น้อยกว่า count ก็ให้เท่าที่มี
  return { rng: r, event: { type: 'shrine', options: out } };
}

export function openRemoveEvent(): EventState {
  return { type: 'remove', capPerRun: REMOVE_CAP_PER_RUN };
}

export function applyRemoveCard(s: GameState, pile: keyof GameState['piles'], index: number): boolean {
  if (!s.runCounters) s.runCounters = { removed: 0 };
  if (s.runCounters.removed >= REMOVE_CAP_PER_RUN) return false;
  const arr = s.piles[pile];
  if (!arr || index < 0 || index >= arr.length) return false;
  const [removed] = arr.splice(index, 1);
  s.runCounters.removed += 1;
  s.log.push(`Removed: ${removed.name} (${pile})`);
  return true;
}

export function rollGamble(rng: RNG): { rng: RNG; resolved: { outcome: 'win' | 'lose'; gold?: number; hpLoss?: number } } {
  let r = rng;
  const coin = int(r, 0, 1); r = coin.rng;
  if (coin.value === 1) {
    return { rng: r, resolved: { outcome: 'win', gold: GAMBLE_WIN_GOLD } };
  }
  return { rng: r, resolved: { outcome: 'lose', hpLoss: GAMBLE_LOSE_HP } };
}

export function rollTreasure(rng: RNG): { rng: RNG; amount: number } {
  let r = rng;
  const amt = int(r, TREASURE_MIN, TREASURE_MAX); r = amt.rng;
  return { rng: r, amount: amt.value };
}

// เลือกประเภท event สำหรับโหนดชนิด 'event'
export function pickEventKind(rng: RNG): { rng: RNG; kind: 'shrine' | 'remove' | 'gamble' | 'treasure' } {
  let r = rng;
  // bias ง่าย: shrine 40, remove 30, gamble 20, treasure 10
  const roll = int(r, 1, 100); r = roll.rng;
  const v = roll.value;
  if (v <= 40) return { rng: r, kind: 'shrine' };
  if (v <= 70) return { rng: r, kind: 'remove' };
  if (v <= 90) return { rng: r, kind: 'gamble' };
  return { rng: r, kind: 'treasure' };
}
