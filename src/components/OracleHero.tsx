import React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing, typeScale } from '@/theme';

interface OracleHeroProps {
  name: string;
  subtitle: string;
  tagline?: string;
  imageSource: ImageSourcePropType;
  /** Signature accent for the subtitle line. Defaults to magenta. */
  accentColor?: string;
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
}

/**
 * The dominant character presentation block for the Oracle Home screen.
 * The portrait fills the majority of the available space, per the brand
 * direction that the character — not chrome — anchors the screen.
 *
 * Swap `imageSource` for production art, e.g.
 *   require('@/assets/characters/luna.png')
 */
export function OracleHero({
  name,
  subtitle,
  tagline,
  imageSource,
  accentColor = colors.magenta,
  topLeft,
  topRight,
}: OracleHeroProps) {
  return (
    <View>
      <View style={styles.imageFrame}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />

        <LinearGradient
          colors={['transparent', 'rgba(5,5,5,0.55)', colors.background, colors.background]}
          locations={[0.5, 0.78, 0.94, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.overlayRow}>
          <View>{topLeft}</View>
          <View>{topRight}</View>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.name}>{name}</Text>
        <Text style={[styles.subtitle, { color: accentColor }]}>{subtitle}</Text>
        {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageFrame: {
    width: '100%',
    aspectRatio: 0.86,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.deepPurple,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  name: {
    ...typeScale.displayXL,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typeScale.label,
    color: colors.magenta,
    textTransform: 'uppercase',
    marginTop: spacing.xxs,
  },
  tagline: {
    ...typeScale.bodyItalic,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
