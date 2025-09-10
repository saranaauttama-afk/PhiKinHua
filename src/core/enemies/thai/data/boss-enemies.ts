// src/core/enemies/thai/data/boss-enemies.ts — บอสในระบบไทย

import type { EnhancedEnemyData } from '../../../types_extended';

/**
 * คลังข้อมูลบอส (Boss Tier)
 * 
 * ลักษณะของบอส:
 * - HP: 120-200+ หน่วย
 * - หลายเฟสการต่อสู้
 * - เวทมนตร์ทรงพลัง 3-5 ตัว
 * - มีลูกน้องและสหาย
 * - ปรับตัวตามการเล่นของผู้เล่น (Adaptive AI)
 * - รางวัลใหญ่และไอเทมเอกสิทธิ์
 */
export const BOSS_ENEMIES: Record<string, EnhancedEnemyData> = {

  // ===== 👑 พระยานาค - ราชาแห่งพญานาค =====
  phraya_naga_boss: {
    id: 'phraya_naga_boss',
    name: 'พระยานาค',
    tier: 'boss',
    hp: 180,
    maxHp: 180,
    block: 10,
    
    // พฤติกรรมซับซ้อนหลายขั้น
    behaviors: [
      {
        id: 'royal_presence',            // ราชาภิสักดิ์
        condition: 'always',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'fear', stacks: 1, duration: 2 },
        priority: 5,
        oncePerCombat: true              // เริ่มต้นเท่านั้น
      },
      {
        id: 'water_domain_control',      // ควบคุมอาณาจักรน้ำ
        condition: 'turn_3_or_later',
        action: 'cast_spell',            // เปลี่ยนเป็น cast_spell
        actionValue: 'water_domain_spell',
        priority: 8,
        oncePerCombat: true
      },
      {
        id: 'naga_fury',                 // ความเดือดดาลของนาค
        condition: 'hp_below_50',
        action: 'enter_phase_2',
        priority: 10,
        oncePerCombat: true
      }
    ],
    
    // เวทมนตร์ทรงพลังหลายตัว
    spells: [
      {
        id: 'monsoon_summoning',
        name: 'การเรียกพายุมรสุม',
        description: 'เรียกพายุใหญ่ถล่มสนามรบ สร้างความเสียหายต่อเนื่อง',
        cost: 5,
        castTime: 3,
        effects: [
          { type: 'damage', value: 25, target: 'player', description: 'พายุถล่ม สร้างความเสียหายสูง' },
          { type: 'apply_status', value: 3, target: 'player', statusEffectId: 'weakness', duration: 4, description: 'ลมแรงทำให้อ่อนแอ' },
          { type: 'change_environment', value: 0, target: 'both', description: 'เปลี่ยนสภาพแวดล้อมเป็นโลกน้ำ' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 9
      },
      {
        id: 'serpent_army_call',
        name: 'การเรียกกองทัพงู',
        description: 'เรียกงูพันธุ์ต่าง ๆ มาช่วยรบ',
        cost: 4,
        castTime: 2,
        effects: [
          { type: 'summon_minion', value: 3, target: 'enemy', description: 'เรียกงูยักษ์ 3 ตัว' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 7
      },
      {
        id: 'naga_regeneration',
        name: 'การฟื้นฟูของนาค',
        description: 'ใช้พลังเทพเจ้าฟื้นฟูร่างกาย',
        cost: 6,
        castTime: 4,
        effects: [
          { type: 'heal', value: 40, target: 'enemy', description: 'รักษา HP 40 หน่วย' },
          { type: 'apply_status', value: 5, target: 'enemy', statusEffectId: 'regeneration', duration: 5, description: 'ฟื้นฟูต่อเนื่อง 5 เทิร์น' },
          { type: 'apply_status', value: 1, target: 'enemy', statusEffectId: 'strength', duration: 0, description: 'แข็งแกร่งขึ้นถาวร' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 6,
        oncePerCombat: true
      }
    ],
    
    // การเปลี่ยนเฟส - เฟสที่ 2 เมื่อ HP ต่ำกว่า 50%
    phaseChangeHP: 90,                  // HP 50% = 90/180
    phase2Behaviors: [
      {
        id: 'divine_wrath',              // ความโกรธศักดิ์สิทธิ์
        condition: 'always',
        action: 'double_attack',
        priority: 10,
        oncePerCombat: false
      },
      {
        id: 'tsunami_preparation',       // เตรียมสึนามิ
        condition: 'turn_even',
        action: 'cast_spell',
        actionValue: 'ultimate_tsunami',
        priority: 9,
        oncePerCombat: false
      }
    ],
    
    // เวทมนตร์เฟส 2
    phase2Spells: [
      {
        id: 'ultimate_tsunami',
        name: 'สึนามิมหาวินาศ',
        description: 'คลื่นยักษ์ถล่มทุกสิ่ง - เวทมนตร์สุดท้ายของพระยานาค',
        cost: 8,
        castTime: 5,                    // ใช้เวลาร่ายนาน
        effects: [
          { type: 'damage', value: 50, target: 'player', description: 'คลื่นสึนามิทำลายล้าง' },
          { type: 'force_discard', value: 3, target: 'player', description: 'น้ำท่วมพัดไพ่ไป 3 ใบ' },
          { type: 'drain_energy', value: 2, target: 'player', description: 'กระแสน้ำดูดพลังงาน' }
        ],
        telegraphed: true,
        interruptible: false,           // ไม่สามารถขัดจังหวะได้!
        priority: 10,
        oncePerCombat: true
      }
    ],
    
    // ภูมิคุ้มกันสถานะผล
    statusImmunities: ['poison', 'corruption'],
    startingStatusEffects: [
      { id: 'strength', name: 'แข็งแกร่ง', description: 'พลังแห่งเทพนาค', duration: 0, stacks: 2 }
    ],
    
    signatureCards: ['naga_strike', 'water_control', 'serpent_magic', 'divine_protection'],
    aiPersonality: 'adaptive',          // ปรับตัวตามผู้เล่น
    aiModifiers: {
      spellCastingPreference: 80,       // ใช้เวทมนตร์บ่อยมาก
      behaviorTriggerChance: 95,
      adaptationRate: 80                // ปรับตัวได้เร็วมาก
    },
    
    scaling: {
      dmgPerAct: 5,                     // เพิ่มความเสียหายเยอะ
      blockPerAct: 3,
      hpPerAct: 30,                     // HP เพิ่มขึ้นมาก
      spellPowerPerAct: 6,
      newAbilitiesPerAct: ['summon_naga_guards', 'weather_control']
    },
    
    // รางวัลบอส - ได้ของดี ๆ
    specialLoot: {
      cardRewards: ['naga_blessing', 'water_mastery', 'divine_protection'],
      equipmentRewards: ['naga_crown', 'serpent_staff', 'water_armor'],
      blessingRewards: ['blessing_of_naga_king', 'water_affinity', 'divine_favor'],
      goldBonus: 200                    // โบนัสทอง
    },
    
    preferredEnvironments: ['spirit_realm', 'royal_palace'],
    summonableMinions: ['serpent_guardian', 'water_spirit', 'naga_warrior'],
    maxMinions: 4                       // เรียกลูกน้องได้เยอะ
  }

  // TODO: เพิ่มบอสอื่น ๆ เช่น
  // - ghost_king (ราชาผี)
  // - demon_lord (เจ้าแห่งปีศาจ)
  // - ancient_spirit_master (นายวิญญาณโบราณ)
  // - thai_necromancer (หมอผีไทย)
};

/**
 * ฟังก์ชันช่วยเหลือสำหรับ Boss Enemies
 */

export function getBossEnemyById(enemyId: string): EnhancedEnemyData | undefined {
  return BOSS_ENEMIES[enemyId];
}

export function getAllBossEnemies(): Record<string, EnhancedEnemyData> {
  return BOSS_ENEMIES;
}

export function getBossEnemyIds(): string[] {
  return Object.keys(BOSS_ENEMIES);
}

export function getRandomBossEnemy(): EnhancedEnemyData {
  const enemyIds = getBossEnemyIds();
  const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
  return BOSS_ENEMIES[randomId];
}

// ตรวจสอบว่าบอสมีการเปลี่ยนเฟสหรือไม่
export function hasPhaseTwoMechanics(bossId: string): boolean {
  const boss = getBossEnemyById(bossId);
  return !!(boss?.phaseChangeHP && boss?.phase2Behaviors?.length);
}

/**
 * สถิติ Boss Enemies
 */
export const BOSS_ENEMY_STATS = {
  HP_RANGE: { min: 120, max: 200 },
  AVERAGE_SPELLS: 4,
  AVERAGE_BEHAVIORS: 5,
  OVERALL_DIFFICULTY: 9,
  PHASE_MECHANICS: true,
  ADAPTIVE_AI: true,
  
  PLAYER_TIPS: [
    "บอสมีหลายเฟส - เตรียมตัวสำหรับการเปลี่ยนแปลง",
    "การขัดจังหวะเวทมนตร์สำคัญมาก โดยเฉพาะเวทย์ใหญ่",
    "สังเกต pattern และปรับกลยุทธ์ให้เหมาะสม",
    "เก็บทรัพยากรไว้สำหรับเฟสสุดท้าย",
    "ระวังการเรียกลูกน้อง - จัดการก่อนที่จะล้นหลาม"
  ]
} as const;

/**
 * ระบบความยาก Boss แต่ละตัว
 */
export const BOSS_DIFFICULTY_RATING = {
  phraya_naga_boss: {
    difficulty: 8,
    mechanics: ['phase_change', 'environment_control', 'minion_summoning', 'ultimate_spell'],
    recommendedLevel: 15,
    strategyTips: [
      "ขัดจังหวะ 'การเรียกพายุมรสุม' ก่อนที่จะร่ายเสร็จ",
      "จัดการงูลูกน้องให้หมดก่อนโจมตีตัวจริง",
      "เก็บพลังงานและไพ่ดี ๆ ไว้สำหรับเฟส 2",
      "ระวัง 'สึนามิมหาวินาศ' - เป็นเวทมนตร์ที่ขัดจังหวะไม่ได้!"
    ]
  }
} as const;