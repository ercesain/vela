import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typeScale } from '@/theme';
import type { ReadingMessageRole } from '@/types';

interface ReadingBubbleProps {
  role: ReadingMessageRole;
  text: string;
  timestamp?: string;
}

/**
 * A single reading message. Deliberately avoids a generic chat-bubble
 * look: oracle messages float on the mystical backdrop with a soft
 * gold accent rule, user messages sit in a warm magenta-tinted pill.
 */
export function ReadingBubble({ role, text, timestamp }: ReadingBubbleProps) {
  const isOracle = role === 'oracle';

  return (
    <View style={[styles.row, isOracle ? styles.rowLeft : styles.rowRight]}>
      <View
        style={[
          styles.bubble,
          isOracle ? styles.oracleBubble : styles.userBubble,
        ]}
      >
        <Text style={[styles.text, { color: isOracle ? colors.textPrimary : colors.textPrimary }]}>{text}</Text>
      </View>
      {timestamp ? (
        <Text style={[styles.timestamp, isOracle ? styles.timestampLeft : styles.timestampRight]}>{timestamp}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
    maxWidth: '86%',
  },
  rowLeft: {
    alignSelf: 'flex-start',
  },
  rowRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  oracleBubble: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    borderTopLeftRadius: radius.sm,
  },
  userBubble: {
    backgroundColor: colors.magentaMuted,
    borderTopRightRadius: radius.sm,
  },
  text: {
    ...typeScale.body,
  },
  timestamp: {
    ...typeScale.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  timestampLeft: {
    marginLeft: spacing.xs,
  },
  timestampRight: {
    marginRight: spacing.xs,
    textAlign: 'right',
  },
});
