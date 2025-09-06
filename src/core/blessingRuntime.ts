// src/core/blessingRuntime.ts
import type { BlessingDef, BlessingFn, CardData, GameState } from './types';
import { getBlessingBehavior } from './blessing/registry';

export function resetBlessingTurnFlags(s: GameState) {
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} as Record<string, boolean> };
  s.turnFlags.blessingOnce = {};
}

function onceGate(s: GameState, key: string, fn: () => void) {
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} as Record<string, boolean> };
  const bag = s.turnFlags.blessingOnce || (s.turnFlags.blessingOnce = {});
  if (bag[key]) return;
  fn();
  bag[key] = true;
}

// ---------- Turn hooks ----------
export function runBlessingsTurnHook(s: GameState, hook: 'on_turn_start'|'on_turn_end') {
  for (const b of s.blessings ?? []) {
    // 1) inline (ของเดิม)
    const inline = (hook === 'on_turn_start' ? b.on_turn_start : b.on_turn_end) as BlessingFn | undefined;
    if (inline) inline({ state: s } as any);

    // 2) registry
    const reg = getBlessingBehavior(b.id);
    if (reg) {
      const fx = reg[hook];
      if (fx) fx(s);
    }
  }
}

// ---------- Card played ----------
export type BlessingPlayedFn = (tc: { state: GameState }, card: CardData) => void;

export function getCardPlayedFns(def: BlessingDef, card: CardData): BlessingPlayedFn[] {
  const out: BlessingPlayedFn[] = [];

  // 1) inline (รองรับทั้ง function และ config object แบบเดิม)
  if (def.on_card_played) {
    const maybeFn = def.on_card_played as any;

    // แบบ function ตรง ๆ
    if (typeof maybeFn === 'function') {
      if (def.oncePerTurn) {
        const k = `${def.id}:inline`;
        out.push(({ state }) => onceGate(state, k, () => maybeFn({ state })));
      } else {
        out.push(({ state }) => maybeFn({ state }));
      }
    } else if (typeof maybeFn === 'object') {
      // แบบ config เดิม: รองรับฟิลด์กว้าง ๆ: effect/fn, oncePerTurn, tag/hasTag, type
      const effect: BlessingFn | undefined = (maybeFn.effect || maybeFn.fn) as any;
      const once = !!(maybeFn.oncePerTurn ?? def.oncePerTurn);
      const tag = maybeFn.tag ?? maybeFn.hasTag ?? maybeFn.cardTag;
      const type = maybeFn.type as CardData['type'] | undefined;

      // เงื่อนไข
      if (effect) {
        const condOk =
          (!type || card.type === type) &&
          (!tag || (card.tags ?? []).includes(tag));

        if (condOk) {
          if (once) {
            const k = `${def.id}:cfg:${tag ?? ''}:${type ?? ''}`;
            out.push(({ state }) => onceGate(state, k, () => effect({ state })));
          } else {
            out.push(({ state }) => effect({ state }));
          }
        }
      }
    }
  }

  // 2) registry (spec array)
  const reg = getBlessingBehavior(def.id);
  if (reg?.on_card_played?.length) {
    for (const spec of reg.on_card_played) {
      // เงื่อนไข
      if (spec.when?.type && card.type !== spec.when.type) continue;
      if (spec.when?.hasTag && !(card.tags ?? []).includes(spec.when.hasTag)) continue;

      if (spec.oncePerTurnKey) {
        const key = `${def.id}:${spec.oncePerTurnKey}`;
        out.push(({ state }, played) => onceGate(state, key, () => spec.effect(state, played)));
      } else {
        out.push(({ state }, played) => spec.effect(state, played));
      }
    }
  }

  return out;
}
