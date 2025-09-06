// Rewards — weighted draws for cards (used by shop/rewards)
import type { CardData, Rarity } from './types';
import { int, shuffle, next, type RNG } from './rng';
import { POOL_COMMON, POOL_UNCOMMON, POOL_RARE } from './balance';
//import { BY_RARITY } from './pack';
import cardsJson from '../data/packs/base/cards.json';

type CardJson = CardData & { starter?: number; inRewards?: boolean; inShop?: boolean };
const CARD_LIST: CardJson[] = cardsJson as any;
const META_BY_ID = new Map<string, CardJson>(CARD_LIST.map(c => [c.id, c]));

// ✅ เลือกแบบถ่วงน้ำหนัก (ไม่ใช้ Math.random)
 function pickWeighted<T>(rng: RNG, items: T[], getW: (x: T) => number) {
   let r = rng;
   let sum = 0;
   for (const it of items) sum += Math.max(0, getW(it));
   const step = next(r);          // ✅ ใช้ฟังก์ชัน next(r)
   r = step.rng;
   let roll = step.value * sum;
   for (const it of items) {
     roll -= Math.max(0, getW(it));
     if (roll <= 0) return { rng: r, value: it };
   }
   return { rng: r, value: items[items.length - 1] };
 }

// ✅ น้ำหนักร้าน: base ตาม rarity + โบนัสถ้า inShop=true
function shopWeight(c: CardData) {
  const rarity = (c.rarity ?? 'Common') as Rarity;
  const base = rarity === 'Rare' ? 5 : rarity === 'Uncommon' ? 25 : 70;
  const meta = META_BY_ID.get(c.id);
  const bonus = meta?.inShop ? 25 : 0; // ปรับได้ตามต้องการ
  return base + bonus;
}

const ALL_CARDS: CardData[] = CARD_LIST
  .filter(c => (c.starter ?? 0) === 0)                // ไม่เอา starter
  .filter(c => (c.inRewards ?? true));                // รางวัลต้องอนุญาต

const BY_RARITY: Record<Rarity, CardData[]> = {
  Common:   ALL_CARDS.filter(c => (c.rarity ?? 'Common') === 'Common'),
  Uncommon: ALL_CARDS.filter(c => c.rarity === 'Uncommon'),
  Rare:     ALL_CARDS.filter(c => c.rarity === 'Rare'),
};

type Tier = 'normal' | 'elite' | 'boss';

const BY_RARITY_LOCAL: Record<Rarity, CardData[]> = BY_RARITY;

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
  const pool = BY_RARITY_LOCAL[rarity].filter(c => !taken.has(c.id));
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
  if (tier === 'boss' && !out.some(c => c.rarity === 'Rare') && BY_RARITY_LOCAL.Rare.length > 0) {
    const d = drawUniqueFrom(r, 'Rare', taken); r = d.rng;
    if (d.card) {
      // แทนตัวแรก
      out[0] = d.card;
    }
  }
  return { rng: r, options: out };
}

// ✅ เวอร์ชัน shop (เลือกรับฟรี 1 ใบ): bias inShop + ตัด starter ออก + ไม่ซ้ำในล็อต
export function rollShopStock(rng: RNG, count = 5) {
  let r = rng;
  const taken = new Set<string>();
  const out: CardData[] = [];
  for (let i = 0; i < count; i++) {
    // รวมพูลทุก rarity (หรือจะสุ่ม rarity ก่อนก็ได้ แต่เรา bias ด้วย weight อยู่แล้ว)
    const pool = [
      ...BY_RARITY.Common,
      ...BY_RARITY.Uncommon,
      ...BY_RARITY.Rare,
    ].filter(c => {
      if (taken.has(c.id)) return false;
      const meta = META_BY_ID.get(c.id);
      // ไม่เอา starter เข้าร้าน (หรือเปลี่ยนเป็น allow ได้ตามดีไซน์)
      if ((meta?.starter ?? 0) > 0) return false;
      return true;
    });
    if (!pool.length) break;
    const pick = pickWeighted(r, pool, shopWeight); r = pick.rng;
    const card = JSON.parse(JSON.stringify(pick.value));
    out.push(card);
    taken.add(card.id);
  }
  // กระจายลำดับเล็กน้อย (ยัง deterministic)
  const sh = shuffle(r, out); r = sh.rng;
  return { rng: r, options: sh.array };
}