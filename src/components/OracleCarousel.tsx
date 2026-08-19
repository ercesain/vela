import { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { colors, radius } from '@/theme';
import type { OracleProfile } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Portrait-first card geometry: larger and taller so the character owns the
// home stage instead of floating inside a small square-ish card.
const CARD_WIDTH = Math.round(Math.min(SCREEN_WIDTH * 0.56, 270));
const CARD_ASPECT = 0.60; // width / height
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT);

export const ORACLE_STAGE_HEIGHT = CARD_HEIGHT;
export const ORACLE_CARD_WIDTH = CARD_WIDTH;

// Keep the proven 5-card coverflow geometry. Only the card box itself is taller.
const DISTANCE_STEPS = [-2, -1, 0, 1, 2];
const X_OUTPUT = [-0.44, -0.28, 0, 0.28, 0.44].map((f) => f * SCREEN_WIDTH);
const SCALE_OUTPUT = [0.66, 0.82, 1, 0.82, 0.66];
const OPACITY_OUTPUT = [0.72, 0.86, 1, 0.86, 0.72];
const Z_BY_ABS_DISTANCE = [50, 40, 30];

const DRAG_FOLLOW_FACTOR = 0.35;
const MAX_DRAG = SCREEN_WIDTH * 0.22;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.16;
const TRANSITION_DURATION = 340;

function circularDistance(pos: number, active: number, total: number) {
  let raw = pos - active;
  const half = total / 2;
  if (raw > half) raw -= total;
  if (raw < -half) raw += total;
  return raw;
}

export function buildStageOrder(list: OracleProfile[]): OracleProfile[] {
  if (list.length !== 5) return list;
  return [list[0], list[1], list[2], list[4], list[3]];
}

interface OracleCarouselProps {
  oracles: OracleProfile[];
  onIndexChange?: (index: number) => void;
}

interface StageCardProps {
  oracle: OracleProfile;
  targetDistance: number;
  isActive: boolean;
  dragX: SharedValue<number>;
  onSelect: () => void;
}

function OracleStageCard({
  oracle,
  targetDistance,
  isActive,
  dragX,
  onSelect,
}: StageCardProps) {
  const distance = useSharedValue(targetDistance);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      distance.value = targetDistance;
      return;
    }

    distance.value = withTiming(targetDistance, {
      duration: TRANSITION_DURATION,
    });
  }, [targetDistance]);

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      distance.value,
      DISTANCE_STEPS,
      SCALE_OUTPUT,
      Extrapolation.CLAMP,
    );
    const x = interpolate(
      distance.value,
      DISTANCE_STEPS,
      X_OUTPUT,
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      distance.value,
      DISTANCE_STEPS,
      OPACITY_OUTPUT,
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateX: x + dragX.value }, { scale }],
    };
  });

  const zIndex =
    Z_BY_ABS_DISTANCE[
      Math.min(2, Math.round(Math.abs(targetDistance)))
    ];

  return (
    <Animated.View style={[styles.card, { zIndex }, cardStyle]}>
      <Pressable
        onPress={onSelect}
        disabled={isActive}
        style={StyleSheet.absoluteFill}
      >
        <View
          style={[
            styles.portraitFrame,
            {
              borderColor: isActive
                ? oracle.accent
                : colors.borderSubtle,
            },
          ]}
        >
          <Image
            source={oracle.artwork}
            style={[
              styles.portraitImage,
              oracle.id === 'luna' && styles.lunaPortraitFocus,
            ]}
            resizeMode="cover"
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * 5-card circular coverflow.
 * Luna starts centered; two Oracles remain visible on each side.
 * The geometry/gesture behavior is preserved from the working version —
 * only the cards are now portrait-oriented and visually larger.
 */
export function OracleCarousel({
  oracles,
  onIndexChange,
}: OracleCarouselProps) {
  const stageOracles = useRef(buildStageOrder(oracles)).current;
  const total = stageOracles.length;
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const dragX = useSharedValue(0);

  const changeActive = (nextStageIndex: number) => {
    const wrapped = ((nextStageIndex % total) + total) % total;

    if (wrapped === activeStageIndex) return;

    Haptics.selectionAsync();
    setActiveStageIndex(wrapped);
  };

  useEffect(() => {
    const activeOracle = stageOracles[activeStageIndex];
    const originalIndex = oracles.findIndex(
      (oracle) => oracle.id === activeOracle.id,
    );

    onIndexChange?.(originalIndex === -1 ? 0 : originalIndex);
  }, [activeStageIndex, onIndexChange, oracles, stageOracles]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      dragX.value = Math.max(
        -MAX_DRAG,
        Math.min(
          MAX_DRAG,
          event.translationX * DRAG_FOLLOW_FACTOR,
        ),
      );
    })
    .onEnd((event) => {
      dragX.value = withTiming(0, { duration: 260 });

      if (event.translationX <= -SWIPE_THRESHOLD) {
        runOnJS(changeActive)(activeStageIndex + 1);
      } else if (event.translationX >= SWIPE_THRESHOLD) {
        runOnJS(changeActive)(activeStageIndex - 1);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.stage}>
        {stageOracles.map((oracle, stageIndex) => (
          <OracleStageCard
            key={oracle.id}
            oracle={oracle}
            targetDistance={circularDistance(
              stageIndex,
              activeStageIndex,
              total,
            )}
            isActive={stageIndex === activeStageIndex}
            dragX={dragX}
            onSelect={() => changeActive(stageIndex)}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: ORACLE_STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -CARD_WIDTH / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },

  portraitFrame: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },

  portraitImage: {
    width: '100%',
    height: '100%',
  },

  lunaPortraitFocus: {
    transform: [
      { scale: 1.04 },
      { translateX: -CARD_WIDTH * 0.035 },
      { translateY: CARD_HEIGHT * 0.02 },
    ],
  },
});
