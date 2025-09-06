// EXP และฟังก์ชันเลเวลอัป (คงโค้งเดิม)
export const EXP_KILL_NORMAL = 10;
export const EXP_KILL_ELITE  = 25;
export const EXP_KILL_BOSS   = 100;

export function nextExpForLevel(level: number) {
  // 20, 50, 90, 140, 200, ...
  const base = 20;
  return Math.round(base + 15 * (level - 1) + 5 * (level - 1) * (level - 1));
}
