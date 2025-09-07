// src/core/save.ts
// Pure save/load (forward-only). ไม่ทำ IO ใดๆ — ใช้ใน UI ชั้นนอกค่อยเขียนลง storage.
// แนวคิด: เก็บแต่ข้อมูลที่ "จำเป็น" และ rehydrate จาก data packs ตอนโหลด

import type {
  GameState, PlayerState, RunCounters, BlessingDef, CardData
} from './types';
import { HAND_SIZE, START_ENERGY, START_HP } from './balance/core';
import { nextExpForLevel } from './balance/progression';

// โหลด data packs ตรง ๆ (ปลอดภัยเพราะเป็น JSON ล้วน)
const cardsBase: CardData[] = require('../data/packs/base/cards.json');
const blessBase: BlessingDef[] = require('../data/packs/base/blessings.json');

export const SAVE_VERSION = 1;

export type SaveV1 = {
  version: 1;
  seed: string;
  mapMode: 'pages';                 // เราใช้ pages-first แล้ว
  pages: NonNullable<GameState['pages']>; // เก็บ state ของ pages ทั้งก้อน (มันเป็นข้อมูล primitive)
  player: PlayerState;
  masterDeckIds: string[];          // อ้างอิงการ์ดด้วย id เพื่อ rehydrate
  blessingIds: string[];            // อ้างอิงพรด้วย id เพื่อ rehydrate
  runCounters?: RunCounters;
  gold: number;                     // สะดวกอ่านเร็ว
  // หมายเหตุ: ไม่เก็บ combat/piles/enemy เพื่อความเรียบง่าย (โหลดแล้วกลับเข้าแผนที่/เพจ)
};

// === helpers rehydrate ===
function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const x of arr) m.set(x.id, x);
  return m;
}
const cardsById = byId(cardsBase);
const blessById = byId(blessBase);

function rehydrateCards(ids: string[]): CardData[] {
  const out: CardData[] = [];
  for (const id of ids) {
    const def = cardsById.get(id);
    if (def) out.push({ ...def });
  }
  return out;
}
function rehydrateBlessings(ids: string[]): BlessingDef[] {
  const out: BlessingDef[] = [];
  for (const id of ids) {
    const def = blessById.get(id);
    if (def) out.push({ ...def });
  }
  return out;
}

// === public API ===
export function toSaveV1(s: GameState): SaveV1 {
  const masterDeckIds = (s.masterDeck ?? []).map(c => c.id);
  const blessingIds = (s.blessings ?? []).map(b => b.id);

  // ป้องกัน: ถ้ายังไม่มี pages.current ก็ให้ UI เรียก OpenPage ก่อนเซฟ (แต่เรายังเก็บ pages ไว้ครบ)
  if (s.mapMode !== 'pages' || !s.pages) {
    throw new Error('SaveV1: pages mode required.');
  }

  return {
    version: SAVE_VERSION,
    seed: s.seed ?? '',
    mapMode: 'pages',
    pages: JSON.parse(JSON.stringify(s.pages)),
    player: { ...s.player },
    masterDeckIds,
    blessingIds,
    runCounters: s.runCounters ? { ...s.runCounters } : undefined,
    gold: s.player.gold ?? 0,
  };
}

export function fromSaveV1(data: SaveV1): GameState {
  if (data.version !== 1) {
    throw new Error(`Unsupported save version: ${data.version}`);
  }

  // rehydrate
  const masterDeck = rehydrateCards(data.masterDeckIds);
  const blessings = rehydrateBlessings(data.blessingIds);

  // สร้าง GameState ใหม่แบบสะอาด (กลับเข้าสู่หน้าแผนที่/เพจ)
  const s: GameState = {
    seed: data.seed,
    phase: 'map',
    turn: 0,
    player: {
      hp: data.player.hp ?? START_HP,
      maxHp: data.player.maxHp ?? START_HP,
      block: 0,
      energy: data.player.maxEnergy ?? START_ENERGY,
      gold: data.gold ?? data.player.gold ?? 0,
      level: data.player.level ?? 1,
      exp: data.player.exp ?? 0,
      expToNext: data.player.expToNext ?? nextExpForLevel(data.player.level ?? 1),
      maxEnergy: data.player.maxEnergy ?? START_ENERGY,
      maxHandSize: data.player.maxHandSize ?? HAND_SIZE,
    },
    enemy: undefined,
    piles: { draw: [], hand: [], discard: [], exhaust: [] },
    log: ['Loaded SaveV1.'],
    blessings,
    turnFlags: { blessingOnce: {}, equipmentOnce: {} },
    runCounters: data.runCounters ? { ...data.runCounters } : { removed: 0 },
    combatVictoryLock: false,
    masterDeck,
    deckOpen: false,
    levelUp: null,
    starter: null,
    mapMode: 'pages',
    pages: JSON.parse(JSON.stringify(data.pages)),
    shopKind: undefined,
    shopStock: undefined,
    event: undefined,
  };

  return s;
}
