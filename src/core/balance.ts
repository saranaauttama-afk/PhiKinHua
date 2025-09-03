import type { CardData, EnemyState, Rarity  } from './types';
import type { RNG } from './rng';
import { int } from './rng';
// โหลดจาก JSON pack (base)
import cardsJson from '../data/packs/base/cards.json';
import enemiesJson from '../data/packs/base/enemies.json';
import thaiCardsJson from '../data/packs/thai_fairytale/cards.json';
import thaiEnemiesJson from '../data/packs/thai_fairytale/enemies.json';
import baseBlessJson from '../data/packs/base/blessings.json';
import baseEventsJson from '../data/packs/base/events.json';
import thaiBlessJson from '../data/packs/thai_fairytale/blessings.json';
import thaiEventsJson from '../data/packs/thai_fairytale/events.json';

export const START_HP = 50;
export const START_ENERGY = 3;
export const HAND_SIZE = 5;
export const START_GOLD = 80; // ✅ ทองเริ่มต้น

// ---------- Cards from JSON ----------
export type PackId = 'base' | 'thai_fairytale';
export let ACTIVE_PACK: PackId = 'thai_fairytale';

const CARDS_BY_PACK: Record<PackId, any[]> = {
  base: cardsJson as any[],
  thai_fairytale: thaiCardsJson as any[],
};
const ENEMIES_BY_PACK: Record<PackId, any[]> = {
  base: enemiesJson as any[],
  thai_fairytale: thaiEnemiesJson as any[],
};
const BLESSINGS_BY_PACK: Record<PackId, any[]> = {
  base: baseBlessJson as any[],
  thai_fairytale: thaiBlessJson as any[],
};
const EVENTS_BY_PACK: Record<PackId, any[]> = {
  base: baseEventsJson as any[],
  thai_fairytale: thaiEventsJson as any[],
};

// ---------- Caches (mutate แทนการสร้างใหม่ เพื่อให้รีเฟรชได้ runtime) ----------
export const ALL_CARDS: CardData[] = [];
export const CARD_BY_ID: Record<string, CardData> = {};
export const POOL_COMMON: CardData[] = [];
export const POOL_UNCOMMON: CardData[] = [];
export const POOL_RARE: CardData[] = [];
export const ENEMY_BY_ID: Record<string, { id: string; name: string; maxHp: number; dmg: number }> = {};
export const ENEMY_IDS: string[] = [];
export const BLESSINGS_JSON: any[] = [];
export const EVENTS_JSON: any[] = [];
export const EVENT_WEIGHTS: Record<string, number> = {};

function _clear<T>(arr: T[]) { arr.length = 0; }
function _clearObj(obj: Record<string, any>) { for (const k of Object.keys(obj)) delete obj[k]; }

export function rebuildPackCaches(pack: PackId) {
  // Cards
  _clear(ALL_CARDS); _clear(POOL_COMMON); _clear(POOL_UNCOMMON); _clear(POOL_RARE); _clearObj(CARD_BY_ID);
  for (const c of CARDS_BY_PACK[pack]) {
    const cd: CardData = {
      id: c.id, name: c.name, type: c.type, cost: c.cost,
      dmg: c.dmg, block: c.block, draw: c.draw, heal: c.heal, energyGain: c.energyGain,
      rarity: (c.rarity ?? 'Common') as Rarity,
    };
    ALL_CARDS.push(cd);
    CARD_BY_ID[cd.id] = cd;
  }
  for (const c of ALL_CARDS) {
    const r = (c.rarity ?? 'Common') as Rarity;
    (r === 'Common' ? POOL_COMMON : r === 'Uncommon' ? POOL_UNCOMMON : POOL_RARE).push(c);
  }
  // Enemies
  _clear(ENEMY_IDS); _clearObj(ENEMY_BY_ID);
  for (const e of ENEMIES_BY_PACK[pack]) {
    ENEMY_BY_ID[e.id] = e;
    ENEMY_IDS.push(e.id);
  }
  // Blessings (เก็บรูป JSON ไว้ก่อน แล้วไปแปลงเป็นฟังก์ชันที่ blessingRuntime)
  _clear(BLESSINGS_JSON);
  for (const b of BLESSINGS_BY_PACK[pack]) BLESSINGS_JSON.push(b);
  // Events (เก็บ config + weight)
  _clear(EVENTS_JSON); _clearObj(EVENT_WEIGHTS);
  for (const ev of EVENTS_BY_PACK[pack]) {
    EVENTS_JSON.push(ev);
    EVENT_WEIGHTS[ev.kind] = (EVENT_WEIGHTS[ev.kind] ?? 0) + (ev.weight ?? 1);
  }  
}

export function setActivePack(pack: PackId) {
  ACTIVE_PACK = pack;
  rebuildPackCaches(pack);
}

// เรียกครั้งแรกเพื่อเติม cache ตาม ACTIVE_PACK
rebuildPackCaches(ACTIVE_PACK);

// เด็คเริ่มต้นอ้างด้วย id (ต้องมีไพ่เหล่านี้ในแพ็กทุกตัว)
export const START_DECK_IDS = ['strike','strike','strike','defend','focus'];
export const START_DECK: CardData[] = START_DECK_IDS.map(id => CARD_BY_ID[id]);

const RAW_CARDS = CARDS_BY_PACK[ACTIVE_PACK];

// ✅ ราคาอ้างอิงร้าน (Act 1)
export const PRICE_COMMON = 35;
export const PRICE_UNCOMMON = 65;
export const PRICE_RARE = 120;
export const SHOP_REROLL_COST = 20;

// ===== Events balance (Act 1 ชั่วคราว)
export const REMOVE_CAP_PER_RUN = 2;  // ลบการ์ดได้ไม่เกิน 2 ครั้ง/หนึ่ง run
export const GAMBLE_WIN_GOLD = 40;
export const GAMBLE_LOSE_HP = 10;
export const TREASURE_MIN = 30;
export const TREASURE_MAX = 80;

// ---------- Enemies API ----------
export function makeEnemy(id: string): EnemyState {
  const e = ENEMY_BY_ID[id];
  if (!e) throw new Error(`enemy not found: ${id}`);
  return { id: e.id, name: e.name, maxHp: e.maxHp, hp: e.maxHp, dmg: e.dmg, block: 0 };
}
export function rollEnemyId(rng: RNG): { id: string; rng: RNG } {
  const pick = int(rng, 0, ENEMY_IDS.length - 1);
  return { id: ENEMY_IDS[pick.value], rng: pick.rng };
}

// ---------- Centralized pool accessor ----------
export function getCardsByRarity(): Record<Rarity, CardData[]> {
  return { Common: POOL_COMMON, Uncommon: POOL_UNCOMMON, Rare: POOL_RARE };
}

// Blessings/Events accessors
export function getBlessingsJson(): any[] { return BLESSINGS_JSON; }
export function getEventWeights(): Record<string, number> { return EVENT_WEIGHTS; }