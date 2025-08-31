import React from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import type { GameState } from '../../../core/types';
import type { ThemeTokens } from '../../theme';
import Panel from '../Panel';
import Hand from '../Hand';
import { haptics } from '../../haptics';

type Props = {
  state: GameState;
  theme: ThemeTokens;
  onPlayCard: (index: number) => void;
  onEndTurn: () => void;
};

export default function BattleView({ state, theme, onPlayCard, onEndTurn }: Props) {
  const enemy = state.enemy;
  const canEndTurn = !!enemy && state.phase === 'combat';
  // === Hit flash & damage float ===
  const flash = React.useRef(new Animated.Value(0)).current; // 0..1 → overlay white
  const float = React.useRef(new Animated.Value(0)).current; // 0..1 → damage text fade/move
  const [lastDamage, setLastDamage] = React.useState<number | null>(null);
  const prevHpRef = React.useRef<number | null>(enemy?.hp ?? null);

  React.useEffect(() => {
    const prev = prevHpRef.current;
    const curr = enemy?.hp ?? null;
    if (prev != null && curr != null && curr < prev) {
      const dmg = prev - curr;
      setLastDamage(dmg);
      // flash
      flash.setValue(0);
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
      // float number
      float.setValue(0);
      Animated.timing(float, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        .start(); // ❗️ไม่ setState ตอนจบแอนิเมชัน (หลีกเลี่ยง warning)
    }
    prevHpRef.current = curr;
  }, [enemy?.hp]);

  const floatStyle = {
    opacity: float.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
    transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [8, -12] }) }],
  };
  const flashStyle = {
    opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
  };  
  return (
    <View>
      <Panel theme={theme} title={enemy ? enemy.name : 'Enemy'} style={{ marginBottom: 16 }}>
        <View style={{ position: 'relative' }}>
          {enemy ? (
            <>
              <Text style={{ color: theme.colors.textMuted }}>HP {enemy.hp}/{enemy.maxHp}</Text>
              <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>Intent: Attack {enemy.dmg}</Text>
              {/* Floating damage */}
              {lastDamage != null ? (
                <Animated.Text
                  style={[{
                    position: 'absolute', top: -6, left: 0, right: 0, textAlign: 'center',
                    fontWeight: '700', color: '#f87171', // red-400
                  }, floatStyle]}
                >
                  -{lastDamage}
                </Animated.Text>
              ) : null}
              {/* Flash overlay */}
              <Animated.View
                pointerEvents="none"
                style={[{ position: 'absolute', inset: 0, backgroundColor: '#fff', borderRadius: theme.radius.xl }, flashStyle]}
              />
            </>
          ) : (
            <Text style={{ color: theme.colors.textMuted }}>No enemy</Text>
          )}
        </View>
      </Panel>
      {/* Hand */}
      <Panel theme={theme} title="Hand">
        <Hand hand={state.piles.hand} energy={state.player.energy} theme={theme} onPlay={onPlayCard} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable
            onPressIn={() => { if (canEndTurn) haptics.tapSoft(); }}
            onPress={() => {
              if (!canEndTurn) { haptics.warn(); return; }
              haptics.confirm();
              onEndTurn();
            }}
            style={{
              paddingVertical: 8, paddingHorizontal: 16,
              borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
              backgroundColor: 'rgba(255,255,255,0.05)',
              opacity: canEndTurn ? 1 : 0.6,
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>End Turn</Text>
          </Pressable>
        </View>
      </Panel>
    </View>
  );
}
