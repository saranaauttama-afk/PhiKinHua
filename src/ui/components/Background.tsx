import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { ThemeTokens } from '../theme';

export default function Background({ theme }: { theme: ThemeTokens }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="v" cx="50%" cy="40%" rx="75%" ry="75%">
            <Stop offset="0%" stopColor={theme.colors.vignetteCenter ?? theme.colors.accent} stopOpacity={0.10} />
            <Stop offset="55%" stopColor={theme.colors.bg} stopOpacity={0.00} />
            <Stop offset="100%" stopColor={theme.colors.vignetteEdge ?? '#000'} stopOpacity={0.55} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#v)" />
      </Svg>
    </View>
  );
}
