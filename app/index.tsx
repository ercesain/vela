import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  BottomNavigation,
  CelestialDecoration,
  OracleCarousel,
  celestialPresets,
  type NavTabId,
} from '@/components';
import { oracles } from '@/data';
import { colors, spacing, typeScale } from '@/theme';
import type { OracleProfile } from '@/types';

export default function OracleSelectionScreen() {
  const [activeTab, setActiveTab] = useState<NavTabId>('oracle');
  const [activeOracleIndex, setActiveOracleIndex] = useState(0);

  const indexProgress = useSharedValue(0);

  useEffect(() => {
    indexProgress.value = withTiming(activeOracleIndex, { duration: 380 });
  }, [activeOracleIndex]);

  const tintStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      indexProgress.value,
      oracles.map((_, i) => i),
      oracles.map((oracle) => oracle.accent)
    ),
  }));

  const handleEnter = (oracle: OracleProfile) => {
    router.push({ pathname: '/reading/intention', params: { oracle: oracle.id } });
  };

  const activeOracle = oracles[activeOracleIndex];
  const motifKey = `oracle-${activeOracle.id}`;
  const motifItems = celestialPresets[motifKey] ?? celestialPresets.home;

  return (
    <View style={styles.screen}>
      {/* subtle, Oracle-driven background tint — never the dominant tone */}
      <Animated.View style={[StyleSheet.absoluteFill, tintStyle, styles.tintOverlay]} />

      {/* character-specific motif scatter — crossfades per Oracle so the
          background morphs (not just a flat color wash) */}
      <Animated.View
        key={activeOracle.id}
        entering={FadeIn.duration(520)}
        exiting={FadeOut.duration(520)}
        style={StyleSheet.absoluteFill}
      >
        <CelestialDecoration items={motifItems} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.wordmarkPill}>
            <Text style={styles.wordmarkGlyph}>♛</Text>
            <Text style={styles.wordmarkText}>VELA</Text>
          </View>
        </View>

        <View style={styles.carouselArea}>
          <OracleCarousel
            oracles={oracles}
            onIndexChange={setActiveOracleIndex}
            onEnter={handleEnter}
          />
        </View>

        <View style={styles.dots}>
          {oracles.map((oracle, index) => {
            const isActive = index === activeOracleIndex;
            return (
              <View
                key={oracle.id}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? oracle.accent : colors.borderSubtle,
                    width: isActive ? 18 : 6,
                  },
                ]}
              />
            );
          })}
        </View>

        <BottomNavigation active={activeTab} onChange={setActiveTab} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tintOverlay: {
    opacity: 0.14,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  wordmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5,5,5,0.45)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  wordmarkGlyph: {
    color: colors.gold,
    fontSize: 14,
  },
  wordmarkText: {
    ...typeScale.label,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  carouselArea: {
    flex: 1,
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
