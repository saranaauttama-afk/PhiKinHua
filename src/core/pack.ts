// src/core/pack.ts
import type { CardData, Rarity, EnemyState, BlessingDef } from './types';
import type { RNG } from './rng';
import { int } from './rng';

// เปลี่ยนแพ็กโดยแก้ค่าเดียว (อนาคต: อ่านจาก config ก็ได้)
export const ACTIVE_PACK = 'base' as const;

// --- JSON imports (ต้องเปิด resolveJsonModule ใน tsconfig)
import cardsJson from '../data/packs/base/cards.json';
import enemiesJson from '../data/packs/base/enemies.json';
import blessingsJson from '../data/packs/base/blessings.json';

type CardJson = CardData & { starter?: number; inRewards?: boolean; inShop?: boolean };
type EnemyJson = EnemyState & { tier: 'normal'|'elite'|'boss' };
type BlessingMeta = { id: string; name: string; rarity: Rarity; desc?: string; oncePerTurn?: boolean };

const CARD_LIST: CardJson[] = cardsJson as any;
const ENEMY_LIST: EnemyJson[] = enemiesJson as any;
const BLESSING_LIST: BlessingMeta[] = blessingsJson as any;

// การ์ดทั้งหมด (ลอกเฉพาะฟิลด์ runtime)
export const ALL_CARDS: CardData[] = CARD_LIST.map(({ starter, inRewards, inShop, ...c }) => c);

// เด็คเริ่มจากค่า "starter" ใน JSON (จำนวนซ้ำ)
export const START_DECK: CardData[] = CARD_LIST.flatMap(c =>
  new Array(c.starter ?? 0).fill(0).map(() => {
    const { starter, inRewards, inShop, ...rest } = c;
    return { ...rest } as CardData;
  })
);

// พูลตาม rarity (ใช้ทำ rewards/shop)
export const BY_RARITY: Record<Rarity, CardData[]> = {
  Common:   ALL_CARDS.filter(c => c.rarity === 'Common'   && (CARD_LIST.find(x => x.id === c.id)?.inRewards ?? true)),
  Uncommon: ALL_CARDS.filter(c => c.rarity === 'Uncommon' && (CARD_LIST.find(x => x.id === c.id)?.inRewards ?? true)),
  Rare:     ALL_CARDS.filter(c => c.rarity === 'Rare'     && (CARD_LIST.find(x => x.id === c.id)?.inRewards ?? true)),
};

// สุ่มศัตรูตาม tier ด้วย RNG (deterministic)
export function pickEnemy(rng: RNG, tier: 'normal'|'elite'|'boss'): { rng: RNG; enemy: EnemyState } {
  let r = rng;
  const pool = ENEMY_LIST.filter(e => e.tier === tier);
  const src = pool.length ? pool : ENEMY_LIST;
  const roll = int(r, 0, src.length - 1); r = roll.rng;
  const chosen = src[roll.value];
  return { rng: r, enemy: JSON.parse(JSON.stringify(chosen)) };
}

// ----- Blessings (metadata จาก JSON + mapping id → behavior ในโค้ด)
export function materializeBlessing(id: string): BlessingDef | undefined {
  const meta = BLESSING_LIST.find(b => b.id === id);
  if (!meta) return undefined;
  switch (id) {
    case 'bl_energy_first':
      return { ...meta, oncePerTurn: true, on_card_played: (tc) => { tc.state.player.energy += 1; } };
    case 'bl_start_block':
      return { ...meta, on_turn_start: (tc) => { tc.state.player.block += 3; } };
    case 'bl_attack_block':
      return { ...meta, on_card_played: { tag: 'attack', once_per_turn: false, effects: [ (tc) => { tc.state.player.block += 2; } ] } };
    case 'bl_end_heal':
      return { ...meta, on_turn_end: (tc) => { tc.state.player.hp = Math.min(tc.state.player.maxHp, tc.state.player.hp + 1); } };
    case 'bl_big_energy_first':
      return { ...meta, oncePerTurn: true, on_card_played: (tc) => { tc.state.player.energy += 2; } };
    default:
      return { ...meta }; // meta only (ไม่มี behavior)
  }
}

export const BLESSING_POOL: BlessingDef[] =
  BLESSING_LIST.map(b => materializeBlessing(b.id)).filter((x): x is BlessingDef => !!x);

export const BLESSINGS_BY_RARITY: Record<Rarity, BlessingDef[]> = {
  Common:   BLESSING_POOL.filter(b => b.rarity === 'Common'),
  Uncommon: BLESSING_POOL.filter(b => b.rarity === 'Uncommon'),
  Rare:     BLESSING_POOL.filter(b => b.rarity === 'Rare'),
};
