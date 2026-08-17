import React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing, typeScale } from '@/theme';

export type IllustratedTarotCardSize = 'fan' | 'hero';

const SIZE_MAP: Record<IllustratedTarotCardSize, { width: number; height: number }> = {
  fan: { width: 172, height: 260 },
  hero: { width: 220, height: 332 },
};

interface IllustratedTarotCardProps {
  artwork: ImageSourcePropType;
  label: string;
  accentColor: string;
  size?: IllustratedTarotCardSize;
  selected?: boolean;
  dimmed?: boolean;
  style?: ViewStyle;
}

/**
 * Large, hand-illustrated tarot card used on the "Niyetini Seç" screen.
 * A thick cream outer frame + dark inner frame surround the illustration,
 * with a small gilded plaque carrying the card's short intention label.
 */
export function IllustratedTarotCard({
  artwork,
  label,
  accentColor,
  size = 'fan',
  selected,
  dimmed,
  style,
}: IllustratedTarotCardProps) {
  const dimensions = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.outerFrame,
        dimensions,
        { opacity: dimmed ? 0.55 : 1, shadowColor: selected ? accentColor : 'transparent' },
        selected ? styles.selectedShadow : null,
        style,
      ]}
    >
      <View style={[styles.innerFrame, { borderColor: colors.textOnCream }]}>
        <Image
          source={artwork}
          style={{ width: dimensions.width - 12, height: dimensions.height - 12 }}
          resizeMode="cover"
        />

        {selected ? <View style={[styles.glowRing, { borderColor: accentColor }]} /> : null}

        <View style={styles.cornerGlyphTL}>
          <Text style={styles.cornerGlyphText}>✦</Text>
        </View>
        <View style={styles.cornerGlyphBR}>
          <Text style={styles.cornerGlyphText}>✦</Text>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(10,6,12,0.82)']}
          locations={[0, 0.65]}
          style={styles.labelPlaque}
        >
          <View style={styles.labelDivider} />
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerFrame: {
    borderRadius: radius.lg,
    padding: 6,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.borderOnCream,
  },
  selectedShadow: {
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  innerFrame: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.deepPurple,
  },
  glowRing: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: radius.sm,
    borderWidth: 2,
  },
  cornerGlyphTL: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
  cornerGlyphBR: {
    position: 'absolute',
    bottom: spacing.xxs,
    right: spacing.xs,
  },
  cornerGlyphText: {
    color: 'rgba(246,237,219,0.75)',
    fontSize: 12,
  },
  labelPlaque: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xl,
  },
  labelDivider: {
    width: 22,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 6,
    borderRadius: 1,
  },
  labelText: {
    ...typeScale.cardTitle,
    color: colors.cream,
    textAlign: 'center',
  },
});
