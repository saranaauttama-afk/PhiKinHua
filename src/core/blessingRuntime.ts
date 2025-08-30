//*** NEW: src/core/blessingRuntime.ts
import type { BlessingCardHookConfig, BlessingDef, BlessingFn, CardData, GameState, TurnCtx } from './types';

// รีเซ็ตธง once-per-turn ตอนเริ่มเทิร์นผู้เล่น
export function resetBlessingTurnFlags(s: GameState) {
  s.turnFlags.blessingOnce = {};
}

// ห่อฟังก์ชันให้ทำงานได้แค่ครั้งเดียวต่อเทิร์นต่อ blessingId
function wrapOncePerTurn(id: string, fn: BlessingFn): BlessingFn {
  return (tc, card, target) => {
    const already = tc.state.turnFlags.blessingOnce[id];
    if (already) return;
    tc.state.turnFlags.blessingOnce[id] = true;
    fn(tc, card, target);
  };
}

// ดึง on_card_played ทั้งหมดเป็นอาร์เรย์ + เคารพ tag และ once-per-turn
export function getCardPlayedFns(def: BlessingDef, card: CardData): BlessingFn[] {
  const hook = def.on_card_played;
  if (!hook) return [];

  const needsWrap = (cfgOnce?: boolean) => cfgOnce || def.oncePerTurn;

  if (typeof hook === 'function') {
    const fn = hook as BlessingFn;
    return [needsWrap() ? wrapOncePerTurn(def.id, fn) : fn];
  }
  // เป็น config: { tag?, once_per_turn?, effects[] }
  const cfg = hook as BlessingCardHookConfig;
  if (cfg.tag && !(card.tags ?? []).includes(cfg.tag)) return [];
  const fns = cfg.effects ?? [];
  if (needsWrap(cfg.once_per_turn)) {
    return fns.map((f, i) => wrapOncePerTurn(`${def.id}#${cfg.tag ?? 'any'}#${i}`, f));
  }
  return fns;
}

// ยูทิลสั่งรัน on_turn_start/on_turn_end ทุกพร
export function runBlessingsTurnHook(s: GameState, which: 'on_turn_start' | 'on_turn_end') {
  const tc: TurnCtx = { state: s };
  for (const b of s.blessings) {
    const fn = b[which];
    if (fn) fn(tc);
  }
}
