import { colors } from '@/theme';
import type { OracleId } from '@/types';

export interface OracleWorldChoice {
  id: string;
  label: string;
  glyph: string;
}

/**
 * Per-Oracle "world" identity: the takeover transition's palette/motif and
 * the welcome screen's copy + first-choice prompts. Only Luna is filled in
 * today — later Oracles get their own signature transition (Nyx: veil/
 * shadow, Sol: sun rays, Astra: constellation geometry, Merc: signal/
 * streaks) by adding another entry here, not by branching the transition
 * or screen components themselves.
 */
export interface OracleWorldConfig {
  id: OracleId;
  /** Brief, mostly-dark flash used behind the takeover transition. */
  transitionBackground: string[];
  /** Persistent background for the world welcome screen — stays dark. */
  worldBackground: string[];
  glowColor: string;
  horizonGlowColor: string;
  /** Restrained corner/edge haze during the portal moment — 3 low-opacity accents. */
  hazeColors: [string, string, string];
  /** Thin celestial line/arc accents that briefly flash during the portal moment. */
  arcColor: string;
  particleColor: string;
  particleGlyphs: string[];
  title: string;
  subtitle: string;
  choices: OracleWorldChoice[];
}

export const oracleWorldConfigs: Partial<Record<OracleId, OracleWorldConfig>> = {
  luna: {
    id: 'luna',
    transitionBackground: [colors.background, colors.deepPurple],
    worldBackground: [colors.background, colors.deepPurple, '#170A22'],
    glowColor: colors.magenta,
    horizonGlowColor: colors.orange,
    hazeColors: [colors.purple, colors.magentaMuted, colors.orange],
    arcColor: colors.gold,
    particleColor: colors.cream,
    particleGlyphs: ['✦', '✧', '⋆'],
    title: 'LUNA',
    subtitle: 'Kartlar seni hangi gerçeğe çağırıyor?',
    choices: [
      { id: 'ask', label: 'Aşk', glyph: '♡' },
      { id: 'baglanti', label: 'Bağlantı', glyph: '∞' },
      { id: 'kendi-sorun', label: 'Kendi Sorun', glyph: '✦' },
    ],
  },
};

export function getOracleWorldConfig(id: string): OracleWorldConfig | undefined {
  return oracleWorldConfigs[id as OracleId];
}
