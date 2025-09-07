// src/core/pack_enemy_cards.ts
export type EnemyCardDef = {
  id: string;
  owner: string;             // "global", "slime", ...
  name?: string;
  type: 'attack' | 'skill';
  energyCost: number;        // ค่าพลังงานที่ใช้
  dmg?: number;              // ความเสียหาย (ถ้าเป็น attack)
  block?: number;            // เกราะ (ถ้าเป็น skill)
  // อนาคต: tags/rarity/effects ฯลฯ
};

// ===== Global pool (ใช้ได้กับศัตรูหลายตัว) =====
const GLOBAL_CARDS: EnemyCardDef[] = [
  // โจมตีเบสิก (ถูก เล่นได้หลายใบเมื่อพลังงานพอ)
  { id: 'claw',  owner: 'global', type: 'attack', energyCost: 1, dmg: 6,  name: 'Claw' },
  { id: 'swipe', owner: 'global', type: 'attack', energyCost: 1, dmg: 8,  name: 'Swipe' },

  // โจมตีหนัก (แพง แต่แรง)
  { id: 'maul',  owner: 'global', type: 'attack', energyCost: 2, dmg: 13, name: 'Maul' },

  // ป้องกัน/เสริมเกราะ
  { id: 'guard', owner: 'global', type: 'skill',  energyCost: 1, block: 7,  name: 'Guard' },
  { id: 'brace', owner: 'global', type: 'skill',  energyCost: 2, block: 12, name: 'Brace' },
];

// ===== Slime-specific =====
const SLIME_CARDS: EnemyCardDef[] = [
  { id: 'slime_poke',  owner: 'slime', type: 'attack', energyCost: 1, dmg: 6, name: 'Poke' },
  { id: 'slime_guard', owner: 'slime', type: 'skill',  energyCost: 1, block: 5, name: 'Sticky Guard' },
];

// ===== รวมทั้งหมด =====
const ALL: EnemyCardDef[] = [
  ...GLOBAL_CARDS,
  ...SLIME_CARDS,
];

// ===== Indexes =====
const BY_ID = new Map<string, EnemyCardDef>();
const BY_OWNER = new Map<string, EnemyCardDef[]>();

for (const c of ALL) {
  BY_ID.set(c.id, c);
  const list = BY_OWNER.get(c.owner) ?? [];
  list.push(c);
  BY_OWNER.set(c.owner, list);
}

// ===== API ที่ฝั่ง engine ใช้ =====
export function enemyCardById(id: string): EnemyCardDef | undefined {
  return BY_ID.get(id);
}

/**
 * คืนพูลของการ์ดตาม owner หลายตัวรวมกัน (เช่น ["global","slime"])
 * พร้อม de-dup ตาม id
 */
export function poolForOwner(owners: string[]): EnemyCardDef[] {
  const seen = new Set<string>();
  const out: EnemyCardDef[] = [];
  for (const o of owners) {
    const list = BY_OWNER.get(o) ?? [];
    for (const c of list) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
  }
  return out;
}

// เผื่ออยากตรวจสอบหรือดีบัก
export function allEnemyCards(): EnemyCardDef[] {
  return ALL.slice();
}
