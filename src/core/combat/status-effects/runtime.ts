// src/core/combat/status-effects/runtime.ts — ระบบประมวลผลสถานะผลในการต่อสู้

import type { GameState, PlayerState, EnemyState } from '../../types';
import type { 
  StatusEffect, 
  StatusEffectType, 
  ActiveStatusEffect, 
  StatusEffectResult,
  StatusEffectConfig 
} from './types';
import { 
  STATUS_EFFECTS_REGISTRY, 
  getStatusEffectDefinition,
  isStackableEffect,
  getMaxStacks 
} from './registry';

// ===== การตั้งค่าเริ่มต้นของระบบ =====
const DEFAULT_CONFIG: StatusEffectConfig = {
  maxTotalDebuffs: 8,        // สูงสุด 8 debuffs ต่อตัวละคร
  maxTotalBuffs: 6,          // สูงสุด 6 buffs ต่อตัวละคร
  immunityTags: [],          // ไม่มีภูมิคุ้มกันเริ่มต้น
  resistanceTags: [],        // ไม่มีการต้านทานเริ่มต้น
  showDuration: true,        // แสดงระยะเวลาที่เหลือ
  showStacks: true,          // แสดงจำนวนชั้น
  animateOnApply: true       // เล่นแอนิเมชันเมื่อใส่สถานะผล
};

// ===== ฟังก์ชันหลักสำหรับจัดการสถานะผล =====

/**
 * ใส่สถานะผลให้เป้าหมาย
 * รองรับการซ้อนชั้นและการควบรวมระยะเวลา
 */
export function applyStatusEffect(
  target: 'player' | 'enemy',
  state: GameState,
  statusId: StatusEffectType,
  duration?: number,
  stacks = 1,
  value?: number,
  sourceId?: string
): StatusEffectResult {
  // ดึงข้อมูลเป้าหมาย
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState) {
    return {
      success: false,
      message: 'เป้าหมายไม่ถูกต้อง',
      logMessages: []
    };
  }

  // เริ่มต้น statusEffects array ถ้ายังไม่มี
  if (!targetState.statusEffects) {
    targetState.statusEffects = [];
  }

  // ดึงคำนิยามสถานะผล
  const statusDef = getStatusEffectDefinition(statusId);
  if (!statusDef) {
    const errorMsg = `ไม่พบสถานะผล: ${statusId}`;
    state.log.push(errorMsg);
    return {
      success: false,
      message: errorMsg,
      logMessages: [errorMsg]
    };
  }

  // ตรวจสอบภูมิคุ้มกัน (จะเพิ่มในอนาคต)
  // if (checkImmunity(targetState, statusDef)) { ... }

  // หาสถานะผลที่มีอยู่แล้ว
  const existingIndex = targetState.statusEffects.findIndex(s => s.id === statusId);
  const finalDuration = duration ?? statusDef.defaultDuration;
  
  let effectApplied: StatusEffect;
  let isNewEffect = false;
  
  if (existingIndex >= 0) {
    // สถานะผลมีอยู่แล้ว - จัดการการซ้อนหรือรีเฟรช
    const existing = targetState.statusEffects[existingIndex];
    
    if (statusDef.stackable) {
      // สามารถซ้อนได้ - เพิ่มชั้น
      const maxStacks = getMaxStacks(statusId);
      const newStacks = Math.min((existing.stacks || 1) + stacks, maxStacks);
      const stacksAdded = newStacks - (existing.stacks || 1);
      
      existing.stacks = newStacks;
      existing.duration = Math.max(existing.duration, finalDuration);
      existing.value = value ?? existing.value;
      
      effectApplied = existing;
      
      if (stacksAdded > 0) {
        state.log.push(`🔄 ${statusDef.name} เพิ่มเป็น ${newStacks} ชั้น (${existing.duration} เทิร์น)`);
      } else {
        state.log.push(`🔄 ${statusDef.name} รีเฟรชระยะเวลา (${existing.duration} เทิร์น)`);
      }
    } else {
      // ไม่สามารถซ้อนได้ - รีเฟรชระยะเวลา
      existing.duration = Math.max(existing.duration, finalDuration);
      existing.value = value ?? existing.value;
      effectApplied = existing;
      
      state.log.push(`🔄 ${statusDef.name} รีเฟรชระยะเวลา (${existing.duration} เทิร์น)`);
    }
  } else {
    // สถานะผลใหม่ - สร้างและเพิ่ม
    isNewEffect = true;
    
    effectApplied = {
      id: statusId,
      name: statusDef.name,
      description: statusDef.description,
      duration: finalDuration,
      stacks: statusDef.stackable ? stacks : undefined,
      value: value,
      tags: statusDef.tags
    };
    
    targetState.statusEffects.push(effectApplied);
    
    const stackText = statusDef.stackable && stacks > 1 ? ` (${stacks} ชั้น)` : '';
    const durationText = finalDuration > 0 ? ` เป็นเวลา ${finalDuration} เทิร์น` : '';
    state.log.push(`✨ ${target === 'player' ? 'ผู้เล่น' : 'ศัตรู'} ได้รับ ${statusDef.name}${stackText}${durationText}`);
  }

  // เรียกใช้ onApply callback ถ้าเป็นสถานะผลใหม่
  if (isNewEffect && statusDef.onApply) {
    try {
      statusDef.onApply(target, effectApplied.stacks || 1);
    } catch (error) {
      console.error(`Error in onApply for ${statusId}:`, error);
    }
  }

  return {
    success: true,
    effectApplied,
    message: `ใส่ ${statusDef.name} สำเร็จ`,
    logMessages: [`ใส่ ${statusDef.name} ให้ ${target === 'player' ? 'ผู้เล่น' : 'ศัตรู'}`]
  };
}

/**
 * ลบสถานะผลจากเป้าหมาย
 */
export function removeStatusEffect(
  target: 'player' | 'enemy',
  state: GameState,
  statusId: StatusEffectType,
  stacksToRemove?: number
): boolean {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return false;

  const effectIndex = targetState.statusEffects.findIndex(s => s.id === statusId);
  if (effectIndex < 0) return false;

  const effect = targetState.statusEffects[effectIndex];
  const statusDef = getStatusEffectDefinition(statusId);
  
  if (stacksToRemove && effect.stacks && effect.stacks > stacksToRemove) {
    // ลบเฉพาะบางชั้น
    effect.stacks -= stacksToRemove;
    state.log.push(`➖ ${statusDef?.name} ลดลง ${stacksToRemove} ชั้น (เหลือ ${effect.stacks} ชั้น)`);
    return true;
  } else {
    // ลบทั้งหมด
    targetState.statusEffects.splice(effectIndex, 1);
    state.log.push(`❌ ${statusDef?.name} หมดไป`);
    
    // เรียกใช้ onRemove callback
    if (statusDef?.onRemove) {
      try {
        statusDef.onRemove(target, effect.stacks || 1);
      } catch (error) {
        console.error(`Error in onRemove for ${statusId}:`, error);
      }
    }
    return true;
  }
}

/**
 * ประมวลผลสถานะผลต้นเทิร์น
 */
export function processStatusEffectsStartTurn(
  target: 'player' | 'enemy',
  state: GameState
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return;

  state.log.push(`🔄 ประมวลผลสถานะผลต้นเทิร์น ${target === 'player' ? 'ผู้เล่น' : 'ศัตรู'}`);

  // ประมวลผล onTurnStart สำหรับสถานะผลทั้งหมด
  for (const effect of targetState.statusEffects) {
    const statusDef = getStatusEffectDefinition(effect.id as StatusEffectType);
    
    if (statusDef?.onTurnStart) {
      try {
        statusDef.onTurnStart(target, effect.stacks || 1);
        
        // ประมวลผลเฉพาะสำหรับสถานะผลที่ต้องการ
        processSpecificStatusEffect(effect, target, state, 'turn_start');
      } catch (error) {
        console.error(`Error processing ${effect.id} onTurnStart:`, error);
      }
    }
  }
}

/**
 * ประมวลผลสถานะผลท้ายเทิร์น
 */
export function processStatusEffectsEndTurn(
  target: 'player' | 'enemy',
  state: GameState
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return;

  state.log.push(`🔄 ประมวลผลสถานะผลท้ายเทิร์น ${target === 'player' ? 'ผู้เล่น' : 'ศัตรู'}`);

  // ประมวลผล onTurnEnd ก่อนลดระยะเวลา
  for (const effect of [...targetState.statusEffects]) {
    const statusDef = getStatusEffectDefinition(effect.id as StatusEffectType);
    
    if (statusDef?.onTurnEnd) {
      try {
        statusDef.onTurnEnd(target, effect.stacks || 1);
        processSpecificStatusEffect(effect, target, state, 'turn_end');
      } catch (error) {
        console.error(`Error processing ${effect.id} onTurnEnd:`, error);
      }
    }
  }

  // ลดระยะเวลาและลบสถานะผลที่หมดอายุ
  reduceStatusEffectDurations(target, state);
}

/**
 * ลดระยะเวลาของสถานะผลและลบที่หมดอายุ
 */
function reduceStatusEffectDurations(
  target: 'player' | 'enemy',
  state: GameState
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return;

  const effectsToRemove: string[] = [];

  for (const effect of targetState.statusEffects) {
    if (effect.duration > 0) {
      effect.duration -= 1;
      
      if (effect.duration <= 0) {
        effectsToRemove.push(effect.id);
      }
    }
  }

  // ลบสถานะผลที่หมดอายุ
  for (const effectId of effectsToRemove) {
    removeStatusEffect(target, state, effectId as StatusEffectType);
  }
}

/**
 * ประมวลผลเฉพาะสำหรับสถานะผลแต่ละประเภท
 */
function processSpecificStatusEffect(
  effect: StatusEffect,
  target: 'player' | 'enemy',
  state: GameState,
  timing: 'turn_start' | 'turn_end'
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState) return;

  const stacks = effect.stacks || 1;

  switch (effect.id) {
    case 'regeneration':
      if (timing === 'turn_start') {
        const healAmount = stacks;
        const oldHp = targetState.hp;
        targetState.hp = Math.min(targetState.maxHp, targetState.hp + healAmount);
        const actualHeal = targetState.hp - oldHp;
        if (actualHeal > 0) {
          state.log.push(`💚 ${target === 'player' ? 'ผู้เล่น' : 'ศัตรู'} ฟื้นฟู HP ${actualHeal} หน่วย`);
        }
      }
      break;

    case 'poison':
      if (timing === 'turn_end') {
        const damage = stacks;
        targetState.hp = Math.max(0, targetState.hp - damage);
        state.log.push(`☠️ ${target === 'player' ? 'ผู้เล่น' : 'ศัตรู'} ได้รับความเสียหายจากพิษ ${damage} หน่วย`);
      }
      break;

    case 'energy_boost':
      if (timing === 'turn_start' && target === 'player') {
        state.player.energy += stacks;
        state.log.push(`⚡ ผู้เล่นได้พลังงานเพิ่ม ${stacks} หน่วย`);
      }
      break;

    case 'fear':
      if (timing === 'turn_start' && target === 'player') {
        // ลดพลังงาน
        state.player.energy = Math.max(0, state.player.energy - 1);
        state.log.push(`😨 ผู้เล่นกลัว - พลังงานลดลง 1 หน่วย`);
        
        // ทิ้งไพ่สุ่ม (จะต้องเพิ่มระบบทิ้งไพ่ในอนาคต)
        state.log.push(`😨 ผู้เล่นทิ้งไพ่สุ่ม 1 ใบจากความกลัว`);
      }
      break;
  }
}

// ===== ฟังก์ชันช่วยเหลือ =====

/**
 * ตรวจสอบว่าเป้าหมายมีสถานะผลอยู่หรือไม่
 */
export function hasStatusEffect(
  target: 'player' | 'enemy',
  state: GameState,
  statusId: StatusEffectType
): boolean {
  const targetState = target === 'player' ? state.player : state.enemy;
  return targetState?.statusEffects?.some(s => s.id === statusId) || false;
}

/**
 * ดึงจำนวนชั้นของสถานะผล
 */
export function getStatusEffectStacks(
  target: 'player' | 'enemy',
  state: GameState,
  statusId: StatusEffectType
): number {
  const targetState = target === 'player' ? state.player : state.enemy;
  const effect = targetState?.statusEffects?.find(s => s.id === statusId);
  return effect?.stacks || 0;
}

/**
 * ล้างสถานะผลทั้งหมดของเป้าหมาย
 */
export function clearAllStatusEffects(
  target: 'player' | 'enemy',
  state: GameState,
  type?: 'buff' | 'debuff'
): void {
  const targetState = target === 'player' ? state.player : state.enemy;
  if (!targetState?.statusEffects) return;

  if (!type) {
    // ล้างทั้งหมด
    targetState.statusEffects = [];
    state.log.push(`🧹 ล้างสถานะผลทั้งหมดของ ${target === 'player' ? 'ผู้เล่น' : 'ศัตรู'}`);
  } else {
    // ล้างเฉพาะประเภทที่ระบุ
    const filteredEffects = targetState.statusEffects.filter(effect => {
      const statusDef = getStatusEffectDefinition(effect.id as StatusEffectType);
      const isTargetType = statusDef?.tags?.includes(type);
      return !isTargetType;
    });
    
    const removedCount = targetState.statusEffects.length - filteredEffects.length;
    targetState.statusEffects = filteredEffects;
    
    if (removedCount > 0) {
      const typeText = type === 'buff' ? 'สถานะผลบวก' : 'สถานะผลลบ';
      state.log.push(`🧹 ล้าง${typeText} ${removedCount} รายการ`);
    }
  }
}

/**
 * สร้างสถานะผลใหม่ (backward compatibility)
 */
export function createStatusEffect(
  id: StatusEffectType,
  duration?: number,
  stacks?: number,
  value?: number
): StatusEffect {
  const statusDef = getStatusEffectDefinition(id);
  
  return {
    id,
    name: statusDef?.name || id,
    description: statusDef?.description || 'ไม่ทราบรายละเอียด',
    duration: duration ?? statusDef?.defaultDuration ?? 1,
    stacks: statusDef?.stackable ? (stacks || 1) : undefined,
    value,
    tags: statusDef?.tags
  };
}

/**
 * ตรวจสอบว่าผู้เล่นสามารถเล่นการ์ดโจมตีได้หรือไม่
 * ใช้สำหรับตรวจสอบสถานะผลเช่น entangle
 */
export function canPlayAttackCards(state: GameState): boolean {
  // ตรวจสอบว่าผู้เล่นถูก entangle หรือไม่
  return !hasStatusEffect('player', state, 'entangle');
}

/**
 * ปรับต้นทุนการ์ดตามสถานะผล
 * ใช้สำหรับสถานะผลที่เปลี่ยนต้นทุนการ์ด เช่น corruption
 */
export function modifyCardCostForStatusEffects(state: GameState, cardCost: number): number {
  if (!state.player) return cardCost;
  
  let modifiedCost = cardCost;
  
  // ตรวจสอบ corruption - เพิ่มต้นทุนการ์ด
  if (hasStatusEffect('player', state, 'corruption')) {
    const stacks = getStatusEffectStacks('player', state, 'corruption');
    modifiedCost += stacks;
  }
  
  return Math.max(0, modifiedCost); // ต้นทุนต่ำสุดคือ 0
}

/**
 * ปรับความเสียหายตามสถานะผล
 * ใช้สำหรับสถานะผลที่เปลี่ยนความเสียหาย เช่น strength, weakness
 */
export function modifyDamageForStatusEffects(state: GameState, baseDamage: number, isPlayerAttack: boolean = true): number {
  const targetState = isPlayerAttack ? state.player : state.enemy;
  if (!targetState) return baseDamage;
  
  let modifiedDamage = baseDamage;
  
  if (isPlayerAttack) {
    // ผู้เล่นโจมตี - ตรวจสอบ strength และ weakness
    if (hasStatusEffect('player', state, 'strength')) {
      const stacks = getStatusEffectStacks('player', state, 'strength');
      modifiedDamage += stacks;
    }
    
    if (hasStatusEffect('player', state, 'weakness')) {
      const stacks = getStatusEffectStacks('player', state, 'weakness');
      modifiedDamage = Math.floor(modifiedDamage * 0.75); // ลดความเสียหาย 25%
    }
  } else {
    // ศัตรูโจมตี - ตรวจสอบสถานะผลของศัตรู
    if (hasStatusEffect('enemy', state, 'strength')) {
      const stacks = getStatusEffectStacks('enemy', state, 'strength');
      modifiedDamage += stacks;
    }
    
    if (hasStatusEffect('enemy', state, 'weakness')) {
      const stacks = getStatusEffectStacks('enemy', state, 'weakness');
      modifiedDamage = Math.floor(modifiedDamage * 0.75);
    }
  }
  
  return Math.max(0, modifiedDamage); // ความเสียหายต่ำสุดคือ 0
}