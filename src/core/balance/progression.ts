// EXP และฟังก์ชันเลเวลอัป (Roguelike optimized for 12-15 encounters)
export const EXP_KILL_NORMAL = 12;  // Slightly higher for faster progression
export const EXP_KILL_ELITE  = 40;  // Much higher - Elite fights = big XP boost
export const EXP_KILL_BOSS   = 100; // Boss gives full level

export function nextExpForLevel(level: number) {
  // Gentler curve: 20, 32, 44, 56, 68, 80, 92, 104, 116, 128
  // Target: Level 10 in ~12-15 encounters (8 normal + 3-4 elite + boss)
  const base = 20;
  return base + (level - 1) * 12; // Much smoother progression
}
