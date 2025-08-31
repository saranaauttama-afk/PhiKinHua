import * as Haptics from 'expo-haptics';

function fire<T>(fn: () => Promise<T>) {
  // ป้องกัน throw ในบางอุปกรณ์: ยิงแบบ fire-and-forget
  try { void fn(); } catch {}
}

export const haptics = {
  // แตะเบา ๆ (กดการ์ด, hover mobile)
  tapSoft() {
    fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
  },
  // เล่นไพ่สำเร็จ
  playCard() {
    fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  // ซื้อของ / รับรางวัล (ไว้ใช้รอบถัดไป)
  confirm() {
    fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  // ใช้เวลาห้าม / พลังงานไม่พอ (ไว้ใช้รอบถัดไป)
  warn() {
    fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
};
