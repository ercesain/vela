import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typeScale } from '@/theme';

export type SecondaryButtonTone = 'onDark' | 'onCream';

interface SecondaryButtonProps {
  label: string;
  onPress?: () => void;
  tone?: SecondaryButtonTone;
  accentColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Lightweight pill "chip" action — outlined, transparent background.
 * Used for secondary reading actions ("DEVAM ET", "BİR KART DAHA ÇEK")
 * and inline quick-reply style affordances.
 */
export function SecondaryButton({
  label,
  onPress,
  tone = 'onDark',
  accentColor,
  style,
  disabled,
}: SecondaryButtonProps) {
  const scale = useSharedValue(1);
  const borderColor = accentColor ?? (tone === 'onDark' ? colors.borderSubtle : colors.borderOnCream);
  const textColor = accentColor ?? (tone === 'onDark' ? colors.textPrimary : colors.textOnCream);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => (scale.value = withTiming(0.96, { duration: 90 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 140 }))}
      disabled={disabled}
      style={[
        styles.base,
        { borderColor },
        disabled ? styles.disabled : null,
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typeScale.label,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.5,
  },
});
