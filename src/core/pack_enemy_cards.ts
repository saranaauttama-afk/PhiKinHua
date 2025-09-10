// src/core/pack_enemy_cards.ts
export type EnemyCardDef = {
  id: string;
  owner: string;             // "global", "slime", ...
  name?: string;
  type: 'attack' | 'skill';
  energyCost: number;        // ค่าพลังงานที่ใช้
  dmg?: number;              // ความเสียหาย (ถ้าเป็น attack)
  block?: number;            // เกราะ (ถ้าเป็น skill)
  desc?: string;             // คำอธิบายการ์ด
};

// Initialize data
let ALL: EnemyCardDef[] = [];
const BY_ID = new Map<string, EnemyCardDef>();
const BY_OWNER = new Map<string, EnemyCardDef[]>();

// Load enemy cards data lazily
function initializeEnemyCards() {
  if (ALL.length > 0) return; // Already loaded
  
  try {
    // Use same path pattern as cards.json
    const enemyCardsData = require('../data/packs/base/enemy_cards.json');
    ALL = enemyCardsData;
    
    // Build indexes
    BY_ID.clear();
    BY_OWNER.clear();
    
    for (const c of ALL) {
      BY_ID.set(c.id, c);
      const list = BY_OWNER.get(c.owner) ?? [];
      list.push(c);
      BY_OWNER.set(c.owner, list);
    }
  } catch (error) {
    console.error('Failed to load enemy cards:', error);
    // Fallback to basic cards to prevent total failure
    ALL = [
      { id: 'claw', owner: 'global', type: 'attack', energyCost: 1, dmg: 6, name: 'Claw' },
      { id: 'guard', owner: 'global', type: 'skill', energyCost: 1, block: 7, name: 'Guard' }
    ];
    
    for (const c of ALL) {
      BY_ID.set(c.id, c);
      const list = BY_OWNER.get(c.owner) ?? [];
      list.push(c);
      BY_OWNER.set(c.owner, list);
    }
  }
}

// ===== API ที่ฝั่ง engine ใช้ =====
export function enemyCardById(id: string): EnemyCardDef | undefined {
  initializeEnemyCards();
  return BY_ID.get(id);
}

/**
 * คืนพูลของการ์ดตาม owner หลายตัวรวมกัน (เช่น ["global","slime"])
 * พร้อม de-dup ตาม id
 */
export function poolForOwner(owners: string[]): EnemyCardDef[] {
  initializeEnemyCards();
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
  initializeEnemyCards();
  return ALL.slice();
}
