import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
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
  PrimaryButton,
  celestialPresets,
  type NavTabId,
} from '@/components';
import { oracles } from '@/data';
import { colors, spacing, typeScale } from '@/theme';
import { useAstroProfile } from '@/profile';
import { buildStageOrder } from '@/components/OracleCarousel';

const stageOracles = buildStageOrder(oracles);

export default function OracleSelectionScreen() {
  const { onboardingComplete, isHydrated } = useAstroProfile();

  const [activeTab, setActiveTab] = useState<NavTabId>('oracle');
  const [activeOracleIndex, setActiveOracleIndex] = useState(0);
  const [enteringWorld, setEnteringWorld] = useState(false);
  const indexProgress = useSharedValue(0);
  const enterOpacity = useSharedValue(0);

  useEffect(() => {
    if (isHydrated && !onboardingComplete) {
  router.replace('/onboarding/astro-profile' as Href);
}
  }, [isHydrated, onboardingComplete]);

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

  const enterOverlayStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
  }));

  if (!isHydrated || !onboardingComplete) {
  return <View style={styles.screen} />;
}

  const activeOracle = oracles[activeOracleIndex];
  const motifKey = `oracle-${activeOracle.id}`;
  const motifItems = celestialPresets[motifKey] ?? celestialPresets.home;
  const handleEnter = () => {
    if (enteringWorld) return;

    setEnteringWorld(true);
    enterOpacity.value = 0;
    enterOpacity.value = withTiming(1, { duration: 280 });

    setTimeout(() => {
      router.push({
        pathname: '/oracle/[id]/world',
        params: { id: activeOracle.id },
      });

      setTimeout(() => {
        enterOpacity.value = 0;
        setEnteringWorld(false);
      }, 250);
    }, 280);
  };

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
          <OracleCarousel oracles={oracles} onIndexChange={setActiveOracleIndex} />
        </View>

        <View key={activeOracle.id} style={styles.detail}>
          <Text style={styles.oracleName} numberOfLines={1}>
            {activeOracle.name}
          </Text>
          <Text style={[styles.specialty, { color: activeOracle.accent }]} numberOfLines={2}>
            {activeOracle.specialty}
          </Text>
          <PrimaryButton
            label="DÜNYASINA GİR"
            variant="magenta"
            onPress={handleEnter}
            disabled={enteringWorld}
            style={styles.enterButton}
          />
        </View>

        <View style={styles.dots}>
          {stageOracles.map((oracle) => {
            const isActive = oracle.id === activeOracle.id;
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

      {enteringWorld ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.enterOverlay, enterOverlayStyle]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  enterOverlay: {
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
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
  // The coverflow stage is the main visual area: it claims the flexible
  // space between the header and the (fixed-height) name/CTA/pagination
  // block below, and centers itself within that space.
  carouselArea: {
    flex: 1,
    justifyContent: 'center',
  },
  detail: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  oracleName: {
    ...typeScale.displaySmall,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  specialty: {
    ...typeScale.label,
    textAlign: 'center',
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  enterButton: {
    width: 220,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
