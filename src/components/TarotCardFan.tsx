import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { spacing } from '@/theme';
import type { TarotCardData, TarotCardId } from '@/types';
import { IllustratedTarotCard } from './IllustratedTarotCard';

interface TarotCardFanProps {
  cards: TarotCardData[];
  onSelectionChange?: (selected: TarotCardId[]) => void;
  onComplete?: (selected: TarotCardId[]) => void;
}

/**
 * Visual dressing for the "Niyetini Seç" draw — a short intention label and
 * illustrated artwork per card. Local to the fan since it's the only
 * consumer; the underlying `tarotCards` data stays generic for reuse
 * elsewhere (e.g. the reading screen).
 */
const CARD_ART: Record<TarotCardId, { artwork: number; label: string }> = {
  lovers: { artwork: require('../../assets/tarot/lovers.png'), label: 'AŞK' },
  moon: { artwork: require('../../assets/tarot/moon.png'), label: 'SEZGİ' },
  star: { artwork: require('../../assets/tarot/star.png'), label: 'GELECEK' },
};

const FAN_ROTATIONS = [-11, 0, 11];
const FAN_OFFSETS_X = [-78, 0, 78];
const FAN_OFFSETS_Y = [22, -14, 22];

interface FanCardProps {
  card: TarotCardData;
  index: number;
  isSelected: boolean;
  hasSelectionStarted: boolean;
  onPress: (id: TarotCardId) => void;
}

function FanCard({ card, index, isSelected, hasSelectionStarted, onPress }: FanCardProps) {
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const recede = !isSelected && hasSelectionStarted;
    lift.value = withSpring(isSelected ? -16 : 0, { damping: 14, stiffness: 160 });
    scale.value = withSpring(isSelected ? 1.06 : recede ? 0.94 : 1, { damping: 14, stiffness: 160 });
    opacity.value = withTiming(recede ? 0.6 : 1, { duration: 220 });
  }, [isSelected, hasSelectionStarted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: FAN_OFFSETS_X[index] },
      { translateY: FAN_OFFSETS_Y[index] + lift.value },
      { rotate: `${FAN_ROTATIONS[index]}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: isSelected ? 10 : index,
  }));

  const art = CARD_ART[card.id];

  return (
    <Animated.View style={[styles.fanCardSlot, animatedStyle]}>
      <Pressable onPress={() => onPress(card.id)} disabled={isSelected} hitSlop={8}>
        <IllustratedTarotCard
          artwork={art.artwork}
          label={art.label}
          accentColor={card.accent}
          size="fan"
          selected={isSelected}
        />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Three overlapping, fanned tarot cards. Tapping a card lifts, scales and
 * glows it while the others dim slightly, drawing focus forward. Cards are
 * selected one at a time until all three have been drawn.
 */
export function TarotCardFan({ cards, onSelectionChange, onComplete }: TarotCardFanProps) {
  const [selected, setSelected] = useState<TarotCardId[]>([]);

  const handlePress = (id: TarotCardId) => {
    if (selected.includes(id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = [...selected, id];
    setSelected(next);
    onSelectionChange?.(next);
    if (next.length === cards.length) {
      onComplete?.(next);
    }
  };

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <FanCard
          key={card.id}
          card={card}
          index={index}
          isSelected={selected.includes(card.id)}
          hasSelectionStarted={selected.length > 0}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  fanCardSlot: {
    position: 'absolute',
  },
});
