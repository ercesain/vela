/**
 * VELA color tokens.
 * Centralized palette — never hardcode these hex values inside components.
 *
 * VELA's UI system is neutral-first: black / warm cream / soft gold /
 * dark surfaces carry the app. Magenta, deep purple and orange are
 * ACCENTS only — used sparingly (a dot, a border, one CTA), never as the
 * dominant tone of a whole screen. Individual Oracle "worlds" bring their
 * own accent identity later; the shell stays neutral.
 */
export const colors = {
  // ---- base (neutral) ----
  background: '#050505',
  surface: '#121116',
  surfaceElevated: '#1A1720',

  cream: '#F4E9D5',
  creamMuted: '#E8DCC2',

  gold: '#D9B36C',

  // ---- accents (use sparingly) ----
  magenta: '#F51C92',
  magentaMuted: '#B81570',

  deepPurple: '#2A0C3C',
  purple: '#7115A8',

  orange: '#FF552A',

  textPrimary: '#F7F2EA',
  textSecondary: '#B8AFB8',
  textOnCream: '#241726',
  textOnCreamMuted: '#5A4A5C',

  borderSubtle: 'rgba(255,255,255,0.10)',
  borderOnCream: 'rgba(36,23,38,0.12)',

  overlayScrim: 'rgba(5,5,5,0.55)',
  white: '#FFFFFF',
  black: '#000000',

  success: '#3ED598',
} as const;

export type ColorToken = keyof typeof colors;
