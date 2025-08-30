import 'react-native-gesture-handler'; // ต้องมาก่อน
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';
import type { Command, GameState } from '../src/core/types';
import { applyCommand } from '../src/core/reducer';
import { HAND_SIZE } from '../src/core/balance';
import { makeRng, seedFromString, type RNG } from '../src/core/rng';

type Store = {
  state: GameState;
  rng: RNG;
  dispatch: (cmd: Command) => void;
  newRun: (seed: string) => void;
};

const makeEmptyState = (): GameState => ({
  seed: '',
  phase: 'menu',
  turn: 0,
  player: { hp: 50, maxHp: 50, block: 0, energy: 3 },
  enemy: undefined,
  piles: { draw: [], hand: [], discard: [], exhaust: [] },
  log: [],
});

const useGame = create<Store>((set, get) => ({
  state: makeEmptyState(),
  rng: makeRng(1),
  dispatch: (cmd) => {
    const { state, rng } = get();
    const out = applyCommand(state, cmd, rng);
    set({ state: out.state, rng: out.rng });
  },
  newRun: (seed: string) => {
    const r = makeRng(seedFromString(seed));
    // NewRun should be applied under that RNG
    const out = applyCommand(makeEmptyState(), { type: 'NewRun', seed }, r);
    set({ state: out.state, rng: out.rng });
  },
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
  const { state, dispatch, newRun } = useGame();
  const [seed, setSeed] = useState('demo-001');
  const inCombat = state.phase === 'combat';
  const inReward = state.phase === 'reward';
  const inMap = state.phase === 'map';
  const inVictory = state.phase === 'victory';
  const inShop = state.phase === 'shop';
  const inEvent = state.phase === 'event';
  const canStartCombat = state.phase === 'menu';

  const energy = state.player.energy;

  const hand = state.piles.hand;
  const enemy = state.enemy;

  const header = useMemo(() => {
    return `${state.phase.toUpperCase()}  •  Turn ${state.turn || 0}`;
  }, [state.phase, state.turn]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' /* zinc-900 */ }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
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

        {/* Enemy panel — แสดงเฉพาะตอนคอมแบต */}
        {inCombat && (
          <View className="rounded-2xl p-4 bg-zinc-800/70 border border-white/10 mb-4">
            {enemy ? (
              <>
                <Text className="text-white text-lg font-semibold">{enemy.name}</Text>
                <Text className="text-white/80 mt-1">HP {enemy.hp}/{enemy.maxHp}</Text>
                <Text className="text-white/70 mt-1">Intent: Attack {enemy.dmg}</Text>
              </>
            ) : (
              <Text className="text-white/60">No enemy</Text>
            )}
          </View>
        )}

        {/* Controls */}
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
            <Button title="Start Combat" onPress={() => dispatch({ type: 'StartCombat' })} disabled={!canStartCombat} />
            <Button title="End Turn" onPress={() => dispatch({ type: 'EndTurn' })} disabled={!inCombat} />
          </View>
        </View>

        {/* === Map View (เลือกโหนด) === */}
        {inMap && (
          <View className="rounded-2xl p-4 bg-zinc-800/70 border border-white/10 mb-4">
            <Text className="text-white text-lg font-semibold">Map</Text>
            <Text className="text-white/60 mb-2">Depth {state.map?.depth ?? 0}/{state.map?.totalCols ?? 0}</Text>
            <View className="flex-row gap-4 flex-wrap">
              {(state.map?.cols[state.map?.depth ?? 0] ?? []).map((n, i) => (
                <Pressable
                  key={n.id}
                  onPress={() => dispatch({ type: 'EnterNode', nodeId: n.id })}
                  className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70"
                >
                  <Text className="text-white font-semibold">
                    {n.kind === 'boss' ? '👑 Boss'
                      : n.kind === 'elite' ? '💀 Elite'
                      : n.kind === 'shop' ? '🛒 Shop'
                      : n.kind === 'bonfire' ? '🔥 Bonfire'
                      : '👾 Monster'} {n.col}.{n.row}
                  </Text>
                </Pressable>
              ))}
              {((state.map?.cols[state.map?.depth ?? 0] ?? []).length === 0) && (
                <Text className="text-white/60">Act complete — (จะต่อยอดใน M1.2)</Text>
              )}
            </View>
          </View>
        )}

        {/* Hand */}
        <Text className="text-white font-semibold mb-2">Hand</Text>
        <View className="flex-row gap-2 flex-wrap">
          {hand.map((c, i) => {
            const disabled = !inCombat || state.player.energy < c.cost;
            return (
              <Pressable
                key={i}
                onPress={disabled ? undefined : () => dispatch({ type: 'PlayCard', index: i })}
                className={`px-3 py-2 rounded-2xl border ${disabled ? 'opacity-50' : 'active:opacity-70'} bg-zinc-800 border-white/10`}
              >
                <Text className="text-white font-semibold">{c.name}</Text>
                <Text className="text-white/70">Cost {c.cost}</Text>
                {c.dmg ? <Text className="text-red-300">DMG {c.dmg}</Text> : null}
                {c.block ? <Text className="text-sky-300">Block {c.block}</Text> : null}
                {c.energyGain ? <Text className="text-amber-300">Energy {c.energyGain}</Text> : null}
                {c.draw ? <Text className="text-emerald-300">Draw {c.draw}</Text> : null}
              </Pressable>
            );
          })}
          {hand.length === 0 && <Text className="text-white/60">Empty</Text>}
        </View>

        {/* === Reward Modal (simple) === */}
        {inReward && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Choose a reward</Text>
            <View className="flex-row gap-2 flex-wrap">
              {(state.rewardOptions ?? []).map((c, i) => (
                <Pressable
                  key={i}
                  onPress={() => dispatch({ type: 'TakeReward', index: i })}
                  className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70"
                >
                  <Text className="text-white font-semibold">{c.name}</Text>
                  <Text className="text-white/70">Cost {c.cost}</Text>
                  {c.dmg ? <Text className="text-red-300">DMG {c.dmg}</Text> : null}
                  {c.block ? <Text className="text-sky-300">Block {c.block}</Text> : null}
                  {c.energyGain ? <Text className="text-amber-300">+Energy {c.energyGain}</Text> : null}
                  {c.draw ? <Text className="text-emerald-300">Draw {c.draw}</Text> : null}
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => dispatch({ type: 'CompleteNode' })}
                className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70"
              >
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* === Shop Modal (เลือกฟรี 1 ใบ) === */}
        {inShop && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Shop — take 1 card (free)</Text>
            <View className="flex-row gap-2 flex-wrap">
              {(state.shopOptions ?? []).map((c, i) => (
                <Pressable
                  key={i}
                  onPress={() => dispatch({ type: 'TakeShop', index: i })}
                  className="px-3 py-2 rounded-2xl border bg-zinc-900 border-white/10 active:opacity-70"
                >
                  <Text className="text-white font-semibold">{c.name} {c.rarity ? `(${c.rarity})` : ''}</Text>
                  <Text className="text-white/70">Cost {c.cost}</Text>
                  {c.dmg ? <Text className="text-red-300">DMG {c.dmg}</Text> : null}
                  {c.block ? <Text className="text-sky-300">Block {c.block}</Text> : null}
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => dispatch({ type: 'CompleteNode' })}
                className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70"
              >
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* === Bonfire Event === */}
        {inEvent && (
          <View className="mt-6 rounded-2xl p-4 bg-zinc-800/80 border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">Bonfire 🔥</Text>
            <Text className="text-white/80">HP {state.player.hp}/{state.player.maxHp}</Text>
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => dispatch({ type: 'DoBonfireHeal' })}
                className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70"
              >
                <Text className="text-white font-semibold">Heal +10</Text>
              </Pressable>
              <Pressable
                onPress={() => dispatch({ type: 'CompleteNode' })}
                className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70"
              >
                <Text className="text-white font-semibold">CompleteNode</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* === Victory screen (จบวิ่ง) === */}
        {inVictory && (
          <View className="mt-6 rounded-2xl p-4 bg-emerald-900/40 border border-emerald-400/30">
            <Text className="text-white text-lg font-semibold">Act Cleared! 🎉</Text>
            <Text className="text-white/70 mt-1">You defeated the boss. Start a new run to play again.</Text>
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => /* เริ่มใหม่ด้วย seed เดิม */ newRun(state.seed)}
                className="px-4 py-2 rounded-2xl border bg-white/5 border-white/20 active:opacity-70"
              >
                <Text className="text-white font-semibold">New Run (same seed)</Text>
              </Pressable>
            </View>
          </View>
        )}

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
