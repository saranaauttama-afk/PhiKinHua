// src/core/thai_enemy_cards.ts — Signature cards for Thai enemies

export type ThaiEnemyCardDef = {
  id: string;
  owner: string;
  name: string;
  type: 'attack' | 'skill' | 'spell';
  energyCost: number;
  dmg?: number;
  block?: number;
  
  // Extended mechanics
  statusEffects?: {
    target: 'player' | 'enemy';
    statusId: string;
    stacks: number;
    duration: number;
  }[];
  
  conditions?: {
    type: 'hp_below' | 'status_present' | 'turn_number' | 'minions_present';
    value: any;
    bonusEffect?: string;
  }[];
  
  specialEffects?: {
    type: 'heal_self' | 'summon_minion' | 'force_discard' | 'drain_energy' | 'unblockable';
    value?: number;
    description: string;
  }[];
  
  description: string;
  tags?: string[];
};

// ===== PHI PONG (ผีโป่ง) SIGNATURE CARDS =====
const PHI_PONG_CARDS: ThaiEnemyCardDef[] = [
  {
    id: 'phase_strike',
    owner: 'phi_pong',
    name: 'Phase Strike',
    type: 'attack',
    energyCost: 1,
    dmg: 7,
    specialEffects: [
      { type: 'unblockable', description: 'This attack ignores block' }
    ],
    description: 'An ethereal attack that phases through defenses',
    tags: ['ghost', 'phase', 'unblockable']
  },
  {
    id: 'floating_dodge',
    owner: 'phi_pong',
    name: 'Floating Dodge',
    type: 'skill',
    energyCost: 1,
    block: 8,
    statusEffects: [
      { target: 'enemy', statusId: 'block_next', stacks: 5, duration: 1 }
    ],
    description: 'Float ethereally to avoid attacks',
    tags: ['ghost', 'defensive', 'evasion']
  },
  {
    id: 'ghost_wail',
    owner: 'phi_pong',
    name: 'Ghost Wail',
    type: 'attack',
    energyCost: 2,
    dmg: 5,
    statusEffects: [
      { target: 'player', statusId: 'fear', stacks: 1, duration: 2 }
    ],
    description: 'A terrifying wail that strikes fear into the living',
    tags: ['ghost', 'fear', 'debuff']
  }
];

// ===== PHI KRASUE (ผีกระสือ) SIGNATURE CARDS =====
const PHI_KRASUE_CARDS: ThaiEnemyCardDef[] = [
  {
    id: 'blood_drain',
    owner: 'phi_krasue',
    name: 'Blood Drain',
    type: 'attack',
    energyCost: 1,
    dmg: 6,
    specialEffects: [
      { type: 'heal_self', value: 3, description: 'Heal for half damage dealt' }
    ],
    description: 'Drains the victim\'s life force',
    tags: ['vampire', 'drain', 'heal']
  },
  {
    id: 'night_hunt',
    owner: 'phi_krasue',
    name: 'Night Hunt',
    type: 'attack',
    energyCost: 2,
    dmg: 12,
    conditions: [
      { 
        type: 'turn_number', 
        value: 'even', 
        bonusEffect: '+4 damage on even turns' 
      }
    ],
    description: 'A devastating attack that grows stronger in darkness',
    tags: ['hunt', 'night', 'conditional']
  },
  {
    id: 'stealth_approach',
    owner: 'phi_krasue', 
    name: 'Stealth Approach',
    type: 'skill',
    energyCost: 1,
    block: 5,
    statusEffects: [
      { target: 'enemy', statusId: 'block_next', stacks: 0, duration: 1 }
    ],
    specialEffects: [
      { type: 'unblockable', description: 'Next attack ignores block' }
    ],
    description: 'Disappear into shadows, preparing for an unblockable strike',
    tags: ['stealth', 'setup', 'unblockable']
  }
];

// ===== PHI RUEN (ผีเรือน) SIGNATURE CARDS =====
const PHI_RUEN_CARDS: ThaiEnemyCardDef[] = [
  {
    id: 'house_curse',
    owner: 'phi_ruen',
    name: 'House Curse',
    type: 'skill',
    energyCost: 1,
    block: 9,
    statusEffects: [
      { target: 'player', statusId: 'curse', stacks: 1, duration: 4 }
    ],
    description: 'Invoke the house\'s malevolent spirit to curse intruders',
    tags: ['curse', 'territory', 'defensive']
  },
  {
    id: 'territorial_strike',
    owner: 'phi_ruen',
    name: 'Territorial Strike',
    type: 'attack',
    energyCost: 1,
    dmg: 8,
    conditions: [
      {
        type: 'status_present',
        value: 'curse',
        bonusEffect: '+3 damage if player is cursed'
      }
    ],
    description: 'Strike intruders who dare violate the sacred home',
    tags: ['territory', 'conditional', 'curse']
  },
  {
    id: 'sanctuary_wall',
    owner: 'phi_ruen',
    name: 'Sanctuary Wall',
    type: 'skill',
    energyCost: 2,
    block: 15,
    description: 'Erect a protective barrier around the sacred house',
    tags: ['defensive', 'sanctuary', 'wall']
  }
];

// ===== NANG TANI ELITE (นางตานี) SIGNATURE CARDS =====
const NANG_TANI_CARDS: ThaiEnemyCardDef[] = [
  {
    id: 'vine_entangle',
    owner: 'nang_tani_elite',
    name: 'Vine Entangle',
    type: 'skill',
    energyCost: 1,
    block: 6,
    statusEffects: [
      { target: 'player', statusId: 'entangle', stacks: 1, duration: 2 }
    ],
    specialEffects: [
      { type: 'drain_energy', value: 1, description: 'Player loses 1 energy' }
    ],
    description: 'Ancient vines wrap around the enemy, restricting movement',
    tags: ['nature', 'entangle', 'control']
  },
  {
    id: 'poison_fruit',
    owner: 'nang_tani_elite',
    name: 'Poison Fruit',
    type: 'attack',
    energyCost: 2,
    dmg: 10,
    statusEffects: [
      { target: 'player', statusId: 'poison', stacks: 3, duration: 4 }
    ],
    description: 'Hurl cursed fruit that poisons the victim over time',
    tags: ['nature', 'poison', 'overtime']
  },
  {
    id: 'tree_regeneration',
    owner: 'nang_tani_elite',
    name: 'Tree Regeneration',
    type: 'skill',
    energyCost: 2,
    statusEffects: [
      { target: 'enemy', statusId: 'regeneration', stacks: 4, duration: 5 }
    ],
    description: 'Draw power from the ancient tree to heal wounds',
    tags: ['nature', 'heal', 'regeneration']
  },
  {
    id: 'forest_command',
    owner: 'nang_tani_elite',
    name: 'Forest Command',
    type: 'skill',
    energyCost: 3,
    specialEffects: [
      { type: 'summon_minion', value: 1, description: 'Summon Tree Guardian' }
    ],
    description: 'Command the forest spirits to aid in battle',
    tags: ['nature', 'summon', 'minion']
  }
];

// ===== PHI POP ELITE (ผีปอบ) SIGNATURE CARDS =====
const PHI_POP_CARDS: ThaiEnemyCardDef[] = [
  {
    id: 'soul_corruption',
    owner: 'phi_pop_elite',
    name: 'Soul Corruption',
    type: 'attack',
    energyCost: 1,
    dmg: 8,
    specialEffects: [
      { type: 'heal_self', value: 4, description: 'Heal from corrupting the soul' }
    ],
    statusEffects: [
      { target: 'player', statusId: 'corruption', stacks: 1, duration: 3 }
    ],
    description: 'Corrupt the victim\'s soul while draining their life',
    tags: ['corruption', 'drain', 'evil']
  },
  {
    id: 'malevolent_aura',
    owner: 'phi_pop_elite',
    name: 'Malevolent Aura',
    type: 'skill',
    energyCost: 2,
    statusEffects: [
      { target: 'enemy', statusId: 'strength', stacks: 3, duration: 0 }
    ],
    description: 'Emanate pure malevolence, empowering all future attacks',
    tags: ['aura', 'buff', 'malevolent']
  },
  {
    id: 'life_drain_feast',
    owner: 'phi_pop_elite',
    name: 'Life Drain Feast',
    type: 'attack',
    energyCost: 3,
    dmg: 15,
    specialEffects: [
      { type: 'heal_self', value: 8, description: 'Massive healing from life drain' }
    ],
    conditions: [
      {
        type: 'hp_below',
        value: 50,
        bonusEffect: '+5 damage and +5 heal if below 50% HP'
      }
    ],
    description: 'A devastating feast on the victim\'s life force',
    tags: ['drain', 'feast', 'heal', 'conditional']
  }
];

// ===== PHRA RUANG BOSS (พระร่วง) SIGNATURE CARDS =====
const PHRA_RUANG_CARDS: ThaiEnemyCardDef[] = [
  {
    id: 'royal_decree',
    owner: 'phra_ruang_boss',
    name: 'Royal Decree',
    type: 'skill',
    energyCost: 2,
    specialEffects: [
      { 
        type: 'force_discard', 
        value: 2, 
        description: 'Force player to discard 2 cards' 
      }
    ],
    description: 'Issue a royal command that must be obeyed',
    tags: ['royal', 'command', 'control']
  },
  {
    id: 'divine_strike',
    owner: 'phra_ruang_boss',
    name: 'Divine Strike',
    type: 'attack',
    energyCost: 2,
    dmg: 14,
    specialEffects: [
      { type: 'unblockable', description: 'Divine power pierces all defenses' }
    ],
    description: 'A strike blessed with divine authority',
    tags: ['divine', 'unblockable', 'royal']
  },
  {
    id: 'royal_guard',
    owner: 'phra_ruang_boss',
    name: 'Royal Guard',
    type: 'skill',
    energyCost: 1,
    block: 10,
    statusEffects: [
      { target: 'enemy', statusId: 'block_next', stacks: 50, duration: 1 }
    ],
    description: 'Summon royal protection to reduce incoming damage',
    tags: ['royal', 'defensive', 'guard']
  },
  {
    id: 'apocalypse_herald',
    owner: 'phra_ruang_boss',
    name: 'Apocalypse Herald',
    type: 'skill',
    energyCost: 4,
    statusEffects: [
      { target: 'player', statusId: 'fear', stacks: 3, duration: 5 },
      { target: 'player', statusId: 'curse', stacks: 2, duration: 10 }
    ],
    description: 'Herald the coming apocalypse with divine wrath',
    tags: ['apocalypse', 'herald', 'divine', 'debuff']
  }
];

// ===== MARA BOSS (มาร) SIGNATURE CARDS =====
const MARA_CARDS: ThaiEnemyCardDef[] = [
  {
    id: 'darkness_wave',
    owner: 'mara_boss',
    name: 'Darkness Wave',
    type: 'attack',
    energyCost: 2,
    dmg: 16,
    statusEffects: [
      { target: 'player', statusId: 'corruption', stacks: 1, duration: 4 }
    ],
    description: 'A wave of pure darkness that corrupts everything it touches',
    tags: ['darkness', 'corruption', 'wave']
  },
  {
    id: 'corrupt_mind',
    owner: 'mara_boss',
    name: 'Corrupt Mind',
    type: 'skill',
    energyCost: 2,
    statusEffects: [
      { target: 'player', statusId: 'corruption', stacks: 2, duration: 5 }
    ],
    specialEffects: [
      { type: 'force_discard', value: 2, description: 'Force discard 2 cards' },
      { type: 'drain_energy', value: 1, description: 'Drain 1 energy' }
    ],
    description: 'Invade and corrupt the victim\'s mind directly',
    tags: ['mind', 'corruption', 'control']
  },
  {
    id: 'evil_regeneration',
    owner: 'mara_boss',
    name: 'Evil Regeneration',
    type: 'skill',
    energyCost: 1,
    statusEffects: [
      { target: 'enemy', statusId: 'regeneration', stacks: 6, duration: 10 }
    ],
    description: 'Channel ultimate evil to regenerate wounds',
    tags: ['evil', 'regeneration', 'heal']
  },
  {
    id: 'apocalypse_preparation',
    owner: 'mara_boss',
    name: 'Apocalypse Preparation',
    type: 'skill',
    energyCost: 3,
    statusEffects: [
      { target: 'enemy', statusId: 'spell_charging', stacks: 1, duration: 4 }
    ],
    specialEffects: [
      { type: 'summon_minion', value: 1, description: 'Summon Shadow Clone' }
    ],
    description: 'Begin preparations for the ultimate spell of destruction',
    tags: ['apocalypse', 'preparation', 'ultimate']
  }
];

// ===== CONSOLIDATED CARD REGISTRY =====
export const THAI_ENEMY_CARDS: ThaiEnemyCardDef[] = [
  ...PHI_PONG_CARDS,
  ...PHI_KRASUE_CARDS,
  ...PHI_RUEN_CARDS,
  ...NANG_TANI_CARDS,
  ...PHI_POP_CARDS,
  ...PHRA_RUANG_CARDS,
  ...MARA_CARDS
];

// ===== INDEX MAPS =====
const CARDS_BY_ID = new Map<string, ThaiEnemyCardDef>();
const CARDS_BY_OWNER = new Map<string, ThaiEnemyCardDef[]>();

for (const card of THAI_ENEMY_CARDS) {
  CARDS_BY_ID.set(card.id, card);
  
  if (!CARDS_BY_OWNER.has(card.owner)) {
    CARDS_BY_OWNER.set(card.owner, []);
  }
  CARDS_BY_OWNER.get(card.owner)!.push(card);
}

// ===== API FUNCTIONS =====
export function getThaiEnemyCard(id: string): ThaiEnemyCardDef | undefined {
  return CARDS_BY_ID.get(id);
}

export function getCardsForEnemy(enemyId: string): ThaiEnemyCardDef[] {
  return CARDS_BY_OWNER.get(enemyId) || [];
}

export function getAllThaiEnemyCards(): ThaiEnemyCardDef[] {
  return THAI_ENEMY_CARDS;
}

// Helper function to check if card has specific effect
export function cardHasEffect(card: ThaiEnemyCardDef, effectType: string): boolean {
  return card.specialEffects?.some(effect => effect.type === effectType) || false;
}

// Helper function to get card's status effects for target
export function getCardStatusEffects(card: ThaiEnemyCardDef, target: 'player' | 'enemy'): any[] {
  return card.statusEffects?.filter(effect => effect.target === target) || [];
}