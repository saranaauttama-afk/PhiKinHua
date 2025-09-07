// Level/XP — weights & rolling for level-up rewards (buckets)
import type { RNG } from './rng';
import { int, shuffle } from './rng';
import type { GameState, CardData, BlessingDef } from './types';
import { BY_RARITY, BLESSINGS_BY_RARITY } from './pack';

export type LevelBucket =
  | 'max_hp' | 'max_energy' | 'max_hand'
  | 'cards' | 'blessing'
  | 'remove' | 'upgrade' | 'gold';

const BASE_BUCKET_W: Record<LevelBucket, number> = {
  max_hp: 20, max_energy: 12, max_hand: 12, cards: 24, blessing: 12, remove: 10, upgrade: 8, gold: 2,
};

function deriveWeights(s: GameState): Record<LevelBucket, number> {
  const w = { ...BASE_BUCKET_W };
  // Soft-pity for max_hand at Lv 3 and 6 (only triggers twice)
  const lv = s.player?.level ?? 1;
  if (lv === 3 || lv === 6) w.max_hand += 20;
  return w;
}

export function rollLevelUpBucket(rng: RNG, s: GameState): { rng: RNG; bucket: LevelBucket } {
  const w = deriveWeights(s);
  const order: LevelBucket[] = ['max_hp','max_energy','max_hand','cards','blessing','remove','upgrade','gold'];
  const total = order.reduce((a,k)=>a + w[k], 0);
  const ro = int(rng, 0, Math.max(0, total - 1));
  let r = ro.rng;
  let roll = ro.value;
  let acc = 0;
  let bucket: LevelBucket = 'gold';
  for (const k of order) {
    acc += w[k];
    if (roll < acc) { bucket = k; break; }
  }
  return { rng: r, bucket };
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
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)).map(b => ({ ...b })) };
}
