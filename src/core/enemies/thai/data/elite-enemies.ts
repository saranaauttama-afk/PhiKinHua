// src/core/enemies/thai/data/elite-enemies.ts — ศัตรูระดับยอดยอดในระบบไทย

import type { EnhancedEnemyData } from '../../../types_extended';

/**
 * คลังข้อมูลศัตรูระดับยอดยอด (Elite Tier)
 * 
 * ลักษณะของศัตรูระดับนี้:
 * - HP: 60-100 หน่วย  
 * - พฤติกรรมซับซ้อนมากขึ้น
 * - มีเวทมนตร์ 2-3 ตัว
 * - มีการเปลี่ยนเฟสการต่อสู้
 * - ให้รางวัลดีกว่าศัตรูธรรมดา
 */
export const ELITE_ENEMIES: Record<string, EnhancedEnemyData> = {

  // ===== 🌺 นางตานี - วิญญาณต้นตาล =====
  nang_tani_elite: {
    id: 'nang_tani_elite',
    name: 'นางตานี',
    tier: 'elite',
    hp: 75,
    maxHp: 75,
    block: 5,
    
    // พฤติกรรมซับซ้อน
    behaviors: [
      {
        id: 'nature_blessing',           // พรแห่งธรรมชาติ
        condition: 'turn_3_or_later',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'regeneration', stacks: 3, duration: 5 },
        priority: 7,
        oncePerCombat: true
      },
      {
        id: 'entangle_roots',            // รากไม้พันธนาการ
        condition: 'player_hp_below_50',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'entangle', stacks: 1, duration: 3 },
        priority: 8,
        oncePerCombat: false
      },
      {
        id: 'forest_wrath',              // ความโกรธของป่า
        condition: 'hp_below_25',
        action: 'change_ai_pattern',
        actionValue: 'berserk_mode',
        priority: 9,
        oncePerCombat: true
      }
    ],
    
    // เวทมนตร์ทรงพลัง
    spells: [
      {
        id: 'forest_domain',
        name: 'อาณาจักรป่าไผ่',
        description: 'เปลี่ยนสนามรบให้เป็นป่าทึบ เรียกผู้พิทักษ์มาช่วย',
        cost: 4,
        castTime: 3,
        effects: [
          { type: 'change_environment', value: 0, target: 'both', description: 'เปลี่ยนเป็นสภาพแวดล้อมป่าทึบ' },
          { type: 'summon_minion', value: 2, target: 'enemy', description: 'เรียกผู้พิทักษ์ต้นไม้ 2 ตัว' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      },
      {
        id: 'nature_heal',
        name: 'การรักษาแห่งธรรมชาติ',
        description: 'ดูดพลังจากธรรมชาติมารักษาตัว',
        cost: 3,
        castTime: 2,
        effects: [
          { type: 'heal', value: 25, target: 'enemy', description: 'รักษา HP 25 หน่วย' },
          { type: 'apply_status', value: 3, target: 'enemy', statusEffectId: 'regeneration', duration: 3, description: 'ฟื้นฟูต่อเนื่อง' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 6
      }
    ],
    
    // การเปลี่ยนเฟส
    phaseChangeHP: 25,                  // เปลี่ยนเฟสเมื่อ HP ≤ 25
    phase2Behaviors: [
      {
        id: 'desperate_thorns',
        condition: 'always',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'poison', stacks: 2, duration: 4 },
        priority: 10,
        oncePerCombat: false
      }
    ],
    
    signatureCards: ['thorn_whip', 'nature_blessing', 'root_bind', 'forest_call'],
    aiPersonality: 'tactical',          // ชำนาญการ วางแผน
    aiModifiers: {
      spellCastingPreference: 60,       // ชอบใช้เวทมนตร์
      behaviorTriggerChance: 85,
      adaptationRate: 50
    },
    
    scaling: {
      dmgPerAct: 3,
      blockPerAct: 2,
      hpPerAct: 15,                     // HP เพิ่มขึ้นด้วย
      spellPowerPerAct: 4,
      newAbilitiesPerAct: ['summon_extra_minions']
    },
    
    // รางวัลพิเศษ
    specialLoot: {
      cardRewards: ['nature_magic', 'healing_herbs'],
      equipmentRewards: ['thorn_armor'],
      blessingRewards: ['nature_affinity'],
      goldBonus: 50
    },
    
    preferredEnvironments: ['dark_forest', 'cursed_forest'],
    summonableMinions: ['tree_guardian'],
    maxMinions: 2
  }

  // TODO: เพิ่มศัตรู Elite อื่น ๆ เช่น
  // - mae_nak_elite (แม่นาคระดับยอด)
  // - phi_tai_hong_elite (ผีตายโหงระดับยอด)
  // - krasue_queen (ราชินีกระสือ)
  // - ghost_monk_elite (พระผีระดับยอด)
};

/**
 * ฟังก์ชันช่วยเหลือสำหรับ Elite Enemies
 */

export function getEliteEnemyById(enemyId: string): EnhancedEnemyData | undefined {
  return ELITE_ENEMIES[enemyId];
}

export function getAllEliteEnemies(): Record<string, EnhancedEnemyData> {
  return ELITE_ENEMIES;
}

export function getEliteEnemyIds(): string[] {
  return Object.keys(ELITE_ENEMIES);
}

export function getRandomEliteEnemy(): EnhancedEnemyData {
  const enemyIds = getEliteEnemyIds();
  const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
  return ELITE_ENEMIES[randomId];
}

/**
 * สถิติ Elite Enemies
 */
export const ELITE_ENEMY_STATS = {
  HP_RANGE: { min: 60, max: 100 },
  AVERAGE_SPELLS: 2.5,
  AVERAGE_BEHAVIORS: 3,
  OVERALL_DIFFICULTY: 6,
  PHASE_CHANGE_COMMON: true,
  
  PLAYER_TIPS: [
    "ศัตรู Elite มีการเปลี่ยนเฟสการต่อสู้",
    "เตรียมพร้อมสำหรับการเรียกลูกน้อง",
    "การขัดจังหวะเวทมนตร์สำคัญมาก",
    "จับจังหวะโจมตีระหว่างที่กำลังร่ายเวทย์"
  ]
} as const;