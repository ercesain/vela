import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing, typeScale } from '@/theme';
import type { TarotCardData, TarotCardId } from '@/types';

export type TarotCardSize = 'fan' | 'inline' | 'hero';

const SIZE_MAP: Record<TarotCardSize, { width: number; height: number }> = {
  fan: { width: 132, height: 196 },
  inline: { width: 108, height: 160 },
  hero: { width: 168, height: 250 },
};

const PLACEHOLDER_GLYPH: Record<TarotCardId, string> = {
  lovers: '♥',
  moon: '☾',
  star: '✶',
};

interface TarotCardProps {
  card: TarotCardData;
  size?: TarotCardSize;
  selected?: boolean;
  dimmed?: boolean;
  showLabel?: boolean;
  style?: ViewStyle;
}

/**
 * Single tarot card. Renders `card.artwork` when supplied; otherwise falls
 * back to an illustrated placeholder built from the accent gradient + a
 * symbolic glyph, so real PNG/WebP artwork can be dropped in later without
 * touching layout code.
 */
export function TarotCard({ card, size = 'inline', selected, dimmed, showLabel = true, style }: TarotCardProps) {
  const dimensions = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.wrapper,
        dimensions,
        {
          opacity: dimmed ? 0.55 : 1,
          borderColor: selected ? card.accent : colors.borderOnCream,
          shadowColor: selected ? card.accent : 'transparent',
        },
        selected ? styles.selectedShadow : null,
        style,
      ]}
    >
      {card.artwork ? (
        <Image source={card.artwork} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[card.accent, colors.deepPurple]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={styles.innerBorder} />

      <View style={styles.content}>
        <Text style={styles.glyph}>{PLACEHOLDER_GLYPH[card.id]}</Text>
        {showLabel ? (
          <View style={styles.labelWrap}>
            <Text style={styles.label} numberOfLines={1}>
              {card.title}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.deepPurple,
  },
  selectedShadow: {
    shadowOpacity: 0.85,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  innerBorder: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(246,237,219,0.35)',
    borderRadius: radius.sm,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  glyph: {
    fontSize: 40,
    color: colors.cream,
    marginBottom: spacing.sm,
  },
  labelWrap: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.xs,
    right: spacing.xs,
    alignItems: 'center',
  },
  label: {
    ...typeScale.cardTitle,
    color: colors.cream,
    textAlign: 'center',
  },
});
