import React from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { colors } from '@/theme';

export interface CelestialGlyphSpec {
  symbol: string;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  size?: number;
  color?: string;
  opacity?: number;
  rotate?: string;
}

interface CelestialDecorationProps {
  items: CelestialGlyphSpec[];
  pointerEvents?: 'none' | 'box-none';
}

const DEFAULT_SYMBOL_SIZE = 16;

/**
 * Absolutely-positioned field of small celestial symbols (stars, moons,
 * sparkles). Purely decorative — rendered with plain Unicode glyphs so no
 * icon/SVG dependency is required. Use the `presets` below for common
 * scatter layouts, or pass custom `items`.
 */
export function CelestialDecoration({ items, pointerEvents = 'none' }: CelestialDecorationProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={pointerEvents}>
      {items.map((item, index) => (
        <Text
          key={`${item.symbol}-${index}`}
          style={[
            styles.glyph,
            {
              position: 'absolute',
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              fontSize: item.size ?? DEFAULT_SYMBOL_SIZE,
              color: item.color ?? colors.textPrimary,
              opacity: item.opacity ?? 0.6,
              transform: item.rotate ? [{ rotate: item.rotate }] : undefined,
            },
          ]}
        >
          {item.symbol}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    includeFontPadding: false,
  },
});

export const celestialPresets: Record<string, CelestialGlyphSpec[]> = {
  home: [
    { symbol: '✦', top: '8%', left: '10%', size: 12, color: colors.gold, opacity: 0.7 },
    { symbol: '✧', top: '14%', right: '14%', size: 16, color: colors.textPrimary, opacity: 0.5 },
    { symbol: '☾', top: '22%', right: '8%', size: 20, color: colors.cream, opacity: 0.55 },
    { symbol: '⋆', top: '6%', left: '46%', size: 10, color: colors.magenta, opacity: 0.7 },
    { symbol: '✦', bottom: '30%', left: '6%', size: 14, color: colors.orange, opacity: 0.5 },
  ],
  cream: [
    { symbol: '☾', top: '4%', left: '8%', size: 22, color: colors.textOnCream, opacity: 0.5, rotate: '-12deg' },
    { symbol: '✦', top: '6%', right: '12%', size: 14, color: colors.magenta, opacity: 0.6 },
    { symbol: '✧', bottom: '6%', left: '14%', size: 16, color: colors.purple, opacity: 0.5 },
    { symbol: '⋆', bottom: '10%', right: '10%', size: 12, color: colors.orange, opacity: 0.6 },
  ],
  reading: [
    { symbol: '✦', top: '4%', right: '8%', size: 12, color: colors.gold, opacity: 0.5 },
    { symbol: '⋆', top: '30%', left: '4%', size: 10, color: colors.magenta, opacity: 0.4 },
  ],

  // Per-Oracle background motifs for the selection carousel — each Oracle
  // "world" gets its own symbolic scatter instead of a flat color wash.
  'oracle-luna': [
    { symbol: '♥', top: '7%', left: '12%', size: 14, color: colors.magenta, opacity: 0.55 },
    { symbol: '☾', top: '10%', right: '10%', size: 22, color: colors.cream, opacity: 0.45, rotate: '-10deg' },
    { symbol: '✦', top: '5%', left: '48%', size: 11, color: colors.gold, opacity: 0.6 },
    { symbol: '✧', top: '20%', right: '22%', size: 12, color: colors.magentaMuted, opacity: 0.5 },
    { symbol: '♥', bottom: '10%', right: '14%', size: 12, color: colors.magenta, opacity: 0.4 },
    { symbol: '⋆', bottom: '16%', left: '9%', size: 10, color: colors.gold, opacity: 0.55 },
  ],
  'oracle-nyx': [
    { symbol: '◐', top: '8%', right: '14%', size: 20, color: colors.cream, opacity: 0.4, rotate: '8deg' },
    { symbol: '⟡', top: '13%', left: '10%', size: 13, color: colors.purple, opacity: 0.5 },
    { symbol: '⋆', top: '6%', left: '40%', size: 9, color: colors.textSecondary, opacity: 0.5 },
    { symbol: '✧', bottom: '14%', left: '16%', size: 11, color: colors.purple, opacity: 0.45 },
    { symbol: '⟡', bottom: '9%', right: '10%', size: 12, color: colors.cream, opacity: 0.35 },
  ],
  'oracle-sol': [
    { symbol: '☀', top: '7%', right: '12%', size: 20, color: colors.gold, opacity: 0.5 },
    { symbol: '✷', top: '16%', left: '10%', size: 14, color: colors.orange, opacity: 0.55 },
    { symbol: '⋆', top: '5%', left: '46%', size: 10, color: colors.gold, opacity: 0.6 },
    { symbol: '✹', bottom: '15%', right: '16%', size: 13, color: colors.orange, opacity: 0.45 },
    { symbol: '✧', bottom: '9%', left: '12%', size: 12, color: colors.gold, opacity: 0.5 },
  ],
  'oracle-astra': [
    { symbol: '✦', top: '6%', left: '10%', size: 13, color: colors.gold, opacity: 0.6 },
    { symbol: '✶', top: '11%', right: '11%', size: 16, color: colors.cream, opacity: 0.5 },
    { symbol: '✛', top: '19%', left: '22%', size: 12, color: colors.purple, opacity: 0.45 },
    { symbol: '⋆', bottom: '17%', right: '9%', size: 10, color: colors.gold, opacity: 0.55 },
    { symbol: '✧', bottom: '10%', left: '15%', size: 11, color: colors.cream, opacity: 0.4 },
    { symbol: '✦', bottom: '6%', right: '30%', size: 9, color: colors.purple, opacity: 0.5 },
  ],
  'oracle-merc': [
    { symbol: '✉', top: '9%', right: '13%', size: 16, color: colors.magentaMuted, opacity: 0.5 },
    { symbol: '⚡', top: '15%', left: '11%', size: 15, color: colors.gold, opacity: 0.5 },
    { symbol: '⋆', top: '6%', left: '44%', size: 9, color: colors.purple, opacity: 0.55 },
    { symbol: '✧', bottom: '13%', right: '17%', size: 12, color: colors.magentaMuted, opacity: 0.45 },
    { symbol: '✦', bottom: '8%', left: '13%', size: 11, color: colors.purple, opacity: 0.4 },
  ],
};
