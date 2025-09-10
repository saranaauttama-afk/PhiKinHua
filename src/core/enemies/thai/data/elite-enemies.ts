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
  },

  // ===== 👻 แม่นาคระดับยอด - วิญญาณผู้หญิงรักสามีมากเกินไป =====
  mae_nak_elite: {
    id: 'mae_nak_elite',
    name: 'แม่นาค',
    tier: 'elite',
    hp: 85,
    maxHp: 85,
    block: 3,
    
    behaviors: [
      {
        id: 'loving_obsession',            // ความรักบ้าคลั่ง
        condition: 'turn_2_or_later',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'charm', stacks: 2, duration: 4 },
        priority: 8,
        oncePerCombat: false
      },
      {
        id: 'protective_fury',             // ความโกรธป้องกัน
        condition: 'hp_below_50',
        action: 'change_ai_pattern',
        actionValue: 'protective_mode',
        priority: 9,
        oncePerCombat: true
      },
      {
        id: 'jealous_rage',                // ความหึงหวง
        condition: 'player_hp_above_75',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'strength', stacks: 3, duration: 3 },
        priority: 7,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'eternal_love_binding',
        name: 'พันธนาการรักนิรันดร์',
        description: 'ผูกมัดด้วยความรักที่ไม่มีวันจางหาย',
        cost: 4,
        castTime: 3,
        effects: [
          { type: 'apply_status', value: 3, target: 'player', statusEffectId: 'entangle', duration: 4, description: 'ผูกมัดด้วยพลังรัก' },
          { type: 'apply_status', value: 2, target: 'player', statusEffectId: 'weakness', duration: 3, description: 'ทำให้อ่อนแรงด้วยความรัก' },
          { type: 'heal', value: 15, target: 'enemy', description: 'รักษาตัวด้วยพลังรัก' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      },
      {
        id: 'haunting_lullaby',
        name: 'เพลงกล่อมผีสาง',
        description: 'เพลงกล่อมเด็กที่ทำให้หลับลึกและฝันร้าย',
        cost: 3,
        castTime: 2,
        effects: [
          { type: 'apply_status', value: 1, target: 'player', statusEffectId: 'sleep', duration: 2, description: 'ทำให้หลับลึก' },
          { type: 'damage', value: 12, target: 'player', description: 'ความเจ็บปวดในความฝัน' },
          { type: 'apply_status', value: 2, target: 'player', statusEffectId: 'nightmare', duration: 3, description: 'ฝันร้ายตามหลัง' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 7
      }
    ],
    
    phaseChangeHP: 35,                    // เปลี่ยนเฟสเมื่อ HP ≤ 35
    phase2Behaviors: [
      {
        id: 'desperate_love',
        condition: 'always',
        action: 'summon_minion',
        actionValue: 'spirit_child',
        priority: 10,
        oncePerCombat: false
      }
    ],
    
    signatureCards: ['loving_embrace', 'jealous_strike', 'protective_barrier', 'haunting_whisper'],
    aiPersonality: 'tactical',
    aiModifiers: {
      spellCastingPreference: 70,
      behaviorTriggerChance: 80,
      adaptationRate: 60
    },
    
    scaling: {
      dmgPerAct: 3,
      blockPerAct: 2,
      hpPerAct: 18,
      spellPowerPerAct: 4,
      newAbilitiesPerAct: ['summon_spirit_children']
    },
    
    specialLoot: {
      cardRewards: ['eternal_love', 'protective_instinct'],
      equipmentRewards: ['mothers_shawl'],
      blessingRewards: ['motherly_protection'],
      goldBonus: 65
    },
    
    preferredEnvironments: ['haunted_house', 'spirit_realm'],
    summonableMinions: ['spirit_child', 'protective_aura'],
    maxMinions: 2
  },

  // ===== ☠️ ผีตายโหงระดับยอด - วิญญาณแค้นที่ทรงพลัง =====
  phi_tai_hong_elite: {
    id: 'phi_tai_hong_elite',
    name: 'ผีตายโหงยอดยอด',
    tier: 'elite',
    hp: 92,
    maxHp: 92,
    block: 2,
    
    behaviors: [
      {
        id: 'vengeful_aura',               // กรรมแห่งความแค้น
        condition: 'always',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'curse', stacks: 1, duration: 0 }, // ถาวร
        priority: 9,
        oncePerCombat: true
      },
      {
        id: 'death_echoes',                // เสียงสะท้อนแห่งความตาย
        condition: 'turn_even',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'fear', stacks: 2, duration: 2 },
        priority: 7,
        oncePerCombat: false
      },
      {
        id: 'final_revenge',               // การแก้แค้นสุดท้าย
        condition: 'hp_below_30',
        action: 'double_attack',
        priority: 10,
        oncePerCombat: false
      }
    ],
    
    spells: [
      {
        id: 'wrath_of_the_wronged',
        name: 'ความโกรธของผู้ถูกปฏิบัติผิด',
        description: 'พลังแค้นที่สะสมมานานระเบิดออกมา',
        cost: 5,
        castTime: 3,
        effects: [
          { type: 'damage', value: 28, target: 'player', description: 'พลังแค้นระเบิด' },
          { type: 'apply_status', value: 3, target: 'player', statusEffectId: 'curse', duration: 5, description: 'คำสาปแค้น' },
          { type: 'apply_status', value: 2, target: 'enemy', statusEffectId: 'strength', duration: 4, description: 'แข็งแกร่งจากความแค้น' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 9
      },
      {
        id: 'tormented_souls_call',
        name: 'การเรียกวิญญาณทุกข์ทรมาน',
        description: 'เรียกวิญญาณผู้ตายอื่น ๆ มาช่วยแก้แค้น',
        cost: 4,
        castTime: 2,
        effects: [
          { type: 'summon_minion', value: 2, target: 'enemy', description: 'เรียกวิญญาณแค้น 2 ตัว' },
          { type: 'apply_status', value: 1, target: 'player', statusEffectId: 'vulnerability', duration: 3, description: 'ทำให้เปราะบาง' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      }
    ],
    
    phaseChangeHP: 30,                    // เปลี่ยนเฟสเมื่อ HP ≤ 30
    phase2Behaviors: [
      {
        id: 'death_throes',
        condition: 'always',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'doom', stacks: 1, duration: 5 },
        priority: 10,
        oncePerCombat: true
      }
    ],
    
    signatureCards: ['vengeful_strike', 'death_curse', 'soul_rend', 'wrathful_scream'],
    aiPersonality: 'aggressive',
    aiModifiers: {
      spellCastingPreference: 65,
      behaviorTriggerChance: 90,
      adaptationRate: 40
    },
    
    scaling: {
      dmgPerAct: 4,
      blockPerAct: 1,
      hpPerAct: 20,
      spellPowerPerAct: 5,
      newAbilitiesPerAct: ['mass_curse', 'death_domain']
    },
    
    specialLoot: {
      cardRewards: ['vengeful_spirit', 'death_magic'],
      equipmentRewards: ['cursed_amulet'],
      blessingRewards: ['spirit_resistance'],
      goldBonus: 70
    },
    
    preferredEnvironments: ['spirit_realm', 'cursed_forest'],
    summonableMinions: ['vengeful_spirit', 'tormented_soul'],
    maxMinions: 3
  },

  // ===== 👑 ราชินีกระสือ - กระสือขุนนางระดับสูง =====
  krasue_queen: {
    id: 'krasue_queen',
    name: 'ราชินีกระสือ',
    tier: 'elite',
    hp: 88,
    maxHp: 88,
    block: 4,
    
    behaviors: [
      {
        id: 'royal_presence',              // ราชาภิสักดิ์
        condition: 'always',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'intimidate', stacks: 2, duration: 0 }, // ถาวร
        priority: 8,
        oncePerCombat: true
      },
      {
        id: 'night_hunt_command',          // สั่งการล่ากลางคืน
        condition: 'turn_3_or_later',
        action: 'summon_minion',
        actionValue: 'krasue_servant',
        priority: 7,
        oncePerCombat: false
      },
      {
        id: 'blood_frenzy_queen',          // อาละวาดเลือดของราชินี
        condition: 'hp_below_40',
        action: 'change_ai_pattern',
        actionValue: 'frenzy_mode',
        priority: 9,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'royal_blood_feast',
        name: 'งานเลี้ยงเลือดหลวง',
        description: 'ราชินีกระสือจัดงานเลี้ยงเลือดอันโหดร้าย',
        cost: 5,
        castTime: 3,
        effects: [
          { type: 'damage', value: 22, target: 'player', description: 'ดูดเลือดอย่างดุร้าย' },
          { type: 'heal', value: 18, target: 'enemy', description: 'รักษาตัวด้วยเลือดที่ดูด' },
          { type: 'apply_status', value: 3, target: 'enemy', statusEffectId: 'regeneration', duration: 4, description: 'ฟื้นฟูต่อเนื่อง' },
          { type: 'apply_status', value: 2, target: 'player', statusEffectId: 'weakness', duration: 3, description: 'อ่อนแรงจากการสูญเสียเลือด' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 9
      },
      {
        id: 'krasue_army_summon',
        name: 'การเรียกกองทัพกระสือ',
        description: 'เรียกกระสือข้าใต้มาช่วยรบ',
        cost: 4,
        castTime: 2,
        effects: [
          { type: 'summon_minion', value: 3, target: 'enemy', description: 'เรียกกระสือข้าใต้ 3 ตัว' },
          { type: 'apply_status', value: 2, target: 'enemy', statusEffectId: 'strength', duration: 0, description: 'เสริมพลังให้กองทัพ' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      }
    ],
    
    phaseChangeHP: 35,                    // เปลี่ยนเฟสเมื่อ HP ≤ 35
    phase2Behaviors: [
      {
        id: 'royal_desperation',
        condition: 'always',
        action: 'triple_attack',           // โจมตี 3 ครั้ง
        priority: 10,
        oncePerCombat: false
      }
    ],
    
    signatureCards: ['royal_bite', 'blood_drain_queen', 'krasue_command', 'night_terror'],
    aiPersonality: 'tactical',
    aiModifiers: {
      spellCastingPreference: 75,
      behaviorTriggerChance: 85,
      adaptationRate: 65
    },
    
    scaling: {
      dmgPerAct: 3,
      blockPerAct: 2,
      hpPerAct: 16,
      spellPowerPerAct: 4,
      newAbilitiesPerAct: ['royal_decree', 'blood_magic_mastery']
    },
    
    specialLoot: {
      cardRewards: ['royal_blood_magic', 'krasue_dominion'],
      equipmentRewards: ['queen_crown', 'blood_amulet'],
      blessingRewards: ['royal_favor', 'night_hunter_blessing'],
      goldBonus: 80
    },
    
    preferredEnvironments: ['royal_palace', 'dark_forest'],
    summonableMinions: ['krasue_servant', 'blood_wraith'],
    maxMinions: 4
  },

  // ===== 🙏 พระผีระดับยอด - พระสงฆ์ที่ตกนรกคุ้มครองวัด =====
  ghost_monk_elite: {
    id: 'ghost_monk_elite',
    name: 'พระผีใหญ่',
    tier: 'elite',
    hp: 95,
    maxHp: 95,
    block: 6,
    
    behaviors: [
      {
        id: 'corrupted_blessing',          // พรที่เสื่อมทราม
        condition: 'turn_2_or_later',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'curse', stacks: 2, duration: 4 },
        priority: 7,
        oncePerCombat: false
      },
      {
        id: 'temple_guardian_wrath',       // ความโกรธผู้พิทักษ์วัด
        condition: 'player_hp_below_60',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'divine_protection', stacks: 3, duration: 3 },
        priority: 8,
        oncePerCombat: true
      },
      {
        id: 'fallen_monk_despair',        // ความสิ้นหวังของพระตกนรก
        condition: 'hp_below_30',
        action: 'cast_spell',
        actionValue: 'final_sermon',
        priority: 10,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'corrupted_chant',
        name: 'คาถาที่เสื่อมทราม',
        description: 'บทสวดที่ถูกความชั่วร้ายครอบงำ',
        cost: 4,
        castTime: 3,
        effects: [
          { type: 'apply_status', value: 3, target: 'player', statusEffectId: 'confusion', duration: 4, description: 'ทำให้สับสนจากคาถาเสื่อมทราม' },
          { type: 'apply_status', value: 2, target: 'player', statusEffectId: 'silence', duration: 2, description: 'ปิดปากไม่ให้ใช้เวทมนตร์' },
          { type: 'apply_status', value: 2, target: 'enemy', statusEffectId: 'block_next', duration: 2, description: 'ป้องกันด้วยพลังคาถา' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      },
      {
        id: 'temple_sanctuary',
        name: 'การสร้างวิหารคุ้มกัน',
        description: 'เรียกพลังศักดิ์สิทธิ์ที่เสื่อมทรามมาป้องกัน',
        cost: 5,
        castTime: 4,
        effects: [
          { type: 'change_environment', value: 0, target: 'both', description: 'เปลี่ยนเป็นสภาพแวดล้อมวัดร่วง' },
          { type: 'apply_status', value: 5, target: 'enemy', statusEffectId: 'regeneration', duration: 5, description: 'รักษาต่อเนื่องในวิหาร' },
          { type: 'summon_minion', value: 2, target: 'enemy', description: 'เรียกวิญญาณศิษย์มาช่วย' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 7
      }
    ],
    
    phaseChangeHP: 40,                    // เปลี่ยนเฟสเมื่อ HP ≤ 40
    phase2Behaviors: [
      {
        id: 'final_sermon',
        condition: 'always',
        action: 'cast_spell',
        actionValue: 'damnation_prayer',
        priority: 10,
        oncePerCombat: false
      }
    ],
    
    phase2Spells: [
      {
        id: 'damnation_prayer',
        name: 'บทสวดแห่งการสาปสูญ',
        description: 'บทสวดสุดท้ายของพระผีที่ต้องการลากทุกคนลงนรก',
        cost: 6,
        castTime: 4,
        effects: [
          { type: 'damage', value: 25, target: 'player', description: 'พลังคำสาปทำลายล้าง' },
          { type: 'apply_status', value: 4, target: 'player', statusEffectId: 'doom', duration: 4, description: 'คำสาปสูญสูญ' },
          { type: 'heal', value: 20, target: 'enemy', description: 'ฟื้นฟูด้วยพลังคำสาป' }
        ],
        telegraphed: true,
        interruptible: false,              // ไม่สามารถขัดจังหวะได้
        priority: 10,
        oncePerCombat: true
      }
    ],
    
    statusImmunities: ['charm', 'fear'],   // ภูมิคุ้มกันสถานะผล
    startingStatusEffects: [
      { id: 'divine_protection', name: 'ป้องกันศักดิ์สิทธิ์', description: 'พลังคุ้มครองที่เสื่อมทราม', duration: 0, stacks: 2 }
    ],
    
    signatureCards: ['corrupted_blessing', 'temple_strike', 'fallen_prayer', 'sanctuary_defense'],
    aiPersonality: 'defensive',
    aiModifiers: {
      spellCastingPreference: 80,
      behaviorTriggerChance: 75,
      adaptationRate: 55
    },
    
    scaling: {
      dmgPerAct: 2,
      blockPerAct: 3,
      hpPerAct: 22,
      spellPowerPerAct: 5,
      newAbilitiesPerAct: ['mass_blessing_curse', 'temple_domain']
    },
    
    specialLoot: {
      cardRewards: ['fallen_monk_wisdom', 'corrupted_prayer'],
      equipmentRewards: ['cursed_prayer_beads', 'fallen_monk_robe'],
      blessingRewards: ['dark_enlightenment', 'temple_guardian_spirit'],
      goldBonus: 75
    },
    
    preferredEnvironments: ['abandoned_temple', 'spirit_realm'],
    summonableMinions: ['ghost_disciple', 'temple_guardian_spirit'],
    maxMinions: 3
  }
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