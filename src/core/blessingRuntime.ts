import type { CardData, GameState } from './types';
import type { RNG } from './rng';
import { getBlessingsJson } from './balance';

// ---------------- Effect registry (คีย์ JSON -> ฟังก์ชัน) ----------------
type TurnController = { state: GameState; rng: RNG }; // ชนิดที่เราใช้ภายในไฟล์นี้

function gainEnergy(n: number) {
  return (tc: TurnController) => { tc.state.player.energy += n; };
}
function gainBlock(n: number) {
  return (tc: TurnController) => { tc.state.player.block = (tc.state.player.block ?? 0) + n; };
}
function heal(n: number) {
  return (tc: TurnController) => {
    const p = tc.state.player;
    p.hp = Math.min(p.maxHp, p.hp + n);
  };
}
function draw(n: number) {
  // สั่งงานผ่าน flag ง่าย ๆ: ให้ commands/drawUpTo อ่านค่าเพิ่ม (วิธีเบา ๆ ก่อน)
  return (tc: TurnController) => {
    (tc.state as any).turnFlags = (tc.state as any).turnFlags || {};
    (tc.state as any).turnFlags.extraDraw = ((tc.state as any).turnFlags.extraDraw ?? 0) + n;
  };
}

function parseEffectKey(key: string) {
  const m = key.match(/^([a-zA-Z]+)\((\-?\d+)\)$/);
  const name = m?.[1], num = m ? parseInt(m[2], 10) : 0;
  switch (name) {
    case 'gainEnergy': return gainEnergy(num);
    case 'gainBlock':  return gainBlock(num);
    case 'heal':       return heal(num);
    case 'draw':       return draw(num);
    default: return () => {};
  }
}

// ---------------- JSON -> runtime blessing ----------------
export type BlessingJson = {
  id: string; name: string; desc?: string; rarity?: 'Common'|'Uncommon'|'Rare';
  on_card_played?: { effects: string[]; once_per_turn?: boolean; tag?: string };
  on_turn_start?: { effects: string[] };
  on_turn_end?:   { effects: string[] };  
};

export function buildBlessingsFromJson(): {
  onCardPlayed: Array<{ id: string; once: boolean; tag?: string; fns: ((tc: TurnController, card?: CardData)=>void)[] }>;
  onTurnStart: Array<{ id: string; fns: ((tc: TurnController)=>void)[] }>;
  onTurnEnd:   Array<{ id: string; fns: ((tc: TurnController)=>void)[] }>;
} {
  const src = getBlessingsJson() as BlessingJson[];
  const onCardPlayed: Array<{ id: string; once: boolean; tag?: string; fns: ((tc: TurnController, card?: CardData)=>void)[] }> = [];
  const onTurnStart:  Array<{ id: string; fns: ((tc: TurnController)=>void)[] }> = [];
  const onTurnEnd:    Array<{ id: string; fns: ((tc: TurnController)=>void)[] }> = [];
  for (const b of src) {
    if (b.on_card_played) onCardPlayed.push({
      id: b.id, once: !!b.on_card_played.once_per_turn, tag: b.on_card_played.tag,
      fns: (b.on_card_played.effects || []).map(parseEffectKey),
    });
    if (b.on_turn_start) onTurnStart.push({ id: b.id, fns: (b.on_turn_start.effects || []).map(parseEffectKey) });
    if (b.on_turn_end)   onTurnEnd.push({ id: b.id, fns: (b.on_turn_end.effects || []).map(parseEffectKey) });
  }
  return { onCardPlayed, onTurnStart, onTurnEnd };
}

function tagMatch(tag: string|undefined, card?: CardData) {
  if (!tag) return true;
  if (!card) return false;
  if (tag === 'attack') return card.type === 'attack';
  if (tag === 'skill')  return card.type === 'skill';
  const m = tag.match(/^rarity:(\w+)$/);
  if (m) return (card.rarity ?? 'Common') === m[1];
  return false;
}

// เรียกตอน "เล่นไพ่" (จาก commands.ts)
export function runBlessingsOnCardPlayed(state: GameState, rng: RNG, card?: CardData): { state: GameState; rng: RNG } {
  (state as any).blessingRuntime = (state as any).blessingRuntime || {};
  const rt = (state as any).blessingRuntime;
  rt.usedThisTurn = rt.usedThisTurn || {}; // ledger once/turn

  const reg = buildBlessingsFromJson();
  for (const ent of reg.onCardPlayed) {
    const used = !!rt.usedThisTurn[ent.id];
    if (ent.once && used) continue;
    if (!tagMatch(ent.tag, card)) continue;
    const tc: TurnController = { state, rng };
    for (const fn of ent.fns) fn(tc, card);
    state = tc.state; rng = tc.rng;
    if (ent.once) rt.usedThisTurn[ent.id] = true;
  }
  return { state, rng };
}

// helper: ล้าง once-per-turn ตอนจบเทิร์น/ขึ้นเทิร์นใหม่ (ให้ reducer เรียก)
export function resetBlessingOncePerTurn(state: GameState) {
  (state as any).blessingRuntime = (state as any).blessingRuntime || {};
  (state as any).blessingRuntime.usedThisTurn = {};
}

// ---------- (ใหม่) hook แบบเทิร์น ----------
export function runBlessingsTurnHook(state: GameState, rng: RNG, hook: 'start'|'end'): { state: GameState; rng: RNG } {
  const reg = buildBlessingsFromJson();
  const list = hook === 'start' ? reg.onTurnStart : reg.onTurnEnd;
  const tc: TurnController = { state, rng };
  for (const ent of list) { for (const fn of ent.fns) fn(tc); }
  return { state: tc.state, rng: tc.rng };
}

// ---------- reset once-per-turn (ชื่อเดิมที่ reducer เรียก) ----------
export function resetBlessingTurnFlags(state: GameState) {
  (state as any).blessingRuntime = (state as any).blessingRuntime || {};
  (state as any).blessingRuntime.usedThisTurn = {};
  // เผื่อโค้ดเดิมมีเล่มเก่าเก็บบน state.turnFlags.blessingOnce
  (state as any).turnFlags = (state as any).turnFlags || {};
  (state as any).turnFlags.blessingOnce = {};
}