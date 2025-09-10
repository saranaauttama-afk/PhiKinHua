// src/core/thai_enemy_system.ts — ระบบศัตรูไทยแบบใหม่ (Refactored)

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

// ===== สำคัญ: ระบบถูก Refactor แล้ว! =====
/**
 * ระบบศัตรูไทยถูกแยกออกเป็นหลายส่วนเพื่อความชัดเจน:
 * 
 * 📁 Status Effects: src/core/combat/status-effects/
 * 📁 Environments: src/core/combat/environments/
 * 📁 Minions: src/core/combat/minions/
 * 📁 Enemy Data: src/core/enemies/thai/data/
 * 
 * ไฟล์นี้ทำหน้าที่เป็น wrapper เพื่อ backward compatibility
 */

// ===== Status Effects - ย้ายไปใช้ระบบใหม่แล้ว =====
// ระบบ Status Effects ถูกย้ายไปที่ src/core/combat/status-effects/
// ใช้ import จาก './combat/status-effects' แทน

// Re-export เพื่อ backward compatibility
export { 
  STATUS_EFFECTS_REGISTRY as STATUS_EFFECTS
} from './combat/status-effects';

// ===== Battle Environments - ย้ายไปใช้ระบบใหม่แล้ว =====
// ระบบสภาพแวดล้อมถูกย้ายไปที่ src/core/combat/environments/
// ใช้ import จาก './combat/environments' แทน

// Re-export เพื่อ backward compatibility
export { THAI_ENVIRONMENTS } from './combat/environments';

// ===== Minion Definitions - ย้ายไปใช้ระบบใหม่แล้ว =====
// ระบบสหายและลูกน้องถูกย้ายไปที่ src/core/combat/minions/
// ใช้ import จาก './combat/minions' แทน

// Re-export เพื่อ backward compatibility
export { THAI_MINIONS } from './combat/minions';

// ===== Thai Enemy Definitions - ย้ายไปใช้ระบบใหม่แล้ว =====
// ระบบศัตรูไทยถูกย้ายไปที่ src/core/enemies/thai/data/
// แยกตามระดับความยาก: normal-enemies.ts, elite-enemies.ts, boss-enemies.ts
// ใช้ import จาก './enemies/thai/data' แทน

// Re-export เพื่อ backward compatibility
export { THAI_ENEMIES } from './enemies/thai/data';

// ===== Helper Functions - ยังคงไว้ที่เดิม =====
// ฟังก์ชันเหล่านี้ยังคงทำงานเหมือนเดิม แต่ใช้ข้อมูลจากระบบใหม่

import { THAI_ENEMIES } from './enemies/thai/data';

// ดึงพฤติกรรมของศัตรูตาม ID
export function getEnemyBehaviors(enemyId: string): EnemyBehavior[] {
  return THAI_ENEMIES[enemyId]?.behaviors || [];
}

// ดึงเวทมนตร์ของศัตรูตาม ID  
export function getEnemySpells(enemyId: string): EnemySpell[] {
  return THAI_ENEMIES[enemyId]?.spells || [];
}

// Re-export ฟังก์ชัน Status Effect Functions เพื่อ backward compatibility  
export { 
  getStatusEffectDefinition as getStatusEffect,
  createStatusEffect
} from './combat/status-effects';

// ===== Migration Guide =====
/**
 * 🚀 คำแนะนำการ Migrate ไปใช้ระบบใหม่:
 * 
 * เดิม:
 *   import { STATUS_EFFECTS, THAI_ENEMIES, THAI_MINIONS } from './thai_enemy_system';
 * 
 * ใหม่:
 *   import { STATUS_EFFECTS_REGISTRY } from './combat/status-effects';
 *   import { THAI_ENEMIES } from './enemies/thai/data';
 *   import { THAI_MINIONS } from './combat/minions';
 * 
 * ประโยชน์ของระบบใหม่:
 * ✅ คอมเมนต์ภาษาไทยครบถ้วน
 * ✅ แยกไฟล์ตามหน้าที่ชัดเจน
 * ✅ ง่ายต่อการบำรุงรักษา
 * ✅ ลดขนาดไฟล์แต่ละตัว
 * ✅ ระบบ type safety ที่ดีกว่า
 */