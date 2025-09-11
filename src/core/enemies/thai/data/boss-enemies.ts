// src/core/enemies/thai/data/boss-enemies.ts — Simple Boss Enemies (Night of the Full Moon style)

import type { EnhancedEnemyData } from '../../../types_extended';

/**
 * Simplified Boss Enemies
 * - No complex behaviors or multiple phases
 * - No spells or multi-turn abilities
 * - Just higher stats and larger decks than elite enemies
 * - Simple, straightforward boss fights
 */
export const BOSS_ENEMIES: Record<string, EnhancedEnemyData> = {

  // ===== 👑 พระยานาค - Simple Naga King Boss =====
  phraya_naga_boss: {
    id: 'phraya_naga_boss',
    name: 'พระยานาค',
    tier: 'boss',
    hp: 180,
    maxHp: 180,
    dmg: 25,
    block: 10,
    
    // Boss deck - very powerful cards, more energy and hand size
    deck: {
      lists: [
        {
          id: 'boss_naga_deck',
          weight: 1,
          cards: [
            'maul', 'maul', 'maul', 'swipe', 'swipe', 
            'brace', 'guard', 'maul', 'swipe', 'brace',
            'maul', 'guard', 'swipe', 'brace', 'maul'
          ]
        }
      ],
      handSize: 5,
      maxEnergy: 5
    }
  },

  // ===== 👹 มหาผีสาง - Simple Great Demon Boss =====
  maha_phi_sang_boss: {
    id: 'maha_phi_sang_boss',
    name: 'มหาผีสาง',
    tier: 'boss',
    hp: 200,
    maxHp: 200,
    dmg: 22,
    block: 15,
    
    // Boss deck - defensive and aggressive mix
    deck: {
      lists: [
        {
          id: 'boss_demon_deck',
          weight: 1,
          cards: [
            'maul', 'maul', 'swipe', 'swipe', 'brace', 
            'brace', 'guard', 'guard', 'maul', 'swipe',
            'brace', 'guard', 'maul', 'swipe', 'brace'
          ]
        }
      ],
      handSize: 5,
      maxEnergy: 5
    }
  },

  // ===== 🐉 พญานาคราช - Simple Dragon King Boss =====
  naga_king_ultimate: {
    id: 'naga_king_ultimate',
    name: 'พญานาคราช',
    tier: 'boss',
    hp: 240,
    maxHp: 240,
    dmg: 28,
    block: 8,
    
    // Boss deck - ultimate boss power
    deck: {
      lists: [
        {
          id: 'boss_ultimate_deck',
          weight: 1,
          cards: [
            'maul', 'maul', 'maul', 'maul', 'swipe', 
            'swipe', 'swipe', 'brace', 'guard', 'maul',
            'swipe', 'brace', 'maul', 'swipe', 'guard',
            'maul', 'swipe', 'brace'
          ]
        }
      ],
      handSize: 6,
      maxEnergy: 6
    }
  }
};

/**
 * Helper functions for Boss Enemies
 */

// Get boss enemy by ID
export function getBossEnemyById(enemyId: string): EnhancedEnemyData | undefined {
  return BOSS_ENEMIES[enemyId];
}

// Get all boss enemies
export function getAllBossEnemies(): Record<string, EnhancedEnemyData> {
  return BOSS_ENEMIES;
}

// Get boss enemy IDs
export function getBossEnemyIds(): string[] {
  return Object.keys(BOSS_ENEMIES);
}

// Get random boss enemy
export function getRandomBossEnemy(): EnhancedEnemyData {
  const enemyIds = getBossEnemyIds();
  const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
  return BOSS_ENEMIES[randomId];
}

/**
 * Boss Enemy Stats (simplified)
 */
export const BOSS_ENEMY_STATS = {
  // HP Range
  HP_RANGE: { min: 180, max: 240 },
  
  // Average damage
  AVERAGE_DAMAGE: 25,
  
  // Average block
  AVERAGE_BLOCK: 11,
  
  // Difficulty level (1-10)
  OVERALL_DIFFICULTY: 9
} as const;