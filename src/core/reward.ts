import type { CardData, Rarity } from './types';
import { int, shuffle, type RNG } from './rng';
import { POOL_COMMON, POOL_UNCOMMON, POOL_RARE } from './balance';

type Tier = 'normal' | 'elite' | 'boss';

const BY_RARITY: Record<Rarity, CardData[]> = {
  Common: POOL_COMMON,
  Uncommon: POOL_UNCOMMON,
  Rare: POOL_RARE,
};

function chooseRarity(rng: RNG, weights: Record<Rarity, number>): { rng: RNG; rarity: Rarity } {
  let r = rng;
  const total = weights.Common + weights.Uncommon + weights.Rare;
  const roll = int(r, 1, total); r = roll.rng;
  let v = roll.value;
  if ((v -= weights.Common) <= 0) return { rng: r, rarity: 'Common' };
  if ((v -= weights.Uncommon) <= 0) return { rng: r, rarity: 'Uncommon' };
  return { rng: r, rarity: 'Rare' };
}

function drawUniqueFrom(rng: RNG, rarity: Rarity, taken: Set<string>): { rng: RNG; card?: CardData } {
  let r = rng;
  const pool = BY_RARITY[rarity].filter(c => !taken.has(c.id));
  if (pool.length === 0) return { rng: r };
  const pick = int(r, 0, pool.length - 1); r = pick.rng;
  const card = pool[pick.value];
  taken.add(card.id);
  return { rng: r, card };
}

export function rollRewardOptionsByTier(rng: RNG, tier: Tier): { rng: RNG; options: CardData[] } {
  let r = rng;
  // จำนวนตัวเลือก
  const counts: Record<Tier, number> = { normal: 3, elite: 4, boss: 5 };
  // น้ำหนัก rarity
  const weightsByTier: Record<Tier, Record<Rarity, number>> = {
    normal:  { Common: 70, Uncommon: 25, Rare: 5 },
    elite:   { Common: 55, Uncommon: 35, Rare: 10 },
    boss:    { Common: 40, Uncommon: 40, Rare: 20 },
  };
  const want = counts[tier];
  const weights = weightsByTier[tier];
  const taken = new Set<string>();
  const out: CardData[] = [];
  for (let i = 0; i < want; i++) {
    const w = chooseRarity(r, weights); r = w.rng;
    const d = drawUniqueFrom(r, w.rarity, taken); r = d.rng;
    if (d.card) out.push(d.card);
  }
  // การันตีอย่างน้อย 1 Rare ใน boss ถ้ายังไม่มีและมี rare ให้เลือก
  if (tier === 'boss' && !out.some(c => c.rarity === 'Rare') && POOL_RARE.length > 0) {
    const d = drawUniqueFrom(r, 'Rare', taken); r = d.rng;
    if (d.card) {
      // แทนตัวแรก
      out[0] = d.card;
    }
  }
  return { rng: r, options: out };
}

// เวอร์ชัน shop (เลือกรับฟรี 1 ใบ): ใช้ bias คล้าย elite แต่จำนวน 5
export function rollShopStock(rng: RNG, count = 5): { rng: RNG; options: CardData[] } {
  let r = rng;
  const taken = new Set<string>();
  const out: CardData[] = [];
  for (let i = 0; i < count; i++) {
    const w = chooseRarity(r, { Common: 60, Uncommon: 30, Rare: 10 }); r = w.rng;
    const d = drawUniqueFrom(r, w.rarity, taken); r = d.rng;
    if (d.card) out.push(d.card);
  }
  // สับเล็กน้อยเพื่อความกระจาย
  const sh = shuffle(r, out); r = sh.rng;
  return { rng: r, options: sh.array };
}