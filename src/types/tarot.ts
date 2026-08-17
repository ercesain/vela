export type TarotCardId = 'lovers' | 'moon' | 'star';

export interface TarotCardData {
  id: TarotCardId;
  title: string;
  subtitle?: string;
  keywords: string[];
  /**
   * Replaceable production artwork. Falls back to an illustrated
   * placeholder (glyph + gradient) when not provided.
   * Example future value: require('@/assets/tarot/lovers.webp')
   */
  artwork?: number;
  /** Accent color used for the card's glow / gradient / symbol. */
  accent: string;
}
