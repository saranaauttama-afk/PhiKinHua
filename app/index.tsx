import 'react-native-gesture-handler'; // ต้องมาก่อน
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, NotoSerifThai_400Regular, NotoSerifThai_700Bold } from '@expo-google-fonts/noto-serif-thai';
import { Animated } from 'react-native';
import { getTheme, type SkinId } from '../src/ui/theme';
import MapView from '../src/ui/components/MapView/MapView';
import RewardModal from '../src/ui/components/Modals/RewardModal';
import ShopModal from '../src/ui/components/Modals/ShopModal';
import HUD from '../src/ui/components/HUD';
import BattleView from '../src/ui/components/BattleView/BattleView';
import EventModal from '../src/ui/components/Modals/EventModal';
import Background from '../src/ui/components/Background';
import { create } from 'zustand';
import type { Command, GameState } from '../src/core/types';
import { applyCommand } from '../src/core/reducer';
import { HAND_SIZE } from '../src/core/balance';
import { makeRng, seedFromString, type RNG } from '../src/core/rng';
import { START_GOLD } from '../src/core/balance'; // path ตามโปรเจกต์คุณ
import { haptics } from '../src/ui/haptics';
import QAOverlay from '../src/ui/components/QAOverlay';
import Panel from '../src/ui/components/Panel';
import VictoryBanner from '../src/ui/components/VictoryBanner';
import DefeatBanner from '../src/ui/components/DefeatBanner';

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
  player: { hp: 50, maxHp: 50, block: 0, energy: 3, gold: START_GOLD },
  enemy: undefined,
  piles: { draw: [], hand: [], discard: [], exhaust: [] },
  log: [],
  // M2 fields (required)
  blessings: [],
  turnFlags: { blessingOnce: {} },
  // optionals (explicit for clarity)
  rewardOptions: undefined,
  map: undefined,
  shopStock: undefined,
  event: undefined,
  combatVictoryLock: false,
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

// Lightweight press animation (แทน MotiPressable)
function ScalePressable({
  onPress, disabled, style, children,
}: { onPress: () => void; disabled?: boolean; style?: any; children: React.ReactNode }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPress={onPress} disabled={disabled} onPressIn={pressIn} onPressOut={pressOut} style={{ padding: 0 }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function Home() {
  const { state, dispatch, newRun } = useGame();
  const [seed, setSeed] = useState('demo-001');
  const [skin, setSkin] = useState<SkinId>('wire');
  // Haptics: trigger เมื่อชนะ/แพ้ (phase transition)
  const prevPhaseRef = React.useRef(state.phase);
  React.useEffect(() => {
    if (prevPhaseRef.current !== state.phase) {
      if (state.phase === 'victory') haptics.confirm();
      else if (state.phase === 'defeat') haptics.warn();
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase]);

  const baseTheme = getTheme(skin);
  const [fontsLoaded] = useFonts({ NotoSerifThai_400Regular, NotoSerifThai_700Bold });
  const theme = React.useMemo(() => {
    if (skin === 'thai_fairytale' && fontsLoaded) {
      return {
        ...baseTheme,
        fonts: { title: 'NotoSerifThai_700Bold', body: 'NotoSerifThai_400Regular' },
      };
    }
    return baseTheme;
  }, [skin, fontsLoaded]);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* พื้นหลัง Vignette */}
      <Background theme={theme} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header / Skin toggle */}
        <View style={{
          marginBottom: 12,
          padding: 12,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.panel
        }}>
          <Text style={{ color: theme.colors.textMuted, marginBottom: 6 }}>
            Skin: {skin === 'wire' ? 'wire' : 'thai_fairytale'}
          </Text>
          <View className="flex-row gap-2">
            <Pressable onPress={() => setSkin(skin === 'wire' ? 'thai_fairytale' : 'wire')}
              style={{
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
                backgroundColor: 'rgba(255,255,255,0.05)'
              }}>
              <Text style={{ color: theme.colors.text, fontWeight: '600', fontFamily: theme.fonts?.title }}>Toggle Skin</Text>
            </Pressable>
          </View>
        </View>
        {/* <Text className="text-white/60 mb-2">Phase: {state.phase}</Text>
        <Text className="text-white/60 mb-4">Log: {state.log.slice(-3).join(' | ')}</Text> */}
        {/* Header / HUD */}
        {/* <Text className="text-white text-xl font-bold mb-2">{header}</Text>
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
        </View> */}

        {/* Enemy panel — แสดงเฉพาะตอนคอมแบต */}
        {/* Combat */}
        {inCombat && (
          <BattleView
            state={state}
            theme={theme}
            onPlayCard={(index) => dispatch({ type: 'PlayCard', index })}
            onEndTurn={() => dispatch({ type: 'EndTurn' })}
          />
        )}

        {/* HUD: Gold */}
        <HUD state={state} theme={theme} />

        {/* Controls */}
        {/* <View style={{
          borderRadius: theme.radius.xl, padding: 16, marginBottom: 16,
          backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border
        }}> */}
        {/* <Text style={{ color: theme.colors.textMuted, marginBottom: 8, fontFamily: theme.fonts?.body }}>Seed</Text>
          <TextInput
            value={seed}
            onChangeText={setSeed}
            placeholder="seed"
            placeholderTextColor="#aaa"
            style={{
              paddingHorizontal: 12, paddingVertical: 8,
              borderRadius: theme.radius.card,
              backgroundColor: 'rgba(0,0,0,0.35)',
              color: theme.colors.text,
              borderWidth: 1, borderColor: theme.colors.border
            }}
          /> */}
        {/* <View className="flex-row gap-2 mt-3 flex-wrap">
            <Button title="New Run" onPress={() => newRun(seed)} />
            <Button title="Start Combat" onPress={() => dispatch({ type: 'StartCombat' })} disabled={!canStartCombat} />
            <Button title="End Turn" onPress={() => dispatch({ type: 'EndTurn' })} disabled={!inCombat} />
          </View> */}
        {/* QA row (debug ผ่าน commands เท่านั้น) */}
        {/* <View className="flex-row gap-2 mt-3 flex-wrap">
            <Button title="QA: Kill Enemy" onPress={() => dispatch({ type: 'QA_KillEnemy' })} disabled={!inCombat} />
            <Button title="QA: Draw 1" onPress={() => dispatch({ type: 'QA_Draw', count: 1 })} disabled={!inCombat} />
            <Button title="QA: Energy=3" onPress={() => dispatch({ type: 'QA_SetEnergy', value: 3 })} disabled={!inCombat} />
            <Button title="QA: Blessing Demo" onPress={() => dispatch({ type: 'QA_AddBlessingDemo' })} />
            <Button title="QA: Open Shop" onPress={() => dispatch({ type: 'QA_OpenShopHere' })} />
            <Button title="QA: Shrine" onPress={() => dispatch({ type: 'QA_OpenShrine' })} />
            <Button title="QA: Remove" onPress={() => dispatch({ type: 'QA_OpenRemove' })} />
            <Button title="QA: Gamble" onPress={() => dispatch({ type: 'QA_OpenGamble' })} />
            <Button title="QA: Treasure" onPress={() => dispatch({ type: 'QA_OpenTreasure' })} />
          </View> */}
        {/* </View> */}

        {/* === Map View (เลือกโหนด) === */}
        {inMap && (
          <MapView
            state={state}
            theme={theme}
            onEnterNode={(nodeId) => dispatch({ type: 'EnterNode', nodeId })}
          />
        )}

        {/* Hand */}
        {/* <Text className="text-white font-semibold mb-2">Hand</Text>
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
        </View> */}

        {/* === Reward Modal (simple) === */}
        {inReward && (
          <RewardModal
            state={state}
            theme={theme}
            onTake={(index) => dispatch({ type: 'TakeReward', index })}
            onComplete={() => dispatch({ type: 'CompleteNode' })}
          />
        )}

        {/* === Shop Modal (ซื้อได้หลายใบ + รีโรล) === */}
        {inShop && (
          <ShopModal
            state={state}
            theme={theme}
            onTake={(index) => dispatch({ type: 'TakeShop', index })}
            onReroll={() => dispatch({ type: 'ShopReroll' })}
            onComplete={() => dispatch({ type: 'CompleteNode' })}
          />
        )}

        {/* === Event Modal (รวมทุกชนิด) === */}
        {inEvent && (
          <EventModal
            state={state}
            theme={theme}
            onBonfireHeal={() => dispatch({ type: 'DoBonfireHeal' })}
            onChooseBlessing={(index) => dispatch({ type: 'EventChooseBlessing', index })}
            onRemoveCard={(pile, index) => dispatch({ type: 'EventRemoveCard', pile, index })}
            onGambleRoll={() => dispatch({ type: 'EventGambleRoll' })}
            onTreasureOpen={() => dispatch({ type: 'EventTreasureOpen' })}
            onComplete={() => dispatch({ type: 'CompleteNode' })}
          />
        )}

        {/* === Victory screen (จบวิ่ง) === */}
        {inVictory && (
          <View style={{
            marginTop: 24, borderRadius: theme.radius.xl, padding: 16,
            backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)'
          }}>
            <Text className="text-white text-lg font-semibold">Act Cleared! 🎉</Text>
            <Text className="text-white/70 mt-1">You defeated the boss. Start a new run to play again.</Text>
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => /* เริ่มใหม่ด้วย seed เดิม */ newRun(state.seed)}
                style={{
                  paddingVertical: 8, paddingHorizontal: 16,
                  borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <Text className="text-white font-semibold">New Run (same seed)</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Log */}
        {/* {state.log?.length ? (
          <Panel theme={theme} title="Log">
            {state.log.map((line, i) => (
              <Text key={i} style={{ color: theme.colors.textMuted }}>
                {String(line)}
              </Text>
            ))}
          </Panel>
        ) : null} */}
        {/* <View className="h-16" /> */}
      </ScrollView>
       {/* Victory overlay — โผล่เมื่อ phase === 'victory' */}
      <VictoryBanner
        theme={theme}
        active={state.phase === 'victory'}
        onContinue={() => {
          // ✅ คอนแทรกต์ของเรา: ปิด flow ด้วย CompleteNode เท่านั้น
          haptics.confirm();
          dispatch({ type: 'CompleteNode' });
        }}
      />
      {/* Defeat overlay — โผล่เมื่อ phase === 'defeat' */}
      <DefeatBanner
        theme={theme}
        active={state.phase === 'defeat'}
        onContinue={() => {
          // ✅ ปิด flow ด้วย CompleteNode ตามคอนแทรกต์
          haptics.confirm();
          dispatch({ type: 'CompleteNode' });
        }}
      />
      {/* QA Overlay */}
      <QAOverlay
        theme={theme}
        currentSeed={state.seed}
        onNewRun={(seed) => dispatch({ type: 'NewRun', seed })}
        onStartCombat={() => {
          const canStart = state.phase === 'menu' || state.phase === 'map';
          if (!canStart) { haptics.warn(); return; }
          haptics.confirm();
          dispatch({ type: 'StartCombat' });
        }}
        canStartCombat={state.phase === 'menu' || state.phase === 'map'}
        onEndTurn={() => {
          const canEnd = state.phase === 'combat' && !!state.enemy;
          if (!canEnd) { haptics.warn(); return; }
          haptics.confirm();
          dispatch({ type: 'EndTurn' });
        }}
        onQAKillEnemy={() => dispatch({ type: 'QA_KillEnemy' })}
        onQADraw={(count) => dispatch({ type: 'QA_Draw', count })}
        onQASetEnergy={(value) => dispatch({ type: 'QA_SetEnergy', value })}
        onQAAddBlessingDemo={() => dispatch({ type: 'QA_AddBlessingDemo' })}
        onQAOpenShopHere={() => dispatch({ type: 'QA_OpenShopHere' })}
        onQAOpenShrine={() => dispatch({ type: 'QA_OpenShrine' })}
        onQAOpenRemove={() => dispatch({ type: 'QA_OpenRemove' })}
        onQAOpenGamble={() => dispatch({ type: 'QA_OpenGamble' })}
        onQAOpenTreasure={() => dispatch({ type: 'QA_OpenTreasure' })}
      />
    </SafeAreaView>
  );
}
