//*** NEW: src/core/shop.ts
import type { CardData, Rarity, ShopItem } from './types';
import type { RNG } from './rng';
import { int, shuffle } from './rng';
import { POOL_COMMON, POOL_UNCOMMON, POOL_RARE, PRICE_COMMON, PRICE_UNCOMMON, PRICE_RARE } from './balance';

const BY_RARITY: Record<Rarity, CardData[]> = {
  Common: POOL_COMMON,
  Uncommon: POOL_UNCOMMON,
  Rare: POOL_RARE,
};

function priceFor(r: Rarity, act = 1): number {
  const base = r === 'Common' ? PRICE_COMMON : r === 'Uncommon' ? PRICE_UNCOMMON : PRICE_RARE;
  // ปรับราคานิดหน่อยตาม act (เผื่อภายหลังมีหลาย act)
  return Math.round(base * (1 + 0.05 * (act - 1)));
}

export function rollShopStock(rng: RNG, count = 6, act = 1): { rng: RNG; items: ShopItem[] } {
  let r = rng;
  const out: ShopItem[] = [];
  const weights = { Common: 60, Uncommon: 30, Rare: 10 } as const;
  const total = weights.Common + weights.Uncommon + weights.Rare;
  const taken = new Set<string>();
  for (let i = 0; i < count; i++) {
    const roll = int(r, 1, total); r = roll.rng;
    let v = roll.value;
    let rar: Rarity = 'Common';
    if ((v -= weights.Common) <= 0) rar = 'Common';
    else if ((v -= weights.Uncommon) <= 0) rar = 'Uncommon';
    else rar = 'Rare';
    const pool = BY_RARITY[rar].filter(c => !taken.has(c.id));
    if (pool.length === 0) continue;
    const pick = int(r, 0, pool.length - 1); r = pick.rng;
    const card = pool[pick.value];
    taken.add(card.id);
    out.push({ card, price: priceFor(card.rarity ?? 'Common', act) });
  }
  const sh = shuffle(r, out); r = sh.rng;
  return { rng: r, items: sh.array };
}
