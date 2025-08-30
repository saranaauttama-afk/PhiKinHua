//*** NEW: src/ui/components/HUD.tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { GameState } from '../../core/types';
import type { ThemeTokens } from '../theme';
import Panel from './Panel';

type Props = { state: GameState; theme: ThemeTokens };

export default function HUD({ state, theme }: Props) {
  const p = state.player;
  return (
    <Panel theme={theme} style={{ marginBottom: 16 }}>
      <Text style={{ color: theme.colors.text }}>
        HP: <Text style={{ color: theme.colors.good }}>{p.hp}</Text>/{p.maxHp}  ·  Block: {p.block}
      </Text>
      <Text style={{ color: theme.colors.text }}>
        Energy: <Text style={{ color: theme.colors.accent }}>{p.energy}</Text>  ·  Gold: {p.gold}g
      </Text>
    </Panel>
  );
}
