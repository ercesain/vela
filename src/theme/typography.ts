/**
 * VELA typography system.
 *
 * Two personalities:
 *  - display: mystical editorial serif — Cormorant Garamond (loaded via
 *    @expo-google-fonts/cormorant-garamond). Used for the wordmark, screen
 *    titles, and major reading titles.
 *  - ui: clean modern sans — Manrope (loaded via @expo-google-fonts/manrope).
 *    Used for buttons, descriptions, chat and labels.
 */
export const fontFamily = {
  displayRegular: 'CormorantGaramond_500Medium',
  displaySemiBold: 'CormorantGaramond_600SemiBold',
  displayBold: 'CormorantGaramond_700Bold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',

  uiRegular: 'Manrope_400Regular',
  uiMedium: 'Manrope_500Medium',
  uiSemiBold: 'Manrope_600SemiBold',
  uiBold: 'Manrope_700Bold',
  uiExtraBold: 'Manrope_800ExtraBold',
} as const;

export const fontsToLoad = {
  CormorantGaramond_500Medium: require('@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf'),
  CormorantGaramond_600SemiBold: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
  CormorantGaramond_700Bold: require('@expo-google-fonts/cormorant-garamond/700Bold/CormorantGaramond_700Bold.ttf'),
  CormorantGaramond_500Medium_Italic: require('@expo-google-fonts/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf'),

  Manrope_400Regular: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
  Manrope_500Medium: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
  Manrope_800ExtraBold: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
};

export const typeScale = {
  wordmark: { fontFamily: fontFamily.displaySemiBold, fontSize: 20, lineHeight: 24, letterSpacing: 3 },

  displayXL: { fontFamily: fontFamily.displayBold, fontSize: 56, lineHeight: 58 },
  displayLarge: { fontFamily: fontFamily.displayBold, fontSize: 40, lineHeight: 44 },
  displayMedium: { fontFamily: fontFamily.displaySemiBold, fontSize: 30, lineHeight: 36 },
  displaySmall: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, lineHeight: 30 },

  screenTitle: { fontFamily: fontFamily.uiExtraBold, fontSize: 26, lineHeight: 32, letterSpacing: 0.5 },
  cardTitle: { fontFamily: fontFamily.uiExtraBold, fontSize: 15, lineHeight: 20, letterSpacing: 1.5 },

  bodyLarge: { fontFamily: fontFamily.uiMedium, fontSize: 17, lineHeight: 25 },
  body: { fontFamily: fontFamily.uiRegular, fontSize: 15, lineHeight: 22 },
  bodyItalic: { fontFamily: fontFamily.displayItalic, fontSize: 18, lineHeight: 26 },

  label: { fontFamily: fontFamily.uiSemiBold, fontSize: 13, lineHeight: 18, letterSpacing: 0.6 },
  caption: { fontFamily: fontFamily.uiMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },

  button: { fontFamily: fontFamily.uiBold, fontSize: 16, lineHeight: 20, letterSpacing: 0.3 },
} as const;

export type TypeScaleToken = keyof typeof typeScale;
