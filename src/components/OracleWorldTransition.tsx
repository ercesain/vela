import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { radius } from '@/theme';
import type { OracleProfile } from '@/types';
import type { OracleWorldConfig } from '@/data/oracleWorlds';
import { useLunaEnterSound } from '@/audio/lunaEnterSound';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OracleWorldTransitionProps {
  oracle: OracleProfile;
  config: OracleWorldConfig;
  sourceRect: Rect;
  onComplete: () => void;
}

// Total portal moment, including the takeover itself — within the
// 900-1200ms window. Phase boundaries below are the literal 0-200 /
// 200-800ms split from the brief, expressed as fractions of this total.
const TOTAL_DURATION = 1100;
const RECEDE_MS = 200;
const EXPAND_END_MS = 800;
const frac = (ms: number) => ms / TOTAL_DURATION;

const TARGET_SCALE = 1.8;
const TARGET_CENTER_X = SCREEN_WIDTH / 2;
const TARGET_CENTER_Y = SCREEN_HEIGHT * 0.4;

interface ParticleSpec {
  angle: number;
  distance: number;
  delay: number;
  size: number;
}

const PARTICLE_COUNT = 8;
const PARTICLES: ParticleSpec[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (Math.PI * 2 * i) / PARTICLE_COUNT + (i % 2 === 0 ? 0.18 : -0.18),
  distance: 66 + (i % 3) * 24,
  delay: 0.16 + i * 0.05,
  size: 9 + (i % 3) * 3,
}));

interface AppearStarSpec {
  top: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  size: number;
  delayFrac: number;
  peakOpacity: number;
}

// Sparse stars that fade in from darkness (static — distinct from the
// particles below, which drift toward the viewer).
const APPEAR_STARS: AppearStarSpec[] = [
  { top: '10%', left: '16%', size: 10, delayFrac: 0.16, peakOpacity: 0.6 },
  { top: '15%', right: '20%', size: 8, delayFrac: 0.24, peakOpacity: 0.55 },
  { top: '27%', left: '10%', size: 7, delayFrac: 0.32, peakOpacity: 0.5 },
  { top: '8%', left: '46%', size: 9, delayFrac: 0.2, peakOpacity: 0.6 },
  { top: '30%', right: '12%', size: 8, delayFrac: 0.38, peakOpacity: 0.5 },
];

interface HazeSpec {
  size: number;
  top?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
}

const HAZE_SPECS: HazeSpec[] = [
  { size: 260, top: '-10%', left: '-14%' },
  { size: 280, bottom: '-12%', right: '-16%' },
  { size: 220, top: '30%', right: '-18%' },
];

interface SilhouetteSpec {
  dx: number;
  dy: number;
  rotate: string;
  width: number;
  height: number;
}

// Faint tarot-back silhouettes drifting behind Luna — plain rounded
// rectangles, not real card art, kept near-invisible on purpose.
const TAROT_SILHOUETTES: SilhouetteSpec[] = [
  { dx: -104, dy: -8, rotate: '-9deg', width: 52, height: 80 },
  { dx: 98, dy: 16, rotate: '7deg', width: 48, height: 74 },
];

interface ArcSpec {
  dx: number;
  dy: number;
  rotate: string;
  length: number;
}

// Thin golden celestial arcs — brief flashes, not sustained shapes.
const GOLDEN_ARCS: ArcSpec[] = [
  { dx: -78, dy: -66, rotate: '-34deg', length: 84 },
  { dx: 84, dy: -46, rotate: '26deg', length: 66 },
  { dx: -18, dy: 96, rotate: '6deg', length: 96 },
];

function TransitionParticle({
  progress,
  spec,
  glyph,
  color,
}: {
  progress: SharedValue<number>;
  spec: ParticleSpec;
  glyph: string;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const local = interpolate(progress.value, [spec.delay, spec.delay + 0.36], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(local, [0, 0.3, 1], [0, 0.85, 0], Extrapolation.CLAMP);
    const dist = interpolate(local, [0, 1], [0, spec.distance], Extrapolation.CLAMP);
    const scale = interpolate(local, [0, 0.3, 1], [0.5, 1.15, 0.9], Extrapolation.CLAMP);
    const x = TARGET_CENTER_X + Math.cos(spec.angle) * dist - spec.size / 2;
    const y = TARGET_CENTER_Y + Math.sin(spec.angle) * dist - spec.size / 2;

    return {
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });

  return <Animated.Text style={[styles.particle, { fontSize: spec.size, color }, style]}>{glyph}</Animated.Text>;
}

function AppearingStar({ progress, spec }: { progress: SharedValue<number>; spec: AppearStarSpec }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [spec.delayFrac, spec.delayFrac + 0.3], [0, spec.peakOpacity], Extrapolation.CLAMP),
  }));

  return (
    <Animated.Text
      style={[styles.appearStar, { top: spec.top, left: spec.left, right: spec.right, fontSize: spec.size }, style]}
    >
      ⋆
    </Animated.Text>
  );
}

function TarotSilhouette({ progress, spec }: { progress: SharedValue<number>; spec: SilhouetteSpec }) {
  const style = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [frac(300), frac(900)], [0, 0.12], Extrapolation.CLAMP);
    const drift = interpolate(progress.value, [frac(300), 1], [8, -6], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [
        { translateX: TARGET_CENTER_X + spec.dx - spec.width / 2 },
        { translateY: TARGET_CENTER_Y + spec.dy - spec.height / 2 + drift },
        { rotate: spec.rotate },
      ],
    };
  });

  return <Animated.View style={[styles.silhouette, { width: spec.width, height: spec.height }, style]} />;
}

function GoldenArc({ progress, spec, color }: { progress: SharedValue<number>; spec: ArcSpec; color: string }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [frac(480), frac(620), frac(760)], [0, 0.55, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: TARGET_CENTER_X + spec.dx },
      { translateY: TARGET_CENTER_Y + spec.dy },
      { rotate: spec.rotate },
    ],
  }));

  return <Animated.View style={[styles.arc, { width: spec.length, backgroundColor: color }, style]} />;
}

/**
 * The Home carousel's "DÜNYASINA GİR" takeover: the active Oracle card
 * grows from wherever it currently sits in the coverflow into a full
 * cinematic portal moment, while the rest of the stage recedes into
 * darkness behind it. Purely additive on top of the Home screen — the
 * carousel itself is untouched.
 */
export function OracleWorldTransition({ oracle, config, sourceRect, onComplete }: OracleWorldTransitionProps) {
  const progress = useSharedValue(0);
  const { play } = useLunaEnterSound();

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    play();

    progress.value = withTiming(
      1,
      { duration: TOTAL_DURATION, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onComplete)();
      }
    );
    // Runs once per mount — this component is only ever mounted for the
    // duration of a single takeover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 0-200ms: the other 4 Oracles + all home chrome recede into darkness
  // behind this overlay. Continues deepening toward pitch black/plum
  // through the rest of the portal moment.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, frac(RECEDE_MS), frac(900)], [0, 0.8, 1], Extrapolation.CLAMP),
  }));

  const hazeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [frac(250), frac(800)], [0, 1], Extrapolation.CLAMP),
  }));

  const moonStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [frac(350), frac(800)], [0, 0.62], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [frac(350), frac(800)], [0.82, 1], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  // 200-800ms: Luna expands from her exact carousel position to fill the
  // viewport. Before 200ms she hasn't moved yet (recede phase); after
  // 800ms she holds while the rest of the portal finishes blooming.
  const cardStyle = useAnimatedStyle(() => {
    const tx = interpolate(
      progress.value,
      [frac(RECEDE_MS), frac(EXPAND_END_MS)],
      [sourceRect.x, TARGET_CENTER_X - sourceRect.width / 2],
      Extrapolation.CLAMP
    );
    const ty = interpolate(
      progress.value,
      [frac(RECEDE_MS), frac(EXPAND_END_MS)],
      [sourceRect.y, TARGET_CENTER_Y - sourceRect.height / 2],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      progress.value,
      [frac(RECEDE_MS), frac(EXPAND_END_MS)],
      [1, TARGET_SCALE],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
    };
  });

  // Frame/border dissolves partway through the expansion — "the same card
  // becoming the next scene", not a box that just happens to grow.
  const frameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [frac(RECEDE_MS), frac(500)], [1, 0], Extrapolation.CLAMP),
  }));

  // One restrained third-eye pulse, timed mid-expansion.
  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [frac(360), frac(560), frac(760)], [0, 0.9, 0], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [frac(360), frac(600)], [0.7, 1.35], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  const moonCenterY = TARGET_CENTER_Y - sourceRect.height * 0.55;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <LinearGradient
          colors={config.transitionBackground as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />

        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, hazeStyle]}>
          {HAZE_SPECS.map((spec, index) => (
            <View
              key={index}
              style={[
                styles.haze,
                {
                  width: spec.size,
                  height: spec.size,
                  borderRadius: spec.size / 2,
                  backgroundColor: config.hazeColors[index % config.hazeColors.length],
                  top: spec.top,
                  bottom: spec.bottom,
                  left: spec.left,
                  right: spec.right,
                },
              ]}
            />
          ))}
        </Animated.View>
      </Animated.View>

      {APPEAR_STARS.map((spec, index) => (
        <AppearingStar key={index} progress={progress} spec={spec} />
      ))}

      <Animated.Text
        pointerEvents="none"
        style={[styles.moon, { left: TARGET_CENTER_X - 65, top: moonCenterY - 65 }, moonStyle]}
      >
        ☾
      </Animated.Text>

      {TAROT_SILHOUETTES.map((spec, index) => (
        <TarotSilhouette key={index} progress={progress} spec={spec} />
      ))}

      {GOLDEN_ARCS.map((spec, index) => (
        <GoldenArc key={index} progress={progress} spec={spec} color={config.arcColor} />
      ))}

      <Animated.View style={[styles.card, { width: sourceRect.width, height: sourceRect.height }, cardStyle]}>
        <View style={styles.portraitClip}>
          <Image source={oracle.artwork} style={styles.portraitImage} resizeMode="cover" />
        </View>
        <Animated.View pointerEvents="none" style={[styles.glow, { backgroundColor: config.glowColor }, glowStyle]} />
        <Animated.View
          pointerEvents="none"
          style={[styles.portraitBorder, { borderColor: oracle.accent }, frameStyle]}
        />
      </Animated.View>

      {PARTICLES.map((spec, index) => (
        <TransitionParticle
          key={index}
          progress={progress}
          spec={spec}
          glyph={config.particleGlyphs[index % config.particleGlyphs.length]}
          color={config.particleColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  haze: {
    position: 'absolute',
    opacity: 0.2,
  },
  moon: {
    position: 'absolute',
    width: 130,
    height: 130,
    fontSize: 118,
    lineHeight: 130,
    textAlign: 'center',
    color: '#F4E9D5',
    includeFontPadding: false,
  },
  appearStar: {
    position: 'absolute',
    color: '#F7F2EA',
    includeFontPadding: false,
  },
  silhouette: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F7F2EA',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  arc: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 1.5,
    borderRadius: 1,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  portraitClip: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#150818',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  portraitBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  // Approximate third-eye position.
  glow: {
    position: 'absolute',
    top: '24%',
    left: '50%',
    width: 46,
    height: 46,
    borderRadius: 23,
    marginLeft: -23,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    includeFontPadding: false,
  },
});
