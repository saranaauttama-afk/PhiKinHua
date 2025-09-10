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

  },

  // ===== 🕷️ ปอบ - ผีมดลูกพราง =====
  phi_pop: {
    id: 'phi_pop',
    name: 'ปอบ',
    tier: 'normal',
    hp: 38,
    maxHp: 38,
    block: 2,
    
    behaviors: [
      {
        id: 'possession_threat',          // คุกคามด้วยการสิง
        condition: 'player_hp_above_75',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'vulnerability', stacks: 2, duration: 3 },
        priority: 7,
        oncePerCombat: false
      },
      {
        id: 'invisible_strike',           // การโจมตีแอบแฝง
        condition: 'turn_odd',           // เทิร์นคี่
        action: 'apply_status_to_self',
        actionValue: { statusId: 'stealth', stacks: 1, duration: 1 },
        priority: 6,
        oncePerCombat: false
      }
    ],
    
    spells: [
      {
        id: 'soul_drain',
        name: 'การดูดวิญญาณ',
        description: 'ดูดพลังชีวิตและพลังงานจากผู้เล่น',
        cost: 3,
        castTime: 2,
        effects: [
          { 
            type: 'damage', 
            value: 12, 
            target: 'player', 
            description: 'ดูดพลังชีวิต' 
          },
          { 
            type: 'drain_energy', 
            value: 1, 
            target: 'player', 
            description: 'ดูดพลังงาน 1 หน่วย' 
          },
          { 
            type: 'heal', 
            value: 6, 
            target: 'enemy', 
            description: 'ใช้พลังที่ดูดมารักษาตัว' 
          }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      }
    ],
    
    signatureCards: ['possession_touch', 'invisible_approach', 'soul_siphon'],
    aiPersonality: 'tactical',
    aiModifiers: {
      spellCastingPreference: 50,
      behaviorTriggerChance: 75,
      adaptationRate: 40
    },
    
    scaling: {
      dmgPerAct: 2,
      blockPerAct: 1,
      spellPowerPerAct: 2
    },
    
    preferredEnvironments: ['haunted_house', 'dark_forest']
  },

  // ===== ☠️ ผีตายโหง - วิญญาณผู้เสียชีวิตอย่างไม่สมหวัง =====
  phi_tai_hong: {
    id: 'phi_tai_hong',
    name: 'ผีตายโหง',
    tier: 'normal',
    hp: 40,
    maxHp: 40,
    block: 0,
    
    behaviors: [
      {
        id: 'vengeful_wrath',             // ความแค้นสะสม
        condition: 'hp_below_75',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'strength', stacks: 2, duration: 4 },
        priority: 8,
        oncePerCombat: true
      },
      {
        id: 'death_curse',               // คำสาปแห่งความตาย
        condition: 'turn_4_or_later',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'curse', stacks: 1, duration: 5 },
        priority: 7,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'haunting_scream',
        name: 'เสียงกรีดร้องหลอน',
        description: 'เสียงกรีดร้องที่สร้างความหวาดกลัวและความเจ็บปวด',
        cost: 2,
        castTime: 1,
        effects: [
          { 
            type: 'damage', 
            value: 15, 
            target: 'player', 
            description: 'เสียงกรีดร้องทำร้าย' 
          },
          { 
            type: 'apply_status', 
            value: 2, 
            target: 'player', 
            statusEffectId: 'fear', 
            duration: 2, 
            description: 'สร้างความหวาดกลัว' 
          }
        ],
        telegraphed: false,
        interruptible: false,
        priority: 9
      }
    ],
    
    signatureCards: ['vengeful_strike', 'death_wail', 'cursed_touch'],
    aiPersonality: 'aggressive',
    aiModifiers: {
      spellCastingPreference: 60,
      behaviorTriggerChance: 85,
      adaptationRate: 25
    },
    
    scaling: {
      dmgPerAct: 3,
      blockPerAct: 0,
      spellPowerPerAct: 3
    },
    
    preferredEnvironments: ['spirit_realm', 'cursed_forest']
  },

  // ===== 👹 ผีหัวตัด - วิญญาณนักรบโบราณ =====
  phi_hua_tad: {
    id: 'phi_hua_tad',
    name: 'ผีหัวตัด',
    tier: 'normal',
    hp: 42,
    maxHp: 42,
    block: 3,
    
    behaviors: [
      {
        id: 'warrior_instinct',           // สัญชาตญาณนักรบ
        condition: 'player_attack_count_3',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'block_next', stacks: 5, duration: 1 },
        priority: 8,
        oncePerCombat: false
      },
      {
        id: 'headless_fury',             // ความโกรธแห่งคนไร้หัว
        condition: 'hp_below_50',
        action: 'double_attack',
        priority: 9,
        oncePerCombat: false
      }
    ],
    
    spells: [
      {
        id: 'phantom_blade',
        name: 'ใบมีดผีสาง',
        description: 'เรียกใบมีดวิญญาณมาโจมตีต่อเนื่อง',
        cost: 4,
        castTime: 2,
        effects: [
          { 
            type: 'damage', 
            value: 10, 
            target: 'player', 
            description: 'ใบมีดผีสางฟัน' 
          },
          { 
            type: 'damage', 
            value: 10, 
            target: 'player', 
            description: 'ใบมีดผีสางฟันซ้ำ' 
          },
          { 
            type: 'apply_status', 
            value: 1, 
            target: 'player', 
            statusEffectId: 'bleed', 
            duration: 3, 
            description: 'ทำให้เลือดไหล' 
          }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      }
    ],
    
    signatureCards: ['phantom_slash', 'warrior_stance', 'headless_charge'],
    aiPersonality: 'aggressive',
    aiModifiers: {
      spellCastingPreference: 40,
      behaviorTriggerChance: 80,
      adaptationRate: 35
    },
    
    scaling: {
      dmgPerAct: 2,
      blockPerAct: 1,
      spellPowerPerAct: 2
    },
    
    preferredEnvironments: ['ancient_battlefield', 'spirit_realm']
  },

  // ===== 🌸 ผีนางรำ - วิญญาณนักรำโบราณ =====
  phi_nang_ram: {
    id: 'phi_nang_ram',
    name: 'ผีนางรำ',
    tier: 'normal',
    hp: 36,
    maxHp: 36,
    block: 1,
    
    behaviors: [
      {
        id: 'hypnotic_dance',             // การเต้นรำมนตร์เสน่ห์
        condition: 'turn_2_or_later',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'charm', stacks: 1, duration: 2 },
        priority: 7,
        oncePerCombat: false
      },
      {
        id: 'graceful_evasion',          // การหลบหลีกอย่างสง่างาม
        condition: 'player_damage_above_15',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'dodge_next', stacks: 1, duration: 1 },
        priority: 6,
        oncePerCombat: false
      }
    ],
    
    spells: [
      {
        id: 'mesmerizing_performance',
        name: 'การแสดงสะกดจิต',
        description: 'การเต้นรำที่สะกดจิตและทำให้สับสน',
        cost: 3,
        castTime: 2,
        effects: [
          { 
            type: 'apply_status', 
            value: 2, 
            target: 'player', 
            statusEffectId: 'confusion', 
            duration: 3, 
            description: 'ทำให้สับสนไม่รู้ทิศทาง' 
          },
          { 
            type: 'apply_status', 
            value: 1, 
            target: 'enemy', 
            statusEffectId: 'regeneration', 
            duration: 2, 
            description: 'ฟื้นฟูตัวเองด้วยพลังการเต้นรำ' 
          }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 7
      }
    ],
    
    signatureCards: ['graceful_strike', 'dance_of_spirits', 'entrancing_gaze'],
    aiPersonality: 'tactical',
    aiModifiers: {
      spellCastingPreference: 55,
      behaviorTriggerChance: 70,
      adaptationRate: 45
    },
    
    scaling: {
      dmgPerAct: 1,
      blockPerAct: 1,
      spellPowerPerAct: 3
    },
    
    preferredEnvironments: ['royal_palace', 'spirit_realm']
  },

  // ===== 🐍 งูผีสาง - วิญญาณงูยักษ์โบราณ =====
  ngu_phi_sang: {
    id: 'ngu_phi_sang',
    name: 'งูผีสาง',
    tier: 'normal',
    hp: 44,
    maxHp: 44,
    block: 2,
    
    behaviors: [
      {
        id: 'serpent_coil',               // การพันรัดแบบงู
        condition: 'player_hp_below_60',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'entangle', stacks: 2, duration: 2 },
        priority: 8,
        oncePerCombat: false
      },
      {
        id: 'venomous_fangs',            // เขี้ยวพิษ
        condition: 'turn_3_or_later',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'poison', stacks: 2, duration: 4 },
        priority: 7,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'phantom_strike',
        name: 'การจู่โจมผีสาง',
        description: 'งูผีสางจู่โจมอย่างรวดเร็วด้วยพิษมรณะ',
        cost: 2,
        castTime: 1,
        effects: [
          { 
            type: 'damage', 
            value: 14, 
            target: 'player', 
            description: 'การจู่โจมของงูผีสาง' 
          },
          { 
            type: 'apply_status', 
            value: 3, 
            target: 'player', 
            statusEffectId: 'poison', 
            duration: 3, 
            description: 'พิษงูผีสางแทรกซึม' 
          }
        ],
        telegraphed: false,
        interruptible: false,
        priority: 8
      }
    ],
    
    signatureCards: ['serpent_bite', 'coiling_attack', 'venom_spit'],
    aiPersonality: 'aggressive',
    aiModifiers: {
      spellCastingPreference: 45,
      behaviorTriggerChance: 85,
      adaptationRate: 30
    },
    
    scaling: {
      dmgPerAct: 2,
      blockPerAct: 1,
      spellPowerPerAct: 2
    },
    
    preferredEnvironments: ['dark_forest', 'cursed_forest']
  }
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
  CLASSIC_GHOSTS: ['phi_pong', 'phi_krasue', 'phi_pop', 'phi_tai_hong', 'phi_hua_tad', 'phi_nang_ram'],
  
  // ศัตรูที่เน้นโจมตี
  OFFENSIVE: ['phi_krasue', 'phi_tai_hong', 'phi_hua_tad', 'ngu_phi_sang'],
  
  // ศัตรูที่เน้นหลบหลีก
  EVASIVE: ['phi_pong', 'phi_nang_ram'],
  
  // ศัตรูที่เน้น debuff และ status effects
  DEBUFFER: ['phi_pop', 'phi_tai_hong', 'phi_nang_ram', 'ngu_phi_sang'],
  
  // ศัตรูที่เหมาะสำหรับผู้เล่นใหม่
  BEGINNER_FRIENDLY: ['phi_pong', 'phi_nang_ram'],
  
  // ศัตรูที่ท้าทาย
  CHALLENGING: ['phi_krasue', 'phi_tai_hong', 'phi_hua_tad', 'ngu_phi_sang'],
  
  // ศัตรูที่มี tactical AI
  TACTICAL: ['phi_pop', 'phi_nang_ram'],
  
  // ศัตรูที่มี aggressive AI
  AGGRESSIVE: ['phi_krasue', 'phi_tai_hong', 'phi_hua_tad', 'ngu_phi_sang']
} as const;