import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typeScale } from '@/theme';

export type NavTabId = 'oracle' | 'gunluk' | 'ritueller' | 'profil';

const TABS: { id: NavTabId; label: string; glyph: string }[] = [
  { id: 'oracle', label: 'Oracle', glyph: '✦' },
  { id: 'gunluk', label: 'Günlük', glyph: '☾' },
  { id: 'ritueller', label: 'Ritüeller', glyph: '✧' },
  { id: 'profil', label: 'Profil', glyph: '◐' },
];

interface BottomNavigationProps {
  active: NavTabId;
  onChange?: (tab: NavTabId) => void;
}

/**
 * Bottom tab bar. Only the "Oracle" destination is implemented in this
 * prototype; other tabs are presentational placeholders for now.
 */
export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => {
              Haptics.selectionAsync();
              onChange?.(tab.id);
            }}
          >
            <Text style={[styles.glyph, { color: isActive ? colors.magenta : colors.textSecondary }]}>
              {tab.glyph}
            </Text>
            <Text style={[styles.label, { color: isActive ? colors.textPrimary : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glyph: {
    fontSize: 18,
  },
  label: {
    ...typeScale.caption,
  },
});
