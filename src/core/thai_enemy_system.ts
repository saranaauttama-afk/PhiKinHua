// src/core/thai_enemy_system.ts — Full Thai Enemy Mechanics Implementation

import type { 
  EnhancedEnemyData, 
  EnemyBehavior, 
  EnemySpell, 
  StatusEffect,
  StatusEffectDefinition,
  StatusEffectType,
  BattleEnvironment,
  MinionData
} from './types_extended';

// ===== Status Effect Registry =====
export const STATUS_EFFECTS: Record<StatusEffectType, StatusEffectDefinition> = {
  fear: {
    id: 'fear',
    name: 'Fear',
    description: 'Reduce energy by 1 and randomly discard 1 card',
    defaultDuration: 2,
    stackable: true,
    maxStacks: 3,
    onTurnStart: (target, stacks) => {
      // Implementation will be in combat system
    }
  },
  poison: {
    id: 'poison',
    name: 'Poison',
    description: 'Take damage at end of turn',
    defaultDuration: 3,
    stackable: true,
    maxStacks: 10
  },
  curse: {
    id: 'curse',
    name: 'Curse',
    description: 'Take +1 damage from all sources per stack',
    defaultDuration: 5,
    stackable: true,
    maxStacks: 5
  },
  corruption: {
    id: 'corruption',
    name: 'Corruption',
    description: 'Cards in hand cost +1 energy',
    defaultDuration: 3,
    stackable: false
  },
  entangle: {
    id: 'entangle',
    name: 'Entangle',
    description: 'Cannot play attack cards',
    defaultDuration: 2,
    stackable: false
  },
  weakness: {
    id: 'weakness', 
    name: 'Weakness',
    description: 'Deal 50% less damage',
    defaultDuration: 2,
    stackable: false
  },
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    description: 'Take 50% more damage',
    defaultDuration: 2,
    stackable: false
  },
  regeneration: {
    id: 'regeneration',
    name: 'Regeneration', 
    description: 'Heal HP at start of turn',
    defaultDuration: 5,
    stackable: true,
    maxStacks: 5
  },
  strength: {
    id: 'strength',
    name: 'Strength',
    description: 'Deal +X damage per stack',
    defaultDuration: 0, // Permanent until removed
    stackable: true,
    maxStacks: 10
  },
  block_next: {
    id: 'block_next',
    name: 'Block Next',
    description: 'Block next X damage',
    defaultDuration: 1,
    stackable: true
  },
  energy_boost: {
    id: 'energy_boost',
    name: 'Energy Boost',
    description: 'Gain +X energy next turn',
    defaultDuration: 1,
    stackable: true
  },
  draw_reduction: {
    id: 'draw_reduction',
    name: 'Draw Reduction',
    description: 'Draw X fewer cards',
    defaultDuration: 2,
    stackable: true,
    maxStacks: 3
  },
  spell_charging: {
    id: 'spell_charging',
    name: 'Spell Charging',
    description: 'Charging a powerful spell',
    defaultDuration: 0, // Special handling
    stackable: false
  }
};

// ===== Battle Environments =====
export const THAI_ENVIRONMENTS: Record<string, BattleEnvironment> = {
  haunted_house: {
    id: 'haunted_house',
    name: 'Haunted House',
    description: 'The spirits of the old house whisper dark magic',
    playerEffects: [
      { type: 'card_cost_modifier', value: 1, description: 'All cards cost +1 energy' }
    ],
    enemyEffects: [
      { type: 'damage_modifier', value: 2, description: 'All attacks deal +2 damage' }
    ],
    neutralEffects: []
  },
  dark_forest: {
    id: 'dark_forest',
    name: 'Dark Forest',
    description: 'Ancient trees hide malevolent spirits',
    playerEffects: [
      { type: 'draw_modifier', value: -1, description: 'Draw 1 fewer card per turn' }
    ],
    enemyEffects: [
      { type: 'energy_modifier', value: 1, description: 'Start each turn with +1 energy' }
    ],
    neutralEffects: [
      { type: 'spell_boost', value: 25, description: 'All spells 25% more powerful' }
    ]
  },
  royal_palace: {
    id: 'royal_palace',
    name: 'Royal Palace',
    description: 'Divine power flows through the ancient halls',
    playerEffects: [
      { type: 'block_modifier', value: -2, description: 'All block effects reduced by 2' }
    ],
    enemyEffects: [
      { type: 'status_immunity', value: 0, condition: 'curse,poison', description: 'Immune to curse and poison' }
    ],
    neutralEffects: []
  },
  spirit_realm: {
    id: 'spirit_realm',
    name: 'Spirit Realm',
    description: 'The boundary between life and death grows thin',
    playerEffects: [
      { type: 'energy_modifier', value: 1, description: 'Start with +1 energy' }
    ],
    enemyEffects: [
      { type: 'energy_modifier', value: 1, description: 'Start with +1 energy' }
    ],
    neutralEffects: [
      { type: 'spell_boost', value: 50, description: 'All magical effects 50% stronger' }
    ]
  }
};

// ===== Minion Definitions =====
export const THAI_MINIONS: Record<string, MinionData> = {
  ghost_ally: {
    id: 'ghost_ally',
    name: 'Ghost Ally',
    hp: 3,
    maxHp: 3,
    attack: 4,
    duration: 3,
    owner: 'player',
    ai: 'aggressive',
    abilities: ['phase_attack'] // Can attack through block
  },
  demon_minion: {
    id: 'demon_minion', 
    name: 'Demon Minion',
    hp: 4,
    maxHp: 4,
    attack: 3,
    duration: 5,
    owner: 'player',
    ai: 'aggressive'
  },
  kuman_spirit: {
    id: 'kuman_spirit',
    name: 'Kuman Spirit',
    hp: 8,
    maxHp: 8,
    attack: 2,
    duration: 0, // Permanent until destroyed
    owner: 'player',
    ai: 'support',
    abilities: ['heal_player_2'] // Heals player 2 HP per turn
  },
  shadow_clone: {
    id: 'shadow_clone',
    name: 'Shadow Clone',
    hp: 15,
    maxHp: 15,
    attack: 8,
    duration: 4,
    owner: 'enemy',
    ai: 'aggressive',
    abilities: ['copy_enemy_attacks'] // Copies enemy's last attack
  },
  tree_guardian: {
    id: 'tree_guardian',
    name: 'Tree Guardian',
    hp: 12,
    maxHp: 12,
    attack: 5,
    duration: 6,
    owner: 'enemy', 
    ai: 'defensive',
    abilities: ['root_entangle'] // Can apply entangle to player
  }
};

// ===== Thai Enemy Definitions =====
export const THAI_ENEMIES: Record<string, EnhancedEnemyData> = {
  // ===== NORMAL ENEMIES =====
  phi_pong: {
    id: 'phi_pong',
    name: 'ผีโป่ง',
    tier: 'normal',
    hp: 35,
    maxHp: 35,
    block: 0,
    
    behaviors: [
      {
        id: 'floating_evasion',
        condition: 'player_hp_below_50',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'block_next', stacks: 8, duration: 1 },
        priority: 8,
        oncePerCombat: false
      },
      {
        id: 'fear_wail',
        condition: 'turn_3_or_later', 
        action: 'apply_status_to_player',
        actionValue: { statusId: 'fear', stacks: 1, duration: 2 },
        priority: 6,
        oncePerCombat: false
      }
    ],
    
    spells: [
      {
        id: 'ghostly_phase',
        name: 'Ghostly Phase',
        description: 'Become untouchable for 2 turns',
        cost: 2,
        castTime: 2,
        effects: [
          { type: 'apply_status', value: 2, target: 'enemy', statusEffectId: 'block_next', duration: 2, description: 'Block all damage for 2 turns' }
        ],
        telegraphed: true,
        interruptible: false,
        priority: 7
      }
    ],
    
    signatureCards: ['phase_strike', 'floating_dodge', 'ghost_wail'],
    aiPersonality: 'chaotic',
    aiModifiers: {
      spellCastingPreference: 30,
      behaviorTriggerChance: 70,
      adaptationRate: 20
    },
    
    scaling: {
      dmgPerAct: 1,
      blockPerAct: 1,
      spellPowerPerAct: 2
    },
    
    preferredEnvironments: ['haunted_house', 'spirit_realm']
  },

  phi_krasue: {
    id: 'phi_krasue',
    name: 'ผีกระสือ',
    tier: 'normal',
    hp: 32,
    maxHp: 32,
    block: 0,
    
    behaviors: [
      {
        id: 'night_hunter',
        condition: 'turn_even',
        action: 'double_attack',
        priority: 9,
        oncePerCombat: false
      },
      {
        id: 'blood_frenzy',
        condition: 'hp_below_50',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'strength', stacks: 3, duration: 0 },
        priority: 8,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'blood_moon_hunt',
        name: 'Blood Moon Hunt', 
        description: 'Devastating night attack that grows stronger with each kill',
        cost: 3,
        castTime: 2,
        effects: [
          { type: 'damage', value: 18, target: 'player', description: 'Deal massive damage' },
          { type: 'heal', value: 8, target: 'enemy', description: 'Heal from the hunt' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 9
      }
    ],
    
    signatureCards: ['blood_drain', 'night_hunt', 'stealth_approach'],
    aiPersonality: 'aggressive',
    aiModifiers: {
      spellCastingPreference: 40,
      behaviorTriggerChance: 80,
      adaptationRate: 30
    },
    
    scaling: {
      dmgPerAct: 2,
      blockPerAct: 0,
      spellPowerPerAct: 3
    },
    
    preferredEnvironments: ['dark_forest', 'spirit_realm']
  },

  // ===== ELITE ENEMIES =====
  nang_tani_elite: {
    id: 'nang_tani_elite',
    name: 'นางตานี',
    tier: 'elite',
    hp: 85,
    maxHp: 85,
    block: 0,
    
    phaseChangeHP: 40,
    
    behaviors: [
      {
        id: 'forest_command',
        condition: 'always',
        action: 'summon_minion',
        actionValue: { minionId: 'tree_guardian', maxCount: 2 },
        priority: 7,
        oncePerCombat: false
      },
      {
        id: 'nature_regeneration',
        condition: 'hp_below_50',
        action: 'apply_status_to_self',
        actionValue: { statusId: 'regeneration', stacks: 5, duration: 5 },
        priority: 8,
        oncePerCombat: true
      }
    ],
    
    phase2Behaviors: [
      {
        id: 'forest_wrath',
        condition: 'phase_2',
        action: 'cast_spell',
        actionValue: 'forest_awakening',
        priority: 10,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'vine_prison',
        name: 'Vine Prison',
        description: 'Entangle the player with supernatural vines',
        cost: 2,
        castTime: 1,
        effects: [
          { type: 'apply_status', value: 3, target: 'player', statusEffectId: 'entangle', duration: 3, description: 'Cannot play attack cards' },
          { type: 'damage', value: 6, target: 'player', description: 'Crushing vine damage' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 7
      },
      {
        id: 'forest_awakening',
        name: 'Forest Awakening',
        description: 'Call forth the ancient power of the forest',
        cost: 4,
        castTime: 3,
        effects: [
          { type: 'summon_minion', value: 3, target: 'enemy', description: 'Summon 3 Tree Guardians' },
          { type: 'apply_status', value: 10, target: 'enemy', statusEffectId: 'regeneration', duration: 10, description: 'Massive regeneration' },
          { type: 'change_environment', value: 0, target: 'both', description: 'Transform battlefield to Dark Forest' }
        ],
        telegraphed: true,
        interruptible: false,
        oncePerCombat: true,
        priority: 10
      }
    ],
    
    signatureCards: ['vine_entangle', 'poison_fruit', 'tree_regeneration', 'forest_command'],
    aiPersonality: 'tactical',
    aiModifiers: {
      spellCastingPreference: 60,
      behaviorTriggerChance: 85,
      adaptationRate: 40
    },
    
    scaling: {
      dmgPerAct: 2,
      blockPerAct: 1,
      hpPerAct: 15,
      spellPowerPerAct: 5
    },
    
    summonableMinions: ['tree_guardian'],
    maxMinions: 3,
    
    preferredEnvironments: ['dark_forest'],
    environmentBonuses: {
      dark_forest: [
        { type: 'spell_boost', value: 50, description: 'Forest spells 50% more powerful' }
      ]
    },
    
    specialLoot: {
      cardRewards: ['nature_blessing', 'tree_ally'],
      equipmentRewards: ['bark_armor', 'living_wood_staff'],
      goldBonus: 15
    }
  },

  // ===== BOSS ENEMIES =====
  mara_boss: {
    id: 'mara_boss',
    name: 'มาร',
    tier: 'boss',
    hp: 190,
    maxHp: 190,
    block: 0,
    
    phaseChangeHP: 95,
    
    behaviors: [
      {
        id: 'corruption_aura',
        condition: 'always',
        action: 'apply_status_to_player',
        actionValue: { statusId: 'corruption', stacks: 1, duration: 3 },
        priority: 9,
        oncePerCombat: false
      },
      {
        id: 'ultimate_evil',
        condition: 'hp_below_25',
        action: 'cast_spell',
        actionValue: 'apocalypse',
        priority: 10,
        oncePerCombat: true
      }
    ],
    
    phase2Behaviors: [
      {
        id: 'shadow_clones',
        condition: 'phase_2',
        action: 'summon_minion',
        actionValue: { minionId: 'shadow_clone', maxCount: 2 },
        priority: 9,
        oncePerCombat: true
      },
      {
        id: 'environment_corruption',
        condition: 'phase_2',
        action: 'change_ai_pattern', // Fixed invalid action type
        actionValue: 'spirit_realm',
        priority: 8,
        oncePerCombat: true
      }
    ],
    
    spells: [
      {
        id: 'mind_corruption',
        name: 'Mind Corruption',
        description: 'Corrupt the player\'s mind and cards',
        cost: 3,
        castTime: 2,
        effects: [
          { type: 'apply_status', value: 2, target: 'player', statusEffectId: 'corruption', duration: 5, description: 'Cards cost +1 energy' },
          { type: 'force_discard', value: 3, target: 'player', description: 'Discard 3 cards' },
          { type: 'drain_energy', value: 2, target: 'player', description: 'Lose 2 energy' }
        ],
        telegraphed: true,
        interruptible: true,
        priority: 8
      },
      {
        id: 'apocalypse',
        name: 'Apocalypse',
        description: 'The ultimate expression of evil power',
        cost: 5,
        castTime: 4,
        effects: [
          { type: 'damage', value: 35, target: 'player', description: 'Devastating apocalyptic damage' },
          { type: 'apply_status', value: 5, target: 'player', statusEffectId: 'curse', duration: 10, description: 'Permanent curse' },
          { type: 'apply_status', value: 10, target: 'enemy', statusEffectId: 'strength', duration: 0, description: 'Massive power boost' },
          { type: 'summon_minion', value: 2, target: 'enemy', description: 'Summon apocalyptic minions' }
        ],
        telegraphed: true,
        interruptible: false,
        oncePerCombat: true,
        priority: 10
      }
    ],
    
    signatureCards: ['darkness_wave', 'corrupt_mind', 'evil_regeneration', 'apocalypse_herald'],
    aiPersonality: 'adaptive',
    aiModifiers: {
      spellCastingPreference: 80,
      behaviorTriggerChance: 95,
      adaptationRate: 70
    },
    
    scaling: {
      dmgPerAct: 3,
      blockPerAct: 2,
      hpPerAct: 30,
      spellPowerPerAct: 10,
      newAbilitiesPerAct: ['shadow_mastery', 'reality_distortion']
    },
    
    statusImmunities: ['fear', 'poison'],
    startingStatusEffects: [
      { id: 'strength', name: 'Ultimate Evil', description: 'Inherent malevolent power', duration: 0, stacks: 5 }
    ],
    
    summonableMinions: ['shadow_clone', 'demon_minion'],
    maxMinions: 4,
    
    preferredEnvironments: ['spirit_realm'],
    environmentBonuses: {
      spirit_realm: [
        { type: 'spell_boost', value: 100, description: 'All spells doubled in power' },
        { type: 'damage_modifier', value: 5, description: 'All attacks deal +5 damage' }
      ]
    },
    
    specialLoot: {
      cardRewards: ['darkness_mastery', 'evil_transcendence'],
      equipmentRewards: ['mara_crown', 'corruption_essence'],
      blessingRewards: ['conquered_darkness'],
      goldBonus: 50
    }
  }
};

// Helper functions for system integration
export function getEnemyBehaviors(enemyId: string): EnemyBehavior[] {
  return THAI_ENEMIES[enemyId]?.behaviors || [];
}

export function getEnemySpells(enemyId: string): EnemySpell[] {
  return THAI_ENEMIES[enemyId]?.spells || [];
}

export function getStatusEffect(statusId: StatusEffectType): StatusEffectDefinition {
  return STATUS_EFFECTS[statusId];
}

export function createStatusEffect(
  statusId: StatusEffectType,
  duration?: number,
  stacks = 1,
  value?: number
): StatusEffect {
  const def = STATUS_EFFECTS[statusId];
  return {
    id: statusId,
    name: def.name,
    description: def.description,
    duration: duration ?? def.defaultDuration,
    stacks: def.stackable ? stacks : 1,
    value,
    tags: def.tags
  };
}