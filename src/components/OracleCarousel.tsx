import React, { useRef, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { PrimaryButton } from './PrimaryButton';
import { colors, radius, spacing, typeScale } from '@/theme';
import type { OracleProfile } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Small base footprint — the center card is scaled up ~1.6x to dominate,
// while a tight stride keeps two Oracles legible on each side at once.
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.26);
const CARD_ASPECT = 0.78; // width / height
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT);
// Cards overlap their neighbors so all 5 read as one continuous stage
// rather than separate pages. Each "slide" lane is STRIDE-wide (narrower
// than the card itself) and the oversized card is centered within it —
// this keeps the scrollable content's total width equal to n * STRIDE, so
// snap targets for every index (including the first/last) are actually
// reachable. (A negative marginRight trick was tried instead but shrinks
// total content width below the last index's target, permanently
// clipping its scale/opacity/detail peak — see PROBLEM_SOLVING notes.)
const STRIDE = Math.round(CARD_WIDTH * 0.68);
const SIDE_INSET = SCREEN_WIDTH / 2 - STRIDE / 2;
const MAX_SCALE = 1.6;
// Comfortable, constant-size footprint for the specialty + CTA — these do
// NOT scale with the tiny portrait card, so "DÜNYASINA GİR" never wraps.
const DETAIL_WIDTH = 200;
// Cleared below the portrait's largest (scaled-up, center) visual extent.
const DETAIL_TOP = Math.round(CARD_HEIGHT * (1 + (MAX_SCALE - 1) / 2)) + spacing.sm;
export const ORACLE_STAGE_HEIGHT = DETAIL_TOP + 110;

interface OracleCarouselProps {
  oracles: OracleProfile[];
  onIndexChange?: (index: number) => void;
  onEnter?: (oracle: OracleProfile) => void;
}

interface SlideProps {
  oracle: OracleProfile;
  index: number;
  scrollX: SharedValue<number>;
  isActive: boolean;
  zIndex: number;
  onSelect: (index: number) => void;
  onEnter: (oracle: OracleProfile) => void;
}

function OracleStageCard({ oracle, index, scrollX, isActive, zIndex, onSelect, onEnter }: SlideProps) {
  // Wide falloff — the portrait + name read across roughly ±2 cards, so
  // all 5 Oracles stay visually present at once.
  const wideRange = [-2, -1, 0, 1, 2].map((d) => (index + d) * STRIDE);
  // Narrow falloff — the specialty line + CTA only surface near dead
  // center, keeping the "dominant" Oracle unambiguous.
  const detailRange = [index * STRIDE - STRIDE * 0.35, index * STRIDE, index * STRIDE + STRIDE * 0.35];

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, wideRange, [0.52, 0.82, MAX_SCALE, 0.82, 0.52], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, wideRange, [0.35, 0.72, 1, 0.72, 0.35], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, wideRange, [20, 9, 0, 9, 20], Extrapolation.CLAMP);
    const rotateY = interpolate(scrollX.value, wideRange, [14, 8, 0, -8, -14], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [
        { perspective: 900 },
        { translateY },
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  const detailStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, detailRange, [0, 1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.slide, { zIndex }]}>
      <Animated.View style={[styles.column, cardStyle]}>
        <Pressable onPress={() => onSelect(index)} disabled={isActive}>
          <View style={[styles.portraitFrame, { borderColor: isActive ? oracle.accent : colors.borderSubtle }]}>
            <Image source={oracle.artwork} style={styles.portraitImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(10,6,12,0.88)']}
              locations={[0.45, 1]}
              style={styles.portraitFade}
            />
            <Text style={styles.portraitName} numberOfLines={1}>
              {oracle.name}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Specialty + CTA live outside the scaled column at a constant,
          comfortable width so the button text never wraps. Positioned
          relative to the slide's own (STRIDE-wide) center, not the wider
          card, since the card is centered within the slide. */}
      <Animated.View style={[styles.detail, detailStyle]} pointerEvents={isActive ? 'auto' : 'none'}>
        <Text style={[styles.specialty, { color: oracle.accent }]} numberOfLines={2}>
          {oracle.specialty}
        </Text>
        <PrimaryButton
          label="DÜNYASINA GİR"
          variant="magenta"
          disabled={!isActive}
          onPress={() => onEnter(oracle)}
        />
      </Animated.View>
    </View>
  );
}

/**
 * A continuous horizontal stage of all 5 Oracles: the centered Oracle
 * reads large and dominant with its specialty + CTA, while two Oracles
 * peek in on each side at reduced scale/opacity with a slight inward
 * (perspective) tilt, so the whole row feels like one world rather than
 * isolated pages.
 */
export function OracleCarousel({ oracles, onIndexChange, onEnter }: OracleCarouselProps) {
  const scrollX = useSharedValue(0);
  const lastIndex = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const registerIndexChange = (index: number) => {
    setActiveIndex(index);
    onIndexChange?.(index);
    Haptics.selectionAsync();
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const nextIndex = Math.round(event.contentOffset.x / STRIDE);
      const clamped = Math.max(0, Math.min(oracles.length - 1, nextIndex));
      if (clamped !== lastIndex.value) {
        lastIndex.value = clamped;
        runOnJS(registerIndexChange)(clamped);
      }
    },
  });

  const handleSelect = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * STRIDE, animated: true });
  };

  const handleEnter = (oracle: OracleProfile) => {
    onEnter?.(oracle);
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={STRIDE}
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: SIDE_INSET }}
      scrollEventThrottle={16}
      onScroll={scrollHandler}
      style={styles.scrollView}
    >
      {oracles.map((oracle, index) => (
        <OracleStageCard
          key={oracle.id}
          oracle={oracle}
          index={index}
          scrollX={scrollX}
          isActive={index === activeIndex}
          zIndex={100 - Math.abs(index - activeIndex) * 10}
          onSelect={handleSelect}
          onEnter={handleEnter}
        />
      ))}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    height: ORACLE_STAGE_HEIGHT,
  },
  slide: {
    width: STRIDE,
    height: ORACLE_STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  column: {
    width: CARD_WIDTH,
  },
  portraitFrame: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.deepPurple,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  portraitFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
  },
  portraitName: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.xs,
    right: spacing.xs,
    ...typeScale.displaySmall,
    fontSize: 20,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  detail: {
    position: 'absolute',
    top: DETAIL_TOP,
    left: STRIDE / 2 - DETAIL_WIDTH / 2,
    width: DETAIL_WIDTH,
    alignItems: 'center',
  },
  specialty: {
    ...typeScale.label,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
