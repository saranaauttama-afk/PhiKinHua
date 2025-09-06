// Reducer — applyCommand(state, cmd, rng) → { state, rng }
// - Deterministic/pure: no Math.random; RNG is threaded
// - Phases: menu → starter → map → combat → victory/defeat → (CompleteNode)
import type { CardData, Command, GameState } from './types';
import { applyCardEffect, baseNewState, buildAndShuffleDeck, drawUpTo, endEnemyTurn, isDefeat, isVictory, startPlayerTurn } from './commands';
import type { RNG } from './rng';
import { rollRewardOptionsByTier } from './reward';
import { rollShopStock } from './shop';
import { availableNodes, completeAndAdvance, generateMap, findNode } from './map';
import { getCardPlayedFns, resetBlessingTurnFlags, runBlessingsTurnHook } from './blessingRuntime';
import { resetEquipmentTurnFlags, runEquipmentOnEquip, runEquipmentTurnHook, runEquipmentCardPlayed } from './equipmentRuntime';
import { openRemoveEvent, pickEventKind, rollGamble, rollShrine, rollTreasure, applyRemoveCard } from './events';
import { START_ENERGY, EXP_KILL_NORMAL, EXP_KILL_ELITE, EXP_KILL_BOSS, nextExpForLevel } from './balance';
import { rollLevelUpBucket, rollTwoCards, rollTwoBlessings, LevelBucket } from './level';
import { getEquipmentById, pickEnemy } from './pack';

// ช่วยให้รองรับได้ทั้ง currentNodeId และ currentId (โค้ดเก่าบางสาขาใช้คนละชื่อ)
function getCurrentNodeId(map?: any): string | undefined {
  if (!map) return undefined;
  return map.currentNodeId ?? map.currentId;
}

function cloneForReducer(prev: GameState): GameState {
  // โคลนข้อมูลด้วย JSON แต่ “คง” ฟังก์ชันใน blessings และ shrine options
  const s: GameState = JSON.parse(JSON.stringify(prev));

  // blessings: shallow copy → ฟังก์ชันข้างในยังอยู่
  s.blessings = (prev.blessings ?? []).slice();

  // shrine options: คง reference ของ options (มีฟังก์ชัน on_card_played)
  if (prev.event?.type === 'shrine' && s.event?.type === 'shrine') {
    s.event.options = prev.event.options;
  }
  return s;
}

function upgradeCard(c: CardData): CardData {
  const up = { ...c, name: (c.name ?? c.id) + ' +' };
  if (typeof up.dmg === 'number') up.dmg += 3;
  if (typeof up.block === 'number') up.block += 3;
  // ถ้าการ์ดไม่มี dmg/block แต่มี draw/energy ก็คงเดิม (ค่อยดีไซน์รายใบทีหลัง)
  return up;
}

function grantExpAndQueueLevelUp(s: GameState, r: RNG): RNG {
  // ใส่ EXP ตามชนิดโหนดปัจจุบัน
  let gained = EXP_KILL_NORMAL;
  if (s.map?.currentNodeId) {
    const n = findNode(s.map, s.map.currentNodeId);
    if (n?.kind === 'elite') gained = EXP_KILL_ELITE;
    if (n?.kind === 'boss') gained = EXP_KILL_BOSS;
  }
  s.player.exp += gained;

  // ตรวจเลเวลอัป แล้ว "คิว" ชุดรางวัลไว้ใน s.levelUp (อย่าย้าย phase ที่นี่)
  while (s.player.exp >= s.player.expToNext) {
    s.player.exp -= s.player.expToNext;
    s.player.level += 1;
    s.player.expToNext = nextExpForLevel(s.player.level);
    if (!s.levelUp) {
      const rolled = rollLevelUpBucket(r, s); r = rolled.rng;
      const bucket = rolled.bucket as LevelBucket;
      let cardChoices, blessingChoices;
      if (bucket === 'cards') { const rr = rollTwoCards(r); r = rr.rng; cardChoices = rr.list; }
      if (bucket === 'blessing') { const bb = rollTwoBlessings(r); r = bb.rng; blessingChoices = bb.list; }
      s.levelUp = { bucket, cardChoices, blessingChoices, consumed: false };
    } else {
      s.log.push('LevelUp queued (multiple levels).');
    }
  }
  return r;
}

export function applyCommand(state: GameState, cmd: Command, rng: RNG): { state: GameState; rng: RNG } {
  // Always work on a copy to keep call-site expectations pure
  let s: GameState = cloneForReducer(state);
  let r = rng;
  // ✅ กัน state รูปร่างไม่ครบ (เช่นมาจาก save เก่า/entry ทางลัด)
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {}, equipmentOnce: {} };
  s.equipmentSlotsMax = s.equipmentSlotsMax ?? 2;
  s.equipped = s.equipped ?? [];
  s.backpack = s.backpack ?? [];

  switch (cmd.type) {
    case 'NewRun': {
      s = baseNewState(cmd.seed);
      s.combatVictoryLock = false; // ✅ รันใหม่ต้องเริ่มจากปลดล็อกเสมอ
      // init blessing storage
      s.blessings = s.blessings ?? [];
      s.turnFlags = { blessingOnce: {}, equipmentOnce: {} };
      s.runCounters = { removed: 0 };
      s.equipmentSlotsMax = 2;
      s.equipped = [];
      s.backpack = [];
      // ✅ ก๊อปเด็คตั้งต้นเข้า masterDeck
      const { START_DECK } = require('./balance');
      s.masterDeck = JSON.parse(JSON.stringify(START_DECK));
      // สร้างแผนที่สำหรับ Act (deterministic ด้วย RNG)
      const g = generateMap(r);
      r = g.rng;
      s.map = g.map;
      // gen map เสร็จ → เปิด LevelUp แบบ blessing 2 ตัวตั้งต้น
      s.levelUp = null;
      const bb = rollTwoBlessings(r); r = bb.rng;
      s.starter = { choices: bb.list, consumed: false };
      s.phase = 'starter';
      return { state: s, rng: r };
    }
    case 'ChooseStarterBlessing': {
      if (s.phase !== 'starter' || !s.starter || s.starter.consumed) return { state: s, rng: r };
      const b = s.starter.choices[cmd.index];
      if (b) {
        s.blessings.push(b);
        s.log.push(`Starter blessing: ${b.name ?? b.id}`);
      }
      s.starter = null;
      s.phase = 'map';
      s.enemy = undefined;
      s.player.block = 0;
      s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      return { state: s, rng: r };
    }
    case 'StartCombat': {
      // ถ้าเริ่มคอมแบตไปแล้ว (มือ/กองจั่วมีการ์ด หรือ turn ตั้งแล้ว) ให้ข้าม
      if ((s.piles?.hand?.length ?? 0) > 0 || (s.piles?.draw?.length ?? 0) > 0 || (s.turn ?? 0) > 0) {
        return { state: s, rng: r };
      }
      s.combatVictoryLock = false; // ✅ ปลดล็อกก่อนเริ่มไฟต์ใหม่
      s.phase = 'combat';
      s.turn = 1;
      {
        const res = pickEnemy(r, 'normal'); r = res.rng;
        s.enemy = res.enemy;
      }
      resetBlessingTurnFlags(s);
      resetEquipmentTurnFlags(s);
      // อุปกรณ์บางชิ้นยิงผลเมื่อ "ติดตั้ง" ตอนเริ่มไฟต์
      runEquipmentOnEquip(s);
      r = (runBlessingsTurnHook(s, 'on_turn_start'), r);
      runEquipmentTurnHook(s, 'on_turn_start');
      s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
      ({ state: s, rng: r } = drawUpTo(s, r));
      s.log.push(`Combat started vs ${s.enemy?.name ?? 'Enemy'}`);
      return { state: s, rng: r };
    }
    case 'PlayCard': {
      if (s.phase !== 'combat' || s.combatVictoryLock) return { state: s, rng: r }; // ✅ กัน re-entrancy หลังชนะ
      const idx = cmd.index;
      if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
      const played = s.piles.hand[idx];

      // --- Energy paywall (แบบเบาสุด: basic=0, special=1+) ---
      const base = (typeof (played as any).cost === 'number') ? (played as any).cost : 0;
      const cost = Math.max(0, Math.floor(base));
      if (cost > 0) {
        const cur = s.player.energy ?? 0;
        if (cur < cost) {
          s.log.push(`Not enough energy (need ${cost}).`);
          return { state: s, rng: r };
        }
        s.player.energy = cur - cost;
      }
      // --- end energy check ---

      
      // Apply effect & move card to discard
      applyCardEffect(s, idx);

      // ✅ Blessings: on_card_played ผ่านตัวกลาง (safe-guard)
      try {
        for (const b of (s.blessings ?? [])) {
          const fns = getCardPlayedFns(b, played);
          const tc = { state: s };
          for (const f of fns) f(tc, played);
        }
        {
          const card = played; // ← อ้างอิงไพ่ที่เพิ่งเล่น (เปลี่ยนเป็นตัวแปรจริงในโค้ดคุณ)
          if (card) {
            for (const b of s.blessings) {
              const fns = getCardPlayedFns(b, card);
              for (const fx of fns) fx({ state: s } as any, card); // deterministic, ไม่มี rng
            }
          }
        }
        // === Equipment on_card_played ===
        runEquipmentCardPlayed(s, played);
      } catch (e: any) {
        s.log.push(`Blessing error: ${e?.message ?? String(e)}`);
      }
      // move to discard
      const [c] = s.piles.hand.splice(idx, 1);
      s.piles.discard.push(c);
      s.log.push(`Played ${played.name}`);
      // On-play draw (for cards that set draw)
      // On-play draw (คำนวณเป้าหมายครั้งเดียว → drawUpTo ครั้งเดียว)
      if (played.draw && played.draw > 0) {
        const target = s.piles.hand.length + played.draw; // หลังเอาใบที่เล่นออกจากมือแล้ว
        ({ state: s, rng: r } = drawUpTo(s, r, target));
      }
      if (isVictory(s)) {
        r = grantExpAndQueueLevelUp(s, r);
        s.combatVictoryLock = true;
        s.phase = 'victory';
        s.log.push('Victory!');
      }
      return { state: s, rng: r };
    }
    case 'EnterNode': {
      if (s.phase !== 'map' || !s.map) return { state: s, rng: r };
      // ตรวจว่า node ที่เลือกอยู่ในคอลัมน์ปัจจุบัน
      const avail = availableNodes(s.map);
      const nodeId = (cmd as any).id ?? (cmd as any).nodeId;
      const ok = avail.find(n => n.id === nodeId);
      if (!ok) return { state: s, rng: r };
      s.map.currentNodeId = nodeId;
      // เริ่มคอมแบต (ตอนนี้มีแต่ monster/boss ตัวอย่างเดียว)
      // แตกตามชนิดโหนด
      if (ok.kind === 'shop') {
        const stock = rollShopStock(r, 6, 1); r = stock.rng;
        s.shopStock = stock.items;
        s.phase = 'shop';
        s.log.push(`Enter node ${nodeId} -> Shop`);
      } else if (ok.kind === 'bonfire') {
        s.event = { type: 'bonfire', healed: false };
        s.phase = 'event';
        s.log.push(`Enter node ${nodeId} -> Bonfire`);
      } else if (ok.kind === 'event') {
        // pick event kind
        const pk = pickEventKind(r); r = pk.rng;
        if (pk.kind === 'shrine') {
          const sh = rollShrine(r, s, 3); r = sh.rng;
          s.event = sh.event;
          s.phase = 'event';
          s.log.push(`Enter node ${nodeId} -> Shrine`);
        } else if (pk.kind === 'remove') {
          s.event = openRemoveEvent();
          s.phase = 'event';
          s.log.push(`Enter node ${nodeId} -> Remove`);
        } else if (pk.kind === 'gamble') {
          s.event = { type: 'gamble' };
          s.phase = 'event';
          s.log.push(`Enter node ${nodeId} -> Gamble`);
        } else {
          s.event = { type: 'treasure' };
          s.phase = 'event';
          s.log.push(`Enter node ${nodeId} -> Treasure`);
        }
      }
      else {
        // combat: monster/elite/boss
        s.combatVictoryLock = false; // ✅ ปลดล็อกเมื่อเข้าไฟต์ใหม่ผ่าน EnterNode
        s.phase = 'combat';
        s.turn = 1;
        {
          // map.kind → tier
          let tier: 'normal' | 'elite' | 'boss' = 'normal';
          if (ok.kind === 'elite') tier = 'elite';
          if (ok.kind === 'boss') tier = 'boss';
          const res = pickEnemy(r, tier); r = res.rng;
          s.enemy = res.enemy;
        }
        s.player.energy = START_ENERGY;
        ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
        ({ state: s, rng: r } = drawUpTo(s, r));
        resetBlessingTurnFlags(s);
        resetEquipmentTurnFlags(s);
        // ติดตั้ง/ยิงผลอุปกรณ์ทันทีเมื่อเข้าสู่คอมแบตใหม่
        runEquipmentOnEquip(s);
        runBlessingsTurnHook(s, 'on_turn_start');
        runEquipmentTurnHook(s, 'on_turn_start'); // ✅ อุปกรณ์ต้นเทิร์น       
        s.log.push(`Enter node ${nodeId} -> Combat vs ${s.enemy?.name ?? 'Enemy'}`);
      }
      return { state: s, rng: r };
    }
    case 'EndTurn': {
      if (s.phase !== 'combat') return { state: s, rng: r };
      endEnemyTurn(s);
      if (isDefeat(s)) {
        s.phase = 'defeat';
        s.log.push('Defeat...');
        return { state: s, rng: r };
      }
      // Next player turn
      r = (runBlessingsTurnHook(s, 'on_turn_end'), r);
      runEquipmentTurnHook(s, 'on_turn_end');
      s.turn = 1;
      ({ state: s, rng: r } = startPlayerTurn(s, r));
      resetBlessingTurnFlags(s);
      resetEquipmentTurnFlags(s);
      runBlessingsTurnHook(s, 'on_turn_start'); // เทิร์นใหม่   
      runEquipmentTurnHook(s, 'on_turn_start'); 
      return { state: s, rng: r };
    }
    case 'TakeReward': {
      if (s.phase !== 'reward' || !s.rewardOptions) return { state: s, rng: r };
      const idx = cmd.index;
      const chosen = s.rewardOptions[idx];
      if (!chosen) return { state: s, rng: r };
      // ใส่การ์ดที่เลือกเข้ากองทิ้ง (จะเข้ามือรอบถัดไปตามปกติ)
      // ✅ เพิ่มเข้า masterDeck (ถาวร)
      s.masterDeck.push(JSON.parse(JSON.stringify(chosen)));
      s.log.push(`Took reward: ${chosen.name}`);
      // ปิดตัวเลือก (ให้กด CompleteNode เพื่อปิด modal)
      s.rewardOptions = undefined;
      return { state: s, rng: r };
    }
    case 'TakeShop': {
      if (s.phase !== 'shop' || !s.shopStock) return { state: s, rng: r };
      const i = cmd.index;
      const item = s.shopStock[i];
      if (!item) return { state: s, rng: r };
      if (s.player.gold < item.price) {
        s.log.push('Shop: Not enough gold');
        return { state: s, rng: r };
      }
      s.player.gold -= item.price;

      // ✅ เพิ่มเข้า masterDeck เสมอ (พร้อมใช้ในคอมแบตถัดไป)
      s.masterDeck.push(JSON.parse(JSON.stringify(item.card)));
      s.shopStock.splice(i, 1);
      s.log.push(`Shop: bought ${item.card.name} for ${item.price}g`);
      return { state: s, rng: r };
    }
    case 'OpenDeck': {
      s.deckOpen = true;
      s.log.push('Deck: open');
      return { state: s, rng: r };
    }
    case 'CloseDeck': {
      s.deckOpen = false;
      s.log.push('Deck: close');
      return { state: s, rng: r };
    }
    case 'ShopReroll': {
      if (s.phase !== 'shop') return { state: s, rng: r };
      const { SHOP_REROLL_COST } = require('./balance');
      if (s.player.gold < SHOP_REROLL_COST) {
        s.log.push('Shop: Not enough gold to reroll');
        return { state: s, rng: r };
      }
      s.player.gold -= SHOP_REROLL_COST;
      const stock = rollShopStock(r, 6, 1); r = stock.rng;
      s.shopStock = stock.items;
      s.log.push(`Shop: rerolled (-${SHOP_REROLL_COST}g)`);
      return { state: s, rng: r };
    }
    case 'DoBonfireHeal': {
      if (s.phase !== 'event' || !s.event || s.event.type !== 'bonfire') return { state: s, rng: r };
      if (!s.event.healed) {
        s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
        s.event.healed = true;
        s.log.push('Bonfire: healed +10');
      }
      return { state: s, rng: r };
    }
    case 'EventChooseBlessing': {
      if (s.phase !== 'event' || !s.event || s.event.type !== 'shrine') return { state: s, rng: r };
      const idx = cmd.index;
      const pick = s.event.options[idx];
      if (!pick) return { state: s, rng: r };
      // no-dup: กันซ้ำอีกชั้น
      if (!s.blessings.find(b => b.id === pick.id)) {
        s.blessings.push(pick);
        s.event.chosenId = pick.id;
        s.log.push(`Shrine: took ${pick.name}`);
      } else {
        s.log.push('Shrine: already owned');
      }
      return { state: s, rng: r };
    }
    case 'EventRemoveCard': {
      if (s.phase !== 'event' || !s.event || s.event.type !== 'remove') return { state: s, rng: r };
      const ok = applyRemoveCard(s, cmd.pile, cmd.index);
      if (!ok) s.log.push('Remove: failed or cap reached');
      return { state: s, rng: r };
    }
    case 'EventGambleRoll': {
      if (s.phase !== 'event' || !s.event || s.event.type !== 'gamble') return { state: s, rng: r };
      if (!s.event.resolved) {
        const g = rollGamble(r); r = g.rng;
        s.event.resolved = g.resolved;
        if (g.resolved.outcome === 'win') {
          s.player.gold += g.resolved.gold ?? 0;
          s.log.push(`Gamble: WIN +${g.resolved.gold}g`);
        } else {
          s.player.hp = Math.max(0, s.player.hp - (g.resolved.hpLoss ?? 0));
          s.log.push(`Gamble: LOSE -${g.resolved.hpLoss} HP`);
          if (s.player.hp === 0) { s.phase = 'defeat'; }
        }
      }
      return { state: s, rng: r };
    }
    case 'EventTreasureOpen': {
      if (s.phase !== 'event' || !s.event || s.event.type !== 'treasure') return { state: s, rng: r };
      if (s.event.amount == null) {
        const t = rollTreasure(r); r = t.rng;
        s.event.amount = t.amount;
        s.player.gold += t.amount;
        s.log.push(`Treasure: +${t.amount}g`);
      }
      return { state: s, rng: r };
    }
    case 'CompleteNode': {
      // // ปิด modal/event ทั้งหมด แล้ว “กลับเมนู” ชั่วคราว (ก่อนมี map)
      // // ปิด modal แล้วกลับแผนที่ + เลื่อนไปคอลัมน์ถัดไป
      // // ปิด modal หลังคอมแบต และตัดสินว่าจะ "ชัยชนะจบ Act" หรือ "กลับแผนที่"
      //  // (1) จาก victory → เปิด Rewards (เหมือนเดิม)
      //  // (2) จาก Rewards → กลับ map และ reveal (เหมือนเดิม)
      // // (3) ถ้ามี LevelUp ที่เตรียมไว้ → เปิด phase 'levelup'
      // if ((s.phase === 'reward' || s.phase === 'event' || s.phase === 'shop') && s.levelUp && !s.levelUp.consumed) {
      //   s.phase = 'levelup';
      //   return { state: s, rng: r };
      // }
      // if (s.phase === 'levelup') {
      //   // ปิด modal levelup
      //   s.levelUp = null;
      //   s.phase = 'map';
      //   return { state: s, rng: r };
      // }      
      // s.rewardOptions = undefined;
      // s.enemy = undefined;
      // s.shopStock = undefined;
      // s.event = undefined;
      // s.combatVictoryLock = false; // ✅ พร้อมคอมแบตใหม่       
      // if (s.map) {
      //   const node = findNode(s.map, s.map.currentNodeId);
      //   // ตีความ: ถ้าเป็น boss => จบวิ่ง (victory)
      //   if (node?.kind === 'boss') {
      //     s.map = completeAndAdvance(s.map, s.map.currentNodeId);
      //     s.phase = 'victory';
      //     s.turn = 0;
      //     s.log.push('Act cleared! 🎉');
      //     return { state: s, rng: r };
      //   }
      //   // ไม่ใช่บอส => กลับแผนที่ เลื่อนไปคอลัมน์ถัดไป
      //   s.map = completeAndAdvance(s.map, s.map.currentNodeId);
      //   s.log.push(`Node ${s.map.currentNodeId ?? ''} completed. Depth=${s.map.depth}/${s.map.totalCols}`);
      // }
      // s.phase = 'map';
      // s.turn = 0;
      // ✅ จาก starter → ปิด modal แล้ว "ไปหน้าแผนที่" ทันที (ไม่ advance node)
      // if (s.phase === 'starter') {
      //   s.starter = null;
      //   s.phase = 'map';
      //   s.enemy = undefined;
      //   s.player.block = 0;
      //   s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      //   return { state: s, rng: r };
      // }

      if (s.phase === 'victory') {
        if (s.levelUp && !s.levelUp.consumed) {
          s.phase = 'levelup';
          return { state: s, rng: r };
        }
        // กลับแผนที่และขยับ node (เฉพาะเมื่อ "มี" node ปัจจุบันจริง)
        const curId = getCurrentNodeId(s.map);
        if (s.map && curId) s.map = completeAndAdvance(s.map, curId);
        s.phase = 'map';
        s.combatVictoryLock = false; // ✅ ปลดล็อกเมื่อออกจากไฟต์
        s.enemy = undefined;
        s.player.block = 0;
        s.player.energy = s.player.maxEnergy ?? START_ENERGY;
        return { state: s, rng: r };
      }

      // จาก levelup → ปิด modal แล้วกลับ map
      // จาก levelup → ปิด modal แล้วกลับ map
      if (s.phase === 'levelup') {
        s.levelUp = null;
        // กรณี NewRun (ยังไม่มี node ปัจจุบัน) ไม่ต้อง advance ใด ๆ
        const curId = getCurrentNodeId(s.map);
        if (s.map && curId) s.map = completeAndAdvance(s.map, curId);
        s.phase = 'map';
        s.combatVictoryLock = false; // ✅ กันไว้ให้ครบทางออก
        s.enemy = undefined;
        s.player.block = 0;
        s.player.energy = s.player.maxEnergy ?? START_ENERGY;
        return { state: s, rng: r };
      }



      if ((s.phase === 'event' || s.phase === 'shop') && s.map) {
        const curId = getCurrentNodeId(s.map);
        if (curId) s.map = completeAndAdvance(s.map, curId);
        s.phase = 'map';
        s.combatVictoryLock = false; // ✅ เช่นกัน
        s.enemy = undefined;
        s.player.block = 0;
        s.player.energy = START_ENERGY;
        return { state: s, rng: r };
      }
      return { state: s, rng: r };
    }
    case 'ChooseLevelUp': {
      if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
      const b = s.levelUp.bucket;
      const idx = cmd.index ?? 0;
      switch (b) {
        case 'max_hp':
          s.player.maxHp += 5; s.player.hp = Math.min(s.player.hp + 5, s.player.maxHp);
          break;
        case 'max_energy':
          s.player.maxEnergy += 1;
          break;
        case 'max_hand':
          s.player.maxHandSize += 1;
          break;
        case 'cards': {
          const c = s.levelUp.cardChoices?.[idx]; if (!c) break;
          s.masterDeck.push(JSON.parse(JSON.stringify(c)));
          // ถ้าอยากให้เข้ากองทิ้งคอมแบตปัจจุบันด้วย เพิ่มได้ภายหลัง
          break;
        }
        case 'blessing': {
          const bsel = s.levelUp.blessingChoices?.[idx]; if (!bsel) break;
          s.blessings.push(bsel);
          break;
        }
        case 'remove': {
          // index ของ masterDeck
          const i = idx;
          if (i >= 0 && i < s.masterDeck.length) {
            s.masterDeck.splice(i, 1);
            s.runCounters = s.runCounters || { removed: 0 };
            s.runCounters.removed += 1;
          }
          break;
        }
        case 'upgrade': {
          const i = idx;
          if (i >= 0 && i < s.masterDeck.length) {
            s.masterDeck[i] = upgradeCard(s.masterDeck[i]); // helper ข้างล่าง
          }
          break;
        }
        case 'gold':
        default:
          s.player.gold += 25;
          break;
      }
      s.levelUp.consumed = true; // รอ CompleteNode ปิด
      return { state: s, rng: r };
    }
    case 'SkipLevelUp': {
      if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
      s.player.gold += 25;
      s.levelUp.consumed = true;
      return { state: s, rng: r };
    }
    // ===== QA Commands (debug only) =====
    case 'QA_KillEnemy': {
      if (s.phase !== 'combat' || !s.enemy) return { state: s, rng: r };
      s.enemy.hp = 0;
      s.log.push('QA: kill enemy');
      // รีไช้ logic เดิมแบบไม่เรียกซ้อน
      if (isVictory(s)) {
        // s.combatVictoryLock = true;
        // s.phase = 'reward';
        // let tier: 'normal' | 'elite' | 'boss' = 'normal';
        // if (s.map) {
        //   const node = findNode(s.map, s.map.currentNodeId);
        //   if (node?.kind === 'elite') tier = 'elite';
        //   if (node?.kind === 'boss') tier = 'boss';
        // }
        // const rolled = rollRewardOptionsByTier(r, tier);
        // r = rolled.rng;
        // s.rewardOptions = rolled.options;
        // s.log.push(`Victory! Choose a card (${tier}).`);
        r = grantExpAndQueueLevelUp(s, r);
        s.combatVictoryLock = true;
        s.phase = 'victory';
        s.log.push('Victory!');
      }
      return { state: s, rng: r };
    }
    case 'QA_Draw': {
      if (s.phase !== 'combat') return { state: s, rng: r };
      // draw N แบบง่าย
      for (let i = 0; i < (cmd.count ?? 1); i++) {
        ({ state: s, rng: r } = drawUpTo(s, r, s.piles.hand.length + 1));
      }
      s.log.push(`QA: draw ${cmd.count}`);
      return { state: s, rng: r };
    }
    case 'QA_SetEnergy': {
      if (s.phase !== 'combat') return { state: s, rng: r };
      s.player.energy = cmd.value;
      s.log.push(`QA: set energy ${cmd.value}`);
      return { state: s, rng: r };
    }
    case 'QA_AddBlessingDemo': {
      // เติมพรตัวอย่าง: "First Play +1 Energy" (ทำงานครั้งเดียวต่อเทิร์น)
      const demo = {
        id: 'bl_energy_first',
        name: 'Battle Rhythm',
        desc: 'First card each turn grants +1 energy.',
        oncePerTurn: true,
        on_card_played: (tc: any) => { tc.state.player.energy += 1; },
      };
      // อย่าเพิ่มซ้ำ
      if (!s.blessings.find(b => b.id === demo.id)) s.blessings.push(demo);
      s.log.push('QA: added blessing "Battle Rhythm"');
      return { state: s, rng: r };
    }
    case 'QA_OpenShopHere': {
      // เปิดร้าน ณ จุดนี้ (สำหรับเทส UI/shop flow)
      const stock = rollShopStock(r, 6, 1); r = stock.rng;
      s.shopStock = stock.items;
      s.phase = 'shop';
      s.log.push('QA: opened Shop here');
      return { state: s, rng: r };
    }
    case 'QA_OpenShrine': {
      const sh = rollShrine(r, s, 3); r = sh.rng;
      s.event = sh.event;
      s.phase = 'event';
      s.log.push('QA: opened Shrine');
      return { state: s, rng: r };
    }
    case 'QA_OpenRemove': {
      s.event = openRemoveEvent();
      s.phase = 'event';
      s.log.push('QA: opened Remove');
      return { state: s, rng: r };
    }
    case 'QA_OpenGamble': {
      s.event = { type: 'gamble' };
      s.phase = 'event';
      s.log.push('QA: opened Gamble');
      return { state: s, rng: r };
    }
    case 'QA_OpenTreasure': {
      s.event = { type: 'treasure' };
      s.phase = 'event';
      s.log.push('QA: opened Treasure');
      return { state: s, rng: r };
    }
    // ===== QA: ใส่อุปกรณ์ตัวอย่างเพื่อเทส flow เร็ว ๆ =====
    case 'QA_AddEquipmentDemo': {
      // ติดตั้งสองชิ้น: เริ่มไฟต์ Block +5 และใบแรก +1 energy
      s.equipmentSlotsMax = 2;
      const a = getEquipmentById('start_shield');
      const b = getEquipmentById('battle_rhythm_band');
      s.equipped = s.equipped ?? [];
      if (a && !s.equipped.find(x => x.id === a.id)) s.equipped.push(a);
      if (b && !s.equipped.find(x => x.id === b.id)) s.equipped.push(b);
      s.log.push('QA: Equipped [Start Shield, Battle Rhythm].');
      return { state: s, rng: r };
    }    
    default:
      return { state: s, rng: r };
  }
}
