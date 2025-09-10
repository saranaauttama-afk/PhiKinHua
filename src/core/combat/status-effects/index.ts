// src/core/combat/status-effects/index.ts — ระบบสถานะผลแบบครบครัน

/**
 * ไฟล์หลักสำหรับระบบสถานะผล (Status Effects System)
 * 
 * ระบบนี้จัดการ:
 * - การนิยามสถานะผลทุกประเภท (types.ts)
 * - คลังข้อมูลสถานะผล (registry.ts) 
 * - การประมวลผลและจัดการสถานะผล (runtime.ts)
 */

// ===== Export Types =====
export type {
  StatusEffectType,
  StatusEffect,
  StatusEffectDefinition,
  ActiveStatusEffect,
  StatusEffectResult,
  StatusEffectConfig
} from './types';

// ===== Export Registry =====
export {
  STATUS_EFFECTS_REGISTRY,
  getStatusEffectDefinition,
  getStatusEffectsByTag,
  getDebuffEffects,
  getBuffEffects,
  getSpecialEffects,
  isStackableEffect,
  getMaxStacks,
  STATUS_EFFECT_GROUPS
} from './registry';

// ===== Export Runtime Functions =====
export {
  applyStatusEffect,
  removeStatusEffect,
  processStatusEffectsStartTurn,
  processStatusEffectsEndTurn,
  hasStatusEffect,
  getStatusEffectStacks,
  clearAllStatusEffects,
  createStatusEffect
} from './runtime';

// ===== Backward Compatibility =====
// สำหรับไฟล์เก่าที่ยังใช้ imports เดิม

// Re-export registry เป็นชื่อเดิม
export { STATUS_EFFECTS_REGISTRY as STATUS_EFFECTS } from './registry';

/**
 * คำแนะนำการใช้งาน:
 * 
 * 1. การนำเข้าสำหรับไฟล์ใหม่:
 *    import { applyStatusEffect, StatusEffectType } from '@/core/combat/status-effects';
 * 
 * 2. การนำเข้าสำหรับไฟล์เก่า (backward compatibility):
 *    import { STATUS_EFFECTS, applyStatusEffect } from '@/core/combat/status-effects';
 * 
 * 3. การใช้งานพื้นฐาน:
 *    applyStatusEffect('player', gameState, 'poison', 3, 2);
 * 
 * 4. การตรวจสอบสถานะผล:
 *    hasStatusEffect('enemy', gameState, 'strength');
 * 
 * 5. การประมวลผลต้นเทิร์น:
 *    processStatusEffectsStartTurn('player', gameState);
 */