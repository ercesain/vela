import { colors } from '@/theme';
import type { OracleProfile } from '@/types';

/**
 * Only Luna has final production art today (`assets/characters/luna.png`).
 * The rest use illustrated placeholders at the same path convention —
 * swap the file in place when real art is ready, no code changes needed.
 */
export const oracles: OracleProfile[] = [
  {
    id: 'luna',
    name: 'Luna',
    specialty: 'Aşk • İlişkiler • Duygusal Bağ',
    accent: colors.magenta,
    artwork: require('../../assets/characters/luna.png'),
  },
  {
    id: 'nyx',
    name: 'Nyx',
    specialty: 'Belirsizlik • İç Ses • Gizlenenler',
    // NOTE: colors.deepPurple is a base/surface token, too dark to read as
    // text — colors.purple is the legible accent for Nyx's world.
    accent: colors.purple,
    artwork: require('../../assets/characters/nyx.png'),
  },
  {
    id: 'sol',
    name: 'Sol',
    specialty: 'Kariyer • Para • Cesaret',
    accent: colors.orange,
    artwork: require('../../assets/characters/sol.png'),
  },
  {
    id: 'astra',
    name: 'Astra',
    specialty: 'Yol • Gelecek • Büyük Kararlar',
    accent: colors.gold,
    artwork: require('../../assets/characters/astra.png'),
  },
  {
    id: 'merc',
    name: 'Merc',
    specialty: 'İletişim • Flört • Mesajlar',
    accent: colors.magentaMuted,
    artwork: require('../../assets/characters/merc.png'),
  },
];

export const getOracleById = (id: string) => oracles.find((oracle) => oracle.id === id);
