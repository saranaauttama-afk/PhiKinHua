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

export function rollThreeCards(rng: RNG, playerLevel = 1) {
  let r = rng;
  
  // ปรับน้ำหนักตาม level
  let commonWeight = 100;
  let uncommonWeight = 0;
  let rareWeight = 0;
  let legendaryWeight = 0;
  
  if (playerLevel >= 1 && playerLevel <= 3) {
    // Level 1-3: Common only
    commonWeight = 100;
  } else if (playerLevel >= 4 && playerLevel <= 6) {
    // Level 4-6: 70% Common, 30% Uncommon
    commonWeight = 70;
    uncommonWeight = 30;
  } else {
    // Level 7+: 50% Common, 40% Uncommon, 10% Rare, 0.5% Legendary
    commonWeight = 50;
    uncommonWeight = 40;
    rareWeight = 10;
    legendaryWeight = 0.5;
  }
  
  const cards: CardData[] = [];
  
  for (let i = 0; i < 3; i++) {
    const roll = Math.random() * 100;
    let selectedPool: CardData[] = BY_RARITY.Common;
    
    if (roll < legendaryWeight && BY_RARITY.Legendary.length > 0) {
      selectedPool = BY_RARITY.Legendary;
    } else if (roll < legendaryWeight + rareWeight && BY_RARITY.Rare.length > 0) {
      selectedPool = BY_RARITY.Rare;
    } else if (roll < legendaryWeight + rareWeight + uncommonWeight && BY_RARITY.Uncommon.length > 0) {
      selectedPool = BY_RARITY.Uncommon;
    }
    
    if (selectedPool.length > 0) {
      const cardRoll = int(r, 0, selectedPool.length - 1);
      r = cardRoll.rng;
      cards.push({ ...selectedPool[cardRoll.value] });
    }
  }
  
  return { rng: r, list: cards };
}

export function rollTwoBlessings(rng: RNG) {
  let r = rng;
  const pool: BlessingDef[] = [...BLESSINGS_BY_RARITY.Common, ...BLESSINGS_BY_RARITY.Uncommon, ...BLESSINGS_BY_RARITY.Rare, ...BLESSINGS_BY_RARITY.Legendary];
  const sh = shuffle(r, pool); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)).map(b => ({ ...b })) };
}
