import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState, Command } from '../../src/core/types';

interface CombatViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

function CombatView({ state, dispatch }: CombatViewProps) {
  const inCombat = state.phase === 'combat';
  const player = state.player;
  const enemy = state.enemy;
  const hand = state.piles?.hand ?? [];
  const piles = state.piles;

  if (!inCombat || !enemy) return null;

  return (
    <View style={{ marginTop: 16 }}>
      {/* Combat Header */}
      <View style={{ borderRadius: 16, padding: 16, backgroundColor: 'rgba(153, 27, 27, 0.3)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 16 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>⚔️ Combat - Turn {state.turn}</Text>
        
        {/* Player Stats */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>🧙‍♂️ You</Text>
          <Text style={{ color: 'white' }}>HP: {player.hp}/{player.maxHp}</Text>
          <Text style={{ color: 'white' }}>Block: {player.block}</Text>
          <Text style={{ color: 'white' }}>Energy: {player.energy}/{player.maxEnergy}</Text>
        </View>

        {/* Enemy Stats */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>👹 {enemy.name}</Text>
          <Text style={{ color: 'white' }}>HP: {enemy.hp}/{enemy.maxHp}</Text>
          <Text style={{ color: 'white' }}>Block: {enemy.block}</Text>
          {(state as any).enemyIntentCardId && (
            <Text style={{ color: '#fca5a5' }}>Intent: {(state as any).enemyIntentCardId}</Text>
          )}
        </View>

        {/* Equipment Display */}
        {(state.equipped?.length ?? 0) > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#fbbf24', fontWeight: '600' }}>⚔️ Equipment:</Text>
            {state.equipped?.map((eq, i) => (
              <Text key={i} style={{ color: '#fcd34d', fontSize: 14 }}>
                • {eq.name} {eq.temporary ? '(TEMP)' : ''}
              </Text>
            ))}
          </View>
        )}

        {/* Combat Actions */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable
            onPress={() => dispatch({ type: 'EndTurn' })}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: 'rgba(21, 128, 61, 0.4)',
              borderWidth: 1,
              borderColor: 'rgba(34, 197, 94, 0.4)'
            }}
          >
            <Text style={{ color: '#bbf7d0', fontWeight: '600' }}>End Turn</Text>
          </Pressable>
        </View>
      </View>

      {/* Hand */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>🃏 Hand ({hand.length})</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {hand.map((c, i) => {
            const disabled = state.combatVictoryLock || player.energy < (c.cost ?? 0);
            return (
              <Pressable
                key={i}
                onPress={disabled ? undefined : () => dispatch({ type: 'PlayCard', index: i })}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  opacity: disabled ? 0.5 : 1,
                  backgroundColor: disabled ? '#374151' : '#1f2937',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{c.name}</Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cost {c.cost ?? 0}</Text>
                {c.type === 'equipment' ? (
                  <Text style={{ color: '#fcd34d' }}>⚔️ Equipment</Text>
                ) : (
                  <>
                    {c.dmg ? <Text style={{ color: '#fca5a5' }}>DMG {c.dmg}</Text> : null}
                    {c.block ? <Text style={{ color: '#7dd3fc' }}>Block {c.block}</Text> : null}
                    {c.energyGain ? <Text style={{ color: '#fcd34d' }}>Energy +{c.energyGain}</Text> : null}
                    {c.draw ? <Text style={{ color: '#86efac' }}>Draw {c.draw}</Text> : null}
                  </>
                )}
              </Pressable>
            );
          })}
          {hand.length === 0 && <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>No cards in hand</Text>}
        </View>
      </View>

      {/* Pile Info */}
      <View style={{ borderRadius: 12, padding: 12, backgroundColor: 'rgba(39, 39, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>📚 Piles</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Draw: {piles?.draw?.length ?? 0}</Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Discard: {piles?.discard?.length ?? 0}</Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Exhaust: {piles?.exhaust?.length ?? 0}</Text>
        </View>
      </View>
    </View>
  );
}

export default CombatView;