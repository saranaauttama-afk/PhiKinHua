import React from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import type { GameState } from '../../../core/types';
import type { ThemeTokens } from '../../theme';
import Panel from '../Panel';
import Hand from '../Hand';
import { haptics } from '../../haptics';
import { dur } from '../../anim';

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

  // === Enemy Intent Tooltip (long-press) ===
  const tipFade = React.useRef(new Animated.Value(0)).current; // 0..1
  const [tipEverShown, setTipEverShown] = React.useState(false); // ให้ mount ครั้งเดียวเลี่ยง setState ใน callback
  const showTip = () => {
    if (!enemy) return;
    setTipEverShown(true);
    tipFade.setValue(0);
    haptics.tapSoft();
    Animated.timing(tipFade, { toValue: 1, duration: dur(140), useNativeDriver: true }).start();
  };
  const hideTip = () => {
    Animated.timing(tipFade, { toValue: 0, duration: dur(120), useNativeDriver: true }).start();
  };  

  React.useEffect(() => {
    const prev = prevHpRef.current;
    const curr = enemy?.hp ?? null;
    if (prev != null && curr != null && curr < prev) {
      const dmg = prev - curr;
      setLastDamage(dmg);
      // flash
      flash.setValue(0);
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: dur(60), easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: dur(180), easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
      // float number
      float.setValue(0);
      Animated.timing(float, { toValue: 1, duration: dur(500), easing: Easing.out(Easing.cubic), useNativeDriver: true })
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
              {/* Make intent area pressable for tooltip */}
              <Pressable
                onLongPress={showTip}
                delayLongPress={250}
                onPressOut={hideTip}
                style={{ paddingVertical: 2 }}
              >
                <Text style={{ color: theme.colors.textMuted }}>
                  HP {enemy.hp}/{enemy.maxHp}
                </Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
                  Intent: {enemy.dmg > 0 ? `Attack ${enemy.dmg}` : '—'}
                </Text>
              </Pressable>

              {/* Tooltip bubble (mounted once; show/hide by opacity) */}
              {tipEverShown ? (
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -6,
                    left: 0,
                    right: 0,
                    opacity: tipFade,
                    transform: [{ translateY: tipFade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      maxWidth: 280,
                      borderRadius: theme.radius.card,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '700', textAlign: 'center' }}>
                      {enemy.name} — Intent
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>
                      {enemy.dmg > 0
                        ? `Will attack for ${enemy.dmg} damage on its turn.\nYour Block reduces damage this turn.`
                        : 'No attack this turn (idle or other action).'}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, marginTop: 6, fontSize: 12 }}>
                      Tip: End Turn to let the enemy act. Build Block first to mitigate damage.
                    </Text>
                  </View>
                </Animated.View>
              ) : null}

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
