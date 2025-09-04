// src/core/level.ts
import type { RNG } from './rng';
import { next, int } from './rng';
import type { GameState, CardData, Rarity, BlessingDef } from './types';
import { BY_RARITY, BLESSINGS_BY_RARITY } from './pack';
import { shuffle } from './rng';

type Bucket = 'max_hp'|'max_energy'|'max_hand'|'cards'|'blessing'|'remove'|'upgrade'|'gold';

const BASE_BUCKET_W: Record<Bucket, number> = {
  max_hp: 20, max_energy: 12, max_hand: 12, cards: 24, blessing: 12, remove: 10, upgrade: 8, gold: 2,
};

export function rollLevelUpBucket(rng: RNG, s: GameState): { rng: RNG; bucket: Bucket } {
  let r = rng;
  // soft-pity: ถ้า 3 เลเวลล่าสุดไม่มีทรัพยากร → บูสต์
  // (ในที่นี้ยังไม่เก็บ history จริงใน state จึงคง BASE_BUCKET_W ไปก่อน; ที่หลังค่อยเพิ่ม)
  const items = Object.entries(BASE_BUCKET_W) as [Bucket, number][];
  const step = next(r); r = step.rng;
  let sum = items.reduce((a, [,w]) => a + w, 0);
  let roll = step.value * sum;
  for (const [b, w] of items) {
    roll -= w;
    if (roll <= 0) return { rng: r, bucket: b };
  }
  return { rng: r, bucket: items[items.length - 1][0] };
}

export function rollTwoCards(rng: RNG): { rng: RNG; list: CardData[] } {
  let r = rng;
  // รวมพูลทั้ง 3 rarity แบบง่าย ๆ แล้วสุ่ม 2 ใบไม่ซ้ำ
  const pool = [...BY_RARITY.Common, ...BY_RARITY.Uncommon, ...BY_RARITY.Rare];
  const sh = shuffle(r, pool); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)).map(c => ({ ...c })) };
}

export function rollTwoBlessings(rng: RNG): { rng: RNG; list: BlessingDef[] } {
  let r = rng;
  const pool = [...BLESSINGS_BY_RARITY.Common, ...BLESSINGS_BY_RARITY.Uncommon, ...BLESSINGS_BY_RARITY.Rare];
  const sh = shuffle(r, pool); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)) };
}
