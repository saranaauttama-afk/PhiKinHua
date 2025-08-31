import React from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import type { ThemeTokens } from '../theme';

type Props = {
  theme: ThemeTokens;
  active: boolean;        // true เมื่อ phase === 'defeat'
  autoHideMs?: number;    // เวลาแสดงก่อนหายเอง
  onContinue?: () => void; // ✅ เรียกเมื่อกด Continue/Close
};

export default function DefeatBanner({ theme, active, autoHideMs = 1800, onContinue }: Props) {
  const [visible, setVisible] = React.useState(false);
  const prevActive = React.useRef(false);
  const fade = React.useRef(new Animated.Value(0)).current;
  const slide = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!prevActive.current && active) {
      setVisible(true);
      fade.setValue(0);
      slide.setValue(0);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
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
    <Animated.View style={[{ position: 'absolute', top: 24, left: 16, right: 16, zIndex: 50 }, contStyle]}>
      <View
        style={{
          borderRadius: theme.radius.xl,
          paddingVertical: 14, paddingHorizontal: 16,
          backgroundColor: 'rgba(0,0,0,0.68)',
          borderWidth: 1, borderColor: '#f87171', // red-400
        }}
      >
        <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 18, textAlign: 'center', fontFamily: theme.fonts?.title }}>
          Defeat
        </Text>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 4 }}>
          You were defeated.
        </Text>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Pressable
            onPress={() => {
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
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
