// src/core/combat/environments/thai-environments.ts — สภาพแวดล้อมการต่อสู้แบบไทย

import type { BattleEnvironment } from '../../types_extended';

/**
 * คลังสภาพแวดล้อมการต่อสู้ทั้งหมดในเกม
 * แต่ละสภาพแวดล้อมจะมีผลต่อการต่อสู้แตกต่างกัน
 * 
 * ผลกระทบ 3 ประเภท:
 * - playerEffects: ผลต่อผู้เล่น
 * - enemyEffects: ผลต่อศัตรู  
 * - neutralEffects: ผลต่อทั้งสองฝ่าย
 */
export const THAI_ENVIRONMENTS: Record<string, BattleEnvironment> = {
  
  // ===== 🏚️ บ้านผีสิง - ป้อมปราการแห่งวิญญาณ =====
  haunted_house: {
    id: 'haunted_house',
    name: 'บ้านผีสิง',
    description: 'วิญญาณในบ้านเก่ากระซิบเวทมนตร์มืด ทำให้การใช้ไพ่หนักขึ้น',
    // ผู้เล่น: ใช้พลังงานเพิ่ม เพราะต้องต่อสู้กับพลังมืด
    playerEffects: [
      { 
        type: 'card_cost_modifier', 
        value: 1, 
        description: 'ไพ่ทั้งหมดใช้พลังงานเพิ่ม +1 (วิญญาณรบกวน)' 
      }
    ],
    // ศัตรู: โจมตีแรงขึ้น เพราะได้พลังจากวิญญาณ
    enemyEffects: [
      { 
        type: 'damage_modifier', 
        value: 2, 
        description: 'การโจมตีทั้งหมดแรงขึ้น +2 (พลังแห่งความมืด)' 
      }
    ],
    neutralEffects: []
  },

  // ===== 🌲 ป่าทึบ - ป่าแห่งวิญญาณร้าย =====  
  dark_forest: {
    id: 'dark_forest',
    name: 'ป่าทึบ',
    description: 'ต้นไม้โบราณซ่อนวิญญาณอันชั่วร้าย ทำให้สมาธิเสียไปจับไพ่ได้น้อยลง',
    // ผู้เล่น: จั่วไพ่น้อยลง เพราะป่าทำให้เสียสมาธิ
    playerEffects: [
      { 
        type: 'draw_modifier', 
        value: -1, 
        description: 'จั่วไพ่น้อยลง 1 ใบต่อเทิร์น (สมาธิเสีย)' 
      }
    ],
    // ศัตรู: ได้พลังงานเพิ่ม เพราะเป็นที่อยู่ธรรมชาติของมัน
    enemyEffects: [
      { 
        type: 'energy_modifier', 
        value: 1, 
        description: 'เริ่มแต่ละเทิร์นด้วยพลังงานเพิ่ม +1 (พลังธรรมชาติ)' 
      }
    ],
    // ทั้งสองฝ่าย: เวทมนตร์แรงขึ้น
    neutralEffects: [
      { 
        type: 'spell_boost', 
        value: 25, 
        description: 'เวทมนตร์ทั้งหมดแรงขึ้น 25% (พลังลึกลับของป่า)' 
      }
    ]
  },

  // ===== 🏰 พระราชวัง - สถานที่ศักดิ์สิทธิ์ =====
  royal_palace: {
    id: 'royal_palace', 
    name: 'พระราชวัง',
    description: 'พลังศักดิ์สิทธิ์ไหลผ่านโถงโบราณ ทำให้การป้องกันลดลงแต่ภูมิคุ้มกันเพิ่มขึ้น',
    // ผู้เล่น: ป้องกันลดลง เพราะพลังศักดิ์สิทธิ์ทำลายกำแพง
    playerEffects: [
      { 
        type: 'block_modifier', 
        value: -2, 
        description: 'การป้องกันทั้งหมดลดลง 2 หน่วย (พลังศักดิ์สิทธิ์ทะลุทุกสิ่ง)' 
      }
    ],
    // ศัตรู: ภูมิคุ้มกันต่อสถานะผลบางอย่าง
    enemyEffects: [
      { 
        type: 'status_immunity', 
        value: 0, 
        condition: 'curse,poison', 
        description: 'ภูมิคุ้มกันต่อคำสาปและพิษ (พลังศักดิ์สิทธิ์ปกป้อง)' 
      }
    ],
    neutralEffects: []
  },

  // ===== 👻 ภพวิญญาณ - มิติแห่งวิญญาณ =====
  spirit_realm: {
    id: 'spirit_realm',
    name: 'ภพวิญญาณ', 
    description: 'เส้นแบ่งระหว่างความตายและความเป็นไหลบาง พลังวิญญาณล้นหลาม',
    // ผู้เล่น: ได้พลังงานเพิ่ม เพราะดูดพลังจากวิญญาณ
    playerEffects: [
      { 
        type: 'energy_modifier', 
        value: 1, 
        description: 'เริ่มเทิร์นด้วยพลังงานเพิ่ม +1 (ดูดพลังวิญญาณ)' 
      }
    ],
    // ศัตรู: ได้พลังงานเพิ่มเช่นกัน เพราะเป็นแหล่งกำเนิดของมัน
    enemyEffects: [
      { 
        type: 'energy_modifier', 
        value: 1, 
        description: 'เริ่มเทิร์นด้วยพลังงานเพิ่ม +1 (พลังแม่บท)' 
      }
    ],
    // ทั้งสองฝ่าย: เวทมนตร์และพลังวิญญาณแรงมาก
    neutralEffects: [
      { 
        type: 'spell_boost', 
        value: 50, 
        description: 'ผลเวทมนตร์ทั้งหมดแรงขึ้น 50% (พลังวิญญาณล้นหลาม)' 
      }
    ]
  },

  // ===== 🏯 วัดร้าง - วิหารแห่งวิญญาณ =====
  haunted_temple: {
    id: 'haunted_temple',
    name: 'วัดร้าง',
    description: 'วิหารเก่าที่วิญญาณสงฆ์ยังคงสวดมนต์อยู่ ให้พลังจิตวิญญาณแก่ผู้ที่เข้ามา',
    // ผู้เล่น: รักษา HP เล็กน้อยเนื่องจากพระสวดมนต์
    playerEffects: [
      { 
        type: 'energy_modifier', 
        value: 0, 
        description: 'วิญญาณพระให้พร - ฟื้นฟูพลังงานเล็กน้อยสุ่ม' 
      }
    ],
    // ศัตรู: รับผลเสียจากพลังบุญ
    enemyEffects: [
      { 
        type: 'damage_penalty', 
        value: 0.1, 
        description: 'พลังชั่วร้ายลดลง 10% เนื่องจากพลังบุญ' 
      }
    ],
    neutralEffects: []
  },

  // ===== ⚰️ สุสานโบราณ - ที่ฝังศพแห่งความมืด =====
  ancient_graveyard: {
    id: 'ancient_graveyard',
    name: 'สุสานโบราณ',
    description: 'ที่ฝังศพเก่าแก่ที่วิญญาณไม่สงบ อาจมีผีฟื้นคืนชีพมาช่วยรบ',
    // ผู้เล่น: โอกาสเรียกผีมาช่วย
    playerEffects: [
      { 
        type: 'draw_modifier', 
        value: 0, 
        description: 'โอกาสเรียกวิญญาณโบราณมาช่วยสู้' 
      }
    ],
    // ศัตรู: อำนาจแห่งความตายเพิ่มขึ้น
    enemyEffects: [
      { 
        type: 'damage_bonus', 
        value: 0.15, 
        description: 'พลังแห่งความตายเพิ่มความเสียหาย 15%' 
      }
    ],
    neutralEffects: []
  },

  // ===== 🌲 ป่าสาป - ป่าแห่งคำสาป =====
  cursed_forest: {
    id: 'cursed_forest',
    name: 'ป่าสาป',
    description: 'ป่าที่ถูกสาปด้วยคำสาปโบราณ ทำให้ทุกสิ่งที่เข้าไปอ่อนแอลง',
    // ผู้เล่น: โอกาสได้รับคำสาป
    playerEffects: [
      { 
        type: 'damage_penalty', 
        value: 0.1, 
        description: 'คำสาปของป่าทำให้ความเสียหายลดลง 10%' 
      }
    ],
    // ศัตรู: ไม่ได้รับผลกระทบจากคำสาปเพราะเป็นต้นเหตุ
    enemyEffects: [
      { 
        type: 'status_immunity', 
        value: 0, 
        condition: 'curse', 
        description: 'ภูมิคุ้มกันต่อคำสาป (เป็นผู้ที่สาป)' 
      }
    ],
    neutralEffects: []
  }
};

/**
 * ฟังก์ชันช่วยในการจัดการสภาพแวดล้อม
 */

// ดึงสภาพแวดล้อมตาม ID
export function getEnvironmentById(envId: string): BattleEnvironment | undefined {
  return THAI_ENVIRONMENTS[envId];
}

// ดึงสภาพแวดล้อมทั้งหมด
export function getAllEnvironments(): Record<string, BattleEnvironment> {
  return THAI_ENVIRONMENTS;
}

// ดึงรายการ ID ของสภาพแวดล้อมทั้งหมด
export function getEnvironmentIds(): string[] {
  return Object.keys(THAI_ENVIRONMENTS);
}

// เลือกสภาพแวดล้อมแบบสุ่ม
export function getRandomEnvironment(): BattleEnvironment {
  const envIds = getEnvironmentIds();
  const randomId = envIds[Math.floor(Math.random() * envIds.length)];
  return THAI_ENVIRONMENTS[randomId];
}

// ดึงสภาพแวดล้อมที่เหมาะกับศัตรูชนิดนั้น ๆ
export function getEnvironmentsForEnemyType(enemyType: 'ghost' | 'demon' | 'spirit' | 'undead'): BattleEnvironment[] {
  // จัดกลุ่มสภาพแวดล้อมตามประเภทศัตรู
  const environmentGroups = {
    ghost: ['haunted_house', 'spirit_realm', 'haunted_temple'],
    demon: ['dark_forest', 'cursed_forest', 'ancient_graveyard'], 
    spirit: ['spirit_realm', 'haunted_temple', 'royal_palace'],
    undead: ['ancient_graveyard', 'cursed_forest', 'haunted_house']
  };
  
  const suitableIds = environmentGroups[enemyType] || getEnvironmentIds();
  return suitableIds.map(id => THAI_ENVIRONMENTS[id]).filter(Boolean);
}

/**
 * การจัดกลุ่มสภาพแวดล้อมตามธีม
 */
export const ENVIRONMENT_THEMES = {
  // สภาพแวดล้อมแห่งความมืด
  DARK: ['haunted_house', 'dark_forest', 'cursed_forest'],
  
  // สภาพแวดล้อมศักดิ์สิทธิ์
  SACRED: ['royal_palace', 'haunted_temple'],
  
  // สภาพแวดล้อมเหนือธรรมชาติ
  SUPERNATURAL: ['spirit_realm', 'ancient_graveyard'],
  
  // สภาพแวดล้อมที่เอื้อต่อผู้เล่น
  PLAYER_FRIENDLY: ['royal_palace', 'haunted_temple'],
  
  // สภาพแวดล้อมที่เอื้อต่อศัตรู
  ENEMY_FRIENDLY: ['dark_forest', 'cursed_forest', 'ancient_graveyard']
} as const;