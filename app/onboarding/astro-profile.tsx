import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typeScale } from '@/theme';
import { useAstroProfile } from '@/profile';

export default function AstroProfileOnboardingScreen() {
  const { setProfile, skipProfile } = useAstroProfile();

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);

  const isValid = useMemo(() => {
    const hasDate = /^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim());
    const hasPlace = birthPlace.trim().length >= 2;
    const hasValidTime =
      !birthTimeKnown || /^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime.trim());

    return hasDate && hasPlace && hasValidTime;
  }, [birthDate, birthPlace, birthTime, birthTimeKnown]);

  const handleContinue = async () => {
    if (!isValid) return;

    await setProfile({
      birthDate: birthDate.trim(),
      birthTime: birthTimeKnown ? birthTime.trim() : undefined,
      birthPlace: birthPlace.trim(),
      birthTimeKnown,
    });

    router.replace('/');
  };

  const handleSkip = async () => {
    await skipProfile();
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>VELA</Text>
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipText}>GEÇ</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Gökyüzünü sana göre okuyalım.</Text>
          <Text style={styles.subtitle}>
            Bu bilgiler tarot yorumlarını kişisel astrolojik bağlamla
            birleştirmek için kullanılacak.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>DOĞUM TARİHİ</Text>
            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1990-05-21"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>DOĞUM YERİ</Text>
            <TextInput
              value={birthPlace}
              onChangeText={setBirthPlace}
              placeholder="İstanbul, Türkiye"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeCopy}>
              <Text style={styles.label}>DOĞUM SAATİMİ BİLİYORUM</Text>
              <Text style={styles.helper}>
                Bilmiyorsan yükselen ve ev yerleşimlerini kullanmayız.
              </Text>
            </View>
            <Switch
              value={birthTimeKnown}
              onValueChange={setBirthTimeKnown}
            />
          </View>

          {birthTimeKnown ? (
            <View style={styles.field}>
              <Text style={styles.label}>DOĞUM SAATİ</Text>
              <TextInput
                value={birthTime}
                onChangeText={setBirthTime}
                placeholder="14:30"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.privacy}>
            Doğum bilgilerin yorumlarını kişiselleştirmek için kullanılacak.
          </Text>

          <Pressable
            onPress={handleContinue}
            disabled={!isValid}
            style={[
              styles.button,
              !isValid && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>DEVAM ET</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },

  header: {
    marginTop: spacing.lg,
  },

  skipText: {
    ...typeScale.label,
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },

  kicker: {
    ...typeScale.label,
    color: colors.gold,
    letterSpacing: 2.4,
  },

  title: {
    ...typeScale.displayLarge,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  subtitle: {
    ...typeScale.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },

  form: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },

  field: {
    gap: spacing.xs,
  },

  label: {
    ...typeScale.caption,
    color: colors.gold,
    letterSpacing: 1.2,
  },

  helper: {
    ...typeScale.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },

  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: 'rgba(255,255,255,0.035)',
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },

  timeCopy: {
    flex: 1,
  },

  footer: {
    marginTop: 'auto',
    gap: spacing.md,
  },

  privacy: {
    ...typeScale.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.magenta,
  },

  buttonDisabled: {
    opacity: 0.35,
  },

  buttonText: {
    ...typeScale.label,
    color: colors.textPrimary,
    letterSpacing: 1.4,
  },
});
