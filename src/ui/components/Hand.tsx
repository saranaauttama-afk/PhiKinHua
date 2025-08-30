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
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {hand.map((c, i) => {
        const canPlay = energy >= (c.cost ?? 0);
        return (
          <CardButton key={`${c.id}-${i}`} disabled={!canPlay} onPress={() => onPlay(i)} theme={theme}>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
              {c.name} {c.rarity ? `(${c.rarity})` : ''}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>Cost {c.cost}</Text>
            {c.dmg ? <Text style={{ color: '#fca5a5' }}>DMG {c.dmg}</Text> : null}
            {c.block ? <Text style={{ color: '#93c5fd' }}>Block {c.block}</Text> : null}
            {c.energyGain ? <Text style={{ color: theme.colors.accent }}>Energy {c.energyGain}</Text> : null}
            {c.draw ? <Text style={{ color: theme.colors.good }}>Draw {c.draw}</Text> : null}
          </CardButton>
        );
      })}
    </View>
  );
}
