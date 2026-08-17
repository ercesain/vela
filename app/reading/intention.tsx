import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DecorativeOccultBackground, IconButton, PrimaryButton, TarotCardFan } from '@/components';
import { tarotCards } from '@/data';
import { colors, radius, spacing, typeScale } from '@/theme';
import type { TarotCardId } from '@/types';

export default function IntentionScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [selectedCards, setSelectedCards] = useState<TarotCardId[]>([]);

  const isComplete = selectedCards.length === tarotCards.length;

  const handleContinue = () => {
    router.push({
      pathname: '/reading/result',
      params: { cards: selectedCards.join(','), mode: mode ?? 'quick-look' },
    });
  };

  return (
    <View style={styles.screen}>
      <DecorativeOccultBackground />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton glyph="‹" tone="onCream" onPress={() => router.back()} />
          <IconButton glyph="i" tone="onCream" />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>✦  V E L A  ✦</Text>
          <Text style={styles.title}>NİYETİNİ SEÇ</Text>
          <Text style={styles.subtitle}>{'Sezgine güven.\nSeni en çok çağıran kartı seç.'}</Text>
        </View>

        <TarotCardFan cards={tarotCards} onSelectionChange={setSelectedCards} />

        <View style={styles.hintChip}>
          <Text style={styles.hint}>
            {isComplete ? 'Kartların açığa çıktı ✦' : 'Kartlara dokun ve enerjini seç'}
          </Text>
        </View>

        <View style={styles.ctaSlot}>
          {isComplete ? (
            <Animated.View entering={FadeInUp.duration(420)}>
              <PrimaryButton label="YORUMU GÖR" variant="magenta" onPress={handleContinue} />
            </Animated.View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  titleBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  eyebrow: {
    ...typeScale.caption,
    color: colors.magenta,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typeScale.screenTitle,
    color: colors.textOnCream,
    letterSpacing: 1,
  },
  subtitle: {
    ...typeScale.body,
    color: colors.textOnCreamMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  hintChip: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(246,237,219,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderOnCream,
  },
  hint: {
    ...typeScale.caption,
    color: colors.textOnCreamMuted,
    textAlign: 'center',
  },
  ctaSlot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    minHeight: 76,
    justifyContent: 'flex-end',
  },
});
