import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { GameState } from '../../../core/types';
import type { ThemeTokens } from '../../theme';
import Panel from '../Panel';
import Hand from '../Hand';

type Props = {
  state: GameState;
  theme: ThemeTokens;
  onPlayCard: (index: number) => void;
  onEndTurn: () => void;
};

export default function BattleView({ state, theme, onPlayCard, onEndTurn }: Props) {
  const enemy = state.enemy;
  return (
    <View>
      <Panel theme={theme} title={enemy ? enemy.name : 'Enemy'} style={{ marginBottom: 16 }}>
        {enemy ? (
          <>
            <Text style={{ color: theme.colors.textMuted }}>HP {enemy.hp}/{enemy.maxHp}</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>Intent: Attack {enemy.dmg}</Text>
          </>
        ) : (
          <Text style={{ color: theme.colors.textMuted }}>No enemy</Text>
        )}
      </Panel>
      {/* Hand */}
      <Panel theme={theme} title="Hand">
        <Hand hand={state.piles.hand} energy={state.player.energy} theme={theme} onPlay={onPlayCard} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable
            onPress={onEndTurn}
            style={{
              paddingVertical: 8, paddingHorizontal: 16,
              borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>End Turn</Text>
          </Pressable>
        </View>
      </Panel>
    </View>
  );
}
