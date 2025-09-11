// src/core/combat/minions/thai-minions.ts — สหายและลูกน้องในระบบไทย

import type { MinionData } from '../../types_extended';

/**
 * คลังข้อมูลสหายและลูกน้องทั้งหมดในเกม
 * แบ่งออกเป็น 2 ประเภทหลัก:
 * - สหายของผู้เล่น (Player Minions) - ช่วยต่อสู้เคียงข้างผู้เล่น
 * - ลูกน้องของศัตรู (Enemy Minions) - ถูกเรียกมาโดยศัตรูเพื่อรบกวนผู้เล่น
 */
export const THAI_MINIONS: Record<string, MinionData> = {

  // ===== 👻 สหายของผู้เล่น (Player Allies) =====

  // วิญญาณเพื่อน - ผีที่มาช่วยโจมตีและเสริมพลัง
  ghost_ally: {
    id: 'ghost_ally',
    name: 'วิญญาณเพื่อน',
    duration: 3, // อยู่ได้ 3 เทิร์น
    owner: 'player',
    abilities: [
      {
        type: 'attack',               // โจมตีศัตรูได้
        trigger: 'turn_start',        
        target: 'enemy',              // โจมตีศัตรู
        value: 4,                     // ความเสียหาย 4
        ignores_block: true,          // ทะลุ block ได้ (เป็นผี)
        description: 'โจมตีด้วยพลังวิญญาณทะลุการป้องกัน'
      }
    ]
  },

  // ปีศาจสหาย - ปีศาจที่โจมตีและป้องกัน
  demon_minion: {
    id: 'demon_minion', 
    name: 'ปีศาจสหาย',
    duration: 5, // ทนทานกว่าผี - อยู่ได้ 5 เทิร์น
    owner: 'player',
    abilities: [
      {
        type: 'attack',               // โจมตีศัตรู
        trigger: 'turn_start',
        target: 'enemy',              // โจมตีศัตรู
        value: 3,                     // ความเสียหาย 3
        description: 'กรงเล็บปีศาจฉีกเป็นแผล'
      }
    ]
  },

  // กุมารทอง - วิญญาณเด็กที่ให้การรักษา
  kuman_spirit: {
    id: 'kuman_spirit',
    name: 'กุมารทอง',
    duration: 6, // อยู่ได้นานที่สุด เพราะเป็นสหายหลัก
    owner: 'player',
    abilities: [
      {
        type: 'heal',
        trigger: 'turn_start',        // รักษาทุกต้นเทิร์น
        target: 'owner',              // รักษาเจ้าของ (ผู้เล่น)
        value: 2,                     // ฟื้นฟู HP 2 หน่วย
        description: 'ส่งพลังบุญบันดาลให้เจ้าของ'
      }
    ]
  },

  // วิญญาณพิษ - วิญญาณที่ช่วยใส่ debuff (Support)
  poison_spirit: {
    id: 'poison_spirit',
    name: 'วิญญาณพิษ',
    duration: 4,
    owner: 'player',
    abilities: [
      {
        type: 'status',               // ใส่สถานะผลลบให้ศัตรู (Support ประเภท debuff)
        trigger: 'turn_start',
        target: 'enemy',              // debuff ศัตรู
        effect: 'poison',             // ใส่พิษ
        value: 1,                     // ลดเหลือ 1 ชั้นเพื่อ balance
        duration: 2,                  // ลดระยะเวลาเป็น 2 เทิร์น
        description: 'พ่นพิษลึกลับรบกวนศัตรู (1 ชั้น, 2 เทิร์น)'
      }
    ]
  },

  // ===== 🌫️ ลูกน้องของศัตรู (Enemy Support Minions) =====
  // เปลี่ยนจากโจมตีโดยตรงเป็น support เท่านั้น

  // โคลนเงา - โจมตีผู้เล่นและสร้างความสับสน
  shadow_clone: {
    id: 'shadow_clone',
    name: 'โคลนเงา',
    duration: 3, // ลดระยะเวลาลง
    owner: 'enemy', // เป็นลูกน้องศัตรู
    abilities: [
      {
        type: 'attack',               // โจมตีผู้เล่นโดยตรง
        trigger: 'turn_start',
        target: 'enemy',              // 'enemy' จากมุม minion = โจมตีผู้เล่น
        value: 8,                     // ความเสียหาย 8 (สูงกว่าเพราะเป็นศัตรู)
        description: 'โคลนเงาจู่โจมด้วยพลังความมืด'
      }
    ]
  },

  // ผู้พิทักษ์ต้นไม้ - วิญญาณที่สร้าง debuff และเสริมศัตรู
  tree_guardian: {
    id: 'tree_guardian',
    name: 'ผู้พิทักษ์ต้นไม้',
    duration: 4, // ลดระยะเวลาลง
    owner: 'enemy',
    abilities: [
      {
        type: 'block',                // เปลี่ยนเป็น support ศัตรู
        trigger: 'turn_start',
        target: 'owner',              // ช่วยศัตรู (เจ้าของ)
        value: 3,
        description: 'สร้างโล่ธรรมชาติป้องกันเจ้าของ'
      },
      {
        type: 'status',               // ยังคง debuff ผู้เล่น
        trigger: 'turn_start',
        target: 'enemy',              // 'enemy' จากมุม minion = debuff ผู้เล่น
        effect: 'entangle',           // ใส่สถานะพันธนาการ
        value: 1,
        duration: 1,                  // ลดระยะเวลาลง
        description: 'พันด้วยรากไม้ ทำให้ไม่สามารถใช้ไพ่โจมตีได้'
      }
    ]
  },

  // ===== 🔮 สหายพิเศษ (Special Support Minions) =====

  // วิญญaณนักสู้โบราณ - สหายสนับสนุนระดับสูง
  ancient_warrior_spirit: {
    id: 'ancient_warrior_spirit',
    name: 'วิญญาณนักสู้โบราณ',
    duration: 5,
    owner: 'player',
    abilities: [
      {
        type: 'block',                // เปลี่ยนจาก attack เป็น defense support
        trigger: 'turn_start',
        target: 'owner',              // ป้องกันผู้เล่น
        value: 3,
        description: 'ใช้ประสบการณ์การรบป้องกันเจ้าของ (+3 block)'
      },
      {
        type: 'energy',               // เพิ่มความสามารถ support
        trigger: 'turn_start',
        target: 'owner',              // ช่วยผู้เล่น
        value: 1,
        description: 'แบ่งปันพลังรบโบราณ (+1 พลังงาน)'
      }
    ]
  },

  // หอยทากผี - สหายที่เพิ่มพลังงาน
  spirit_snail: {
    id: 'spirit_snail',
    name: 'หอยทากผี',
    duration: 4,
    owner: 'player',
    abilities: [
      {
        type: 'energy',               // เพิ่มพลังงาน
        trigger: 'turn_start',
        target: 'owner',
        value: 1,                     // +1 พลังงานต่อเทิร์น
        description: 'ส่งพลังงานลึกลับให้เจ้าของ'
      }
    ]
  },

  // ปีศาจป่า - ลูกน้องศัตรูที่สร้าง debuff (Support)
  forest_demon: {
    id: 'forest_demon',
    name: 'ปีศาจป่า',
    duration: 3, // ลดระยะเวลาลง
    owner: 'enemy',
    abilities: [
      {
        type: 'status',
        trigger: 'turn_start',
        target: 'enemy',              // 'enemy' จากมุม minion = debuff ผู้เล่น
        effect: 'weakness',           // ใส่ความอ่อนแอ
        value: 1,
        duration: 1,                  // ลดระยะเวลาลง
        description: 'สาปให้ผู้เล่นอ่อนแอลง (1 เทิร์น)'
      }
    ]
  },

  // ===== 💀 Status Effect Minions (Invisible) =====
  // These represent status effects as minions for unified system

  // พิษ - Status Effect as Minion
  poison_status: {
    id: 'poison_status',
    name: 'พิษ',
    duration: 4,
    owner: 'enemy', // Will be set dynamically based on target
    isStatusEffect: true,
    invisible: true,
    stacks: 3,
    abilities: [
      {
        type: 'damage_over_time',
        trigger: 'turn_start',
        target: 'owner',
        value: 3,
        description: 'ได้รับความเสียหาย 3 จากพิษ'
      }
    ]
  },

  // ความอ่อนแอ - Status Effect as Minion
  weakness_status: {
    id: 'weakness_status',
    name: 'ความอ่อนแอ',
    duration: 3,
    owner: 'player', // Will be set dynamically based on target
    isStatusEffect: true,
    invisible: true,
    abilities: [
      {
        type: 'modify_damage',
        trigger: 'turn_start',
        target: 'owner',
        value: 0.5,
        modifyType: 'multiply',
        description: 'ลดความเสียหายที่สร้างได้ 50%'
      }
    ]
  },

  // พันธนาการ - Status Effect as Minion  
  entangle_status: {
    id: 'entangle_status',
    name: 'พันธนาการ',
    duration: 2,
    owner: 'player', // Will be set dynamically based on target
    isStatusEffect: true,
    invisible: true,
    abilities: [
      {
        type: 'block_cards',
        trigger: 'turn_start',
        target: 'owner',
        value: 1,
        cardTypes: ['attack'],
        description: 'ไม่สามารถเล่นไพ่โจมตีได้'
      }
    ]
  },

  // การรักษา - Positive Status Effect as Minion
  regeneration_status: {
    id: 'regeneration_status',
    name: 'การฟื้นฟู',
    duration: 5,
    owner: 'player', // Will be set dynamically based on target
    isStatusEffect: true,
    invisible: true,
    abilities: [
      {
        type: 'heal',
        trigger: 'turn_start',
        target: 'owner',
        value: 2,
        description: 'ฟื้นฟู HP 2 ต่อเทิร์น'
      }
    ]
  }

};

/**
 * ฟังก์ชันช่วยในการจัดการ Minions
 */

// ดึง Minion ตาม ID
export function getMinionById(minionId: string): MinionData | undefined {
  return THAI_MINIONS[minionId];
}

// ดึง Minions ทั้งหมด
export function getAllMinions(): Record<string, MinionData> {
  return THAI_MINIONS;
}

// ดึง Player Minions เท่านั้น
export function getPlayerMinions(): Record<string, MinionData> {
  const playerMinions: Record<string, MinionData> = {};
  
  Object.entries(THAI_MINIONS).forEach(([id, minion]) => {
    if (minion.owner === 'player') {
      playerMinions[id] = minion;
    }
  });
  
  return playerMinions;
}

// ดึง Enemy Minions เท่านั้น
export function getEnemyMinions(): Record<string, MinionData> {
  const enemyMinions: Record<string, MinionData> = {};
  
  Object.entries(THAI_MINIONS).forEach(([id, minion]) => {
    if (minion.owner === 'enemy') {
      enemyMinions[id] = minion;
    }
  });
  
  return enemyMinions;
}

// ดึง Minions ตามประเภทความสามารถ
export function getMinionsByAbilityType(abilityType: 'attack' | 'heal' | 'energy' | 'status' | 'block'): MinionData[] {
  return Object.values(THAI_MINIONS).filter(minion => 
    minion.abilities.some(ability => ability.type === abilityType)
  );
}

// ดึง Minions ที่มีความทนทานสูง (duration >= 5)
export function getDurableMinions(): MinionData[] {
  return Object.values(THAI_MINIONS).filter(minion => minion.duration >= 5);
}

// สร้าง Minion instance ใหม่สำหรับใช้ในเกม
export function createMinionInstance(minionId: string, owner: 'player' | 'enemy'): MinionData | null {
  const template = getMinionById(minionId);
  if (!template) return null;
  
  // สร้าง instance ใหม่ด้วย ID ที่ไม่ซ้ำ
  return {
    ...template,
    id: `${minionId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    owner, // ใช้ owner ที่ส่งมา (อาจแตกต่างจาก template)
    // abilities และ duration จะคัดลอกจาก template
  };
}

/**
 * การจัดกลุ่ม Minions ตามบทบาท
 */
export const MINION_CATEGORIES = {
  // สหายโจมตี - เน้นสร้างความเสียหาย
  OFFENSIVE: ['ghost_ally', 'demon_minion', 'ancient_warrior_spirit'],
  
  // สหายสนับสนุน - เน้นช่วยเหลือผู้เล่น
  SUPPORT: ['kuman_spirit', 'spirit_snail'],
  
  // สหาย debuffer - เน้นใส่สถานะผลใให้ศัตรู
  DEBUFFER: ['poison_spirit'],
  
  // ลูกน้องศัตรูโจมตี - โจมตีผู้เล่น
  ENEMY_OFFENSIVE: ['shadow_clone', 'tree_guardian'],
  
  // ลูกน้องศัตรู debuffer - รบกวนผู้เล่น
  ENEMY_DEBUFFER: ['forest_demon', 'tree_guardian'], // tree_guardian มีทั้งโจมตีและ debuff
  
  // สหายป้องกัน - เน้นป้องกันและรักษา
  DEFENSIVE: ['kuman_spirit', 'ancient_warrior_spirit']
} as const;

/**
 * คำแนะนำการใช้งาน Minions สำหรับผู้เล่นใหม่
 */
export const MINION_USAGE_TIPS = {
  ghost_ally: "เหมาะกับการทำลาย enemy ที่มีการป้องกันสูง เพราะทะลุ block ได้",
  demon_minion: "เหมาะกับการสู้ยาว ๆ เพราะทนทานและโจมตีต่อเนื่อง", 
  kuman_spirit: "เหมาะกับ build ที่ต้องการ sustain เพราะรักษาต่อเนื่อง",
  poison_spirit: "เหมาะกับการต่อสู้กับ enemy ที่ HP สูง เพราะ poison จะสะสมความเสียหาย",
  ancient_warrior_spirit: "สหายครบสูตร มีทั้งโจมตีและป้องกัน เหมาะกับทุกสถานการณ์",
  spirit_snail: "เหมาะกับ deck ที่ต้องการพลังงานเยอะ เช่น combo deck"
} as const;