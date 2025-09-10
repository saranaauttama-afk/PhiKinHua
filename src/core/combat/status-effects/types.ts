// src/core/combat/status-effects/types.ts — ระบบประเภทและคำนิยามสถานะผล

/**
 * ประเภทของสถานะผลทั้งหมดในเกม
 * แบ่งออกเป็น 3 กลุ่มหลัก: ลบ (Debuff), บวก (Buff), และพิเศษ (Special)
 */
export type StatusEffectType = 
  // === สถานะผลลบ (Debuffs) ===
  | 'fear'          // ความกลัว - ลดพลังงานและทิ้งไพ่
  | 'poison'        // พิษ - สร้างความเสียหายต่อเนื่อง
  | 'curse'         // คำสาป - รับความเสียหายเพิ่ม
  | 'corruption'    // ความเสื่อม - ไพ่ใช้พลังงานเพิ่ม
  | 'entangle'      // พันธนาการ - ไม่สามารถใช้ไพ่โจมตี
  | 'weakness'      // อ่อนแอ - สร้างความเสียหายลดลง
  | 'vulnerable'    // เปราะบาง - รับความเสียหายเพิ่ม
  | 'draw_reduction' // จั่วไพ่ลดลง - จั่วไพ่น้อยลง
  
  // === สถานะผลบวก (Buffs) ===
  | 'regeneration'  // ฟื้นฟู - ฟื้นฟู HP ต่อเทิร์น
  | 'strength'      // แข็งแกร่ง - สร้างความเสียหายเพิ่ม
  | 'block_next'    // บล็อคครั้งต่อไป - บล็อคความเสียหายครั้งต่อไป
  | 'energy_boost'  // เพิ่มพลังงาน - ได้พลังงานเพิ่มเทิร์นต่อไป
  
  // === สถานะผลพิเศษ (Special) ===
  | 'spell_charging'; // ร่ายเวทย์ - กำลังร่ายเวทย์อันทรงพลัง

/**
 * โครงสร้างข้อมูลของสถานะผลแต่ละตัวในเกม
 */
export type StatusEffect = {
  id: string;              // รหัสสถานะผล (ไม่ซ้ำ)
  name: string;            // ชื่อสถานะผล (ภาษาไทย/อังกฤษ)
  description: string;     // คำอธิบายผลกระทบ
  duration: number;        // จำนวนเทิร์นที่เหลือ
  stacks?: number;         // จำนวนชั้น (สำหรับสถานะที่ซ้อนได้)
  value?: number;          // ค่าตัวเลข (เช่น ความเสียหาย, การรักษา)
  tags?: string[];         // แท็กสำหรับจัดกลุ่ม (เช่น 'magical', 'physical')
};

/**
 * คำนิยามสถานะผลสำหรับระบบเกม
 * กำหนดพฤติกรรมและการทำงานของสถานะผลแต่ละประเภท
 */
export type StatusEffectDefinition = {
  id: StatusEffectType;           // ประเภทสถานะผล
  name: string;                   // ชื่อแสดงผล
  description: string;            // คำอธิบายสั้น ๆ
  defaultDuration: number;        // ระยะเวลาเริ่มต้น
  stackable: boolean;             // สามารถซ้อนได้หรือไม่
  maxStacks?: number;             // จำนวนชั้นสูงสุด (ถ้าซ้อนได้)
  
  // === ฟังก์ชันการทำงาน (Event Handlers) ===
  onApply?: (target: 'player' | 'enemy', stacks: number) => void;      // เมื่อใส่สถานะผล
  onTurnStart?: (target: 'player' | 'enemy', stacks: number) => void;   // เริ่มเทิร์น
  onTurnEnd?: (target: 'player' | 'enemy', stacks: number) => void;     // จบเทิร์น
  onRemove?: (target: 'player' | 'enemy', stacks: number) => void;      // เมื่อหมดสถานะผล
  
  // === แท็กเพื่อจัดกลุ่ม ===
  tags?: string[];               // เช่น ['debuff', 'magical'], ['buff', 'physical']
};

/**
 * ข้อมูลสถานะผลที่มีอยู่ในตัวละคร (Player/Enemy)
 * ใช้สำหรับติดตามสถานะผลปัจจุบัน
 */
export type ActiveStatusEffect = StatusEffect & {
  sourceId?: string;             // แหล่งที่มาของสถานะผล (การ์ด, ศัตรู, สิ่งแวดล้อม)
  appliedTurn: number;           // เทิร์นที่ใส่สถานะผล
  lastProcessedTurn?: number;    // เทิร์นสุดท้ายที่ประมวลผล
};

/**
 * การตั้งค่าการใช้สถานะผลในระบบ
 */
export interface StatusEffectConfig {
  // === การจัดการ Stacking ===
  maxTotalDebuffs: number;       // จำนวน debuff สูงสุดต่อตัวละคร
  maxTotalBuffs: number;         // จำนวน buff สูงสุดต่อตัวละคร
  
  // === การป้องกันสถานะผล ===
  immunityTags: string[];        // แท็กที่ภูมิคุ้มกัน
  resistanceTags: string[];      // แท็กที่ต้านทาน (ลดระยะเวลา)
  
  // === การแสดงผล ===
  showDuration: boolean;         // แสดงจำนวนเทิร์นที่เหลือ
  showStacks: boolean;           // แสดงจำนวนชั้น
  animateOnApply: boolean;       // เล่นแอนิเมชันเมื่อใส่สถานะผล
}

/**
 * ผลลัพธ์จากการใช้สถานะผล
 * ใช้สำหรับ log และ feedback ให้ผู้เล่น
 */
export interface StatusEffectResult {
  success: boolean;              // สำเร็จหรือไม่
  effectApplied?: StatusEffect;  // สถานะผลที่ใส่
  blocked?: boolean;             // ถูกบล็อคโดยภูมิคุ้มกัน
  reduced?: boolean;             // ถูกลดผลโดยการต้านทาน
  message?: string;              // ข้อความแสดงผล
  logMessages: string[];         // ข้อความสำหรับ combat log
}