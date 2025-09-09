// src/core/engine/handlers/enemy.ts
import type { GameState } from '../../types';
import type { RNG } from '../../rng';
import { int } from '../../rng';
import { enemyCardById } from '../../pack_enemy_cards';
import {
  ENEMY_DECK_SIZE, ENEMY_HAND_SIZE,
  ENEMY_MAX_ENERGY_NORMAL, ENEMY_MAX_ENERGY_ELITE, ENEMY_MAX_ENERGY_BOSS
} from '../../balance/core';
import { runEquipmentTurnHook, runEquipmentCardPlayed, resetEquipmentTurnFlags } from '../../equipmentRuntime';
// PATCH: import equipment hooks for enemy start/end & on_card_played

type DeckConfig =
  | { lists: Array<{ id: string; weight: number; cards: string[] }>; handSize?: number; maxEnergy?: number }
  | { pool: { allowOwners: string[]; include?: Array<{ id: string; w: number }>; minAttack?: number; minBlock?: number }, handSize?: number; maxEnergy?: number };

// ====== utils ======
function shuffleIds(ids: string[], r: RNG) {
  const a = ids.slice();
  let rr = r;
  for (let i = a.length - 1; i > 0; i--) {
    const ro = int(rr, 0, i);
    rr = ro.rng;
    const j = ro.value;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return { arr: a, rng: rr };
}

function defaultCycleForTier(tier: 'normal'|'elite'|'boss'): string[] {
  if (tier === 'elite') return ['swipe','swipe','brace','guard'];
  if (tier === 'boss')  return ['maul','brace','maul','guard','swipe'];
  return ['claw','guard','claw','claw'];
}

function tierFromEnemy(s: GameState): 'normal'|'elite'|'boss' {
  const id = s.enemy?.id ?? '';
  if (/boss/i.test(id)) return 'boss';
  if (/elite/i.test(id)) return 'elite';
  return 'normal';
}

function maxEnergyForTier(t: 'normal'|'elite'|'boss') {
  if (t === 'elite') return ENEMY_MAX_ENERGY_ELITE;
  if (t === 'boss')  return ENEMY_MAX_ENERGY_BOSS;
  return ENEMY_MAX_ENERGY_NORMAL;
}

// ====== build at combat start ======
export function buildAndShuffleEnemyDeck(s: GameState, r: RNG) {
  if (!s.enemy) return { state: s, rng: r };
  const t = tierFromEnemy(s);

  // ✅ 1) ถ้ามี deck config → ใช้เลย
  const deckCfg = ((s.enemy as any).deck) || ((s.enemy as any).ai?.deck);
  let ids: string[] | null = null;
  let handSizeCfg: number | undefined;
  let maxEnergyCfg: number | undefined;

  if (deckCfg) {
    const out = buildDeckFromConfig(s.enemy.id, deckCfg, r);
    r = out.rng;
    ids = out.ids;
    handSizeCfg = out.handSize;
    maxEnergyCfg = out.maxEnergy;
  }

  // ✅ 2) ถ้าไม่มี deck config → fallback เป็น cycle (กรณีตัวเก่ายังไม่ย้าย)
  if (!ids) {
    const cycle: string[] =
      ((s as any).enemyAi?.cycle?.length ? (s as any).enemyAi.cycle.slice()
       : (s.enemy as any)?.ai?.cycle?.length ? (s.enemy as any).ai.cycle.slice()
       : defaultCycleForTier(t));

    ids = [];
    for (let i = 0; ids.length < ENEMY_DECK_SIZE; i++) {
      ids.push(cycle[i % cycle.length]);
    }
  }

  // สุ่มลำดับเด็คหนึ่งครั้งให้ deterministic
  const sh = shuffleIds(ids, r);
  (s as any).enemyPiles = { draw: sh.arr, hand: [], discard: [] };
  (s as any).enemyEnergy = 0;

  // ใช้ค่าจาก deck config ถ้ามี ไม่งั้น default ตาม tier
  (s as any).enemyHandSize = handSizeCfg ?? (s as any).enemyHandSize ?? ENEMY_HAND_SIZE;
  (s as any).enemyMaxEnergy = maxEnergyCfg ?? (s as any).enemyMaxEnergy ?? maxEnergyForTier(t);

  // preview intent
  (s as any).enemyIntentCardId = (s as any).enemyPiles.draw[0];

  return { state: s, rng: sh.rng };
}

// (เก็บเผื่ออนาคต: สร้างเด็คจาก config แบบ lists เท่านั้น ณ ตอนนี้)
function buildDeckFromConfig(_enemyId: string, cfg: DeckConfig, r: RNG): { ids: string[]; rng: RNG; handSize?: number; maxEnergy?: number } {
  let rr = r;
  if ('lists' in cfg && cfg.lists?.length) {
    const total = cfg.lists.reduce((a,c)=>a+(c.weight||0),0) || 1;
    const ro = int(rr, 0, total-1); rr = ro.rng;
    let acc=0, pick = cfg.lists[0];
    for (const opt of cfg.lists) { acc += (opt.weight||0); if (ro.value < acc) { pick = opt; break; } }
    const ids = pick.cards.slice(0, ENEMY_DECK_SIZE);
    return { ids, rng: rr, handSize: cfg.handSize, maxEnergy: cfg.maxEnergy };
  }
  // fallback: วน cycle เริ่มต้น (กันเด็คว่าง)
  const ids: string[] = defaultCycleForTier('normal').slice(0, ENEMY_DECK_SIZE);
  return { ids, rng: rr, handSize: cfg.handSize, maxEnergy: cfg.maxEnergy };
}

function orderHandIndexes(s: GameState, mode?: string): number[] {
  const hand: string[] = ((s as any).enemyPiles?.hand ?? []);
  const scored = hand.map((id, i) => {
    const c = enemyCardById(id);
    const cost = c?.energyCost ?? 1;
    const score =
      mode === 'atk_first' ? ((c?.dmg ?? 0) * 10 - cost)
    : mode === 'block_below_30hp' && s.enemy && s.enemy.hp <= (s.enemy.maxHp*0.3) ? ((c?.block ?? 0) * 10 - cost)
    : /* cheap_first */ (-(cost*10) + (c?.dmg ?? 0) + (c?.block ?? 0));
    return { i, score };
  });
  scored.sort((a,b)=>b.score - a.score);
  return scored.map(x=>x.i);
}

// ====== per-turn loop ======
function enemyDrawOne(s: GameState) {
  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] } | undefined;
  if (!piles) return false;
  if (piles.draw.length === 0) {
    if (piles.discard.length > 0) {
      // เอา discard กลับ draw แบบ reverse เพื่อยืดอายุเด็ค
      piles.draw = piles.discard.reverse();
      piles.discard = [];
    }
  }
  const id = piles.draw.shift();
  if (!id) return false;
  piles.hand.push(id);
  return true;
}

function enemyDrawUpToHand(s: GameState) {
  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] } | undefined;
  if (!piles) return;
  const want = Math.max(0, ((s as any).enemyHandSize ?? ENEMY_HAND_SIZE));
  while (piles.hand.length < want) {
    const ok = enemyDrawOne(s);
    if (!ok) break;
  }
}

function enemyPlayCardId(s: GameState, idx: number): boolean {
  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] } | undefined;
  if (!s.enemy || !piles) return false;
  if (idx < 0 || idx >= piles.hand.length) return false;

  const id = piles.hand[idx];
  const def = enemyCardById(id);
  if (!def) {
   // \1  // PATCH: notify equipment that ENEMY played a card
  try { runEquipmentCardPlayed(s, { id }, 'enemy'); } catch (e) { /* ignore */ }
s.log.push(`Enemy discards unknown card ${id}.`);
    return true;
  }

  const cost = typeof def.energyCost === 'number' ? def.energyCost : 1;
  if (((s as any).enemyEnergy ?? 0) < cost) return false; // เล่นไม่ได้

  // หักค่า energy
  (s as any).enemyEnergy = ((s as any).enemyEnergy ?? 0) - cost;

  // เล่นเอฟเฟ็กต์
  if (def.type === 'attack' && (def.dmg ?? 0) > 0) {
    const atk = Math.max(0, def.dmg!);
    const blockAfter = Math.max(0, s.player.block - atk);
    const hpLoss = Math.max(0, atk - s.player.block);
    s.player.block = blockAfter;
    s.player.hp = Math.max(0, s.player.hp - hpLoss);
    s.log.push(`Enemy plays ${def.name ?? def.id}: Attack ${atk} (${hpLoss} dmg).`);
  } else if (def.type === 'skill' && (def.block ?? 0) > 0) {
    s.enemy.block = (s.enemy.block ?? 0) + (def.block ?? 0);
    s.log.push(`Enemy plays ${def.name ?? def.id}: Block +${def.block}.`);
  } else {
    s.log.push(`Enemy plays ${def.name ?? def.id}.`);
  }

  // ย้ายการ์ดไป discard
  const [cardId] = piles.hand.splice(idx, 1);
  piles.discard.push(cardId);
  return true;
}

function enemyDiscardHand(s: GameState) {
  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] } | undefined;
  if (!piles) return;
  if (piles.hand.length > 0) {
    piles.discard.push(...piles.hand.splice(0, piles.hand.length));
  }
}

export function runEnemyTurn(s: GameState) {
  if (!s.enemy || !(s as any).enemyPiles) return;

  // Import behavior system
  const { processEnemyTurnBehaviors } = require('../../enemyBehaviorRuntime');
  const { processStatusEffectsOnTurnStart } = require('../../statusEffectsRuntime');

  // PATCH: equipment once-per-turn reset and start-turn hook for ENEMY
  resetEquipmentTurnFlags(s);
  runEquipmentTurnHook(s, 'on_turn_start', 'enemy');

  // Process status effects at start of enemy turn
  processStatusEffectsOnTurnStart('enemy', s);

  // Process enemy behaviors and spells
  processEnemyTurnBehaviors(s);

  // Import environment and minion systems
  const { applyEnvironmentEnergyModifier } = require('../../environmentRuntime');
  const { processEnemyTurnMinions } = require('../../minionRuntime');

  // เริ่มเทิร์นศัตรู with environment modifications
  s.enemy.block = 0;
  const baseEnemyEnergy = (s as any).enemyMaxEnergy ?? ENEMY_MAX_ENERGY_NORMAL;
  (s as any).enemyEnergy = applyEnvironmentEnergyModifier(s, baseEnemyEnergy, 'enemy');

  // จั่วถึงขนาดมือ
  enemyDrawUpToHand(s);

  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] };
  const startHand = piles?.hand?.length ?? 0;
  const maxPlays = startHand; // จำกัดจำนวนเล่นไม่เกินขนาดมือเริ่มเทิร์น
  let plays = 0;

  // Log เริ่มเทิร์น
  s.log.push(`Enemy turn: hand=${startHand}, energy=${(s as any).enemyEnergy}`);

  // เล่นการ์ดจากซ้ายไปขวา เท่าที่พลังงานพอ / ไม่เกินขนาดมือเริ่มต้น
  while (true) {
    let playedThisScan = false;
    for (let i = 0; i < ((s as any).enemyPiles?.hand.length ?? 0); i++) {
      if (plays >= maxPlays) break;
      if (enemyPlayCardId(s, i)) {
        plays++;
        playedThisScan = true;
        break;
      }
    }
    if (plays >= maxPlays) break;
    if (!playedThisScan) break;
  }

   // จบท้าย: ทิ้งการ์ดที่เหลือในมือ
  const endHandBeforeDiscard = (s as any).enemyPiles?.hand?.length ?? 0;
  enemyDiscardHand(s);
  s.log.push(`Enemy end turn: played ${plays}/${startHand}, leftover=${endHandBeforeDiscard - plays}`);

  // Process enemy minions actions
  processEnemyTurnMinions(s);

  // Process status effects at end of enemy turn
  const { processStatusEffectsOnTurnEnd } = require('../../statusEffectsRuntime');
  processStatusEffectsOnTurnEnd('enemy', s);

  // Process minion end turn effects
  const { processMinionsEndTurn } = require('../../minionRuntime');
  processMinionsEndTurn(s);

  // PATCH: equipment end-turn hook for ENEMY
  runEquipmentTurnHook(s, 'on_turn_end', 'enemy');

  // ตั้ง intent preview สำหรับเทิร์นถัดไป = ไพ่บนสุดของ draw (ถ้ามี)
  (s as any).enemyIntentCardId = (s as any).enemyPiles.draw[0];
}
