//*** NEW: src/ui/theme.ts
export type SkinId = 'wire' | 'thai_fairytale';

export type ThemeTokens = {
  id: SkinId;
  colors: {
    bg: string;
    panel: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    good: string;
    vignetteEdge?: string;   // สีขอบมืด
    vignetteCenter?: string; // ไฮไลท์กลาง
  };
  radius: { xl: number; card: number };
  durations: { fast: number; normal: number };
  fonts?: { title?: string; body?: string };
  elevation: {
    0: number;
    1: number;
    2: number;
    3: number;
  };  
};

export function getTheme(id: SkinId): ThemeTokens {
  if (id === 'thai_fairytale') {
    return {
      id,
      colors: {
        bg: '#0b1020',          // น้ำเงินเข้มกลางคืน
        panel: '#12172a',       // พาเนลเข้ม
        border: 'rgba(212,175,55,0.25)', // ขอบทองโปร่ง
        text: '#f7f0d9',        // พาร์ชเมนต์
        textMuted: 'rgba(247,240,217,0.7)',
        accent: '#d4af37',      // ทองคำ
        good: '#9ae6b4',
        vignetteEdge: '#000000',
        vignetteCenter: '#d4af37',
      },
      radius: { xl: 18, card: 16 },
      durations: { fast: 120, normal: 240 },
      elevation: { 0: 0, 1: 2, 2: 6, 3: 12 },
    };
  }
  // default: wireframe
  return {
    id,
    colors: {
      bg: '#111827',           // zinc-900
      panel: 'rgba(39,39,42,0.7)', // zinc-800/70
      border: 'rgba(255,255,255,0.1)',
      text: '#ffffff',
      textMuted: 'rgba(255,255,255,0.7)',
      accent: '#60a5fa',       // blue-400
      good: '#34d399',         // emerald-400
      vignetteEdge: '#000000',
      vignetteCenter: '#60a5fa',
    },
    radius: { xl: 16, card: 14 },
    durations: { fast: 120, normal: 220 },
    elevation: { 0: 0, 1: 2, 2: 6, 3: 12 },
  };
}

// Helper: เงา cross-platform ตามระดับ
export function shadowStyle(level: 0 | 1 | 2 | 3, color = '#000') {
  if (level === 0) return {};
  const ios = {
    shadowColor: color,
    shadowOpacity: 0.18 + 0.06 * (level - 1),
    shadowRadius: 2 + 3 * (level - 1),
    shadowOffset: { width: 0, height: 1 + level },
  } as const;
  const android = { elevation: [0, 2, 6, 12][level] } as const;
  return { ...ios, ...android };
}
