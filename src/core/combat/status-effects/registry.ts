// src/core/combat/status-effects/registry.ts — คลังข้อมูลสถานะผลทั้งหมด

import type { StatusEffectType, StatusEffectDefinition } from './types';

/**
 * คลังข้อมูลสถานะผลทั้งหมดในเกม
 * จัดกลุ่มตามประเภทและผลกระทบ
 */
export const STATUS_EFFECTS_REGISTRY: Record<StatusEffectType, StatusEffectDefinition> = {
  
  // ===== 🔴 สถานะผลลบ (Debuffs) =====
  
  fear: {
    id: 'fear',
    name: 'ความกลัว',
    description: 'ลดพลังงาน 1 และทิ้งไพ่สุ่ม 1 ใบ',
    defaultDuration: 2,
    stackable: true,
    maxStacks: 3,
    tags: ['debuff', 'mental'],
    onTurnStart: (target, stacks) => {
      // ระบบจะประมวลผลใน statusEffectsRuntime
      console.log(`${target} ได้รับผลจากความกลัว (${stacks} ชั้น)`);
    }
  },

  poison: {
    id: 'poison',
    name: 'พิษ',
    description: 'ได้รับความเสียหายต่อเนื่องท้ายเทิร์น',
    defaultDuration: 3,
    stackable: true,
    maxStacks: 10,
    tags: ['debuff', 'damage_over_time'],
    onTurnEnd: (target, stacks) => {
      console.log(`${target} ได้รับความเสียหายจากพิษ ${stacks} หน่วย`);
    }
  },

  curse: {
    id: 'curse',
    name: 'คำสาป',
    description: 'รับความเสียหายเพิ่ม +1 ต่อชั้นจากทุกแหล่ง',
    defaultDuration: 5,
    stackable: true,
    maxStacks: 5,
    tags: ['debuff', 'vulnerability'],
    onApply: (target, stacks) => {
      console.log(`${target} ถูกสาปด้วยคำสาป (${stacks} ชั้น)`);
    }
  },

  corruption: {
    id: 'corruption',
    name: 'ความเสื่อม',
    description: 'ไพ่ในมือใช้พลังงานเพิ่ม +1',
    defaultDuration: 3,
    stackable: false,
    tags: ['debuff', 'energy_manipulation'],
    onApply: (target) => {
      console.log(`${target} ถูกความเสื่อมทำลาย - ไพ่ใช้พลังงานเพิ่ม`);
    }
  },

  entangle: {
    id: 'entangle',
    name: 'พันธนาการ',
    description: 'ไม่สามารถใช้ไพ่โจมตีได้',
    defaultDuration: 2,
    stackable: false,
    tags: ['debuff', 'restriction'],
    onApply: (target) => {
      console.log(`${target} ถูกพันธนาการ - ไม่สามารถโจมตีได้`);
    }
  },

  weakness: {
    id: 'weakness', 
    name: 'ความอ่อนแอ',
    description: 'สร้างความเสียหายลดลง 50%',
    defaultDuration: 2,
    stackable: false,
    tags: ['debuff', 'damage_reduction'],
    onApply: (target) => {
      console.log(`${target} อ่อนแอลง - ความเสียหายลดลง`);
    }
  },

  vulnerable: {
    id: 'vulnerable',
    name: 'ความเปราะบาง',
    description: 'รับความเสียหายเพิ่ม 50%',
    defaultDuration: 2,
    stackable: false,
    tags: ['debuff', 'vulnerability'],
    onApply: (target) => {
      console.log(`${target} เปราะบาง - รับความเสียหายเพิ่ม`);
    }
  },

  draw_reduction: {
    id: 'draw_reduction',
    name: 'การจั่วไพ่ลดลง',
    description: 'จั่วไพ่น้อยลงตามจำนวนชั้น',
    defaultDuration: 2,
    stackable: true,
    maxStacks: 3,
    tags: ['debuff', 'card_manipulation'],
    onTurnStart: (target, stacks) => {
      console.log(`${target} จั่วไพ่ลดลง ${stacks} ใบ`);
    }
  },

  // ===== 🟢 สถานะผลบวก (Buffs) =====

  regeneration: {
    id: 'regeneration',
    name: 'การฟื้นฟู', 
    description: 'ฟื้นฟู HP ต้นเทิร์นตามจำนวนชั้น',
    defaultDuration: 5,
    stackable: true,
    maxStacks: 5,
    tags: ['buff', 'healing'],
    onTurnStart: (target, stacks) => {
      console.log(`${target} ฟื้นฟู HP ${stacks} หน่วย`);
    }
  },

  strength: {
    id: 'strength',
    name: 'ความแข็งแกร่ง',
    description: 'สร้างความเสียหายเพิ่มตามจำนวนชั้น',
    defaultDuration: 0, // ถาวรจนกว่าจะถูกลบ
    stackable: true,
    maxStacks: 10,
    tags: ['buff', 'damage_boost'],
    onApply: (target, stacks) => {
      console.log(`${target} แข็งแกร่งขึ้น (+${stacks} ความเสียหาย)`);
    }
  },

  block_next: {
    id: 'block_next',
    name: 'บล็อคครั้งต่อไป',
    description: 'บล็อคความเสียหายครั้งต่อไปตามจำนวนชั้น',
    defaultDuration: 1,
    stackable: true,
    tags: ['buff', 'protection'],
    onApply: (target, stacks) => {
      console.log(`${target} เตรียมบล็อค ${stacks} ความเสียหาย`);
    }
  },

  energy_boost: {
    id: 'energy_boost',
    name: 'เพิ่มพลังงาน',
    description: 'ได้พลังงานเพิ่มเทิร์นต่อไปตามจำนวนชั้น',
    defaultDuration: 1,
    stackable: true,
    tags: ['buff', 'energy_manipulation'],
    onTurnStart: (target, stacks) => {
      console.log(`${target} ได้พลังงานเพิ่ม ${stacks} หน่วย`);
    }
  },

  // ===== ⭐ สถานะผลพิเศษ (Special) =====

  spell_charging: {
    id: 'spell_charging',
    name: 'ร่ายเวทย์',
    description: 'กำลังร่ายเวทย์อันทรงพลัง - ห้ามขัดจังหวะ',
    defaultDuration: 0, // จัดการพิเศษโดยระบบเวทย์
    stackable: false,
    tags: ['special', 'casting'],
    onApply: (target) => {
      console.log(`${target} เริ่มร่ายเวทย์อันทรงพลัง...`);
    },
    onRemove: (target) => {
      console.log(`${target} ร่ายเวทย์เสร็จสิ้น!`);
    }
  }
};

/**
 * ฟังก์ชันช่วยในการดึงข้อมูลสถานะผล
 */

// ดึงสถานะผลตาม ID
export function getStatusEffectDefinition(effectType: StatusEffectType): StatusEffectDefinition | undefined {
  return STATUS_EFFECTS_REGISTRY[effectType];
}

// ดึงสถานะผลทั้งหมดตามแท็ก
export function getStatusEffectsByTag(tag: string): StatusEffectDefinition[] {
  return Object.values(STATUS_EFFECTS_REGISTRY).filter(effect => 
    effect.tags?.includes(tag)
  );
}

// ดึงเฉพาะ Debuffs
export function getDebuffEffects(): StatusEffectDefinition[] {
  return getStatusEffectsByTag('debuff');
}

// ดึงเฉพาะ Buffs
export function getBuffEffects(): StatusEffectDefinition[] {
  return getStatusEffectsByTag('buff');
}

// ดึงเฉพาะสถานะผลพิเศษ
export function getSpecialEffects(): StatusEffectDefinition[] {
  return getStatusEffectsByTag('special');
}

// ตรวจสอบว่าสถานะผลสามารถซ้อนได้หรือไม่
export function isStackableEffect(effectType: StatusEffectType): boolean {
  const definition = getStatusEffectDefinition(effectType);
  return definition?.stackable || false;
}

// ได้จำนวนชั้นสูงสุด
export function getMaxStacks(effectType: StatusEffectType): number {
  const definition = getStatusEffectDefinition(effectType);
  return definition?.maxStacks || 1;
}

/**
 * การจัดกลุ่มสถานะผลสำหรับระบบ UI
 */
export const STATUS_EFFECT_GROUPS = {
  // สถานะผลที่ส่งผลต่อการต่อสู้โดยตรง
  COMBAT: ['strength', 'weakness', 'vulnerable', 'block_next'],
  
  // สถานะผลที่ส่งผลต่อการจัดการไพ่
  CARD_MANIPULATION: ['corruption', 'draw_reduction', 'entangle'],
  
  // สถานะผลที่ส่งผลต่อพลังงาน
  ENERGY: ['fear', 'energy_boost'],
  
  // สถานะผลต่อเนื่อง
  OVER_TIME: ['poison', 'regeneration', 'curse'],
  
  // สถานะผลพิเศษ
  SPECIAL: ['spell_charging']
} as const;