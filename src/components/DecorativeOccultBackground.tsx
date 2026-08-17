import React, { useMemo } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/theme';
import { CelestialDecoration, type CelestialGlyphSpec } from './CelestialDecoration';

interface BlobSpec {
  size: number;
  color: string;
  opacity: number;
  bottom?: DimensionValue;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
}

const LEFT_CLOUD: BlobSpec[] = [
  { size: 220, color: colors.black, opacity: 0.92, bottom: -100, left: -80 },
  { size: 150, color: colors.deepPurple, opacity: 0.95, bottom: -60, left: 10 },
  { size: 100, color: colors.black, opacity: 0.85, bottom: -20, left: -20 },
  { size: 70, color: colors.deepPurple, opacity: 0.8, bottom: 20, left: 30 },
];

const RIGHT_CLOUD: BlobSpec[] = [
  { size: 220, color: colors.black, opacity: 0.92, bottom: -100, right: -80 },
  { size: 150, color: colors.deepPurple, opacity: 0.95, bottom: -60, right: 10 },
  { size: 100, color: colors.black, opacity: 0.85, bottom: -20, right: -20 },
  { size: 70, color: colors.purple, opacity: 0.55, bottom: 22, right: 25 },
];

const BACKGROUND_GLYPHS: CelestialGlyphSpec[] = [
  { symbol: '✦', top: '4%', left: '8%', size: 14, color: colors.magenta, opacity: 0.6 },
  { symbol: '✧', top: '3%', right: '10%', size: 16, color: colors.orange, opacity: 0.55 },
  { symbol: '⋆', top: '9%', left: '20%', size: 10, color: colors.gold, opacity: 0.6 },
  { symbol: '☾', top: '7%', right: '22%', size: 20, color: colors.textOnCream, opacity: 0.4, rotate: '-15deg' },
  { symbol: '✶', top: '16%', left: '6%', size: 14, color: colors.purple, opacity: 0.5 },
  { symbol: '⟡', top: '18%', right: '7%', size: 16, color: colors.magenta, opacity: 0.5 },
  { symbol: '✧', top: '30%', left: '4%', size: 12, color: colors.orange, opacity: 0.45 },
  { symbol: '⋆', top: '34%', right: '5%', size: 12, color: colors.purple, opacity: 0.5 },
  { symbol: '✦', top: '46%', left: '9%', size: 11, color: colors.gold, opacity: 0.55 },
  { symbol: '✦', top: '48%', right: '10%', size: 13, color: colors.magenta, opacity: 0.55 },
  { symbol: '◇', top: '58%', left: '5%', size: 12, color: colors.textOnCream, opacity: 0.4 },
  { symbol: '◇', top: '58%', right: '6%', size: 12, color: colors.textOnCream, opacity: 0.4 },
  { symbol: '✧', bottom: '20%', left: '10%', size: 14, color: colors.cream, opacity: 0.5 },
  { symbol: '✶', bottom: '18%', right: '11%', size: 14, color: colors.cream, opacity: 0.5 },
  { symbol: '⋆', bottom: '10%', left: '22%', size: 10, color: colors.gold, opacity: 0.55 },
  { symbol: '⋆', bottom: '9%', right: '24%', size: 10, color: colors.gold, opacity: 0.55 },
  { symbol: '✦', bottom: '4%', left: '42%', size: 12, color: colors.magenta, opacity: 0.5 },
];

function Blob({ spec }: { spec: BlobSpec }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size / 2,
        backgroundColor: spec.color,
        opacity: spec.opacity,
        top: spec.top,
        bottom: spec.bottom,
        left: spec.left,
        right: spec.right,
      }}
    />
  );
}

function SunRays({ centerXPercent, rayCount, color, opacity }: {
  centerXPercent: DimensionValue;
  rayCount: number;
  color: string;
  opacity: number;
}) {
  const rays = useMemo(() => {
    const spread = 130;
    return Array.from({ length: rayCount }, (_, i) => {
      const t = rayCount === 1 ? 0 : i / (rayCount - 1);
      const angle = -spread / 2 + spread * t;
      const length = 120 + (i % 3) * 26;
      return { angle, length };
    });
  }, [rayCount]);

  return (
    <View style={[styles.rayOrigin, { left: centerXPercent }]}>
      {rays.map((ray, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            width: 3,
            height: ray.length,
            backgroundColor: color,
            opacity,
            borderRadius: 2,
            transform: [{ rotate: `${ray.angle}deg` }],
            transformOrigin: 'top',
          }}
        />
      ))}
    </View>
  );
}

/**
 * Illustrated-poster style background for the "Niyetini Seç" screen: warm
 * cream base with dark cloud shapes framing the lower corners, a soft
 * radiant glow + sunburst behind the title, and a dense scatter of
 * celestial symbols so the composition never reads as an empty screen.
 */
export function DecorativeOccultBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* soft radiant glow behind the title */}
      <View style={styles.titleGlowWrap}>
        <LinearGradient
          colors={[colors.magenta, 'rgba(245,28,146,0.15)', 'transparent']}
          style={styles.titleGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <SunRays centerXPercent="50%" rayCount={9} color={colors.magenta} opacity={0.16} />
      <SunRays centerXPercent="50%" rayCount={5} color={colors.gold} opacity={0.2} />

      {/* corner accent blobs */}
      <View style={[styles.accentBlob, { top: -30, left: -30, backgroundColor: colors.orange, opacity: 0.28 }]} />
      <View style={[styles.accentBlob, { top: -20, right: -40, backgroundColor: colors.magenta, opacity: 0.22 }]} />

      <CelestialDecoration items={BACKGROUND_GLYPHS} />

      {LEFT_CLOUD.map((spec, i) => (
        <Blob key={`left-${i}`} spec={spec} />
      ))}
      {RIGHT_CLOUD.map((spec, i) => (
        <Blob key={`right-${i}`} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  titleGlowWrap: {
    position: 'absolute',
    top: -40,
    left: '50%',
    marginLeft: -160,
    width: 320,
    height: 260,
  },
  titleGlow: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  rayOrigin: {
    position: 'absolute',
    top: 6,
    width: 0,
    height: 0,
  },
  accentBlob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
});
