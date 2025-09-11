// app/index.tsx — pages-first, cleaned UI with component separation
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';
import type { Command, GameState } from '../src/core/types';
import { applyCommand } from '../src/core/reducer';
import { saveGame, loadGame, getSaveSlots, autoSave, type SaveSlotInfo } from '../src/core/storage';
import { HAND_SIZE, START_ENERGY, START_HP } from '../src/core/balance/core';
import { nextExpForLevel } from '../src/core/balance/progression';
import { makeRng, seedFromString, type RNG } from '../src/core/rng';
import { START_GOLD } from '../src/core/balance';

// Components
import CombatView from './components/CombatView';
import ShopView from './components/ShopView';
import MapView from './components/MapView';
import DeckView from './components/DeckView';
import EventView from './components/EventView';

// Commands that should trigger auto-save
function shouldAutoSave(cmdType: Command['type']): boolean {
  const autoSaveCommands: Command['type'][] = [
    'CompleteNode', 'ChooseLevelUp', 'TakeShop', 'EventChooseBlessing',
    'ChooseOffer', 'Proceed', 'ShopRemoveBuy', 'ShopUpgradeBuy'
  ];
  return autoSaveCommands.includes(cmdType);
}

type Store = {
  state: GameState;
  rng: RNG;
  dispatch: (cmd: Command) => void;
  newRun: (seed: string) => void;
  saveToSlot: (slot: number) => Promise<void>;
  loadFromSlot: (slot: number) => Promise<void>;
  getSaveSlots: () => Promise<SaveSlotInfo[]>;
  autoSaveEnabled: boolean;
};

const makeEmptyState = (): GameState => ({
  seed: '',
  phase: 'menu',
  turn: 0,
  player: {
    hp: START_HP, maxHp: START_HP, block: 0,
    energy: START_ENERGY, gold: START_GOLD,
    level: 1, exp: 0, expToNext: nextExpForLevel(1),
    maxEnergy: START_ENERGY, maxHandSize: HAND_SIZE,
  },
  enemy: undefined,
  piles: { draw: [], hand: [], discard: [], exhaust: [] },
  log: [],
  blessings: [],
  turnFlags: { blessingOnce: {} },
  shopStock: undefined,
  event: undefined,
  combatVictoryLock: false,
  masterDeck: [],
  mapMode: 'pages',
  pages: undefined,
  shopKind: undefined,
});

const useGame = create<Store>((set, get) => ({
  state: makeEmptyState(),
  rng: makeRng(1),
  autoSaveEnabled: true,
  dispatch: (cmd) => {
    const { state, rng, autoSaveEnabled } = get();
    const out = applyCommand(state, cmd, rng);
    set({ state: out.state, rng: out.rng });
    
    // Auto-save after important actions
    if (autoSaveEnabled && shouldAutoSave(cmd.type)) {
      autoSave(out.state).catch(err => console.warn('Auto-save failed:', err));
    }
  },
  newRun: (seed: string) => {
    const r = makeRng(seedFromString(seed));
    const out = applyCommand(makeEmptyState(), { type: 'NewRun', seed }, r);
    set({ state: out.state, rng: out.rng });
  },
  saveToSlot: async (slot: number) => {
    const { state } = get();
    await saveGame(state, slot);
  },
  loadFromSlot: async (slot: number) => {
    const loadedState = await loadGame(slot);
    const r = makeRng(seedFromString(loadedState.seed));
    set({ state: loadedState, rng: r });
  },
  getSaveSlots: () => getSaveSlots(3),
}));

function Button({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
        opacity: disabled ? 0.5 : 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: 'white', textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export default function Home() {
  const { state, dispatch, newRun, saveToSlot, loadFromSlot, getSaveSlots } = useGame();
  const [seed, setSeed] = useState('demo-001');
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [saveLoadError, setSaveLoadError] = useState<string>('');

  // Load save slots when opening save/load panel
  const refreshSaveSlots = async () => {
    try {
      const slots = await getSaveSlots();
      setSaveSlots(slots);
      setSaveLoadError('');
    } catch (error) {
      setSaveLoadError(`Failed to load save slots: ${error}`);
    }
  };

  const header = useMemo(() => {
    return `${state.phase.toUpperCase()} • Turn ${state.turn || 0}`;
  }, [state.phase, state.turn]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#16213e' }}>
        
        {/* Header */}
        <View style={{ borderRadius: 16, padding: 16, backgroundColor: 'rgba(39, 39, 42, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{header}</Text>
          
          {/* Player Stats */}
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: 'white' }}>❤️ HP: {state.player.hp}/{state.player.maxHp}</Text>
              <Text style={{ color: 'white' }}>⚡ Energy: {state.player.energy}/{state.player.maxEnergy}</Text>
            </View>
            <View>
              <Text style={{ color: 'white' }}>🪙 Gold: {state.player.gold}g</Text>
              <Text style={{ color: 'white' }}>📊 Level: {state.player.level} (EXP: {state.player.exp}/{state.player.expToNext})</Text>
            </View>
          </View>

          {/* Blessings */}
          {state.blessings.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: '#c4b5fd', fontWeight: '600' }}>✨ Blessings:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {state.blessings.map((b, i) => (
                  <Text key={i} style={{ color: '#ddd6fe', fontSize: 14, backgroundColor: 'rgba(109, 40, 217, 0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    {b.name}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Menu Screen */}
        {state.phase === 'menu' && (
          <View style={{ borderRadius: 16, padding: 16, backgroundColor: 'rgba(39, 39, 42, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 16 }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>🎴 PhiKinHua - Thai Shaman</Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: 'white', marginBottom: 8 }}>Seed:</Text>
              <TextInput
                value={seed}
                onChangeText={setSeed}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: '#3f3f46',
                  color: 'white',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
                placeholder="Enter seed..."
                placeholderTextColor="#999"
              />
            </View>

            <Button title="🚀 New Run" onPress={() => newRun(seed)} />
            
            <Button 
              title={showSaveLoad ? "📂 Hide Save/Load" : "📂 Save/Load"}
              onPress={() => {
                setShowSaveLoad(!showSaveLoad);
                if (!showSaveLoad) refreshSaveSlots();
              }}
            />

            {/* Save/Load Panel */}
            {showSaveLoad && (
              <View style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: 'rgba(63, 63, 70, 0.5)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <Text style={{ color: 'white', fontWeight: '600', marginBottom: 12 }}>Save/Load Game</Text>
                
                {saveLoadError && (
                  <Text style={{ color: '#f87171', marginBottom: 12 }}>{saveLoadError}</Text>
                )}

                {saveSlots.map((slot, i) => (
                  <View key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 8, backgroundColor: 'rgba(82, 82, 91, 0.5)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Slot {slot.slot}</Text>
                    {slot.exists ? (
                      <>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>
                          Level {slot.playerLevel || 1} • Gold: {slot.gold || 0}g
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>Page {slot.currentPage || 0}/{slot.totalPages || 0}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                          <Pressable
                            onPress={() => loadFromSlot(slot.slot)}
                            style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(37, 99, 235, 0.5)' }}
                          >
                            <Text style={{ color: '#bfdbfe', fontSize: 14 }}>Load</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => saveToSlot(slot.slot)}
                            style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(34, 197, 94, 0.5)' }}
                          >
                            <Text style={{ color: '#bbf7d0', fontSize: 14 }}>Overwrite</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <View>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Empty</Text>
                        <Pressable
                          onPress={() => saveToSlot(slot.slot)}
                          style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(34, 197, 94, 0.5)', marginTop: 8 }}
                        >
                          <Text style={{ color: '#bbf7d0', fontSize: 14 }}>Save Here</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Deck Button */}
        {state.phase !== 'menu' && (
          <View style={{ marginBottom: 16 }}>
            <Pressable
              onPress={() => dispatch({ type: state.deckOpen ? 'CloseDeck' : 'OpenDeck' })}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(99, 102, 241, 0.4)',
                borderWidth: 1,
                borderColor: 'rgba(99, 102, 241, 0.4)'
              }}
            >
              <Text style={{ color: '#c7d2fe', fontWeight: '600', textAlign: 'center' }}>
                {state.deckOpen ? '📚 Close Deck' : '📚 View Deck'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Game Views */}
        <CombatView state={state} dispatch={dispatch} />
        <ShopView state={state} dispatch={dispatch} />
        <MapView state={state} dispatch={dispatch} />
        <EventView state={state} dispatch={dispatch} />
        <DeckView state={state} dispatch={dispatch} />

        {/* Defeat Screen */}
        {state.phase === 'defeat' && (
          <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <Text style={{ color: '#fecaca', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>💀 พ่ายแพ้</Text>
            <Text style={{ color: '#fca5a5', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>หมอผีถูกปีศาจเอาชนะ...</Text>
            
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
              <Pressable
                onPress={() => {
                  // Restart from beginning
                  const { newRun } = useGame.getState();
                  newRun(state.seed);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(34, 197, 94, 0.5)',
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.5)',
                  flex: 1
                }}
              >
                <Text style={{ color: '#bbf7d0', fontWeight: '600', textAlign: 'center' }}>🔄 เริ่มใหม่</Text>
              </Pressable>
              
              <Pressable
                onPress={() => {
                  // Go back to menu
                  useGame.setState({ state: makeEmptyState(), rng: makeRng(1) });
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(99, 102, 241, 0.5)',
                  borderWidth: 1,
                  borderColor: 'rgba(129, 140, 248, 0.5)',
                  flex: 1
                }}
              >
                <Text style={{ color: '#c7d2fe', fontWeight: '600', textAlign: 'center' }}>🏠 เมนูหลัก</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Enhanced Log with System Message Formatting */}
        {state.log.length > 0 && (
          <View style={{ marginTop: 24, borderRadius: 16, padding: 16, backgroundColor: 'rgba(39, 39, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>📜 Game Log</Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
              {state.log.slice(-20).map((entry, i) => {
                // Enhanced log formatting for different system messages
                const getLogColor = (text: string) => {
                  if (text.includes('🎆') || text.includes('✨')) return '#fbbf24'; // Combo messages - gold
                  if (text.includes('🧠') || text.includes('🤖')) return '#8b5cf6'; // AI messages - purple  
                  if (text.includes('💫') || text.includes('status')) return '#a78bfa'; // Status messages - light purple
                  if (text.includes('💥') || text.includes('damage')) return '#ef4444'; // Damage - red
                  if (text.includes('💚') || text.includes('heal')) return '#22c55e'; // Healing - green
                  if (text.includes('👹') || text.includes('👿')) return '#f87171'; // Enemy/minion - light red
                  if (text.includes('🌿') || text.includes('Environment')) return '#10b981'; // Environment - emerald
                  if (text.includes('⚡') || text.includes('energy')) return '#fcd34d'; // Energy - yellow
                  return 'rgba(255, 255, 255, 0.7)'; // Default
                };
                
                return (
                  <Text key={i} style={{ 
                    color: getLogColor(entry), 
                    fontSize: 14, 
                    marginBottom: 4,
                    fontWeight: entry.includes('🎆') || entry.includes('COMBO') ? '600' : '400'
                  }}>
                    • {entry}
                  </Text>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Enhanced QA Debug Panel */}
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: '600', marginBottom: 8 }}>🛠️ Debug Tools</Text>
          
          {/* Basic Debug */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, marginBottom: 4 }}>Basic:</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_KillEnemy' })} 
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, backgroundColor: 'rgba(185, 28, 28, 0.3)' }}
              >
                <Text style={{ color: '#fecaca', fontSize: 14 }}>Kill Enemy</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_Draw', count: 1 })} 
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, backgroundColor: 'rgba(29, 78, 216, 0.3)' }}
              >
                <Text style={{ color: '#bfdbfe', fontSize: 14 }}>Draw Cards</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_SetEnergy', value: 10 })} 
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, backgroundColor: 'rgba(161, 98, 7, 0.3)' }}
              >
                <Text style={{ color: '#fde68a', fontSize: 14 }}>+Energy</Text>
              </Pressable>
              <Pressable 
                onPress={() => newRun(Math.random().toString(36).substring(2, 8))} 
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
              >
                <Text style={{ color: '#bbf7d0', fontSize: 14 }}>New Game</Text>
              </Pressable>
            </View>
          </View>

          {/* Status Effects Debug */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, marginBottom: 4 }}>Status Effects:</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_ApplyStatusToPlayer', statusId: 'poison', stacks: 3 })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <Text style={{ color: '#fca5a5', fontSize: 12 }}>☠️ Poison Self</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_ApplyStatusToEnemy', statusId: 'vulnerable', stacks: 2 })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(168, 85, 247, 0.3)' }}
              >
                <Text style={{ color: '#c084fc', fontSize: 12 }}>🛡️💔 Vuln Enemy</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_ClearPlayerStatus' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
              >
                <Text style={{ color: '#86efac', fontSize: 12 }}>🧹 Clear Player</Text>
              </Pressable>
            </View>
          </View>

          {/* Phase 4 Debug */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, marginBottom: 4 }}>Phase 4 Systems:</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_DebugAdaptiveAI' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(139, 92, 246, 0.3)' }}
              >
                <Text style={{ color: '#a78bfa', fontSize: 12 }}>🧠 AI Debug</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_DebugCombos' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(245, 158, 11, 0.3)' }}
              >
                <Text style={{ color: '#fbbf24', fontSize: 12 }}>✨ Combo Debug</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_TriggerCombo', comboId: 'shaman_meditation' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
              >
                <Text style={{ color: '#86efac', fontSize: 12 }}>🎆 Force Combo</Text>
              </Pressable>
            </View>
          </View>

          {/* Environment & Minions */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, marginBottom: 4 }}>Environment & Minions:</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_SetEnvironment', environmentId: 'haunted_temple' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(16, 185, 129, 0.3)' }}
              >
                <Text style={{ color: '#6ee7b7', fontSize: 12 }}>🌿 Temple</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_SummonPlayerMinion', minionId: 'ghost_ally' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(168, 85, 247, 0.3)' }}
              >
                <Text style={{ color: '#c084fc', fontSize: 12 }}>🤝 Summon Ally</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_SummonEnemyMinion', minionId: 'shadow_clone' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <Text style={{ color: '#fca5a5', fontSize: 12 }}>👿 Enemy Minion</Text>
              </Pressable>
            </View>
          </View>

          {/* Shops & Spawns */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, marginBottom: 4 }}>Shops & Spawns:</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_OpenShopHere' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(21, 128, 61, 0.3)' }}
              >
                <Text style={{ color: '#bbf7d0', fontSize: 12 }}>🏪 Shop</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_SpawnEquippedEnemy', enemyId: 'thai_ghost_doctor' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(185, 28, 28, 0.3)' }}
              >
                <Text style={{ color: '#fecaca', fontSize: 12 }}>👹 Boss Fight</Text>
              </Pressable>
              <Pressable 
                onPress={() => dispatch({ type: 'QA_LevelUp' })} 
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(234, 179, 8, 0.3)' }}
              >
                <Text style={{ color: '#fde68a', fontSize: 12 }}>⬆️ Level Up</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}