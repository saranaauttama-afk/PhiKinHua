import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import type { ThemeTokens } from '../theme';

type Props = {
  theme: ThemeTokens;
  radius: number;
  strokeWidth?: number;
  enabled?: boolean;
  children: React.ReactNode;
};

export default function CardFrame({ theme, radius, strokeWidth = 2, enabled, children }: Props) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const onLayout = React.useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  }, [size.w, size.h]);

  return (
    <View onLayout={onLayout} style={{ position: 'relative' }}>
      {children}
      {enabled && size.w > 0 && size.h > 0 && (
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
          <Svg width="100%" height="100%">
            <Defs>
              {/* ไล่เฉดทองแบบเบา ๆ */}
              <LinearGradient id="foil" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#f7e27a" />
                <Stop offset="35%" stopColor="#d4af37" />
                <Stop offset="65%" stopColor="#f3d45a" />
                <Stop offset="100%" stopColor="#b88a21" />
              </LinearGradient>
            </Defs>
            <Rect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              width={size.w - strokeWidth}
              height={size.h - strokeWidth}
              rx={radius}
              ry={radius}
              fill="none"
              stroke="url(#foil)"
              strokeWidth={strokeWidth}
            />
          </Svg>
        </View>
      )}
    </View>
  );
}
