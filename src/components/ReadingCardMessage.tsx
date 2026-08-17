import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typeScale } from '@/theme';
import type { TarotCardData } from '@/types';
import { TarotCard } from './TarotCard';

interface ReadingCardMessageProps {
  card: TarotCardData;
  interpretation: string;
  timestamp?: string;
}

/**
 * A tarot card drawn directly into the conversation, paired with Luna's
 * interpretation. This is the visual centerpiece of the reading screen —
 * the card itself carries the moment, not a chat bubble.
 */
export function ReadingCardMessage({ card, interpretation, timestamp }: ReadingCardMessageProps) {
  return (
    <View style={styles.container}>
      <TarotCard card={card} size="inline" selected />
      <View style={styles.textCol}>
        <View style={styles.interpretationCard}>
          <Text style={styles.interpretation}>{interpretation}</Text>
        </View>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    maxWidth: '100%',
  },
  textCol: {
    flex: 1,
    paddingTop: spacing.xxs,
  },
  interpretationCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  interpretation: {
    ...typeScale.body,
    color: colors.textPrimary,
  },
  timestamp: {
    ...typeScale.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginLeft: spacing.xs,
  },
});
