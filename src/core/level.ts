// src/core/level.ts
import type { RNG } from './rng';
import { next, int } from './rng';
import type { GameState, CardData, Rarity, BlessingDef } from './types';
import { BY_RARITY, BLESSINGS_BY_RARITY } from './pack';
import { shuffle } from './rng';

export type LevelBucket =
  | 'max_hp' | 'max_energy' | 'max_hand'
  | 'cards' | 'blessing'
  | 'remove' | 'upgrade' | 'gold';

const BASE_BUCKET_W: Record<LevelBucket, number> = {
  max_hp: 20, max_energy: 12, max_hand: 12, cards: 24, blessing: 12, remove: 10, upgrade: 8, gold: 2,
};

export function rollLevelUpBucket(rng: RNG, _s: GameState) {
  let r = rng;
  const items = Object.entries(BASE_BUCKET_W) as [LevelBucket, number][];
  const step = next(r); r = step.rng;
  const total = items.reduce((a, [,w]) => a + w, 0);
  let roll = step.value * total;
  for (const [b, w] of items) { roll -= w; if (roll <= 0) return { rng: r, bucket: b }; }
  return { rng: r, bucket: 'max_hp' };
}

export function rollTwoCards(rng: RNG) {
  let r = rng;
  const pool: CardData[] = [...BY_RARITY.Common, ...BY_RARITY.Uncommon, ...BY_RARITY.Rare];
  const sh = shuffle(r, pool); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)).map(c => ({ ...c })) };
}

export function rollTwoBlessings(rng: RNG) {
  let r = rng;
  const pool: BlessingDef[] = [...BLESSINGS_BY_RARITY.Common, ...BLESSINGS_BY_RARITY.Uncommon, ...BLESSINGS_BY_RARITY.Rare];
  const sh = shuffle(r, pool); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)) };
}
