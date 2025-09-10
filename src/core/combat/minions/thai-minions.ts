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

  // วิญญาณเพื่อน - ผีที่มาช่วยเหลือ
  ghost_ally: {
    id: 'ghost_ally',
    name: 'วิญญาณเพื่อน',
    duration: 3, // อยู่ได้ 3 เทิร์น
    owner: 'player',
    abilities: [
      {
        type: 'attack',
        trigger: 'turn_start',        // โจมตีทุกต้นเทิร์น
        target: 'enemy',              // โจมตีศัตรู
        value: 4,                     // ความเสียหาย 4
        ignores_block: true,          // ทะลุการป้องกัน (เป็นวิญญาณ)
        description: 'โจมตีทะลุการป้องกันด้วยพลังวิญญาณ'
      }
    ]
  },

  // ปีศาจสหาย - ปีศาจที่ถูกควบคุม
  demon_minion: {
    id: 'demon_minion', 
    name: 'ปีศาจสหาย',
    duration: 5, // ทนทานกว่าผี - อยู่ได้ 5 เทิร์น
    owner: 'player',
    abilities: [
      {
        type: 'attack',
        trigger: 'turn_start',
        target: 'enemy',
        value: 3,                     // ความเสียหายน้อยกว่าผี แต่ทนทาน
        description: 'โจมตีด้วยกรงเล็บปีศาจ'
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

  // วิญญาณพิษ - วิญญาณที่ใช้พิษโจมตี
  poison_spirit: {
    id: 'poison_spirit',
    name: 'วิญญาณพิษ',
    duration: 4,
    owner: 'player',
    abilities: [
      {
        type: 'status',               // ใส่สถานะผล
        trigger: 'turn_start',
        target: 'enemy',
        effect: 'poison',             // ใส่พิษ
        value: 2,                     // 2 ชั้น
        duration: 3,                  // ยาวนาน 3 เทิร์น
        description: 'พ่นพิษลึกลับใส่ศัตรู (2 ชั้น, 3 เทิร์น)'
      }
    ]
  },

  // ===== 👤 ลูกน้องของศัตรู (Enemy Minions) =====

  // โคลนเงา - สำเนาเงาของศัตรู
  shadow_clone: {
    id: 'shadow_clone',
    name: 'โคลนเงา',
    duration: 4,
    owner: 'enemy', // เป็นลูกน้องศัตรู
    abilities: [
      {
        type: 'attack',
        trigger: 'turn_start',
        target: 'enemy',              // จะถูกเปลี่ยนเป็น 'player' โดยระบบ
        value: 8,                     // โจมตีแรงมาก
        description: 'โจมตีด้วยพลังแห่งเงามืด'
      }
    ]
  },

  // ผู้พิทักษ์ต้นไม้ - วิญญาณต้นไม้ยักษ์
  tree_guardian: {
    id: 'tree_guardian',
    name: 'ผู้พิทักษ์ต้นไม้',
    duration: 6, // ทนทานมาก
    owner: 'enemy',
    abilities: [
      {
        type: 'attack',
        trigger: 'turn_start',
        target: 'enemy',              // จะถูกเปลี่ยนเป็น 'player' โดยระบบ
        value: 5,
        description: 'โจมตีด้วยกิ่งไม้และราก'
      },
      {
        type: 'status',               // ความสามารถพิเศษ: พันธนาการ
        trigger: 'turn_start',
        target: 'enemy',              // จะถูกเปลี่ยนเป็น 'player' โดยระบบ  
        effect: 'entangle',           // ใส่สถานะพันธนาการ
        value: 1,
        duration: 2,
        description: 'พันด้วยรากไม้ ทำให้ไม่สามารถโจมตีได้'
      }
    ]
  },

  // ===== 🔮 สหายพิเศษ (Special Minions) =====

  // วิญญาณนักสู้โบราณ - สหายระดับสูง
  ancient_warrior_spirit: {
    id: 'ancient_warrior_spirit',
    name: 'วิญญาณนักสู้โบราณ',
    duration: 5,
    owner: 'player',
    abilities: [
      {
        type: 'attack',
        trigger: 'turn_start',
        target: 'enemy',
        value: 6,                     // โจมตีแรง
        description: 'โจมตีด้วยทักษะการรบโบราณ'
      },
      {
        type: 'block',                // ความสามารถป้องกัน
        trigger: 'turn_start',
        target: 'owner',              // ป้องกันผู้เล่น
        value: 3,
        description: 'ใช้โล่ป้องกันเจ้าของ'
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

  // ปีศาจป่า - ลูกน้องศัตรูที่สร้าง debuff
  forest_demon: {
    id: 'forest_demon',
    name: 'ปีศาจป่า',
    duration: 5,
    owner: 'enemy',
    abilities: [
      {
        type: 'status',
        trigger: 'turn_start',
        target: 'enemy',              // จะถูกเปลี่ยนเป็น 'player' โดยระบบ
        effect: 'weakness',           // ใส่ความอ่อนแอ
        value: 1,
        duration: 2,
        description: 'สาปให้ผู้เล่นอ่อนแอลง'
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