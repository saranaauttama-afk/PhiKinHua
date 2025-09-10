// src/core/statusEffectsRuntime.ts — Status Effects Processing System (Legacy - Use combat/status-effects instead)

import type { GameState, PlayerState, EnemyState } from './types';
import type { StatusEffect, StatusEffectType, StatusEffectDefinition } from './types_extended';

// ===== DEPRECATED: ใช้ระบบใหม่แทน =====
// ไฟล์นี้เก่าแล้ว - ใช้ src/core/combat/status-effects/ แทน
// ระบบใหม่มีคอมเมนต์ภาษาไทยและจัดการดีกว่า

// Re-export จากระบบใหม่เพื่อ backward compatibility
export { 
  STATUS_EFFECTS_REGISTRY as STATUS_EFFECTS,
  applyStatusEffect,
  removeStatusEffect,
  processStatusEffectsStartTurn,
  processStatusEffectsStartTurn as processStatusEffectsOnTurnStart, // Alias for backward compatibility
  processStatusEffectsEndTurn,
  processStatusEffectsEndTurn as processStatusEffectsOnTurnEnd, // Alias for backward compatibility
  hasStatusEffect,
  getStatusEffectStacks,
  clearAllStatusEffects,
  createStatusEffect,
  canPlayAttackCards,
  modifyCardCostForStatusEffects,
  modifyDamageForStatusEffects
} from './combat/status-effects';

/**
 * ===== คำแนะนำการ Migration =====
 * 
 * แทนที่การใช้:
 *   import { applyStatusEffect } from './statusEffectsRuntime';
 * 
 * ด้วย:
 *   import { applyStatusEffect } from './combat/status-effects';
 * 
 * ประโยชน์ของระบบใหม่:
 * ✅ คอมเมนต์ภาษาไทยครบถ้วน
 * ✅ แยกไฟล์ตามหน้าที่ชัดเจน  
 * ✅ Type safety ดีกว่า
 * ✅ Error handling ที่ดีกว่า
 * ✅ ระบบ logging ที่เข้าใจง่าย
 */