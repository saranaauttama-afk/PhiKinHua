import type { EquipmentData, GameState } from './types';

// ===== New: shared types =====
type TurnSide = 'player' | 'enemy';

// Hook ชนิดเดียวกับพร แต่เพิ่มบริบทฝั่ง (side)
type TurnHook  = (tc: { state: GameState; side: TurnSide }) => void;
type CardHook  = (tc: { state: GameState; side: TurnSide }, card: any) => void;
type DamageHook = (tc: { state: GameState; side: TurnSide; target: 'player'|'enemy'; amount: number }) => void;

type EquipBehavior = {
  /** ใช้ร่วมกับ on_card_played / on_turn_* ได้ (จำกัด 1 ครั้งต่อเทิร์น/ต่อฝั่ง) */
  oncePerTurn?: boolean;

  /** เดิม: เรียกครั้งเดียวตอนเริ่มไฟต์ (ยังรองรับเพื่อ backward compatibility) */
  on_equip?: TurnHook;
  /** ใหม่: alias ชัดความหมายว่า "เริ่มไฟต์" */
  on_battle_start?: TurnHook;

  on_turn_start?: TurnHook;
  on_turn_end?: TurnHook;
  on_card_played?: CardHook;

  /** ใหม่: เรียกหลังคำนวณดาเมจแล้ว ใช้กับเอฟเฟกต์แบบ thorns/trigger on damage */
  on_damage_dealt?: DamageHook;
};

// === Registry: ผูก behavior ตาม id (ข้อมูลใน JSON ใส่แค่ข้อความ-เมตา)
const REGISTRY: Record<string, EquipBehavior> = {
  // ฟื้นฟูเล็กน้อยปลายเทิร์น
  regen_charm: {
    on_turn_end: ({ state: s, side }) => {
      if (side === 'player') {
        const before = s.player.hp;
        s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1);
        const healed = s.player.hp - before;
        s.log.push(healed > 0 ? 'Equip: Player Regen Charm heals 1.' : 'Equip: Player Regen Charm (no effect).');
      } else if (side === 'enemy' && s.enemy) {
        const before = s.enemy.hp;
        s.enemy.hp = Math.min(s.enemy.maxHp, s.enemy.hp + 1);
        const healed = s.enemy.hp - before;
        s.log.push(healed > 0 ? 'Equip: Enemy Regen Charm heals 1.' : 'Equip: Enemy Regen Charm (no effect).');
      }
    },
  },
  // ได้ Block 5 ตอนเริ่มไฟต์และทุกเทิร์น
  start_shield: {
    on_battle_start: ({ state: s, side }) => {
      if (side === 'player') {
        s.player.block = (s.player.block ?? 0) + 5;
        s.log.push('Equip: Player Start Shield gives Block +5 (battle start).');
      } else if (side === 'enemy' && s.enemy) {
        s.enemy.block = (s.enemy.block ?? 0) + 5;
        s.log.push('Equip: Enemy Start Shield gives Block +5 (battle start).');
      }
    },
    on_turn_start: ({ state: s, side }) => {
      if (side === 'player') {
        s.player.block = (s.player.block ?? 0) + 5;
        s.log.push('Equip: Player Start Shield gives Block +5 (turn start).');
      } else if (side === 'enemy' && s.enemy) {
        s.enemy.block = (s.enemy.block ?? 0) + 5;
        s.log.push('Equip: Enemy Start Shield gives Block +5 (turn start).');
      }
    },
  },
  // ใบแรกที่เล่นแต่ละเทิร์น +1 Energy (ทั้ง player/enemy)
  battle_rhythm_band: {
    oncePerTurn: true,
    on_card_played: ({ state: s, side }) => {
      if (side === 'player') {
        s.player.energy += 1;
        s.log.push('Equip: Player Battle Rhythm (+1 energy on first play).');
      } else if (side === 'enemy' && s.enemyEnergy !== undefined) {
        s.enemyEnergy += 1;
        s.log.push('Equip: Enemy Battle Rhythm (+1 energy on first play).');
      }
    },
  },

  // === Thai Shaman Equipment ===
  // ผ้าเย็นถาวร: ฟื้นฟู 2 HP ต้นเทิร์น
  cooling_cloth_equipment: {
    on_turn_start: ({ state: s, side }) => {
      if (side === 'player') {
        const before = s.player.hp;
        s.player.hp = Math.min(s.player.maxHp, s.player.hp + 2);
        const healed = s.player.hp - before;
        s.log.push(healed > 0 ? 'ผ้าเย็น: ฟื้นฟู 2 HP' : 'ผ้าเย็น: HP เต็มแล้ว');
      }
    },
  },

  // เครื่องรางหลวงปู่: ลดดาเมจที่รับ 1 แต้ม
  luang_pu_amulet: {
    on_damage_dealt: ({ state: s, side, target, amount }) => {
      if (target === 'player' && side === 'enemy') {
        // ลดดาเมจที่ผู้เล่นรับจากศัตรู
        const reduction = Math.min(1, amount);
        s.player.hp += reduction;
        s.log.push(`เครื่องรางหลวงปู่: ลดดาเมจ ${reduction} แต้ม`);
      }
    },
  },

  // ลูกประคำ: เมื่อเล่นการ์ดโจมตี +1 ดาเมจ
  prayer_beads: {
    on_card_played: ({ state: s, side }, card) => {
      if (side === 'player' && card.type === 'attack' && card.dmg) {
        // เพิ่มดาเมจให้การ์ดโจมตี (จำลองโดยเพิ่ม HP ให้ศัตรู)
        if (s.enemy) {
          s.enemy.hp -= 1;
          s.log.push('ลูกประคำ: +1 ดาเมจ');
        }
      }
    },
  },

  // กะโหลกนางตานี: เมื่อศัตรูตาย จั่วการ์ด 1 ใบ
  nang_tani_skull: {
    // Note: จะต้องเรียกผ่าน event อื่นเมื่อศัตรูตาย
  },

  // ไม้เท้าหมอผี: การ์ดแรกแต่ละเทิร์น ใช้ Energy -1
  shaman_staff: {
    oncePerTurn: true,
    on_card_played: ({ state: s, side }, card) => {
      if (side === 'player' && card.cost > 0) {
        s.player.energy += 1;
        s.log.push('ไม้เท้าหมอผี: ลด Energy 1 แต้ม');
      }
    },
  },
};

// === Helpers ===
function activeEquipped(s: GameState, side: TurnSide = 'player'): EquipmentData[] {
  // เลือก equipment list ตาม side
  const list = side === 'player' ? (s.equipped ?? []) : (s.enemy?.equipped ?? []);
  const slots = side === 'player' ? (s.equipmentSlotsMax ?? 0) : 1; // ศัตรูมี 1 slot เป็นพื้นฐาน
  
  let used = 0;
  const active: EquipmentData[] = [];
  for (const e of list) {
    const cost = Math.max(1, e.slotCost ?? 1);
    if (used + cost <= slots) {
      active.push(e); used += cost;
    } else {
      // เกินโควต้า → ยังไม่ใช้งานในไฟต์นี้
    }
  }
  return active;
}

 function ensureEquipFlags(s: GameState) {
   // ถ้า turnFlags ยังไม่มี ให้ตั้งโครงพื้นฐานไว้ก่อน
   s.turnFlags = s.turnFlags ?? { blessingOnce: {} as Record<string, boolean> };
   // ถ้า equipmentOnce ยังไม่มี ให้สร้าง object ว่าง
   // (สำคัญ! ป้องกัน Cannot set property '... of undefined')
   // @ts-ignore - turnFlags อาจไม่ประกาศ equipmentOnce ใน type เดิม
   if (!s.turnFlags.equipmentOnce) s.turnFlags.equipmentOnce = {};
 }

/** คีย์ once-per-turn ที่แยกประเภทและแยกฝั่งอย่างชัดเจน */
const onceKey = (e: EquipmentData, tag: string, side: TurnSide) =>
  `equip:${e.id}:${tag}:${side}`;

export function resetEquipmentTurnFlags(s: GameState) {
  ensureEquipFlags(s);
  // รีเซ็ตเฉพาะของอุปกรณ์ในเทิร์นใหม่
  // @ts-ignore
  s.turnFlags.equipmentOnce = {};
}

/** ใหม่: เรียกเมื่อเริ่มไฟต์ (alias on_battle_start + on_equip แบบเดิม) */
export function runEquipmentOnBattleStart(s: GameState, side: TurnSide = 'player') {
  ensureEquipFlags(s);
  for (const e of activeEquipped(s, side)) {
    const bh = REGISTRY[e.id];
    if (bh?.on_battle_start) bh.on_battle_start({ state: s, side });
    if (bh?.on_equip)        bh.on_equip({ state: s, side }); // backward compat
  }
}

/** คงชื่อเดิมไว้เป็น alias เพื่อไม่ให้ call site เดิมพัง */
export const runEquipmentOnEquip = runEquipmentOnBattleStart;

/** Hook เทิร์น (เริ่ม/จบ) — รองรับ once-per-turn สำหรับทั้ง start/end และแยกฝั่ง */
export function runEquipmentTurnHook(
  s: GameState,
  which: 'on_turn_start' | 'on_turn_end',
  side: TurnSide = 'player'
) {
  ensureEquipFlags(s);
  for (const e of activeEquipped(s, side)) {
    const bh = REGISTRY[e.id];
    const fn = bh?.[which];
    if (!fn) continue;

    if (bh.oncePerTurn) {
      const k = onceKey(e, which, side);
      if (s.turnFlags?.equipmentOnce?.[k]) continue;
      fn({ state: s, side });
      s.turnFlags!.equipmentOnce![k] = true;
    } else {
      fn({ state: s, side });
    }
  }
}

/** Hook เมื่อมีการ์ดถูกเล่น (player/enemy) — รองรับ once-per-turn (แยกฝั่ง) */
export function runEquipmentCardPlayed(
  s: GameState,
  played: any,
  side: TurnSide = 'player'
) {
  ensureEquipFlags(s);
  for (const e of activeEquipped(s, side)) {
    const bh = REGISTRY[e.id];
    const fn = bh?.on_card_played;
    if (!fn) continue;

    if (bh.oncePerTurn) {
      const k = onceKey(e, 'on_card_played', side);
      // @ts-ignore
      if (s.turnFlags.equipmentOnce[k]) continue;
      fn({ state: s, side }, played);
      // @ts-ignore
      s.turnFlags.equipmentOnce[k] = true;
    } else {
      fn({ state: s, side }, played);
    }
  }
}

/** ใหม่: Hook บนเหตุการณ์ทำดาเมจ */
export function runEquipmentDamageDealt(
  s: GameState,
  payload: { amount: number; side: TurnSide; target: 'player' | 'enemy' }
) {
  for (const e of activeEquipped(s)) {
    const bh = REGISTRY[e.id];
    const fn = bh?.on_damage_dealt;
    if (!fn) continue;
    fn({ state: s, side: payload.side, target: payload.target, amount: payload.amount });
  }
}
