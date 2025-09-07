// src/core/shop.ts
import type { CardData, Rarity, ShopItem } from './types';
import type { RNG } from './rng';
import { int, shuffle } from './rng';

// โหลดพูลการ์ดจากแพ็ค base (ให้ Metro bundle ได้)
const cardsBase: CardData[] = require('../data/packs/base/cards.json');

// จัดกลุ่มตาม Rarity จาก cards.json (อนุญาตเฉพาะใบที่ขายได้)
function buildPools() {
  const by: Record<Rarity, CardData[]> = {
    Common: [],
    Uncommon: [],
    Rare: [],
  };
  const pool = (Array.isArray(cardsBase) ? cardsBase : []).filter(
    (c: any) => c && (c.inShop === true || typeof c.cost === 'number')
  );
  for (const c of pool) {
    const rar: Rarity = (c.rarity as Rarity) ?? 'Common';
    by[rar].push(c);
  }
  return by;
}

// ประเมินราคาแบบง่าย + สเกลตาม act (คง deterministic)
function priceForCard(c: CardData, act = 1): number {
  let price =
    10 +
    (c.cost ?? 0) * 20 +
    (c.dmg ?? 0) * 2 +
    (c.block ?? 0) * 2 +
    (c.draw ?? 0) * 10 +
    (c.energyGain ?? 0) * 25;

  if (c.rarity === 'Uncommon') price += 20;
  if (c.rarity === 'Rare') price += 50;

  // ปรับขึ้นเล็กน้อยตาม act
  price = Math.round(price * (1 + 0.05 * (act - 1)));
  return Math.max(10, price);
}

// สุ่มสต็อกร้านแบบ no-replacement ด้วยน้ำหนักตาม Rarity
export function rollShopStock(
  rng: RNG,
  count = 6,
  act = 1
): { rng: RNG; items: ShopItem[] } {
  let r = rng;
  const out: ShopItem[] = [];
  const taken = new Set<string>();

  // น้ำหนักเลือก Rarity
  const weights: Record<Rarity, number> = { Common: 60, Uncommon: 30, Rare: 10 };
  const total = weights.Common + weights.Uncommon + weights.Rare;

  // พูลตาม rarity (อัปเดตครั้งเดียวตอนเรียก)
  const BY_RARITY = buildPools();

  // helper: หยิบการ์ดใบหนึ่งจากพูลตาม rarity ถ้ายังเหลือ
  const pickFromRarity = (rar: Rarity): CardData | undefined => {
    const pool = BY_RARITY[rar].filter((c) => !taken.has(c.id));
    if (pool.length === 0) return undefined;
    const pick = int(r, 0, pool.length - 1);
    r = pick.rng;
    return pool[pick.value];
  };

  for (let i = 0; i < count; i++) {
    // เลือก rarity ตามน้ำหนัก
    const roll = int(r, 1, total); r = roll.rng;
    let v = roll.value;
    let rar: Rarity = 'Common';
    if ((v -= weights.Common) <= 0) rar = 'Common';
    else if ((v -= weights.Uncommon) <= 0) rar = 'Uncommon';
    else rar = 'Rare';

    // พยายามหยิบจาก rarity ที่สุ่มได้ก่อน
    let card = pickFromRarity(rar);

    // ถ้าหมวดนั้นหมด ลอง fallback ไปหมวดอื่นที่ยังเหลือ
    if (!card) {
      card = pickFromRarity('Uncommon') ?? pickFromRarity('Common') ?? pickFromRarity('Rare');
    }
    if (!card) break; // การ์ดหมดจริง ๆ

    taken.add(card.id);
    out.push({ card, price: priceForCard(card, act) });
  }

  // สุ่มเรียงรายการออก (deterministic ผ่าน RNG)
  const sh = shuffle(r, out);
  r = sh.rng;

  return { rng: r, items: sh.array };
}
