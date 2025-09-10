// src/core/combat/environments/index.ts — ระบบสภาพแวดล้อมการต่อสู้แบบครบครัน

/**
 * ไฟล์หลักสำหรับระบบสภาพแวดล้อมการต่อสู้ (Battle Environment System)
 * 
 * ระบบนี้จัดการ:
 * - สภาพแวดล้อมการต่อสู้ต่าง ๆ
 * - ผลกระทบต่อผู้เล่นและศัตรู
 * - การเลือกสภาพแวดล้อมที่เหมาะสมกับศัตรู
 * - การสุ่มสภาพแวดล้อมตามธีม
 */

// ===== Export Types =====
export type { BattleEnvironment, EnvironmentEffect } from '../../types_extended';

// ===== Export Thai Environments =====
export {
  THAI_ENVIRONMENTS,
  getEnvironmentById,
  getAllEnvironments,
  getEnvironmentIds,
  getRandomEnvironment,
  getEnvironmentsForEnemyType,
  ENVIRONMENT_THEMES
} from './thai-environments';

// ===== Backward Compatibility =====
// Re-export เป็นชื่อเดิมสำหรับไฟล์ที่ยังใช้ import เก่า
export { THAI_ENVIRONMENTS as ENVIRONMENTS_REGISTRY } from './thai-environments';

/**
 * ฟังก์ชันช่วยสำหรับระบบสภาพแวดล้อม
 */

// นำเข้าข้อมูลพื้นฐาน
import { 
  THAI_ENVIRONMENTS, 
  getRandomEnvironment, 
  getEnvironmentsForEnemyType,
  ENVIRONMENT_THEMES 
} from './thai-environments';
import type { BattleEnvironment } from '../../types_extended';

// สร้างสภาพแวดล้อมแบบสุ่มตามธีม
export function getRandomEnvironmentByTheme(theme: keyof typeof ENVIRONMENT_THEMES): BattleEnvironment {
  const themeEnvironments = ENVIRONMENT_THEMES[theme];
  const randomId = themeEnvironments[Math.floor(Math.random() * themeEnvironments.length)];
  return THAI_ENVIRONMENTS[randomId];
}

// ดึงสภาพแวดล้อมที่เอื้อต่อผู้เล่น
export function getPlayerFriendlyEnvironments(): BattleEnvironment[] {
  return ENVIRONMENT_THEMES.PLAYER_FRIENDLY.map(id => THAI_ENVIRONMENTS[id]);
}

// ดึงสภาพแวดล้อมที่เอื้อต่อศัตรู
export function getEnemyFriendlyEnvironments(): BattleEnvironment[] {
  return ENVIRONMENT_THEMES.ENEMY_FRIENDLY.map(id => THAI_ENVIRONMENTS[id]);
}

// ตรวจสอบว่าสภาพแวดล้อมมีผลต่อการ์ดหรือไม่
export function affectsCardCosts(envId: string): boolean {
  const env = THAI_ENVIRONMENTS[envId];
  if (!env) return false;
  
  return env.playerEffects.some(effect => 
    effect.type === 'card_cost_modifier'
  );
}

// ตรวจสอบว่าสภาพแวดล้อมมีผลต่อพลังงานหรือไม่
export function affectsEnergy(envId: string): boolean {
  const env = THAI_ENVIRONMENTS[envId];
  if (!env) return false;
  
  return [...env.playerEffects, ...env.enemyEffects].some(effect => 
    effect.type === 'energy_modifier'
  );
}

// ตรวจสอบว่าสภาพแวดล้อมมีผลต่อเวทมนตร์หรือไม่
export function boostsSpells(envId: string): boolean {
  const env = THAI_ENVIRONMENTS[envId];
  if (!env) return false;
  
  return env.neutralEffects.some(effect => effect.type === 'spell_boost');
}

// ดึงข้อมูลผลกระทบที่เป็นผลดีต่อผู้เล่น
export function getPlayerBenefits(envId: string): string[] {
  const env = THAI_ENVIRONMENTS[envId];
  if (!env) return [];
  
  const benefits: string[] = [];
  
  // ผลดีจาก player effects
  env.playerEffects.forEach(effect => {
    if (effect.type === 'energy_modifier' && effect.value > 0) {
      benefits.push(`ได้พลังงานเพิ่ม +${effect.value}`);
    }
    // เพิ่มการตรวจสอบ effect อื่น ๆ ตามต้องการ
  });
  
  // ผลดีจาก neutral effects
  env.neutralEffects.forEach(effect => {
    if (effect.type === 'spell_boost') {
      benefits.push(`เวทมนตร์แรงขึ้น ${effect.value}%`);
    }
  });
  
  return benefits;
}

// ดึงข้อมูลผลเสียที่ผู้เล่นจะได้รับ
export function getPlayerDrawbacks(envId: string): string[] {
  const env = THAI_ENVIRONMENTS[envId];
  if (!env) return [];
  
  const drawbacks: string[] = [];
  
  env.playerEffects.forEach(effect => {
    if (effect.type === 'card_cost_modifier' && effect.value > 0) {
      drawbacks.push(`ไพ่ใช้พลังงานเพิ่ม +${effect.value}`);
    } else if (effect.type === 'draw_modifier' && effect.value < 0) {
      drawbacks.push(`จั่วไพ่น้อยลง ${Math.abs(effect.value)} ใบ`);
    } else if (effect.type === 'block_modifier' && effect.value < 0) {
      drawbacks.push(`การป้องกันลดลง ${Math.abs(effect.value)} หน่วย`);
    }
  });
  
  return drawbacks;
}

/**
 * ระบบการแนะนำสภาพแวดล้อม
 * ตามสถานการณ์การต่อสู้และประเภทศัตรู
 */
export function recommendEnvironmentForBattle(situation: {
  enemyType?: 'ghost' | 'demon' | 'spirit' | 'undead';
  difficulty?: 'easy' | 'normal' | 'hard';
  playerPreference?: 'offensive' | 'defensive' | 'magical' | 'balanced';
}): string[] {
  const recommendations: string[] = [];
  
  // แนะนำตามประเภทศัตรู
  if (situation.enemyType) {
    const suitableEnvs = getEnvironmentsForEnemyType(situation.enemyType);
    recommendations.push(...suitableEnvs.map(env => env.id));
  }
  
  // แนะนำตามความยาก
  if (situation.difficulty === 'easy') {
    recommendations.push(...ENVIRONMENT_THEMES.PLAYER_FRIENDLY);
  } else if (situation.difficulty === 'hard') {
    recommendations.push(...ENVIRONMENT_THEMES.ENEMY_FRIENDLY);
  }
  
  // แนะนำตามความชอบของผู้เล่น
  if (situation.playerPreference === 'magical') {
    // สภาพแวดล้อมที่เสริมเวทมนตร์
    recommendations.push('dark_forest', 'spirit_realm');
  } else if (situation.playerPreference === 'defensive') {
    // สภาพแวดล้อมที่ปลอดภัย
    recommendations.push('royal_palace', 'haunted_temple');
  }
  
  // กรองและลบซ้ำ
  return Array.from(new Set(recommendations)).filter(id => THAI_ENVIRONMENTS[id]);
}

/**
 * ฟังก์ชันวิเคราะห์สภาพแวดล้อม
 * สำหรับแสดงข้อมูลให้ผู้เล่นก่อนการต่อสู้
 */
export function analyzeEnvironment(envId: string): {
  name: string;
  description: string;
  playerBenefits: string[];
  playerDrawbacks: string[];
  enemyAdvantages: string[];
  neutralEffects: string[];
  recommendation: string;
} {
  const env = THAI_ENVIRONMENTS[envId];
  if (!env) {
    return {
      name: 'ไม่ทราบ',
      description: 'สภาพแวดล้อมไม่ถูกต้อง',
      playerBenefits: [],
      playerDrawbacks: [],
      enemyAdvantages: [],
      neutralEffects: [],
      recommendation: 'ไม่สามารถวิเคราะห์ได้'
    };
  }
  
  const playerBenefits = getPlayerBenefits(envId);
  const playerDrawbacks = getPlayerDrawbacks(envId);
  
  const enemyAdvantages = env.enemyEffects.map(effect => effect.description);
  const neutralEffects = env.neutralEffects.map(effect => effect.description);
  
  // สร้างคำแนะนำ
  let recommendation = '';
  if (playerBenefits.length > playerDrawbacks.length) {
    recommendation = 'สภาพแวดล้อมนี้เอื้อต่อผู้เล่น - ใช้ประโยชน์จากผลดีที่ได้รับ';
  } else if (playerDrawbacks.length > playerBenefits.length) {
    recommendation = 'สภาพแวดล้อมนี้ท้าทาย - วางแผนรับมือกับผลเสีย';
  } else {
    recommendation = 'สภาพแวดล้อมสมดุล - ปรับกลยุทธ์ตามสถานการณ์';
  }
  
  return {
    name: env.name,
    description: env.description,
    playerBenefits,
    playerDrawbacks,
    enemyAdvantages,
    neutralEffects,
    recommendation
  };
}

/**
 * สถิติระบบสภาพแวดล้อม
 */
export const ENVIRONMENT_SYSTEM_STATS = {
  TOTAL_ENVIRONMENTS: Object.keys(THAI_ENVIRONMENTS).length,
  
  THEME_DISTRIBUTION: {
    DARK: ENVIRONMENT_THEMES.DARK.length,
    SACRED: ENVIRONMENT_THEMES.SACRED.length,
    SUPERNATURAL: ENVIRONMENT_THEMES.SUPERNATURAL.length,
    PLAYER_FRIENDLY: ENVIRONMENT_THEMES.PLAYER_FRIENDLY.length,
    ENEMY_FRIENDLY: ENVIRONMENT_THEMES.ENEMY_FRIENDLY.length
  },
  
  EFFECT_TYPES: {
    AFFECTS_CARDS: Object.keys(THAI_ENVIRONMENTS).filter(affectsCardCosts).length,
    AFFECTS_ENERGY: Object.keys(THAI_ENVIRONMENTS).filter(affectsEnergy).length,
    BOOSTS_SPELLS: Object.keys(THAI_ENVIRONMENTS).filter(boostsSpells).length
  }
} as const;

/**
 * คำแนะนำการใช้งาน:
 * 
 * // วิเคราะห์สภาพแวดล้อม
 * const analysis = analyzeEnvironment('spirit_realm');
 * 
 * // หาสภาพแวดล้อมที่เหมาะสมกับศัตรู
 * const suitableEnvs = getEnvironmentsForEnemyType('ghost');
 * 
 * // สุ่มสภาพแวดล้อมตามธีม
 * const darkEnv = getRandomEnvironmentByTheme('DARK');
 */