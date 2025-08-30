import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { CardData } from '../../core/types';
import type { ThemeTokens } from '../theme';

type Props = {
  hand: CardData[];
  energy: number;
  theme: ThemeTokens;
  onPlay: (index: number) => void;
};

function CardButton({
  disabled, onPress, theme, children,
}: { disabled?: boolean; onPress: () => void; theme: ThemeTokens; children: React.ReactNode }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={{
          paddingHorizontal: 12, paddingVertical: 8,
          borderRadius: theme.radius.card,
          borderWidth: 1, borderColor: theme.colors.border,
          backgroundColor: 'rgba(0,0,0,0.35)',
          marginRight: 8, marginBottom: 8,
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function Hand({ hand, energy, theme, onPlay }: Props) {
  // เก็บ Animated.Value ต่อใบ เพื่อให้ใบ "ใหม่" ค่อยๆ โผล่เข้ามา
  const animsRef = React.useRef<Animated.Value[]>([]);
  const prevLenRef = React.useRef<number>(0);

  React.useEffect(() => {
    const prevLen = prevLenRef.current;
    if (hand.length < animsRef.current.length) {
      animsRef.current = animsRef.current.slice(0, hand.length);
    }
    if (hand.length > prevLen) {
      // ใบใหม่ตั้งค่า opacity=0/translateY=6 แล้ว animate → 1/0
      for (let i = prevLen; i < hand.length; i++) {
        const v = new Animated.Value(0);
        animsRef.current[i] = v;
        Animated.timing(v, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      }
    }
    prevLenRef.current = hand.length;
  }, [hand.length]);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {hand.map((c, i) => {
        const canPlay = energy >= (c.cost ?? 0);
        const a = animsRef.current[i];
        const animatedStyle = a
          ? { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }
          : undefined;
        return (
          <Animated.View key={`${c.id}-${i}`} style={animatedStyle}>
            <CardButton disabled={!canPlay} onPress={() => onPlay(i)} theme={theme}>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
              {c.name} {c.rarity ? `(${c.rarity})` : ''}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts?.body }}>Cost {c.cost}</Text>
            {c.dmg ? <Text style={{ color: '#fca5a5' }}>DMG {c.dmg}</Text> : null}
            {c.block ? <Text style={{ color: '#93c5fd' }}>Block {c.block}</Text> : null}
            {c.energyGain ? <Text style={{ color: theme.colors.accent }}>Energy {c.energyGain}</Text> : null}
            {c.draw ? <Text style={{ color: theme.colors.good }}>Draw {c.draw}</Text> : null}
            </CardButton>
          </Animated.View>
        );
      })}
    </View>
  );
}
