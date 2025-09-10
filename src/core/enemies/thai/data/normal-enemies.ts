// src/core/enemies/thai/data/normal-enemies.ts — ศัตรูระดับธรรมดาในระบบไทย

import type { EnhancedEnemyData } from '../../../types_extended';

/**
 * คลังข้อมูลศัตรูระดับธรรมดา (Normal Tier)
 * 
 * ลักษณะของศัตรูระดับนี้:
 * - HP: 30-40 หน่วย
 * - พฤติกรรมไม่ซับซ้อนมาก
 * - มีเวทมนตร์ 1-2 ตัว
 * - เหมาะสำหรับการเรียนรู้เกม
 */
export const NORMAL_ENEMIES: Record<string, EnhancedEnemyData> = {

  // ===== 👻 ผีโป่ง - ผีลูกโป่งที่ลอยไปลอยมา =====
  phi_pong: {
    id: 'phi_pong',
    name: 'ผีโป่ง',
    tier: 'normal',
    hp: 35,
    maxHp: 35,
    block: 0,
    
    // พฤติกรรมพิเศษ
    behaviors: [
      {
        id: 'floating_evasion',          // หลบหลีกแบบลอย
        condition: 'player_hp_below_50', // เมื่อผู้เล่น HP ต่ำกว่า 50%
        action: 'apply_status_to_self',  // ใส่สถานะผลให้ตัวเอง
        actionValue: { statusId: 'block_next', stacks: 8, duration: 1 },
        priority: 8,
        oncePerCombat: false             // ใช้ได้หลายครั้งต่อการต่อสู้
      },
      {
        id: 'fear_wail',                 // เสียงร้องน่ากลัว
        condition: 'turn_3_or_later',    // หลังเทิร์นที่ 3
        action: 'apply_status_to_player', // ใส่สถานะผลให้ผู้เล่น
        actionValue: { statusId: 'fear', stacks: 1, duration: 2 },
        priority: 6,
        oncePerCombat: false
      }
    ],
    
    // เวทมนตร์พิเศษ
    spells: [
      {
        id: 'ghostly_phase',
        name: 'การลอยผ่านมิติ',
        description: 'กลายเป็นผีลอยที่แตะต้องไม่ได้เป็นเวลา 2 เทิร์น',
        cost: 2,                        // ใช้พลังงาน 2 หน่วย
        castTime: 2,                    // ใช้เวลาร่าย 2 เทิร์น
        effects: [
          { 
            type: 'apply_status', 
            value: 2, 
            target: 'enemy',            // เป้าหมายตัวเอง (enemy จากมุมผู้เล่น)
            statusEffectId: 'block_next', 
            duration: 2, 
            description: 'บล็อคความเสียหายทั้งหมดเป็นเวลา 2 เทิร์น' 
          }
        ],
        telegraphed: true,              // แจ้งเตือนผู้เล่นล่วงหน้า
        interruptible: false,           // ไม่สามารถขัดจังหวะได้
        priority: 7
      }
    ],
    
    // ไพ่ลักษณะเฉพาะ
    signatureCards: ['phase_strike', 'floating_dodge', 'ghost_wail'],
    
    // บุคลิก AI
    aiPersonality: 'chaotic',          // แบบสุ่มสี สับเปลี่ยน
    aiModifiers: {
      spellCastingPreference: 30,      // โอกาส 30% ที่จะใช้เวทมนตร์
      behaviorTriggerChance: 70,       // โอกาส 70% ที่จะใช้พฤติกรรมพิเศษ
      adaptationRate: 20               // ปรับตัวได้ช้า
    },
    
    // การเพิ่มพลังตาม Act
    scaling: {
      dmgPerAct: 1,                    // ความเสียหาย +1 ต่อ Act
      blockPerAct: 1,                  // การป้องกัน +1 ต่อ Act
      spellPowerPerAct: 2              // พลังเวทมนตร์ +2 ต่อ Act
    },
    
    // สภาพแวดล้อมที่ชอบ
    preferredEnvironments: ['haunted_house', 'spirit_realm']
  },

  // ===== 🌙 ผีกระสือ - ผีหัวลอยกินสิ่งสกปรก =====
  phi_krasue: {
    id: 'phi_krasue',
    name: 'ผีกระสือ',
    tier: 'normal',
    hp: 32,
    maxHp: 32,
    block: 0,
    
    behaviors: [
      {
        id: 'night_hunter',              // นักล่าราตรี
        condition: 'turn_even',          // เทิร์นคู่ (2, 4, 6, ...)
        action: 'double_attack',         // โจมตี 2 ครั้ง
        priority: 9,
        oncePerCombat: false
      },
      {
        id: 'blood_frenzy',              // อาละวาดเลือด
        condition: 'hp_below_50',        // เมื่อ HP ต่ำกว่า 50%
        action: 'apply_status_to_self',
        actionValue: { statusId: 'strength', stacks: 3, duration: 0 }, // แข็งแกร่งถาวร
        priority: 8,
        oncePerCombat: true              // ใช้ได้แค่ครั้งเดียว
      }
    ],
    
    spells: [
      {
        id: 'blood_moon_hunt',
        name: 'การล่าใต้จันทร์เลือด',
        description: 'การโจมตีกลางคืนที่รุนแรง ยิ่งฆ่าได้มากยิ่งแรง',
        cost: 3,
        castTime: 2,
        effects: [
          { 
            type: 'damage', 
            value: 18,                   // ความเสียหายสูง
            target: 'player', 
            description: 'สร้างความเสียหายมหาศาล' 
          },
          { 
            type: 'heal', 
            value: 8,                    // รักษาตัวเองด้วย
            target: 'enemy', 
            description: 'ดูดเลือดเพื่อรักษาตัว' 
          }
        ],
        telegraphed: true,
        interruptible: true,             // สามารถขัดจังหวะได้
        priority: 9
      }
    ],
    
    signatureCards: ['blood_drain', 'night_hunt', 'stealth_approach'],
    aiPersonality: 'aggressive',        // ก้าวร้าว โจมตีก่อน
    aiModifiers: {
      spellCastingPreference: 40,
      behaviorTriggerChance: 80,
      adaptationRate: 30
    },
    
    scaling: {
      dmgPerAct: 2,                     // เพิ่มความเสียหายเยอะ
      blockPerAct: 0,                   // ไม่มีการป้องกัน
      spellPowerPerAct: 3
    },
    
    preferredEnvironments: ['dark_forest', 'spirit_realm']
  }

  // หมายเหตุ: ในไฟล์จริงจะมีศัตรูอื่น ๆ เพิ่มเติม
  // แต่เพื่อความชัดเจนในการ demo จึงแสดงแค่ 2 ตัวก่อน
};

/**
 * ฟังก์ชันช่วยในการจัดการ Normal Enemies
 */

// ดึงศัตรูระดับธรรมดาตาม ID
export function getNormalEnemyById(enemyId: string): EnhancedEnemyData | undefined {
  return NORMAL_ENEMIES[enemyId];
}

// ดึงศัตรูระดับธรรมดาทั้งหมด
export function getAllNormalEnemies(): Record<string, EnhancedEnemyData> {
  return NORMAL_ENEMIES;
}

// ดึงรายการ ID ของศัตรูระดับธรรมดา
export function getNormalEnemyIds(): string[] {
  return Object.keys(NORMAL_ENEMIES);
}

// เลือกศัตรูระดับธรรมดาแบบสุ่ม
export function getRandomNormalEnemy(): EnhancedEnemyData {
  const enemyIds = getNormalEnemyIds();
  const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
  return NORMAL_ENEMIES[randomId];
}

// ดึงศัตรูที่เหมาะกับสภาพแวดล้อม
export function getNormalEnemiesForEnvironment(envId: string): EnhancedEnemyData[] {
  return Object.values(NORMAL_ENEMIES).filter(enemy => 
    enemy.preferredEnvironments?.includes(envId)
  );
}

// ดึงศัตรูตามบุคลิก AI
export function getNormalEnemiesByPersonality(personality: 'aggressive' | 'defensive' | 'tactical' | 'chaotic'): EnhancedEnemyData[] {
  return Object.values(NORMAL_ENEMIES).filter(enemy => 
    enemy.aiPersonality === personality
  );
}

/**
 * สถิติและข้อมูลเพิ่มเติมสำหรับ Normal Enemies
 */
export const NORMAL_ENEMY_STATS = {
  // พิสัย HP
  HP_RANGE: { min: 30, max: 40 },
  
  // จำนวนเวทมนตร์เฉลี่ย
  AVERAGE_SPELLS: 1.5,
  
  // จำนวนพฤติกรรมเฉลี่ย
  AVERAGE_BEHAVIORS: 2,
  
  // ความแข็งแกร่งโดยรวม (1-10)
  OVERALL_DIFFICULTY: 3,
  
  // คำแนะนำสำหรับผู้เล่นใหม่
  PLAYER_TIPS: [
    "ศัตรูระดับธรรมดามักมีจุดอ่อนที่เห็นได้ชัด",
    "สังเกตพฤติกรรมแล้วเตรียมตัวรับมือ", 
    "การขัดจังหวะเวทมนตร์จะช่วยได้มาก",
    "ใช้สภาพแวดล้อมให้เป็นประโยชน์"
  ]
} as const;

/**
 * การจัดกลุ่มศัตรูตามธีม
 */
export const NORMAL_ENEMY_THEMES = {
  // ผีไทยคลาสสิค
  CLASSIC_GHOSTS: ['phi_pong', 'phi_krasue'],
  
  // ศัตรูที่เน้นโจมตี
  OFFENSIVE: ['phi_krasue'],
  
  // ศัตรูที่เน้นหลบหลีก
  EVASIVE: ['phi_pong'],
  
  // ศัตรูที่เหมาะสำหรับผู้เล่นใหม่
  BEGINNER_FRIENDLY: ['phi_pong'],
  
  // ศัตรูที่ท้าทาย
  CHALLENGING: ['phi_krasue']
} as const;