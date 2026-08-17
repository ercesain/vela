import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius } from '@/theme';

interface IconButtonProps {
  glyph: string;
  onPress?: () => void;
  tone?: 'onDark' | 'onCream';
  style?: ViewStyle;
  size?: number;
}

/**
 * Circular chrome button for back / info / more affordances. Uses a
 * single glyph character rather than a vector icon set, keeping the
 * dependency surface minimal while matching the illustrated brand voice.
 */
export function IconButton({ glyph, onPress, tone = 'onDark', style, size = 40 }: IconButtonProps) {
  const isDark = tone === 'onDark';

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(36,23,38,0.08)',
          borderColor: isDark ? colors.borderSubtle : colors.borderOnCream,
        },
        style,
      ]}
    >
      <Text style={[styles.glyph, { color: isDark ? colors.textPrimary : colors.textOnCream }]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
  },
  glyph: {
    fontSize: 16,
    lineHeight: 18,
  },
});
