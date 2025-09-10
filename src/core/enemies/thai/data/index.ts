// src/core/enemies/thai/data/index.ts — ระบบศัตรูไทยแบบครบครัน

import type { EnhancedEnemyData } from '../../../types_extended';

// === Import ศัตรูแต่ละระดับ ===
import { NORMAL_ENEMIES, getNormalEnemyById, getAllNormalEnemies } from './normal-enemies';
import { ELITE_ENEMIES, getEliteEnemyById, getAllEliteEnemies } from './elite-enemies';
import { BOSS_ENEMIES, getBossEnemyById, getAllBossEnemies } from './boss-enemies';

/**
 * คลังข้อมูลศัตรูไทยทั้งหมด
 * รวมทุกระดับความยากเข้าด้วยกัน
 */
export const THAI_ENEMIES: Record<string, EnhancedEnemyData> = {
  // ===== ศัตรูระดับธรรมดา (Normal Tier) =====
  ...NORMAL_ENEMIES,
  
  // ===== ศัตรูระดับยอดยอด (Elite Tier) =====
  ...ELITE_ENEMIES,
  
  // ===== บอส (Boss Tier) =====
  ...BOSS_ENEMIES
};

/**
 * ฟังก์ชันหลักสำหรับจัดการศัตรูทุกประเภท
 */

// ดึงศัตรูตาม ID (ไม่จำกัดประเภท)
export function getEnemyById(enemyId: string): EnhancedEnemyData | undefined {
  return THAI_ENEMIES[enemyId];
}

// ดึงศัตรูทั้งหมด
export function getAllEnemies(): Record<string, EnhancedEnemyData> {
  return THAI_ENEMIES;
}

// ดึงรายการ ID ของศัตรูทั้งหมด
export function getAllEnemyIds(): string[] {
  return Object.keys(THAI_ENEMIES);
}

// ดึงศัตรูตามระดับความยาก
export function getEnemiesByTier(tier: 'normal' | 'elite' | 'boss'): Record<string, EnhancedEnemyData> {
  switch (tier) {
    case 'normal': return getAllNormalEnemies();
    case 'elite': return getAllEliteEnemies();  
    case 'boss': return getAllBossEnemies();
    default: return {};
  }
}

// เลือกศัตรูแบบสุ่มจากระดับที่ระบุ
export function getRandomEnemyByTier(tier: 'normal' | 'elite' | 'boss'): EnhancedEnemyData {
  const enemies = getEnemiesByTier(tier);
  const enemyIds = Object.keys(enemies);
  const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
  return enemies[randomId];
}

// ดึงศัตรูที่เหมาะกับสภาพแวดล้อม
export function getEnemiesForEnvironment(envId: string): EnhancedEnemyData[] {
  return Object.values(THAI_ENEMIES).filter(enemy => 
    enemy.preferredEnvironments?.includes(envId)
  );
}

// ดึงศัตรูตามบุคลิก AI
export function getEnemiesByPersonality(personality: 'aggressive' | 'defensive' | 'tactical' | 'chaotic' | 'adaptive'): EnhancedEnemyData[] {
  return Object.values(THAI_ENEMIES).filter(enemy => 
    enemy.aiPersonality === personality
  );
}

// ตรวจสอบว่าศัตรูสามารถเรียกลูกน้องได้หรือไม่
export function canSummonMinions(enemyId: string): boolean {
  const enemy = getEnemyById(enemyId);
  return !!(enemy?.summonableMinions?.length);
}

// ดึงลูกน้องที่ศัตรูสามารถเรียกได้
export function getEnemyMinions(enemyId: string): string[] {
  const enemy = getEnemyById(enemyId);
  return enemy?.summonableMinions || [];
}

// ตรวจสอบว่าศัตรูมีการเปลี่ยนเฟสหรือไม่
export function hasPhaseChange(enemyId: string): boolean {
  const enemy = getEnemyById(enemyId);
  return !!(enemy?.phaseChangeHP && enemy?.phase2Behaviors?.length);
}

/**
 * ระบบการสุ่มศัตรูแบบถ่วงน้ำหนัก
 * ให้โอกาสศัตรูแต่ละระดับตามความเหมาะสม
 */
export function getRandomEnemyWeighted(weights: {
  normal: number,
  elite: number, 
  boss: number
}): EnhancedEnemyData {
  const totalWeight = weights.normal + weights.elite + weights.boss;
  const random = Math.random() * totalWeight;
  
  if (random < weights.normal) {
    return getRandomEnemyByTier('normal');
  } else if (random < weights.normal + weights.elite) {
    return getRandomEnemyByTier('elite');
  } else {
    return getRandomEnemyByTier('boss');
  }
}

/**
 * ระบบการสร้าง Encounter แบบปรับตัวตาม Act และความยากลำบาก
 */
export function generateEnemyForAct(act: number, difficulty: 'easy' | 'normal' | 'hard' | 'nightmare' = 'normal'): EnhancedEnemyData {
  // น้ำหนักตาม Act และความยาก
  const baseWeights = {
    1: { normal: 80, elite: 15, boss: 5 },
    2: { normal: 60, elite: 30, boss: 10 },
    3: { normal: 40, elite: 40, boss: 20 },
    4: { normal: 20, elite: 50, boss: 30 },
    5: { normal: 10, elite: 40, boss: 50 }
  };
  
  // ปรับน้ำหนักตามความยาก
  const difficultyMultipliers = {
    easy: { normal: 1.5, elite: 0.7, boss: 0.3 },
    normal: { normal: 1.0, elite: 1.0, boss: 1.0 },
    hard: { normal: 0.7, elite: 1.3, boss: 1.5 },
    nightmare: { normal: 0.3, elite: 1.2, boss: 2.0 }
  };
  
  const actWeights = baseWeights[Math.min(act, 5) as keyof typeof baseWeights];
  const multipliers = difficultyMultipliers[difficulty];
  
  const finalWeights = {
    normal: actWeights.normal * multipliers.normal,
    elite: actWeights.elite * multipliers.elite,
    boss: actWeights.boss * multipliers.boss
  };
  
  return getRandomEnemyWeighted(finalWeights);
}

/**
 * ระบบการปรับสเกลศัตรูตาม Act
 */
export function scaleEnemyForAct(enemy: EnhancedEnemyData, act: number): EnhancedEnemyData {
  const scaledEnemy = { ...enemy };
  const actMultiplier = act - 1; // Act 1 = x0, Act 2 = x1, etc.
  
  // ปรับสเกล HP และ damage
  scaledEnemy.hp = Math.round(enemy.hp + (enemy.scaling.hpPerAct || 0) * actMultiplier);
  scaledEnemy.maxHp = scaledEnemy.hp;
  scaledEnemy.block = enemy.block + (enemy.scaling.blockPerAct || 0) * actMultiplier;
  
  // ปรับสเกลเวทมนตร์ (เพิ่มพลังเวทย์)
  scaledEnemy.spells = enemy.spells.map(spell => ({
    ...spell,
    effects: spell.effects.map(effect => ({
      ...effect,
      value: Math.round(effect.value + (enemy.scaling.spellPowerPerAct || 0) * actMultiplier)
    }))
  }));
  
  return scaledEnemy;
}

/**
 * สถิติรวมของระบบศัตรู
 */
export const ENEMY_SYSTEM_STATS = {
  TOTAL_ENEMIES: Object.keys(THAI_ENEMIES).length,
  NORMAL_COUNT: Object.keys(NORMAL_ENEMIES).length,
  ELITE_COUNT: Object.keys(ELITE_ENEMIES).length,
  BOSS_COUNT: Object.keys(BOSS_ENEMIES).length,
  
  AVERAGE_HP: {
    NORMAL: 33,
    ELITE: 75,
    BOSS: 180
  },
  
  COMPLEXITY_LEVELS: {
    NORMAL: 'พื้นฐาน - เหมาะสำหรับผู้เล่นใหม่',
    ELITE: 'กลาง - ต้องมีกลยุทธ์',
    BOSS: 'สูง - ต้องชำนาญเกมดี'
  }
} as const;

/**
 * คำแนะนำทั่วไปสำหรับการต่อสู้กับศัตรูไทย
 */
export const GENERAL_COMBAT_TIPS = [
  "ศึกษาพฤติกรรมของศัตรูแต่ละประเภท",
  "ใช้สภาพแวดล้อมให้เป็นประโยชน์",
  "เตรียมการ์ดขัดจังหวะเวทมนตร์ไว้",
  "จัดลำดับความสำคัญ: ลูกน้อง → ศัตรูหลัก",
  "สังเกตการเปลี่ยนเฟสของศัตรู",
  "ปรับกลยุทธ์ตาม AI Personality ของศัตรู"
] as const;

// ===== Re-exports เพื่อ Backward Compatibility =====
export {
  // Normal enemies
  NORMAL_ENEMIES,
  getNormalEnemyById,
  getAllNormalEnemies,
  
  // Elite enemies  
  ELITE_ENEMIES,
  getEliteEnemyById,
  getAllEliteEnemies,
  
  // Boss enemies
  BOSS_ENEMIES,
  getBossEnemyById,
  getAllBossEnemies
};

/**
 * คำแนะนำการใช้งาน:
 * 
 * // ดึงศัตรูเฉพาะ
 * const enemy = getEnemyById('phi_pong');
 * 
 * // สุ่มศัตรูตามระดับ
 * const randomBoss = getRandomEnemyByTier('boss');
 * 
 * // สร้างศัตรูสำหรับ Act 3 ระดับยาก
 * const actEnemy = generateEnemyForAct(3, 'hard');
 * 
 * // ปรับสเกลศัตรูตาม Act
 * const scaledEnemy = scaleEnemyForAct(enemy, 3);
 */