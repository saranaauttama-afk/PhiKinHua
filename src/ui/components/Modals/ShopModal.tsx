//*** NEW: src/ui/components/ShopModal.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { GameState } from '../../../core/types';
import type { ThemeTokens } from '../../theme';
import { haptics } from '../../haptics';

type Props = {
  state: GameState;
  theme: ThemeTokens;
  onTake: (index: number) => void;
  onReroll: () => void;
  onComplete: () => void;
};

export default function ShopModal({ state, theme, onTake, onReroll, onComplete }: Props) {
  const stock = state.shopStock ?? [];
  return (
    <View style={{
      marginTop: 24, borderRadius: theme.radius.xl, padding: 16,
      backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border
    }}>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Shop 🛒</Text>
      <Text style={{ color: theme.colors.textMuted, marginBottom: 8 }}>Gold: {state.player.gold}g</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {stock.map((item, i) => {
          const canBuy = state.player.gold >= item.price;
          return (
            <Pressable
              key={`${item.card.id}-${i}`}
              onPress={() => {
              if (!canBuy) { haptics.warn(); return; }
              haptics.confirm();
              onTake(i);
              }}
              style={{
                paddingHorizontal: 12, paddingVertical: 8,
                borderRadius: theme.radius.card,
                borderWidth: 1, borderColor: theme.colors.border,
                backgroundColor: 'rgba(0,0,0,0.35)', marginRight: 8, marginBottom: 8,
                opacity: canBuy ? 1 : 0.6
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                {item.card.name} {item.card.rarity ? `(${item.card.rarity})` : ''}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>Price: {item.price}g</Text>
              <Text style={{ color: theme.colors.textMuted }}>Card Cost: {item.card.cost}</Text>
              {item.card.dmg ? <Text style={{ color: '#fca5a5' }}>DMG {item.card.dmg}</Text> : null}
              {item.card.block ? <Text style={{ color: '#93c5fd' }}>Block {item.card.block}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pressable
          onPress={() => {
            if (state.player.gold < 20) { haptics.warn(); return; }
            haptics.confirm();
            onReroll();
          }}
          style={{
            paddingVertical: 8, paddingHorizontal: 16,
            borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
            backgroundColor: 'rgba(255,255,255,0.05)'
          }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Reroll (-20g)</Text>
        </Pressable>
        <Pressable
          onPress={() => { haptics.confirm(); onComplete(); }}
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
