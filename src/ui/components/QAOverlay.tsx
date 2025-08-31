import React from 'react';
import { View, Text, Pressable, TextInput, Animated } from 'react-native';
import type { ThemeTokens } from '../theme';
import Panel from './Panel';
import { haptics } from '../haptics';

type Props = {
  theme: ThemeTokens;
  currentSeed: string;
  onNewRun: (seed: string) => void;
  onStartCombat: () => void;
  canStartCombat?: boolean;
  onEndTurn: () => void;
  onQAKillEnemy: () => void;
  onQADraw: (count: number) => void;
  onQASetEnergy: (value: number) => void;
  onQAAddBlessingDemo: () => void;
  onQAOpenShopHere: () => void;
  onQAOpenShrine: () => void;
  onQAOpenRemove: () => void;
  onQAOpenGamble: () => void;
  onQAOpenTreasure: () => void;  
};

export default function QAOverlay({
  theme, currentSeed, onNewRun, onStartCombat,canStartCombat = true, onEndTurn,
  onQAKillEnemy, onQADraw, onQASetEnergy, onQAAddBlessingDemo,
  onQAOpenShopHere, onQAOpenShrine, onQAOpenRemove, onQAOpenGamble, onQAOpenTreasure,  
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [seed, setSeed] = React.useState(currentSeed || 'demo-001');
  React.useEffect(() => { setSeed(currentSeed || 'demo-001'); }, [currentSeed]);
  const [drawN, setDrawN] = React.useState('1');
  const [energyVal, setEnergyVal] = React.useState('3');  

  const scale = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(scale, { toValue: open ? 1 : 0, useNativeDriver: true, friction: 7, tension: 120 }).start();
  }, [open]);
  const panelStyle = {
    transform: [{ scale: scale.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
    opacity: scale,
  };

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 16 }}>
      {/* Panel */}
      {open && (
        <Animated.View style={[panelStyle, { marginBottom: 12 }]}>
          <Panel theme={theme} title="QA" style={{ width: 300 }}>
            <Text style={{ color: theme.colors.textMuted, marginBottom: 6 }}>Seed</Text>
            <TextInput
              value={seed}
              onChangeText={setSeed}
              placeholder="demo-001"
              placeholderTextColor={theme.colors.textMuted}
              style={{
                borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card,
                paddingHorizontal: 10, paddingVertical: 8, color: theme.colors.text, marginBottom: 10,
              }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Btn title="New Run" onPress={() => { haptics.confirm(); onNewRun(seed.trim() || 'demo-001'); }} theme={theme} />
              <Pressable
                onPressIn={() => { if (canStartCombat) haptics.tapSoft(); }}
                onPress={onStartCombat}
                style={{
                  paddingVertical: 8, paddingHorizontal: 12,
                  borderRadius: theme.radius.card,
                  borderWidth: 1, borderColor: theme.colors.border,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  marginRight: 8, marginBottom: 8,
                  opacity: canStartCombat ? 1 : 0.6,
                }}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Start Combat</Text>
              </Pressable>
              <Btn title="End Turn" onPress={() => { haptics.tapSoft(); onEndTurn(); }} theme={theme} />
            </View>

            {/* --- QA Extra --- */}
            <Text style={{ color: theme.colors.textMuted, marginTop: 12, marginBottom: 6 }}>QA Commands</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Btn title="Kill Enemy" onPress={() => { haptics.confirm(); onQAKillEnemy(); }} theme={theme} />
              <Btn title="Add Blessing (Demo)" onPress={() => { haptics.confirm(); onQAAddBlessingDemo(); }} theme={theme} />
              <Btn title="Open Shop" onPress={() => { haptics.confirm(); onQAOpenShopHere(); }} theme={theme} />
              <Btn title="Open Shrine" onPress={() => { haptics.confirm(); onQAOpenShrine(); }} theme={theme} />
              <Btn title="Open Remove" onPress={() => { haptics.confirm(); onQAOpenRemove(); }} theme={theme} />
              <Btn title="Open Gamble" onPress={() => { haptics.confirm(); onQAOpenGamble(); }} theme={theme} />
              <Btn title="Open Treasure" onPress={() => { haptics.confirm(); onQAOpenTreasure(); }} theme={theme} />
            </View>

            {/* Inline controls for Draw / Energy */}
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: theme.colors.textMuted, marginBottom: 6 }}>Draw N</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  value={drawN}
                  onChangeText={setDrawN}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={theme.colors.textMuted}
                  style={{
                    flexGrow: 1,
                    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card,
                    paddingHorizontal: 10, paddingVertical: 8, color: theme.colors.text, marginRight: 8,
                  }}
                />
                <Btn
                  title="Draw"
                  onPress={() => {
                    const count = parseInt(drawN || '0', 10);
                    if (!Number.isFinite(count) || count <= 0) { haptics.warn(); return; }
                    haptics.confirm(); onQADraw(count);
                  }}
                  theme={theme}
                />
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={{ color: theme.colors.textMuted, marginBottom: 6 }}>Set Energy</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  value={energyVal}
                  onChangeText={setEnergyVal}
                  keyboardType="number-pad"
                  placeholder="3"
                  placeholderTextColor={theme.colors.textMuted}
                  style={{
                    flexGrow: 1,
                    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card,
                    paddingHorizontal: 10, paddingVertical: 8, color: theme.colors.text, marginRight: 8,
                  }}
                />
                <Btn
                  title="Apply"
                  onPress={() => {
                    const v = parseInt(energyVal || '0', 10);
                    if (!Number.isFinite(v) || v < 0) { haptics.warn(); return; }
                    haptics.confirm(); onQASetEnergy(v);
                  }}
                  theme={theme}
                />
              </View>
            </View>            
          </Panel>
        </Animated.View>
      )}

      {/* FAB */}
      <Pressable
        onPressIn={() => haptics.tapSoft()}
        onPress={() => setOpen(v => !v)}
        style={{
          paddingHorizontal: 16, paddingVertical: 12,
          borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      >
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{open ? 'Close QA' : 'QA'}</Text>
      </Pressable>
    </View>
  );
}

function Btn({ title, onPress, theme }: { title: string; onPress: () => void; theme: ThemeTokens }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: theme.radius.card,
        borderWidth: 1, borderColor: theme.colors.border,
        backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, marginBottom: 8,
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}
