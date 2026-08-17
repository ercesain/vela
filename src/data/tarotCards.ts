import { colors } from '@/theme';
import type { TarotCardData } from '@/types';

/**
 * Mock tarot deck. `artwork` is intentionally left undefined so
 * <TarotCard /> renders an illustrated placeholder (symbol + gradient).
 * Replace by adding e.g. artwork: require('@/assets/tarot/lovers.webp').
 */
export const tarotCards: TarotCardData[] = [
  {
    id: 'lovers',
    title: 'AŞIKLAR',
    subtitle: 'The Lovers',
    keywords: ['Çekim', 'Bağ', 'Seçim'],
    accent: colors.magenta,
  },
  {
    id: 'moon',
    title: 'AY',
    subtitle: 'The Moon',
    keywords: ['Belirsizlik', 'Sezgi', 'Gizli Duygular'],
    accent: colors.purple,
  },
  {
    id: 'star',
    title: 'YILDIZ',
    subtitle: 'The Star',
    keywords: ['Umut', 'Yenilenme', 'Yön'],
    accent: colors.gold,
  },
];

export const getTarotCardById = (id: string) => tarotCards.find((card) => card.id === id);
