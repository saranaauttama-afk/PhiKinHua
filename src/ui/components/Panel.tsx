//*** NEW: src/ui/components/Panel.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import type { ThemeTokens } from '../theme';
import { shadowStyle } from '../theme';

type Props = {
  theme: ThemeTokens;
  title?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export default function Panel({ theme, title, style, children }: Props) {
  return (
    <View
      style={[
        {
          borderRadius: theme.radius.xl,
          padding: 16,
          backgroundColor: theme.colors.panel,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        shadowStyle(1, theme.colors.vignetteEdge ?? '#000'),
        style,
      ]}
    >
      {title ? (
        <Text style={{
          color: theme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8,
          fontFamily: theme.fonts?.title,
        }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
