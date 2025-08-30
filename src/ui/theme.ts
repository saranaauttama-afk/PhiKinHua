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
  };
  radius: { xl: number; card: number };
  durations: { fast: number; normal: number };
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
      },
      radius: { xl: 18, card: 16 },
      durations: { fast: 120, normal: 240 },
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
    },
    radius: { xl: 16, card: 14 },
    durations: { fast: 120, normal: 220 },
  };
}
