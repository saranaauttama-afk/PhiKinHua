// src/core/enemies/thai/data/elite-enemies.ts — Simple Elite Enemies (Night of the Full Moon style)

import type { EnhancedEnemyData } from '../../../types_extended';

/**
 * Simplified Elite Enemies
 * - No complex behaviors
 * - No spells
 * - No phase changes
 * - Just stronger stats and better decks than normal enemies
 */
export const ELITE_ENEMIES: Record<string, EnhancedEnemyData> = {

  // ===== 🌺 นางตานี - Elite Palm Tree Spirit =====
  nang_tani_elite: {
    id: 'nang_tani_elite',
    name: 'นางตานี',
    tier: 'elite',
    hp: 75,
    maxHp: 75,
    dmg: 12,
    block: 5,
    
    // Elite deck - stronger than normal monsters
    deck: {
      lists: [
        {
          id: 'elite_nature_deck',
          weight: 1,
          cards: ['swipe', 'swipe', 'brace', 'guard', 'maul', 'swipe', 'brace', 'guard', 'maul', 'swipe']
        }
      ],
      handSize: 4,
      maxEnergy: 4
    }
  },

  // ===== 👻 ผีตายโหงเอลิท - Elite Vengeful Spirit =====
  phi_tai_hong_elite: {
    id: 'phi_tai_hong_elite',
    name: 'ผีตายโหงเอลิท',
    tier: 'elite',
    hp: 85,
    maxHp: 85,
    dmg: 15,
    block: 3,
    
    // Elite deck - aggressive vengeful spirit (more maul)
    deck: {
      lists: [
        {
          id: 'elite_vengeful_deck',
          weight: 1,
          cards: ['maul', 'maul', 'swipe', 'maul', 'brace', 'swipe', 'maul', 'guard', 'swipe', 'maul']
        }
      ],
      handSize: 4,
      maxEnergy: 4
    }
  },

  // ===== 👑 ราชินีกระสือ - Elite Krasue Queen =====
  krasue_queen: {
    id: 'krasue_queen',
    name: 'ราชินีกระสือ',
    tier: 'elite',
    hp: 90,
    maxHp: 90,
    dmg: 13,
    block: 6,
    
    // Elite deck - royal blood attacks
    deck: {
      lists: [
        {
          id: 'elite_royal_deck',
          weight: 1,
          cards: ['maul', 'swipe', 'swipe', 'brace', 'maul', 'guard', 'swipe', 'brace', 'maul', 'guard']
        }
      ],
      handSize: 4,
      maxEnergy: 4
    }
  },

  // ===== 🙏 พระอาจารย์ผีสาง - Elite Corrupted Monk =====
  phra_ajarn_phi_sang: {
    id: 'phra_ajarn_phi_sang',
    name: 'พระอาจารย์ผีสาง',
    tier: 'elite',
    hp: 80,
    maxHp: 80,
    dmg: 11,
    block: 8,
    
    // Elite deck - defensive monk style
    deck: {
      lists: [
        {
          id: 'elite_monk_deck',
          weight: 1,
          cards: ['guard', 'brace', 'brace', 'swipe', 'guard', 'brace', 'swipe', 'guard', 'maul', 'brace']
        }
      ],
      handSize: 4,
      maxEnergy: 4
    }
  }
};

/**
 * Helper functions for Elite Enemies
 */

// Get elite enemy by ID
export function getEliteEnemyById(enemyId: string): EnhancedEnemyData | undefined {
  return ELITE_ENEMIES[enemyId];
}

// Get all elite enemies
export function getAllEliteEnemies(): Record<string, EnhancedEnemyData> {
  return ELITE_ENEMIES;
}

// Get elite enemy IDs
export function getEliteEnemyIds(): string[] {
  return Object.keys(ELITE_ENEMIES);
}

// Get random elite enemy
export function getRandomEliteEnemy(): EnhancedEnemyData {
  const enemyIds = getEliteEnemyIds();
  const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
  return ELITE_ENEMIES[randomId];
}

/**
 * Elite Enemy Stats (simplified)
 */
export const ELITE_ENEMY_STATS = {
  // HP Range
  HP_RANGE: { min: 75, max: 90 },
  
  // Average damage
  AVERAGE_DAMAGE: 13,
  
  // Average block
  AVERAGE_BLOCK: 5,
  
  // Difficulty level (1-10)
  OVERALL_DIFFICULTY: 6
} as const;