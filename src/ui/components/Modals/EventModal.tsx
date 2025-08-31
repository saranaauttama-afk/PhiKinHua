import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { GameState, DeckPiles } from '../../../core/types';
import type { ThemeTokens } from '../../theme';
import Panel from '../Panel';
import { haptics } from '../../haptics';

type Props = {
  state: GameState;
  theme: ThemeTokens;
  onBonfireHeal: () => void;
  onChooseBlessing: (index: number) => void;
  onRemoveCard: (pile: keyof DeckPiles, index: number) => void;
  onGambleRoll: () => void;
  onTreasureOpen: () => void;
  onComplete: () => void;
};

export default function EventModal({
  state, theme,
  onBonfireHeal, onChooseBlessing, onRemoveCard, onGambleRoll, onTreasureOpen, onComplete,
}: Props) {
  if (state.phase !== 'event' || !state.event) return null;
  const e = state.event;

  // Common button
  const Btn = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8, paddingHorizontal: 16,
        borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
        backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, marginTop: 12,
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );

  if (e.type === 'bonfire') {
    return (
      <Panel theme={theme} title="Bonfire 🔥" style={{ marginTop: 24 }}>
        <Text style={{ color: theme.colors.text }}>
          HP <Text style={{ color: theme.colors.good }}>{state.player.hp}</Text>/{state.player.maxHp}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Btn title="Heal 10" onPress={onBonfireHeal} />
          <Btn title="CompleteNode" onPress={() => { haptics.confirm(); onComplete(); }} />
        </View>
      </Panel>
    );
  }

  if (e.type === 'shrine') {
    return (
      <Panel theme={theme} title="Shrine ✨ — Choose a blessing" style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(e.options ?? []).map((b, i) => (
            <Pressable
              key={b.id}
              onPress={() => onChooseBlessing(i)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8,
                borderRadius: theme.radius.card,
                borderWidth: 1, borderColor: theme.colors.border,
                backgroundColor: 'rgba(0,0,0,0.35)', marginRight: 8, marginBottom: 8,
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                {b.name} {b.rarity ? `(${b.rarity})` : ''}
              </Text>
              {b.desc ? <Text style={{ color: theme.colors.textMuted }}>{b.desc}</Text> : null}
            </Pressable>
          ))}
        </View>
        <Btn title="CompleteNode" onPress={() => { haptics.confirm(); onComplete(); }} />
      </Panel>
    );
  }

  if (e.type === 'remove') {
    return (
      <Panel theme={theme} title="Remove Card 🗑️" style={{ marginTop: 24 }}>
        <Text style={{ color: theme.colors.textMuted, marginBottom: 8 }}>
          Removed this run: {state.runCounters?.removed ?? 0}/{e.capPerRun}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>Hand</Text>
        <RowCards theme={theme} cards={state.piles.hand} onPick={(i) => onRemoveCard('hand', i)} />
        <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>Draw</Text>
        <RowCards theme={theme} cards={state.piles.draw} onPick={(i) => onRemoveCard('draw', i)} />
        <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>Discard</Text>
        <RowCards theme={theme} cards={state.piles.discard} onPick={(i) => onRemoveCard('discard', i)} />
        <Btn title="CompleteNode" onPress={() => { haptics.confirm(); onComplete(); }} />
      </Panel>
    );
  }

  if (e.type === 'gamble') {
    return (
      <Panel theme={theme} title="Gamble 🎲" style={{ marginTop: 24 }}>
        {e.resolved ? (
          <Text style={{ color: theme.colors.text }}>
            {e.resolved.outcome === 'win'
              ? `You WIN ${e.resolved.gold}g`
              : `You LOSE -${e.resolved.hpLoss} HP`}
          </Text>
        ) : (
          <Btn title="Roll" onPress={onGambleRoll} />
        )}
        <Btn title="CompleteNode" onPress={() => { haptics.confirm(); onComplete(); }} />
      </Panel>
    );
  }

  if (e.type === 'treasure') {
    return (
      <Panel theme={theme} title="Treasure 💰" style={{ marginTop: 24 }}>
        {e.amount != null ? (
          <Text style={{ color: theme.colors.text }}>You found {e.amount}g</Text>
        ) : (
          <Btn title="Open" onPress={onTreasureOpen} />
        )}
        <Btn title="CompleteNode" onPress={() => { haptics.confirm(); onComplete(); }} />
      </Panel>
    );
  }

  return null;
}

function RowCards({
  theme, cards, onPick,
}: { theme: ThemeTokens; cards: GameState['piles']['hand']; onPick: (index: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {cards.map((c, i) => (
        <Pressable
          key={`${c.id}-${i}`}
          onPress={() => onPick(i)}
          style={{
            paddingHorizontal: 12, paddingVertical: 8,
            borderRadius: theme.radius.card,
            borderWidth: 1, borderColor: theme.colors.border,
            backgroundColor: 'rgba(0,0,0,0.35)', marginRight: 8, marginBottom: 8,
          }}
        >
          <Text style={{ color: theme.colors.text }}>{c.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}
