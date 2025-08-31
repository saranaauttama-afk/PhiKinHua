import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { CardData } from '../../core/types';
import type { ThemeTokens } from '../theme';
import { shadowStyle } from '../theme';
import CardFrame from './CardFrame';
import { haptics } from '../haptics';

type Props = {
    hand: CardData[];
    energy: number;
    theme: ThemeTokens;
    onPlay: (index: number) => void;
};

function CardButton({
    disabled, onPress, theme, borderColor, borderWidth, children,
}: {
    disabled?: boolean;
    onPress: () => void;
    theme: ThemeTokens;
    borderColor?: string;            // ✅ สีขอบที่ส่งเข้ามา
    borderWidth?: number;            // ✅ ความหนาขอบที่ส่งเข้ามา
    children: React.ReactNode;
}) {
    const scale = React.useRef(new Animated.Value(1)).current;
    
  const pressIn = () => {
    haptics.tapSoft(); // ✅ ฟีลสัมผัสเบา ๆ ตอนกด
    Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  };
    const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    return (
        <Animated.View style={[
            { transform: [{ scale }], opacity: disabled ? 0.6 : 1 },
            shadowStyle(2, theme.colors.vignetteEdge ?? '#000'),
        ]}>
            <Pressable
                onPress={() => { haptics.playCard(); onPress(); }}  // ✅ เล่นไพ่สำเร็จ: ฟีดแบ็ก Medium
                disabled={disabled}
                onPressIn={pressIn}
                onPressOut={pressOut}
                style={{
                    paddingHorizontal: 12, paddingVertical: 8,
                    borderRadius: theme.radius.card,
                    borderWidth: borderWidth ?? 1,
                    borderColor: borderColor ?? theme.colors.border,   // ✅ ใช้ค่าที่ส่งเข้ามาจริง
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    position: 'relative', // ✅ รองรับ badge แบบ absolute
                }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

export default function Hand({ hand, energy, theme, onPlay }: Props) {
    // เก็บ Animated.Value ต่อใบ เพื่อให้ใบ "ใหม่" ค่อยๆ โผล่เข้ามา
    const animsRef = React.useRef<Animated.Value[]>([]);
    const prevLenRef = React.useRef<number>(0);
    const [, setTick] = React.useState(0);

    React.useEffect(() => {
        const prevLen = prevLenRef.current;
        if (hand.length < animsRef.current.length) {
            animsRef.current = animsRef.current.slice(0, hand.length);
        }
        let created = false;
        if (hand.length > prevLen) {
            // ใบใหม่ตั้งค่า opacity=0/translateY=12 แล้ว animate → 1/0
            for (let i = prevLen; i < hand.length; i++) {
                const v = new Animated.Value(0);
                animsRef.current[i] = v;
                created = true;
                Animated.timing(v, { toValue: 1, duration: 240, useNativeDriver: true }).start();
            }
        }
        // ถ้ามีการ์ดใหม่ สั่ง re-render หนึ่งครั้งเพื่อให้ style ผูกกับ Animated.Value ที่เพิ่งสร้าง
        if (created) setTick(t => t + 1);
        prevLenRef.current = hand.length;
    }, [hand.length]);

    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {hand.map((c, i) => {
                const canPlay = energy >= (c.cost ?? 0);
                const a = animsRef.current[i];
                const animatedStyle = a
                    ? { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }
                    : undefined;
                // สีขอบพิเศษตาม rarity (Rare ใช้ accent, Uncommon ใช้ textMuted)
                const borderColor =
                    c.rarity === 'Rare' ? theme.colors.accent :
                        c.rarity === 'Uncommon' ? theme.colors.textMuted :
                            theme.colors.border;
                const borderWidth = c.rarity === 'Rare' ? 2 : 1;
                const isRareFoil = theme.id === 'thai_fairytale' && c.rarity === 'Rare';
                return (
                    <Animated.View
                        key={`${c.id}-${i}`}
                        // ✅ ใส่ margin ที่ "กล่องนอกสุด" ของการ์ด
                        style={[animatedStyle, { marginRight: 8, marginBottom: 8 }]}
                    >
                        {/* ครอบกรอบทองเฉพาะ Rare  สกิน thai_fairytale */}
                        <CardFrame
                            theme={theme}
                            radius={theme.radius.card}
                            strokeWidth={1}
                            enabled={isRareFoil}
                        >
                            <CardButton
                                disabled={!canPlay}
                                onPress={() => onPlay(i)}
                                theme={theme}
                                borderColor={isRareFoil ? 'transparent' : borderColor}  // ❗️ซ่อนขอบเดิมเมื่อใช้ฟอยล์
                                borderWidth={isRareFoil ? 0 : borderWidth}               // ❗️ไม่ให้หนาซ้อน
                            >
                                {/* Header: ชื่อการ์ด */}
                                <Text style={{ color: theme.colors.text, fontWeight: '600', paddingRight: 36 }}>
                                    {c.name} {c.rarity ? `(${c.rarity})` : ''}
                                </Text>
                                {/* Icon row: ค่าต่าง ๆ */}
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {c.dmg ? (
                                        <Text style={{ color: '#fca5a5' }}>⚔ {c.dmg}</Text>
                                    ) : null}
                                    {c.block ? (
                                        <Text style={{ color: '#93c5fd' }}>🛡 {c.block}</Text>
                                    ) : null}
                                    {c.energyGain ? (
                                        <Text style={{ color: theme.colors.accent }}>⚡ +{c.energyGain}</Text>
                                    ) : null}
                                    {c.draw ? (
                                        <Text style={{ color: theme.colors.good }}>🃏 +{c.draw}</Text>
                                    ) : null}
                                </View>
                                {/* Cost badge: มุมขวาบน */}
                                <View
                                    style={{
                                        position: 'absolute', top: 6, right: 6,
                                        minWidth: 26, height: 26, borderRadius: 13,
                                        alignItems: 'center', justifyContent: 'center',
                                        paddingHorizontal: 6,
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        borderWidth: 1,
                                        borderColor: theme.colors.border,
                                    }}
                                >
                                    <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                        {c.cost}
                                    </Text>
                                </View>
                            </CardButton>
                        </CardFrame>
                    </Animated.View>
                );
            })}
        </View>
    );
}
