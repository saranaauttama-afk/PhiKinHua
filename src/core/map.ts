// Map — generate, query nodes, and advance
import type { RNG } from './rng';
import { int } from './rng';

export type NodeKind = 'monster' | 'elite' | 'shop' | 'bonfire' | 'event' | 'boss';

export type MapNode = {
  id: string;
  col: number; // ความลึกจากซ้ายไปขวา
  row: number; // ตำแหน่งในคอลัมน์
  kind: NodeKind;
  completed?: boolean;
};

export type MapState = {
  cols: MapNode[][];
  depth: number;     // คอลัมน์ปัจจุบันที่ผู้เล่นจะเลือกเข้า
  totalCols: number;
  currentNodeId?: string; // โหนดที่กำลังเล่นอยู่ (ระหว่าง combat)
};

export function generateMap(rng: RNG, cols = 5): { rng: RNG; map: MapState } {
  let r = rng;
  const out: MapNode[][] = [];
  for (let c = 0; c < cols - 1; c++) {
    // คอลัมน์ 0..cols-2 มี 2–3 โหนดแบบสุ่ม
    const count = int(r, 2, 3); r = count.rng;
    const n = count.value;
    const nodes: MapNode[] = [];
    for (let i = 0; i < n; i++) {
      // Bias (ง่าย): monster 50, elite 25, shop 10, bonfire 5, event 10
      const roll = int(r, 1, 100); r = roll.rng;
      let kind: NodeKind = 'monster';
      const v = roll.value;
      if (v <= 50) kind = 'monster';
      else if (v <= 75) kind = 'elite';
      else if (v <= 85) kind = 'shop';
      else if (v <= 90) kind = 'bonfire';
      else kind = 'event';
      nodes.push({ id: `N${c}_${i}`, col: c, row: i, kind });
    }
    out.push(nodes);
  }
  // คอลัมน์สุดท้าย = boss 1 ตัว
  // ✅ Guarantee: มี "ร้าน" อย่างน้อย 1 จุดก่อนบอส (ถ้ายังไม่มี)
  let hasShop = false;
  for (const col of out) {
    if (col.some(n => n.kind === 'shop')) { hasShop = true; break; }
  }
  if (!hasShop && out.length > 0) {
    const pickCol = int(r, 0, out.length - 1); r = pickCol.rng;
    const colIdx = pickCol.value;
    const pickRow = int(r, 0, out[colIdx].length - 1); r = pickRow.rng;
    out[colIdx][pickRow.value].kind = 'shop';
  }
  // คอลัมน์สุดท้าย = boss 1 ตัว
  out.push([{ id: `N${cols - 1}_0`, col: cols - 1, row: 0, kind: 'boss' }]);
  return { rng: r, map: { cols: out, depth: 0, totalCols: cols } };
}

export function availableNodes(m: MapState): MapNode[] {
  if (m.depth >= m.totalCols) return [];
  return (m.cols[m.depth] ?? []).filter(n => !n.completed);
}

export function completeAndAdvance(m: MapState, nodeId?: string): MapState {
  const map = { ...m, cols: m.cols.map(col => col.map(n => ({ ...n }))) };
  if (nodeId) {
    for (const col of map.cols) {
      const n = col.find(v => v.id === nodeId);
      if (n) { n.completed = true; break; }
    }
  }
  map.currentNodeId = undefined;
  // ไปคอลัมน์ถัดไป (ทางเลือกง่ายใน M1)
  map.depth = Math.min(map.depth + 1, map.totalCols);
  return map;
}

export function findNode(map: MapState, nodeId: string | undefined): MapNode | undefined {
  if (!nodeId) return undefined;
  for (const col of map.cols) {
    const found = col.find(n => n.id === nodeId);
    if (found) return found;
  }
  return undefined;
}
