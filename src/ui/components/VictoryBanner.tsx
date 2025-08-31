import React from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import type { ThemeTokens } from '../theme';

type Props = {
  theme: ThemeTokens;
  active: boolean;        // true เมื่อ phase === 'victory'
  autoHideMs?: number;    // เวลาแสดงก่อนหายเอง
  onContinue?: () => void; // ✅ เรียกเมื่อกด Continue
};

export default function VictoryBanner({ theme, active, autoHideMs = 1600, onContinue }: Props) {
  // ทำให้โชว์แค่หนึ่งครั้งต่อรอบ victory (แม้ active ค้างอยู่)
  const [visible, setVisible] = React.useState(false);
  const [epoch, setEpoch] = React.useState(0);
  const prevActive = React.useRef(false);

  const fade = React.useRef(new Animated.Value(0)).current; // 0..1
  const slide = React.useRef(new Animated.Value(0)).current; // 0..1

  React.useEffect(() => {
    if (!prevActive.current && active) {
      // เริ่มรอบใหม่ของ victory
      setEpoch(e => e + 1);
      setVisible(true);
      fade.setValue(0);
      slide.setValue(0);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      // auto hide
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fade, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(slide, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) setVisible(false); });
      }, autoHideMs);
      return () => clearTimeout(t);
    }
    prevActive.current = active;
  }, [active]);

  if (!visible) return null;

  const contStyle = {
    opacity: fade,
    transform: [
      { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
      { scale: slide.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };

  return (
    <Animated.View
      // overlay กลางจอด้านบน
      style={[{
        position: 'absolute', top: 24, left: 16, right: 16, zIndex: 50,
      }, contStyle]}
      // ใช้ key ผูกกับ epoch เพื่อให้ React รีเรนเดอร์ถูกจังหวะ (optional)
    >
      <View
        style={{
          borderRadius: theme.radius.xl,
          paddingVertical: 14, paddingHorizontal: 16,
          backgroundColor: 'rgba(0,0,0,0.65)',
          borderWidth: 1, borderColor: theme.colors.accent,
        }}
      >
        <Text style={{ color: theme.colors.accent, fontWeight: '800', fontSize: 18, textAlign: 'center', fontFamily: theme.fonts?.title }}>
          Victory!
        </Text>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 4 }}>
          You won the battle.
        </Text>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Pressable
            onPress={() => {
              // ปุ่มนี้ปิดเฉพาะ overlay (UI) — ไม่ยุ่ง Engine
              onContinue?.();
              Animated.parallel([
                Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }),
              ]).start(() => setVisible(false));
            }}
            style={{
              paddingVertical: 6, paddingHorizontal: 12,
              borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
