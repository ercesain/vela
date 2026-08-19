import type { CurrentSkyProvider } from './currentSkyProvider';
import type { CurrentSkySnapshot } from './types';

/**
 * Development-only provider.
 * Gerçek ephemeris bağlanana kadar AstroContext akışını güvenli biçimde test eder.
 * Production'da kullanılmamalı.
 */
export const mockCurrentSkyProvider: CurrentSkyProvider = {
  async getCurrentSky(): Promise<CurrentSkySnapshot> {
    return {
      calculatedAt: new Date().toISOString(),

      mercury: {
        planet: 'mercury',
        sign: 'leo',
        degree: 12.4,
        retrograde: true,
      },

      venus: {
        planet: 'venus',
        sign: 'virgo',
        degree: 3.1,
        retrograde: false,
      },

      mars: {
        planet: 'mars',
        sign: 'gemini',
        degree: 18.7,
        retrograde: false,
      },

      moon: {
        planet: 'moon',
        sign: 'scorpio',
        degree: 8.2,
      },

      moonPhase: 'waxing-crescent',

      transits: [
        {
          transitPlanet: 'saturn',
          aspect: 'square',
          natalPlanet: 'venus',
          orb: 1.8,
          applying: true,
        },
        {
          transitPlanet: 'mercury',
          aspect: 'conjunction',
          natalPlanet: 'mercury',
          orb: 2.2,
          applying: false,
        },
      ],
    };
  },
};
