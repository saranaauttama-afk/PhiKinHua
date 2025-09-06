import type { EquipmentData, GameState } from './types';

// Hook ชนิดเดียวกับพร แต่แยก runtime
type TurnHook = (tc: { state: GameState }) => void;
type CardHook = (tc: { state: GameState }, card: any) => void;

type EquipBehavior = {
  oncePerTurn?: boolean;                 // ใช้ร่วมกับ on_card_played / on_turn_* ได้
  on_equip?: TurnHook;                   // เรียก "ครั้งเดียว" ตอนเริ่มไฟต์
  on_turn_start?: TurnHook;
  on_turn_end?: TurnHook;
  on_card_played?: CardHook;
};

// === Registry: ผูก behavior ตาม id (ข้อมูลใน JSON ใส่แค่ข้อความ-เมตา)
const REGISTRY: Record<string, EquipBehavior> = {
  // ฟื้นฟูเล็กน้อยปลายเทิร์น
  regen_charm: {
    on_turn_end: ({ state: s }) => {
      const before = s.player.hp;
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1);
      const healed = s.player.hp - before;
      s.log.push(healed > 0 ? 'Equip: Regen Charm heals 1.' : 'Equip: Regen Charm (no effect).');
    },
  },
  // ได้ Block 5 เมื่อเข้าคอมแบต
  start_shield: {
    on_equip: ({ state: s }) => {
      s.player.block = (s.player.block ?? 0) + 5;
      s.log.push('Equip: Start Shield gives Block +5.');
    },
  },
  // ใบแรกที่เล่นแต่ละเทิร์น +1 Energy
  battle_rhythm_band: {
    oncePerTurn: true,
    on_card_played: ({ state: s }) => {
      // กรณี once-per-turn ใช้ร่วมกับธงใน turnFlags.equipmentOnce
      s.player.energy += 1;
      s.log.push('Equip: Battle Rhythm (+1 energy on first play).');
    },
  },
};

// === Helpers ===
function activeEquipped(s: GameState): EquipmentData[] {
  const list = s.equipped ?? [];
  const slots = s.equipmentSlotsMax ?? 0;
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

export function resetEquipmentTurnFlags(s: GameState) {
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
  s.turnFlags.equipmentOnce = {};
}

export function runEquipmentOnEquip(s: GameState) {
  for (const e of activeEquipped(s)) {
    const bh = REGISTRY[e.id];
    if (bh?.on_equip) bh.on_equip({ state: s });
  }
}

export function runEquipmentTurnHook(s: GameState, which: 'on_turn_start' | 'on_turn_end') {
  for (const e of activeEquipped(s)) {
    const bh = REGISTRY[e.id];
    const fn = bh?.[which];
    if (fn) {
      // once-per-turn ใช้เฉพาะ hook ที่มีความหมายเป็นครั้งเดียว เช่น on_turn_start
      if (bh.oncePerTurn && which === 'on_turn_start') {
        const k = `equip:${e.id}:start`;
        if (s.turnFlags?.equipmentOnce?.[k]) continue;
        fn({ state: s });
        s.turnFlags!.equipmentOnce![k] = true;
      } else {
        fn({ state: s });
      }
    }
  }
}

export function runEquipmentCardPlayed(s: GameState, played: any) {
  for (const e of activeEquipped(s)) {
    const bh = REGISTRY[e.id];
    const fn = bh?.on_card_played;
    if (!fn) continue;
    if (bh.oncePerTurn) {
      const k = `equip:${e.id}:played`;
      if (s.turnFlags?.equipmentOnce?.[k]) continue;
      fn({ state: s }, played);
      s.turnFlags!.equipmentOnce![k] = true;
    } else {
      fn({ state: s }, played);
    }
  }
}
