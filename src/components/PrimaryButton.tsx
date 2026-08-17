import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typeScale } from '@/theme';

export type PrimaryButtonVariant = 'magenta' | 'purple' | 'cream';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  variant?: PrimaryButtonVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

const variantStyles: Record<
  PrimaryButtonVariant,
  { background: string; textColor: string; borderColor?: string }
> = {
  magenta: { background: colors.magenta, textColor: colors.textPrimary },
  purple: { background: colors.deepPurple, textColor: colors.textPrimary, borderColor: colors.borderSubtle },
  cream: { background: colors.cream, textColor: colors.textOnCream },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Large, rounded, high-confidence call-to-action. Used for the dominant
 * actions on the Oracle Home screen and the "YORUMU GÖR" CTA.
 */
export function PrimaryButton({
  label,
  onPress,
  variant = 'magenta',
  icon,
  style,
  disabled,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const { background, textColor, borderColor } = variantStyles[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 90 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 140 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.base,
        { backgroundColor: background, borderColor: borderColor ?? 'transparent' },
        borderColor ? styles.bordered : null,
        disabled ? styles.disabled : null,
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typeScale.button,
    textAlign: 'center',
  },
  icon: {
    marginLeft: spacing.xxs,
  },
  disabled: {
    opacity: 0.5,
  },
});
