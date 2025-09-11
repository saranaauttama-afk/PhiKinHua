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
    dmg: 6,
    block: 0,
    
    // Simple behavior - removed complex behaviors for Night of the Full Moon style
    
    // No spells - simple enemies only use basic attacks
    
    // Simple deck configuration
    deck: {
      lists: [
        {
          id: 'basic_ghost',
          weight: 100,
          cards: ['claw', 'claw', 'claw', 'guard', 'guard']
        }
      ]
    }
  },

  // ===== 🌙 ผีกระสือ - ผีหัวลอยกินสิ่งสกปรก =====
  phi_krasue: {
    id: 'phi_krasue',
    name: 'ผีกระสือ',
    tier: 'normal',
    hp: 32,
    maxHp: 32,
    dmg: 5,
    block: 0,
    
    // Simple behavior - removed complex behaviors
    
    // No spells - simple enemies only use basic attacks
    
    // Simple deck configuration - aggressive enemy  
    deck: {
      lists: [
        {
          id: 'aggressive',
          weight: 100,
          cards: ['swipe', 'swipe', 'claw', 'claw', 'guard']
        }
      ]
    }
  },

  // ===== 🕷️ ปอบ - ผีมดลูกพราง =====
  phi_pop: {
    id: 'phi_pop',
    name: 'ปอบ',
    tier: 'normal',
    hp: 38,
    maxHp: 38,
    dmg: 7,
    block: 2,
    
    // Simple behavior - removed complex behaviors
    
    // No spells - simple enemies only use basic attacks
    
    // Simple deck configuration - balanced enemy
    deck: {
      lists: [
        {
          id: 'balanced',
          weight: 100,
          cards: ['claw', 'claw', 'guard', 'brace', 'guard']
        }
      ]
    }
  },

  // ===== ☠️ ผีตายโหง - วิญญาณผู้เสียชีวิตอย่างไม่สมหวัง =====
  phi_tai_hong: {
    id: 'phi_tai_hong',
    name: 'ผีตายโหง',
    tier: 'normal',
    hp: 40,
    maxHp: 40,
    dmg: 9,
    block: 0,
    
    // Simple behavior - removed complex behaviors
    
    // No spells - simple enemies only use basic attacks
    
    // Simple deck configuration - heavy hitter
    deck: {
      lists: [
        {
          id: 'heavy_attacker',
          weight: 100,
          cards: ['maul', 'swipe', 'swipe', 'claw', 'guard']
        }
      ]
    }
  },

  // ===== 👹 ผีหัวตัด - วิญญาณนักรบโบราณ =====
  phi_hua_tad: {
    id: 'phi_hua_tad',
    name: 'ผีหัวตัด',
    tier: 'normal',
    hp: 42,
    maxHp: 42,
    dmg: 10,
    block: 3,
    
    // Simple behavior - removed complex behaviors
    
    // No spells - simple enemies only use basic attacks
    
    // Simple deck configuration - warrior type
    deck: {
      lists: [
        {
          id: 'warrior',
          weight: 100,
          cards: ['swipe', 'swipe', 'guard', 'brace', 'claw']
        }
      ]
    }
  },

  // ===== 🌸 ผีนางรำ - วิญญาณนักรำโบราณ =====
  phi_nang_ram: {
    id: 'phi_nang_ram',
    name: 'ผีนางรำ',
    tier: 'normal',
    hp: 36,
    maxHp: 36,
    dmg: 8,
    block: 1,
    
    // Simple behavior - removed complex behaviors
    
    // No spells - simple enemies only use basic attacks
    
    // Simple deck configuration - defensive enemy
    deck: {
      lists: [
        {
          id: 'defensive',
          weight: 100,
          cards: ['guard', 'brace', 'guard', 'claw', 'claw']
        }
      ]
    }
  },

  // ===== 🐍 งูผีสาง - วิญญาณงูยักษ์โบราณ =====
  ngu_phi_sang: {
    id: 'ngu_phi_sang',
    name: 'งูผีสาง',
    tier: 'normal',
    hp: 44,
    maxHp: 44,
    dmg: 12,
    block: 2,
    
    // Simple behavior - removed complex behaviors
    
    // No spells - simple enemies only use basic attacks
    
    // Simple deck configuration - strong attacker
    deck: {
      lists: [
        {
          id: 'strong_attacker',
          weight: 100,
          cards: ['maul', 'swipe', 'claw', 'claw', 'guard']
        }
      ]
    }
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