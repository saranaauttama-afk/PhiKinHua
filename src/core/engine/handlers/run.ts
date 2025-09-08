// src/core/engine/handlers/run.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { baseNewState } from '../../commands';
import { rollTwoBlessings } from '../../level';
import { START_ENERGY } from '../../balance/core';
import { initPageMap, rollPageOffers } from '../../map/pages';

// export function newRun(
//   s: GameState,
//   cmd: Extract<Command, { type: 'NewRun' }>,
//   r: RNG
// ) {
//   // สร้าง state ใหม่ตามปกติ
//   s = baseNewState(cmd.seed);
//   s.blessings = s.blessings ?? [];
//   s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
//   // นับรอบร้านลบ/อัปเกรดไว้ที่นี่ตั้งแต่ต้น run
//   s.runCounters = { removed: 0, removeShopCount: 0, upgradeShopCount: 0 };

//   // เด็คตั้งต้น → masterDeck
//   const { START_DECK } = require('../../balance/core');
//   s.masterDeck = JSON.parse(JSON.stringify(START_DECK));

//   // ✅ Equipment defaults
//   s.equipmentSlotsMax = s.equipmentSlotsMax ?? 1;
//   s.equipped = s.equipped ?? [];
//   s.backpack = s.backpack ?? [];

//   // ✅ ใช้ PAGES MODE เสมอ (ตัดระบบ Map เดิมทิ้ง)
//   s.mapMode = 'pages';
//   //s.map = undefined; // กันหลงเหลือค่าเก่า
//   const init = initPageMap(r); r = init.rng;
//   s.pages = init.map;

//   // Starter blessing (เลือกก่อนเข้าเพจแรก)
//   s.levelUp = null;
//   const bb = rollTwoBlessings(r); r = bb.rng;
//   s.starter = { choices: bb.list, consumed: false };
//   s.phase = 'starter';
//   return { state: s, rng: r };
// }
export function newRun(
  s: GameState,
  cmd: Extract<Command, { type: 'NewRun' }>,
  r: RNG
) {
  s = baseNewState(cmd.seed);
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
  s.runCounters = { removed: 0, removeShopCount: 0, upgradeShopCount: 0 };
  s.turnFlags.equipmentOnce = {};

  const { START_DECK } = require('../../balance/core');
  s.masterDeck = JSON.parse(JSON.stringify(START_DECK));

  // ✅ Equipment defaults (ปรับเป็น 1 ช่องสำหรับการทดสอบ)
  s.equipmentSlotsMax = 1;              // <— เปลี่ยนจาก 2 เป็น 1 (test)
  s.equipped = s.equipped ?? [];
  s.backpack = s.backpack ?? [];

  // ✅ แจกอุปกรณ์ทดสอบ 1 ชิ้น ถ้ายังว่าง
  if (s.equipped.length === 0) {
    s.equipped.push({
      id: 'battle_rhythm_band',
      name: 'Battle Rhythm Band',
      slotCost: 1,
    } as any);
    s.log?.push?.('[dev] Granted test equipment: Battle Rhythm Band (slot 1/1).');
  }

  // ✅ ใช้ PAGES MODE เสมอ
  s.mapMode = 'pages';
  const init = initPageMap(r); r = init.rng;
  s.pages = init.map;

  // Starter blessing
  s.levelUp = null;
  const bb = rollTwoBlessings(r); r = bb.rng;
  s.starter = { choices: bb.list, consumed: false };
  s.phase = 'starter';
  return { state: s, rng: r };
}

export function chooseStarter(
  s: GameState,
  cmd: Extract<Command, { type: 'ChooseStarterBlessing' }>,
  r: RNG
) {
  if (s.phase !== 'starter' || !s.starter || s.starter.consumed) {
    return { state: s, rng: r };
  }
  const b = s.starter.choices[cmd.index];
  if (b) {
    s.blessings.push(b);
    s.log.push(`Starter blessing: ${b.name ?? b.id}`);
  }
  s.starter = null;

  // ให้แน่ใจว่ามี pages แล้ว
  if (!s.pages) {
    const init = initPageMap(r); r = init.rng;
    s.pages = init.map;
  }

  // ✅ Roll ข้อเสนอหน้าแรกทันที (3 ช่อง) แล้วไป phase 'map' เพื่อแสดง Pages UI
  const ro = rollPageOffers(s.pages, r, s); r = ro.rng;
  s.pages.current = { offers: ro.offers, resolved: ro.offers.map(() => false) };
  s.pages._activeOfferIndex = undefined;
  s.pages._shopUsed = false;

  s.phase = 'map'; // UI ของคุณใช้ phase 'map' เพื่อโชว์ pages อยู่แล้ว
  s.enemy = undefined;
  s.player.block = 0;
  s.player.energy = s.player.maxEnergy ?? START_ENERGY;
  return { state: s, rng: r };
}
