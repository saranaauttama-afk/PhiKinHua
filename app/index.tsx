// app/index.tsx — pages-first, cleaned UI
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
import { removeCostForCount, upgradeCostForCount } from '../src/core/balance/economy';

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
      className={`px-4 py-2 rounded-2xl border mt-2 ${disabled ? 'opacity-50' : 'active:opacity-70'} bg-white/5 border-white/20`}
    >
      <Text className="text-base font-semibold text-white">{title}</Text>
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

  const inCombat = state.phase === 'combat';
  const inMap = state.phase === 'map';
  const inVictory = state.phase === 'victory';
  const inShop = state.phase === 'shop';
  const inEvent = state.phase === 'event';

  const shopKind = state.shopKind ?? ((state.shopStock?.length ?? 0) > 0 ? 'card' : undefined);
  const isPages = state.mapMode === 'pages';
  const page = state.pages?.current;
  const canProceedPage = !!(page && page.resolved.every(Boolean));

  const removeCount = state.runCounters?.removeShopCount ?? 0;
  const upgradeCount = state.runCounters?.upgradeShopCount ?? 0;
  const priceRemove = removeCostForCount(removeCount);
  const priceUpgrade = upgradeCostForCount(upgradeCount);

  const hand = state.piles.hand;
  const enemy = state.enemy;

  // ---- NEW: ข้อมูลอุปกรณ์สำหรับ UI
  const equipped = state.equipped ?? [];
  const equipSlotsMax = state.equipmentSlotsMax ?? 0;
  const equipDisplayName = (e: any) => e?.name ?? e?.id ?? 'Unknown';

  const header = useMemo(() => {
    return `${state.phase.toUpperCase()}  •  Turn ${state.turn || 0}`;
  }, [state.phase, state.turn]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView contentContainerStyle={{ padding: 16, rowGap: 16 }}>
        <Text className="text-white/60 mb-2">Phase: {state.phase}</Text>
        <Text className="text-white/60 mb-2">CombatLock: {state.combatVictoryLock ? 'LOCKED' : 'OK'}</Text>
        <Text className="text-white/60 mb-4">Log: {state.log.slice(-3).join(' | ')}</Text>

        {/* Header / HUD */}
        <Text className="text-white text-xl font-bold mb-2">{header}</Text>
        <View className="flex-row gap-3 mb-3">
          <View className="px-3 py-2 rounded-xl bg-emerald-700/40">
            <Text className="text-white">HP {state.player.hp}/{state.player.maxHp}</Text>
          </View>
          <View className="px-3 py-2 rounded-xl bg-sky-700/40">
            <Text className="text-white">Block {state.player.block}</Text>
          </View>
          <View className="px-3 py-2 rounded-xl bg-amber-700/40">
            <Text className="text-white">Energy {state.player.energy}</Text>
          </View>
          <View className="px-3 py-2 rounded-xl bg-fuchsia-700/40">
            <Text className="text-white">Hand {hand.length}/{HAND_SIZE}</Text>
          </View>
        </View>

        <View className="mb-3 p-3 rounded-2xl bg-fuchsia-900/20 border border-fuchsia-700/30">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-semibold">Equipment</Text>
            <Text className="text-white/80 text-xs">
              {equipped.length}/{equipSlotsMax} slot{equipSlotsMax === 1 ? '' : 's'}
            </Text>
          </View>

          {equipped.length === 0 ? (
            <Text className="text-white/70 text-xs">No equipment equipped.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {equipped.map((eq: any, idx: number) => (
                <View key={`${eq.id}-${idx}`} className="px-2 py-1 rounded-xl bg-fuchsia-700/40">
                  <Text className="text-white text-xs">{equipDisplayName(eq)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ===== Blessings ===== */}
        {(state.blessings?.length ?? 0) > 0 ? (
          <View style={{ marginTop: 8, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.20)', alignSelf: 'stretch' }}>
            <Text style={{ color: '#000', fontWeight: '700', marginBottom: 6 }}>Blessings</Text>
            {state.blessings.map((b, i) => (
              <Text key={`${b.id}-${i}`} style={{ color: '#000', lineHeight: 20 }}>
                • {b.name ?? b.id}{b.rarity ? ` (${b.rarity})` : ''}{b.desc ? ` — ${b.desc}` : ''}
              </Text>
            ))}
          </View>
        ) : null}

        {/* ===== Level & EXP ===== */}
        {(() => {
          const lv = state.player?.level ?? 1;
          const cur = state.player?.exp ?? 0;
          const next = Math.max(1, state.player?.expToNext ?? 1);
          const pct = Math.max(0, Math.min(100, Math.floor((cur / next) * 100)));
          return (
            <View style={{ marginTop: 8, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.25)', alignSelf: 'flex-start' }}>
              <Text style={{ color: '#000', fontWeight: '700' }}>Level {lv}</Text>
              <Text style={{ color: '#000' }}>EXP {cur} / {next} ({pct}%)</Text>
              <View style={{ height: 6, width: 180, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 4 }}>
                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: '#CCC' }} />
              </View>
            </View>
          );
        })()}

        {/* ===== Level Up Panel ===== */}
        {state.phase === 'levelup' && state.levelUp ? (
          <View style={{ marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <Text style={{ color: '#000', fontWeight: '800', marginBottom: 6 }}>Level Up!</Text>
            <Text style={{ color: '#000', marginBottom: 8 }}>เลือก 1 อย่าง</Text>

            {(() => {
              const lu = state.levelUp!;
              const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
                <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.25)', marginBottom: 8, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#000' }}>{label}</Text>
                </Pressable>
              );
              switch (lu.bucket) {
                case 'blessing':
                  return (
                    <View>
                      {(lu.blessingChoices ?? []).map((b, i) => (
                        <Btn key={`${b.id}-${i}`} label={`${b.name ?? b.id}${b.rarity ? ` (${b.rarity})` : ''}${b.desc ? ` — ${b.desc}` : ''}`} onPress={() => dispatch({ type: 'ChooseLevelUp', index: i })} />
                      ))}
                    </View>
                  );
                case 'cards':
                  return (
                    <View>
                      {(lu.cardChoices ?? []).map((c, i) => (
                        <Btn key={`${c.id}-${i}`} label={`${c.name ?? c.id}${c.rarity ? ` (${c.rarity})` : ''} — cost ${c.cost}${c.dmg ? ` | DMG ${c.dmg}` : ''}${c.block ? ` | Block ${c.block}` : ''}${c.draw ? ` | Draw ${c.draw}` : ''}${c.energyGain ? ` | +Energy ${c.energyGain}` : ''}`} onPress={() => dispatch({ type: 'ChooseLevelUp', index: i })} />
                      ))}
                    </View>
                  );
                case 'remove': {
                  const counts = new Map<string, number>();
                  (state.masterDeck ?? []).forEach(c => counts.set(c.id, (counts.get(c.id) ?? 0) + 1));
                  return (
                    <View>
                      <Text style={{ color: '#000', marginBottom: 6 }}>ลบการ์ด 1 ใบจากเด็ค</Text>
                      {(state.masterDeck ?? []).map((c, i) => (
                        <Btn key={`${c.id}-${i}`} label={`${c.name ?? c.id} (${counts.get(c.id) ?? 1})`} onPress={() => dispatch({ type: 'ChooseLevelUp', index: i })} />
                      ))}
                    </View>
                  );
                }
                case 'upgrade':
                  return (
                    <View>
                      <Text style={{ color: '#000', marginBottom: 6 }}>อัปเกรดการ์ด 1 ใบ</Text>
                      {(state.masterDeck ?? []).map((c, i) => (
                        <Btn key={`${c.id}-${i}`} label={`${c.name ?? c.id}${c.dmg ? ` | DMG ${c.dmg}` : ''}${c.block ? ` | Block ${c.block}` : ''}`} onPress={() => dispatch({ type: 'ChooseLevelUp', index: i })} />
                      ))}
                    </View>
                  );
                case 'max_hp': return <Btn label="+5 Max HP" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
                case 'max_energy': return <Btn label="+1 Max Energy" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
                case 'max_hand': return <Btn label="+1 Max Hand Size" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
                case 'gold':
                default: return <Btn label="+25 Gold" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              }
            })()}

            <View style={{ flexDirection: 'row', columnGap: 8, marginTop: 6 }}>
              {!state.levelUp?.consumed ? (
                <Pressable onPress={() => dispatch({ type: 'SkipLevelUp' })} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#000' }}>
                  <Text style={{ color: '#000' }}>Skip (+25g)</Text>
                </Pressable>
              ) : null}
              {state.levelUp?.consumed ? (
                <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#000', backgroundColor: '#CCC' }}>
                  <Text style={{ color: '#000', fontWeight: '700' }}>Continue</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ===== Starter Blessing ===== */}
        {state.phase === 'starter' && state.starter ? (
          <View style={{ marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <Text style={{ color: '#000', fontWeight: '800', marginBottom: 6 }}>Choose a Starter Blessing</Text>
            <Text style={{ color: '#000', marginBottom: 8 }}>เลือกพร 1 อย่างเพื่อเริ่มต้นการผจญภัย</Text>
            {(state.starter.choices ?? []).map((b, i) => (
              <Pressable key={`${b.id}-${i}`} onPress={() => dispatch({ type: 'ChooseStarterBlessing', index: i })}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.25)', marginBottom: 8, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#000' }}>{b.name ?? b.id}{b.rarity ? ` (${b.rarity})` : ''}{b.desc ? ` — ${b.desc}` : ''}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* ===== Enemy panel ===== */}
        {inCombat && (
          <View className="rounded-2xl p-4 bg-zinc-800/70 border border-white/10 mb-4">
            {enemy ? (
              <>
                <Text className="text-white text-lg font-semibold">{enemy.name}</Text>
                <Text className="text-white/80 mt-1">HP {enemy.hp}/{enemy.maxHp}</Text>
                <Text className="text-white/70 mt-1">
                  Intent: {enemy.intentCardId ?? '...'}
                </Text>
                
                {/* Equipment Status During Combat */}
                {(state.equipped && state.equipped.length > 0) && (
                  <View className="mt-3 p-2 rounded-lg bg-amber-900/30 border border-amber-500/30">
                    <Text className="text-amber-400 font-semibold text-sm mb-1">
                      ⚔️ Active Equipment ({state.equipped.length}/{(state.equipmentSlotsMax || 1) + (state.equipmentTempSlots || 0)}):
                    </Text>
                    <View className="flex-row flex-wrap gap-1">
                      {state.equipped.map((eq, i) => {
                        const isTemp = eq.temporary;
                        return (
                          <View 
                            key={`equipment-${eq.id}-${i}-${isTemp ? 'temp' : 'perm'}-${state.turn}`} 
                            className={`px-2 py-1 rounded border ${
                              isTemp 
                                ? 'bg-orange-600/50 border-orange-400/60' 
                                : 'bg-green-600/50 border-green-400/60'
                            }`}
                          >
                            <Text className={`text-xs font-medium ${isTemp ? 'text-orange-100' : 'text-green-100'}`}>
                              {eq.name || eq.id}{isTemp ? ' (TEMP)' : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                    <Text className="text-amber-300/70 text-xs mt-1">
                      Permanent: {state.equipped.filter(eq => !eq.temporary).length} | 
                      Temporary: {state.equipped.filter(eq => eq.temporary).length}
                    </Text>
                    <Text className="text-amber-300/50 text-xs">
                      Slots: Base({state.equipmentSlotsMax || 1}) + Temp({state.equipmentTempSlots || 0}) = {(state.equipmentSlotsMax || 1) + (state.equipmentTempSlots || 0)}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text className="text-white/60">No enemy</Text>
            )}
          </View>
        )}

        {/* ===== Deck toggle & list ===== */}
        <View style={{ marginTop: 8 }}>
          <Pressable
            onPress={inCombat ? undefined : () => dispatch({ type: state.deckOpen ? 'CloseDeck' : 'OpenDeck' })}
            className={`px-4 py-2 rounded-2xl border self-start ${
              inCombat 
                ? 'bg-gray-600/50 border-gray-500/50 opacity-50' 
                : 'bg-white/5 border-white/20 active:opacity-70'
            }`}
          >
            <Text className={`font-semibold ${inCombat ? 'text-gray-400' : 'text-white'}`}>
              {state.deckOpen ? 'Close Deck' : 'Open Deck'} ({state.masterDeck?.length ?? 0})
              {inCombat && ' (Locked in Combat)'}
            </Text>
          </Pressable>
        </View>

        {state.deckOpen ? (
          <View className="mt-4 p-4 rounded-2xl bg-zinc-800/70 border border-white/10">
            {(() => {
              const counts = new Map<string, { name: string; count: number }>();
              for (const c of state.masterDeck ?? []) {
                const name = c.name ?? c.id;
                const rec = counts.get(c.id) ?? { name, count: 0 };
                rec.count += 1;
                counts.set(c.id, rec);
              }
              const list = Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name));
              const equipmentCards = (state.masterDeck ?? []).filter(c => c.type === 'equipment');
              
              if (!list.length) return <Text className="text-white/60">Deck is empty.</Text>;
              return (
                <View>
                  <Text className="text-white text-lg font-semibold mb-3">Your Deck ({state.masterDeck?.length} cards)</Text>
                  
                  {/* Equipment Management Section */}
                  {(equipmentCards.length > 0 || (state.equipped && state.equipped.length > 0)) && (
                    <View className="mb-4 p-3 rounded-lg bg-zinc-700/50 border border-amber-500/30">
                      <Text className="text-amber-400 font-semibold mb-2">⚔️ Equipment ({(state.equipped ?? []).length}/{state.equipmentSlotsMax ?? 1})</Text>
                      
                      {/* Currently Equipped */}
                      {(state.equipped ?? []).map((eq, i) => (
                        <View key={i} className="flex-row justify-between items-center mb-2 p-2 rounded bg-green-900/30">
                          <View>
                            <Text className="text-green-300 font-semibold">{eq.name || eq.id}</Text>
                            <Text className="text-green-300/70 text-sm">{eq.desc}</Text>
                            {eq.temporary && <Text className="text-orange-300 text-xs">TEMPORARY</Text>}
                          </View>
                          {!eq.temporary && (
                            <Pressable
                              onPress={() => dispatch({ type: 'UnequipToDeck', equipmentId: eq.id })}
                              className="px-2 py-1 rounded bg-red-600/50 active:opacity-70"
                            >
                              <Text className="text-red-200 text-sm">Unequip</Text>
                            </Pressable>
                          )}
                        </View>
                      ))}
                      
                      {/* Equipment Cards in Deck */}
                      {equipmentCards.map((card, i) => {
                        const isEquipped = (state.equipped ?? []).some(eq => eq.id === card.equipmentId);
                        const currentSlotUsage = (state.equipped ?? []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
                        const maxSlots = state.equipmentSlotsMax || 1;
                        const canEquip = !isEquipped && currentSlotUsage < maxSlots;
                        
                        return (
                          <View key={card.id + i} className={`flex-row justify-between items-center mb-2 p-2 rounded ${isEquipped ? 'bg-gray-600/30' : 'bg-blue-900/30'}`}>
                            <View>
                              <Text className={`font-semibold ${isEquipped ? 'text-gray-400' : 'text-blue-300'}`}>{card.name || card.id}</Text>
                              <Text className={`text-sm ${isEquipped ? 'text-gray-400' : 'text-blue-300/70'}`}>{card.desc}</Text>
                              {isEquipped && <Text className="text-gray-400 text-xs">EQUIPPED</Text>}
                            </View>
                            {canEquip && (
                              <Pressable
                                onPress={() => dispatch({ type: 'EquipFromDeck', cardId: card.id })}
                                className="px-2 py-1 rounded bg-blue-600/50 active:opacity-70"
                              >
                                <Text className="text-blue-200 text-sm">Equip</Text>
                              </Pressable>
                            )}
                            {!canEquip && !isEquipped && (
                              <Text className="text-red-400 text-xs">No Slots</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                  
                  {/* Regular Deck List */}
                  {list.map((it, idx) => (
                    <Text key={`${it.name}-${idx}`} className="text-white/80 mb-1">
                      {it.name} × {it.count}
                    </Text>
                  ))}
                </View>
              );
            })()}
          </View>
        ) : null}

        {/* HUD: Gold */}
        <View className="rounded-2xl p-4 bg-zinc-800/70 border border-white/10 mb-4">
          <Text className="text-white">Gold: {state.player.gold}g</Text>
        </View>

        {/* ===== Pages (MTOM) ===== */}
        {inMap && isPages && (
          <View className="rounded-2xl p-4 bg-zinc-800/70 border border-white/10 mb-4">
            <Text className="text-white text-lg font-semibold">Pages (dev)</Text>
            <Text className="text-white/60 mb-2">Page {(state.pages?.pageIndex ?? 0) + 1} / {state.pages?.totalPages ?? 0}</Text>

            {page ? (
              <>
                <View className="flex-col gap-2">
                  {page.offers.map((o, i) => (
                    <View key={i} className="flex-row items-center justify-between mb-2">
                      <Text className="text-white">
                        {o.kind === 'monster' ? `monster:${o.tier}` : o.kind}{page.resolved[i] ? '  ✅' : ''}
                      </Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => dispatch({ type: 'ChooseOffer', index: i })}
                          className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70"
                        >
                          <Text className="text-white font-semibold">Choose {i}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => dispatch({ type: 'DismissOffer', index: i })}
                          className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70"
                          disabled={page.resolved[i]}
                        >
                          <Text className="text-white/90">Dismiss</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>

                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => dispatch({ type: 'Proceed' })}
                    className={`px-4 py-2 rounded-2xl border ${canProceedPage ? 'bg-white/5 active:opacity-70' : 'bg-white/5 opacity-50'} border-white/20`}
                    disabled={!canProceedPage}
                  >
                    <Text className="text-white font-semibold">Proceed (เมื่อเคลียร์ครบ)</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => dispatch({ type: 'OpenPage' })}
                  className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70"
                >
                  <Text className="text-white font-semibold">Open Page</Text>
                </Pressable>
              </View>
            )}

            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'QA_InitPages' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">QA: Init Pages</Text>
              </Pressable>
              <Pressable onPress={() => dispatch({ type: 'QA_PrintPage' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">QA: Print Offers</Text>
              </Pressable>
              {page ? null : (
                <Pressable onPress={() => dispatch({ type: 'OpenPage' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                  <Text className="text-white font-semibold">Open Page</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* ===== Hand ===== */}
        <Text className="text-white font-semibold mb-2">Hand</Text>
        <View className="flex-row gap-2 flex-wrap">
          {hand.map((c, i) => {
            const disabled = !inCombat || state.combatVictoryLock || state.player.energy < (c.cost ?? 0);
            return (
              <Pressable
                key={i}
                onPress={disabled ? undefined : () => dispatch({ type: 'PlayCard', index: i })}
                className={`px-3 py-2 rounded-2xl border ${disabled ? 'opacity-50' : 'active:opacity-70'} bg-zinc-800 border-white/10`}
              >
                <Text className="text-white font-semibold">{c.name}</Text>
                <Text className="text-white/70">Cost {c.cost ?? 0}</Text>
                {c.type === 'equipment' ? (
                  <Text className="text-amber-300">⚔️ Equipment</Text>
                ) : (
                  <>
                    {c.dmg ? <Text className="text-red-300">DMG {c.dmg}</Text> : null}
                    {c.block ? <Text className="text-sky-300">Block {c.block}</Text> : null}
                    {c.energyGain ? <Text className="text-amber-300">Energy {c.energyGain}</Text> : null}
                    {c.draw ? <Text className="text-emerald-300">Draw {c.draw}</Text> : null}
                  </>
                )}
              </Pressable>
            );
          })}
          {hand.length === 0 && <Text className="text-white/60">Empty</Text>}
        </View>

        {/* ===== Shop: Card ===== */}
        {inShop && shopKind === 'card' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Shop 🛒 — Cards</Text>
            <Text className="text-white/80 mb-2">Gold: {state.player.gold}g</Text>
            <View className="flex-row gap-2 flex-wrap">
              {(state.shopStock ?? []).map((item, i) => (
                <Pressable
                  key={i}
                  onPress={() => dispatch({ type: 'TakeShop', index: i })}
                  className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70"
                  disabled={state.player.gold < item.price}
                >
                  <Text className="text-white font-semibold">
                    {item.card.name} {item.card.rarity ? `(${item.card.rarity})` : ''}
                  </Text>
                  <Text className="text-white/70">Price: {item.price}g</Text>
                  <Text className="text-white/70">Card Cost: {item.card.cost}</Text>
                  {item.card.dmg ? <Text className="text-red-300">DMG {item.card.dmg}</Text> : null}
                  {item.card.block ? <Text className="text-sky-300">Block {item.card.block}</Text> : null}
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'ShopReroll' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">Reroll (-20g)</Text>
              </Pressable>
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ===== Shop: Remove ===== */}
        {inShop && state.shopKind === 'remove' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Remove Card 🗑️</Text>
            <Text className="text-white/80 mb-2">Price: {priceRemove}g</Text>
            <View className="flex-row gap-2 flex-wrap">
              {(state.masterDeck ?? []).map((c, i) => (
                <Pressable key={i} onPress={() => dispatch({ type: 'ShopRemoveBuy', index: i })} className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70">
                  <Text className="text-white">{c.name ?? c.id}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ===== Shop: Upgrade ===== */}
        {inShop && state.shopKind === 'upgrade' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Upgrade Card ✨</Text>
            <Text className="text-white/80 mb-2">Price: {priceUpgrade}g</Text>
            <View className="flex-row gap-2 flex-wrap">
              {(state.masterDeck ?? []).map((c, i) => (
                <Pressable key={i} onPress={() => dispatch({ type: 'ShopUpgradeBuy', index: i })} className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70">
                  <Text className="text-white">
                    {c.name ?? c.id}{c.dmg ? ` | DMG ${c.dmg}` : ''}{c.block ? ` | Block ${c.block}` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ===== Events ===== */}
        {inEvent && state.event?.type === 'well' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Well ⛲</Text>
            <Text className="text-white/80">HP {state.player.hp}/{state.player.maxHp}</Text>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'DoWellUse' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">Use (+10 HP)</Text>
              </Pressable>
              <Pressable onPress={() => dispatch({ type: 'DoWellDismiss' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">Dismiss</Text>
              </Pressable>
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {inEvent && state.event?.type === 'bonfire' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Bonfire 🔥</Text>
            <Text className="text-white/80">HP {state.player.hp}/{state.player.maxHp}</Text>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'DoBonfireHeal' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">Heal +10</Text>
              </Pressable>
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {inEvent && state.event?.type === 'shrine' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Shrine ✨ — Choose a blessing</Text>
            <View className="flex-row gap-2 flex-wrap">
              {(state.event.options ?? []).map((b, i) => (
                <Pressable key={b.id} onPress={() => dispatch({ type: 'EventChooseBlessing', index: i })} className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70">
                  <Text className="text-white font-semibold">{b.name} {b.rarity ? `(${b.rarity})` : ''}</Text>
                  {b.desc ? <Text className="text-white/70">{b.desc}</Text> : null}
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {inEvent && state.event?.type === 'remove' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Remove Card 🗑️</Text>
            <Text className="text-white/70 mb-2">Removed this run: {state.runCounters?.removed ?? 0}/{state.event.capPerRun}</Text>
            <Text className="text-white/80">Hand</Text>
            <View className="flex-row gap-2 flex-wrap mb-2">
              {state.piles.hand.map((c, i) => (
                <Pressable key={`h${i}`} onPress={() => dispatch({ type: 'EventRemoveCard', pile: 'hand', index: i })} className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70">
                  <Text className="text-white">{c.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-white/80">Draw</Text>
            <View className="flex-row gap-2 flex-wrap mb-2">
              {state.piles.draw.map((c, i) => (
                <Pressable key={`d${i}`} onPress={() => dispatch({ type: 'EventRemoveCard', pile: 'draw', index: i })} className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70">
                  <Text className="text-white">{c.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-white/80">Discard</Text>
            <View className="flex-row gap-2 flex-wrap">
              {state.piles.discard.map((c, i) => (
                <Pressable key={`x${i}`} onPress={() => dispatch({ type: 'EventRemoveCard', pile: 'discard', index: i })} className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70">
                  <Text className="text-white">{c.name}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {inEvent && state.event?.type === 'gamble' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Gamble 🎲</Text>
            {state.event.resolved ? (
              <Text className="text-white/80">
                {state.event.resolved.outcome === 'win'
                  ? `You WIN +${state.event.resolved.gold}g`
                  : `You LOSE -${state.event.resolved.hpLoss} HP`}
              </Text>
            ) : (
              <Pressable onPress={() => dispatch({ type: 'EventGambleRoll' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70 mt-1">
                <Text className="text-white font-semibold">Roll</Text>
              </Pressable>
            )}
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {inEvent && state.event?.type === 'treasure' && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Treasure 💰</Text>
            {state.event.amount != null ? (
              <Text className="text-white/80">You found {state.event.amount}g</Text>
            ) : (
              <Pressable onPress={() => dispatch({ type: 'EventTreasureOpen' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70 mt-1">
                <Text className="text-white font-semibold">Open</Text>
              </Pressable>
            )}
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ===== Victory (generic) ===== */}
        {inVictory && (
          <View className="mt-6 rounded-2xl p-4 bg-emerald-900/30 border border-emerald-400/20">
            <Text className="text-white text-lg font-semibold">Victory</Text>
            <Text className="text-white/70 mt-1">You won the battle.</Text>
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => dispatch({ type: 'CompleteNode' })} className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70">
                <Text className="text-white font-semibold">Continue</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ===== Save/Load Panel ===== */}
        {showSaveLoad && (
          <View className="rounded-2xl p-4 bg-zinc-800/80 border border-white/10 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-semibold">Save/Load Game</Text>
              <Pressable 
                onPress={() => setShowSaveLoad(false)}
                className="px-3 py-1 rounded-xl bg-red-700/40"
              >
                <Text className="text-white font-semibold">✕</Text>
              </Pressable>
            </View>
            
            {saveLoadError ? (
              <Text className="text-red-300 mb-3">{saveLoadError}</Text>
            ) : null}

            <View className="mb-3">
              <Pressable 
                onPress={refreshSaveSlots}
                className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70 mb-3"
              >
                <Text className="text-white font-semibold">Refresh Save Slots</Text>
              </Pressable>
              
              {saveSlots.map((slot, idx) => (
                <View key={slot.slot} className="flex-row items-center justify-between mb-2 p-3 rounded-xl bg-zinc-900/50">
                  <View className="flex-1">
                    <Text className="text-white font-semibold">Slot {slot.slot + 1}</Text>
                    {slot.exists ? (
                      <>
                        <Text className="text-white/70 text-sm">
                          Level {slot.playerLevel} • {slot.gold}g
                        </Text>
                        <Text className="text-white/60 text-sm">
                          Page {slot.currentPage}/{slot.totalPages}
                        </Text>
                        <Text className="text-white/50 text-xs">
                          {slot.savedAt ? new Date(slot.savedAt).toLocaleString() : 'Unknown time'}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-white/50 text-sm">Empty</Text>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable 
                      onPress={async () => {
                        try {
                          await saveToSlot(slot.slot);
                          await refreshSaveSlots();
                          setSaveLoadError('');
                        } catch (error) {
                          setSaveLoadError(`Save failed: ${error}`);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-green-700/40 active:opacity-70"
                      disabled={state.phase === 'menu'}
                    >
                      <Text className="text-white text-sm font-semibold">Save</Text>
                    </Pressable>
                    <Pressable 
                      onPress={async () => {
                        try {
                          await loadFromSlot(slot.slot);
                          setShowSaveLoad(false);
                          setSaveLoadError('');
                        } catch (error) {
                          setSaveLoadError(`Load failed: ${error}`);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-700/40 active:opacity-70"
                      disabled={!slot.exists}
                    >
                      <Text className="text-white text-sm font-semibold">Load</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ===== Controls / QA ===== */}
        <View className="rounded-2xl p-4 bg-zinc-800/50 border border-white/10 mb-4">
          <Text className="text-white/80 mb-2">Seed</Text>
          <TextInput
            value={seed}
            onChangeText={setSeed}
            placeholder="seed"
            placeholderTextColor="#aaa"
            className="px-3 py-2 rounded-xl bg-zinc-900 text-white border border-white/10"
          />
          <View className="flex-row gap-2 mt-3 flex-wrap">
            <Button title="New Run" onPress={() => newRun(seed)} />
            <Button title="End Turn" onPress={() => dispatch({ type: 'EndTurn' })} disabled={!inCombat} />
            <Button 
              title={showSaveLoad ? "Close Save/Load" : "Save/Load Game"} 
              onPress={() => {
                setShowSaveLoad(!showSaveLoad);
                if (!showSaveLoad) {
                  refreshSaveSlots();
                }
              }} 
            />
          </View>
          <View className="flex-row gap-2 mt-3 flex-wrap">
            <Button title="QA: Kill Enemy" onPress={() => dispatch({ type: 'QA_KillEnemy' })} disabled={!inCombat} />
            <Button title="QA: Draw 1" onPress={() => dispatch({ type: 'QA_Draw', count: 1 })} disabled={!inCombat} />
            <Button title="QA: Energy=3" onPress={() => dispatch({ type: 'QA_SetEnergy', value: 3 })} disabled={!inCombat} />
            <Button title="QA: Blessing Demo" onPress={() => dispatch({ type: 'QA_AddBlessingDemo' })} />
            <Button title="QA: Equip Demo" onPress={() => dispatch({ type: 'QA_AddEquipmentDemo' })} />
            <Button title="QA: Open Shop" onPress={() => dispatch({ type: 'QA_OpenShopHere' })} />
            <Button title="QA: Shrine" onPress={() => dispatch({ type: 'QA_OpenShrine' })} />
            <Button title="QA: Remove" onPress={() => dispatch({ type: 'QA_OpenRemove' })} />
            <Button title="QA: Gamble" onPress={() => dispatch({ type: 'QA_OpenGamble' })} />
            <Button title="QA: Treasure" onPress={() => dispatch({ type: 'QA_OpenTreasure' })} />
            <Button title="QA: InitPages" onPress={() => dispatch({ type: 'QA_InitPages' })} />
            <Button title="QA: PrintPage" onPress={() => dispatch({ type: 'QA_PrintPage' })} />
          </View>
        </View>

        {/* Log */}
        <Text className="text-white font-semibold mt-6 mb-2">Log</Text>
        {state.log.slice(-8).map((l, i) => (
          <Text key={i} className="text-white/60">{l}</Text>
        ))}
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
