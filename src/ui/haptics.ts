import * as Haptics from 'expo-haptics';

function fire<T>(fn: () => Promise<T>) {
  // ป้องกัน throw ในบางอุปกรณ์: ยิงแบบ fire-and-forget
  try { void fn(); } catch {}
}

let ENABLED = true;

export const haptics = {
  setEnabled(v: boolean) { ENABLED = v; },
  isEnabled() { return ENABLED; },
  // แตะเบา ๆ (กดการ์ด, hover mobile)
  tapSoft() {
    if (!ENABLED) return;
    fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
  },
  // เล่นไพ่สำเร็จ
  playCard() {
    if (!ENABLED) return;
    fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  // ซื้อของ / รับรางวัล (ไว้ใช้รอบถัดไป)
  confirm() {
    if (!ENABLED) return;
    fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  // ใช้เวลาห้าม / พลังงานไม่พอ (ไว้ใช้รอบถัดไป)
  warn() {
    if (!ENABLED) return;
    fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
};
