//*** NEW: src/ui/components/MapView.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { GameState } from '../../../core/types';
import type { ThemeTokens } from '../../theme';
import { haptics } from '../../haptics';

type Props = {
  state: GameState;
  theme: ThemeTokens;
  onEnterNode: (nodeId: string) => void;
};

export default function MapView({ state, theme, onEnterNode }: Props) {
  const depth = state.map?.depth ?? 0;
  const total = state.map?.totalCols ?? 0;
  const nodes = state.map?.cols[depth] ?? [];
  return (
    <View style={{
      borderRadius: theme.radius.xl, padding: 16, marginBottom: 16,
      backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border
    }}>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600' }}>Map</Text>
      <Text style={{ color: theme.colors.textMuted, marginBottom: 8 }}>
        Depth {depth}/{total}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {nodes.map((n) => (
          <Pressable
            key={n.id}
            onPressIn={() => haptics.tapSoft()}
            onPress={() => { haptics.confirm(); onEnterNode(n.id); }}
            style={{
              paddingHorizontal: 12, paddingVertical: 8,
              borderRadius: theme.radius.card,
              borderWidth: 1, borderColor: theme.colors.border,
              backgroundColor: 'rgba(0,0,0,0.35)', marginRight: 8, marginBottom: 8
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
              {n.kind === 'boss' ? '👑 Boss'
                : n.kind === 'elite' ? '💀 Elite'
                : n.kind === 'shop' ? '🛒 Shop'
                : n.kind === 'bonfire' ? '🔥 Bonfire'
                : n.kind === 'event' ? '✨ Event'
                : '👾 Monster'} {n.col}.{n.row}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
