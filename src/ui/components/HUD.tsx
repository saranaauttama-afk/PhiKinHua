//*** NEW: src/ui/components/HUD.tsx
import React from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import type { GameState } from '../../core/types';
import type { ThemeTokens } from '../theme';
import Panel from './Panel';
import { haptics } from '../haptics';

type Props = { state: GameState; theme: ThemeTokens };

export default function HUD({ state, theme }: Props) {
  const p = state.player;
  // === Player hit/heal feedback ===
  const flash = React.useRef(new Animated.Value(0)).current;   // 0..1 → white overlay
  const float = React.useRef(new Animated.Value(0)).current;   // 0..1 → number fade/move
  const [lastDelta, setLastDelta] = React.useState<number | null>(null);
  const prevHpRef = React.useRef<number | null>(p.hp);

  React.useEffect(() => {
    const prev = prevHpRef.current;
    const curr = p.hp;
    if (prev != null && curr != null && curr !== prev) {
      const delta = curr - prev; // + heal, - damage
      setLastDelta(delta);
      // Flash: แดงจางเมื่อโดนดาเมจ, เขียวจางเมื่อฮีล
      flash.setValue(0);
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
      // Float number
      float.setValue(0);
      Animated.timing(float, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        .start(); // ❗️ไม่ setState ตอนจบ (ป้องกัน warning)
      // Haptics
      if (delta < 0) haptics.warn(); else haptics.confirm();
    }
    prevHpRef.current = curr;
  }, [p.hp]);

  const floatStyle = {
    opacity: float.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
    transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [8, -12] }) }],
  } as const;
  const flashStyle = (lastDelta ?? 0) < 0
    ? { backgroundColor: '#ff4747', opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }) }
    : { backgroundColor: '#22c55e', opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }) };

  return (
    <Panel theme={theme} style={{ marginBottom: 16 }}>
      <View style={{ position: 'relative' }}>
        <Text style={{ color: theme.colors.text }}>
          HP: <Text style={{ color: theme.colors.good }}>{p.hp}</Text>/{p.maxHp}  ·  Block: {p.block}
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Energy: <Text style={{ color: theme.colors.accent }}>{p.energy}</Text>  ·  Gold: {p.gold}g
        </Text>

        {/* Blessings (แสดงใต้ Energy) */}
        {Array.isArray(state.blessings) && state.blessings.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 }}>
              พรที่มีอยู่
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {state.blessings.map((b, i) => (
                <View
                  key={b.id ?? i}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    marginRight: 6,
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{ color: theme.colors.text, fontSize: 12, maxWidth: 140 }}
                    numberOfLines={1}
                  >
                    {b.name ?? b.id}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Floating heal/damage number */}
        {lastDelta != null ? (
          <Animated.Text
            style={[
              {
                position: 'absolute', top: -10, left: 0, right: 0, textAlign: 'center',
                fontWeight: '700',
                color: lastDelta < 0 ? '#f87171' : '#86efac', // red-400 / green-300
              },
              floatStyle,
            ]}
          >
            {lastDelta < 0 ? `-${Math.abs(lastDelta)}` : `+${lastDelta}`}
          </Animated.Text>
        ) : null}

        {/* Flash overlay */}
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', inset: 0, borderRadius: theme.radius.xl }, flashStyle]}
        />
      </View>
    </Panel>
  );
}
