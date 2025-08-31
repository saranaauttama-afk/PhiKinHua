import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { CardData } from '../../core/types';
import type { ThemeTokens } from '../theme';
import { shadowStyle } from '../theme';
import CardFrame from './CardFrame';
import { haptics } from '../haptics';
import { sfx } from '../sfx';
import { dur } from '../anim';

type Props = {
    hand: CardData[];
    energy: number;
    theme: ThemeTokens;
    onPlay: (index: number) => void;
};

function CardButton({
    disabled, canPlay, onPress, theme, borderColor, borderWidth, children, tooltipContent,
}: {
    disabled?: boolean;
    canPlay?: boolean;                 // ✅ ใช้ guard ภายในปุ่ม
    onPress: () => void;
    theme: ThemeTokens;
    borderColor?: string;            // ✅ สีขอบที่ส่งเข้ามา
    borderWidth?: number;            // ✅ ความหนาขอบที่ส่งเข้ามา
    children: React.ReactNode;
    tooltipContent?: React.ReactNode; // ✅ เนื้อหา tooltip (กดค้าง)
}) {
    const scale = React.useRef(new Animated.Value(1)).current;
    const shake = React.useRef(new Animated.Value(0)).current; // -1..1 → translateX

    const pressIn = () => {
        if (canPlay !== false) haptics.tapSoft(); // ✅ แตะเบา เฉพาะเมื่อเล่นได้
        Animated.timing(scale, { toValue: 0.97, duration: dur(100), useNativeDriver: true }).start();
    };
    const pressOut = () => Animated.timing(scale, { toValue: 1, duration: dur(100), useNativeDriver: true }).start();
    const doShake = () => {
        shake.setValue(0);
        Animated.sequence([
            Animated.timing(shake, { toValue: 1, duration: dur(60), useNativeDriver: true }),
            Animated.timing(shake, { toValue: -1, duration: dur(90), useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: dur(70), useNativeDriver: true }),
        ]).start();
    };
    // Tooltip
    const [tip, setTip] = React.useState(false);
    const tipFade = React.useRef(new Animated.Value(0)).current;
    const showTip = React.useCallback(() => {
        setTip(true);
        tipFade.setValue(0);
        Animated.timing(tipFade, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    }, []);
    const hideTip = React.useCallback(() => {
        Animated.timing(tipFade, { toValue: 0, duration: 120, useNativeDriver: true })
            .start(() => setTip(false));
    }, []);
    const outerTransform = [
        { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) },
        { scale },
    ];
    const isDim = (disabled ?? false) || canPlay === false;

    return (
        <Animated.View style={[
            { transform: outerTransform, opacity: isDim ? 0.6 : 1 },
            shadowStyle(2, theme.colors.vignetteEdge ?? '#000'),
        ]}>
            <Pressable
        onPress={() => {
          if (canPlay === false) { haptics.warn(); doShake(); return; } // ❗️Guard: พลังงานไม่พอ
          // ✅ Success micro-anim: pop → spring กลับ แล้วค่อย commit เล่นไพ่
          haptics.playCard();
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.08, duration: dur(80), useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 160 }),
          ]).start();
          // commit หลังเด้งเล็กน้อย เพื่อให้ผู้เล่น "เห็น" แอนิเมชันก่อนที่ไพ่จะถูกถอนไปจากมือ
          setTimeout(() => { onPress(); }, dur(70));
        }}
                disabled={false} // เปิดรับอีเวนต์เสมอ เพื่อให้ guard ทำงานได้
                onPressIn={pressIn}
                onPressOut={() => { hideTip(); pressOut(); }}
                onLongPress={() => { if (tooltipContent) showTip(); }}
                delayLongPress={250}
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
                {/* Tooltip bubble */}
                {tip && tooltipContent ? (
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            transform: [{ translateY: -6 }],
                            opacity: tipFade,
                        }}
                    >
                        <View style={{
                            borderRadius: theme.radius.card,
                            borderWidth: 1, borderColor: theme.colors.border,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            paddingHorizontal: 10, paddingVertical: 8,
                            maxWidth: 240,
                        }}>
                            {typeof tooltipContent === 'string'
                                ? <Text style={{ color: theme.colors.text }}>{tooltipContent}</Text>
                                : tooltipContent
                            }
                        </View>
                    </Animated.View>
                ) : null}
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
                Animated.timing(v, { toValue: 1, duration: dur(240), useNativeDriver: true }).start();
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
                // ✅ Tooltip text (fallback จากฟิลด์การ์ด)
                const parts: string[] = [];
                if (c.dmg) parts.push(`Deal ${c.dmg} damage`);
                if (c.block) parts.push(`Gain ${c.block} Block`);
                if (c.energyGain) parts.push(`+${c.energyGain} Energy`);
                if (c.draw) parts.push(`Draw ${c.draw}`);
                const tipText = parts.length ? parts.join(' • ') : 'Play to trigger effects';

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
                                canPlay={canPlay}
                                onPress={() => {
                                    // ✅ เล่นเสียงตามชนิดการ์ด
                                    if (c.dmg) sfx.attack();
                                    else if (c.block) sfx.block();
                                    onPlay(i);
                                }}
                                theme={theme}
                                borderColor={isRareFoil ? 'transparent' : borderColor}  // ❗️ซ่อนขอบเดิมเมื่อใช้ฟอยล์
                                borderWidth={isRareFoil ? 0 : borderWidth}               // ❗️ไม่ให้หนาซ้อน
                                tooltipContent={
                                    <View>
                                        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                            {c.name} {c.rarity ? `(${c.rarity})` : ''}
                                        </Text>
                                        {tipText ? (
                                            <Text style={{ color: theme.colors.textMuted, marginTop: 2 }}>
                                                {tipText}
                                            </Text>
                                        ) : null}
                                        <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
                                            Cost: {c.cost}
                                        </Text>
                                    </View>
                                }
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
