// EXP และฟังก์ชันเลเวลอัป (Roguelike optimized for 12-15 encounters)
export const EXP_KILL_NORMAL = 12;  // Slightly higher for faster progression
export const EXP_KILL_ELITE  = 40;  // Much higher - Elite fights = big XP boost
export const EXP_KILL_BOSS   = 100; // Boss gives full level

export function nextExpForLevel(level: number) {
  // Adjusted curve to reach level 10 with current encounters (9 normal + 3 elite = 228 XP)
  // Target: Level 10 before boss (total 220 XP for levels 1-10)
  const base = 10;
  return base + (level - 1) * 4; // Very gentle progression: 10, 14, 18, 22, 26, 30, 34, 38, 42, 46
}
