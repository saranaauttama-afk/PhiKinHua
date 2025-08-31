let SCALE = 1; // 1x = ปกติ, 2x = เร็วขึ้นสองเท่า (ระยะเวลา /2)

export function setAnimSpeedScale(v: number) {
  // ป้องกันค่าประหลาด
  SCALE = Math.min(3, Math.max(0.25, v));
}
export function getAnimSpeedScale() {
  return SCALE;
}
// แปลง ms ด้วย speed scale (ยิ่ง scale สูง แอนิเมชันยิ่งสั้น/เร็ว)
export function dur(ms: number) {
  const d = Math.max(1, Math.round(ms / SCALE));
  return d;
}
