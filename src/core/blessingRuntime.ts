//*** UPDATED: src/core/blessingRuntime.ts
import type {
  BlessingCardHookConfig, BlessingDef, BlessingFn, CardData, GameState, TurnCtx
} from './types';

// ================= Behavior Registry =================
// ใส่เฉพาะ "ฟังก์ชัน" ที่นิยามไม่ได้ใน JSON เช่น regen_1: จบเทิร์นฮีล 1
const BLESSING_BEHAVIOR: Record<string, Partial<BlessingDef>> = {
  regen_1: {
    on_turn_end: (tc) => {
      const s = tc.state;
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1);
      s.log.push('Blessing: Regeneration I heals 1.');
    },
  },
  // เพิ่ม behavior ใหม่ ๆ ได้ตามต้องการ
};

// รวม def จาก JSON เข้ากับ behavior ที่ผูกตาม id (behavior > json)
function mergeBlessing(def: BlessingDef): BlessingDef {
  const extra = BLESSING_BEHAVIOR[def.id];
  return extra ? { ...def, ...extra } : def;
}

// ================= Flags: once-per-turn =================
export function resetBlessingTurnFlags(s: GameState) {
  s.turnFlags.blessingOnce = {};
}

function wrapOncePerTurn(id: string, fn: BlessingFn): BlessingFn {
  return (tc, card, target) => {
    const already = tc.state.turnFlags.blessingOnce[id];
    if (already) return;
    tc.state.turnFlags.blessingOnce[id] = true;
    fn(tc, card, target);
  };
}

// ================= Hooks: on_card_played =================
export function getCardPlayedFns(defRaw: BlessingDef, card: CardData): BlessingFn[] {
  const def = mergeBlessing(defRaw);
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

// ================= Hooks: turn start / turn end =================
export function runBlessingsTurnHook(s: GameState, which: 'on_turn_start' | 'on_turn_end') {
  const tc = { state: s } as TurnCtx; // เผื่อ TurnCtx มี field อื่นในอนาคต
  for (const b0 of s.blessings) {
    const b = mergeBlessing(b0);
    const fn = b[which] as BlessingFn | undefined;
    if (fn) fn(tc);
  }
}
