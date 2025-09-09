import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState, Command } from '../../src/core/types';

interface DeckViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

function DeckView({ state, dispatch }: DeckViewProps) {
  if (!state.deckOpen) return null;

  // Group cards by ID for counting
  const counts = new Map<string, { name: string; count: number; card: any }>();
  for (const c of state.masterDeck ?? []) {
    const name = c.name ?? c.id;
    const rec = counts.get(c.id) ?? { name, count: 0, card: c };
    rec.count += 1;
    counts.set(c.id, rec);
  }
  
  const cardList = Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name));
  const equipmentCards = (state.masterDeck ?? []).filter(c => c.type === 'equipment');

  return (
    <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: 'rgba(39, 39, 42, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>📚 Your Deck ({state.masterDeck?.length} cards)</Text>
        <Pressable
          onPress={() => dispatch({ type: 'CloseDeck' })}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: 'rgba(220, 38, 38, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(248, 113, 113, 0.5)'
          }}
        >
          <Text style={{ color: '#fecaca' }}>✕ Close</Text>
        </Pressable>
      </View>

      {!cardList.length ? (
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', paddingVertical: 32 }}>Deck is empty.</Text>
      ) : (
        <>
          {/* Equipment Management Section */}
          {(equipmentCards.length > 0 || (state.equipped && state.equipped.length > 0)) && (
            <View style={{ marginBottom: 24, padding: 16, borderRadius: 8, backgroundColor: 'rgba(63, 63, 70, 0.5)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Text style={{ color: '#fbbf24', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                ⚔️ Equipment ({(state.equipped ?? []).length}/{state.equipmentSlotsMax ?? 1})
              </Text>
              
              {/* Currently Equipped */}
              {(state.equipped ?? []).length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#fcd34d', fontWeight: '600', marginBottom: 8 }}>🛡️ Currently Equipped:</Text>
                  {(state.equipped ?? []).map((eq, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(20, 83, 45, 0.3)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#86efac', fontWeight: '600' }}>{eq.name || eq.id}</Text>
                        <Text style={{ color: 'rgba(134, 239, 172, 0.7)', fontSize: 14 }}>{eq.desc}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                          <Text style={{ color: '#4ade80', fontSize: 12 }}>⭐ {eq.rarity}</Text>
                          {eq.temporary && <Text style={{ color: '#fdba74', fontSize: 12 }}>🕐 TEMPORARY</Text>}
                        </View>
                      </View>
                      {!eq.temporary && (
                        <Pressable
                          onPress={() => dispatch({ type: 'UnequipToDeck', equipmentId: eq.id })}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: 'rgba(220, 38, 38, 0.5)',
                            borderWidth: 1,
                            borderColor: 'rgba(248, 113, 113, 0.5)'
                          }}
                        >
                          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Unequip</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
              
              {/* Equipment Cards in Deck */}
              {equipmentCards.length > 0 && (
                <View>
                  <Text className="text-amber-300 font-semibold mb-2">📦 Available Equipment Cards:</Text>
                  {equipmentCards.map((card, i) => {
                    const isEquipped = (state.equipped ?? []).some(eq => eq.id === card.equipmentId);
                    const currentSlotUsage = (state.equipped ?? []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
                    const maxSlots = state.equipmentSlotsMax || 1;
                    const canEquip = !isEquipped && currentSlotUsage < maxSlots;
                    
                    return (
                      <View key={card.id + i} className={`flex-row justify-between items-center mb-2 p-3 rounded-lg border ${
                        isEquipped ? 'bg-gray-600/30 border-gray-500/30' : 'bg-blue-900/30 border-blue-500/30'
                      }`}>
                        <View className="flex-1">
                          <Text className={`font-semibold ${isEquipped ? 'text-gray-400' : 'text-blue-300'}`}>
                            {card.name || card.id}
                          </Text>
                          <Text className={`text-sm ${isEquipped ? 'text-gray-400' : 'text-blue-300/70'}`}>
                            {card.desc}
                          </Text>
                          <View className="flex-row gap-2 mt-1">
                            <Text className={`text-xs ${isEquipped ? 'text-gray-400' : 'text-blue-400'}`}>
                              ⭐ {card.rarity}
                            </Text>
                            {isEquipped && <Text className="text-gray-400 text-xs">✓ EQUIPPED</Text>}
                          </View>
                        </View>
                        
                        <View className="ml-3">
                          {canEquip && (
                            <Pressable
                              onPress={() => dispatch({ type: 'EquipFromDeck', cardId: card.id })}
                              className="px-3 py-2 rounded-lg bg-blue-600/50 border border-blue-400/50 active:opacity-70"
                            >
                              <Text className="text-blue-200 font-semibold">Equip</Text>
                            </Pressable>
                          )}
                          {!canEquip && !isEquipped && (
                            <Text className="text-red-400 text-sm font-semibold px-2">No Slots</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
          
          {/* Regular Card List */}
          <View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>🃏 Cards by Type</Text>
            
            {/* Group by card type */}
            {['attack', 'skill', 'equipment'].map(type => {
              const typeCards = cardList.filter(item => item.card.type === type);
              if (typeCards.length === 0) return null;
              
              const typeIcon = type === 'attack' ? '⚔️' : type === 'skill' ? '🧠' : '⚙️';
              const typeColorStyle = type === 'attack' ? '#fca5a5' : type === 'skill' ? '#93c5fd' : '#fcd34d';
              
              return (
                <View key={type} style={{ marginBottom: 16 }}>
                  <Text style={{ color: typeColorStyle, fontWeight: '600', marginBottom: 8 }}>
                    {typeIcon} {type.charAt(0).toUpperCase() + type.slice(1)} Cards ({typeCards.length})
                  </Text>
                  <View style={{ marginLeft: 12 }}>
                    {typeCards.map((item, idx) => (
                      <View key={`${item.name}-${idx}`} style={{ marginBottom: 8, padding: 8, borderRadius: 8, backgroundColor: 'rgba(63, 63, 70, 0.3)' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View>
                            <Text style={{ color: 'white', fontWeight: '600' }}>{item.name} × {item.count}</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Cost: {item.card.cost ?? 0}</Text>
                              {item.card.dmg && <Text style={{ color: '#fca5a5', fontSize: 14 }}>DMG {item.card.dmg}</Text>}
                              {item.card.block && <Text style={{ color: '#7dd3fc', fontSize: 14 }}>Block {item.card.block}</Text>}
                              {item.card.energyGain && <Text style={{ color: '#fcd34d', fontSize: 14 }}>Energy +{item.card.energyGain}</Text>}
                              {item.card.draw && <Text style={{ color: '#86efac', fontSize: 14 }}>Draw {item.card.draw}</Text>}
                            </View>
                            {item.card.desc && (
                              <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginTop: 4 }}>{item.card.desc}</Text>
                            )}
                          </View>
                          <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 14 }}>⭐ {item.card.rarity}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

export default DeckView;