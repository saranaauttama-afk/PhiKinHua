//*** NEW: src/ui/components/RewardModal.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { GameState } from '../../../core/types';
import type { ThemeTokens } from '../../theme';

type Props = {
  state: GameState;
  theme: ThemeTokens;
  onTake: (index: number) => void;
  onComplete: () => void;
};

export default function RewardModal({ state, theme, onTake, onComplete }: Props) {
  const options = state.rewardOptions ?? [];
  return (
    <View style={{
      marginTop: 24, borderRadius: theme.radius.xl, padding: 16,
      backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border
    }}>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
        Choose a reward
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {options.map((c, i) => (
          <Pressable
            key={`${c.id}-${i}`}
            onPress={() => onTake(i)}
            style={{
              paddingHorizontal: 12, paddingVertical: 8,
              borderRadius: theme.radius.card,
              borderWidth: 1, borderColor: theme.colors.border,
              backgroundColor: 'rgba(0,0,0,0.35)', marginRight: 8, marginBottom: 8
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{c.name}</Text>
            <Text style={{ color: theme.colors.textMuted }}>Cost {c.cost}</Text>
            {c.dmg ? <Text style={{ color: '#fca5a5' }}>DMG {c.dmg}</Text> : null}
            {c.block ? <Text style={{ color: '#93c5fd' }}>Block {c.block}</Text> : null}
            {c.energyGain ? <Text style={{ color: theme.colors.accent }}>Energy {c.energyGain}</Text> : null}
            {c.draw ? <Text style={{ color: theme.colors.good }}>Draw {c.draw}</Text> : null}
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pressable
          onPress={onComplete}
          style={{
            paddingVertical: 8, paddingHorizontal: 16,
            borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
            backgroundColor: 'rgba(255,255,255,0.05)'
          }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>CompleteNode</Text>
        </Pressable>
      </View>
    </View>
  );
}
