import type { CurrentSkyProvider } from './currentSkyProvider';
import type {
  Aspect,
  CurrentSkySnapshot,
  MoonPhase,
  NatalSnapshot,
  Planet,
  PlanetPosition,
  TransitAspect,
  ZodiacSign,
} from './types';

const CURRENT_SKY_URL =
  'https://sdcyuumfbqijxsewftkp.supabase.co/functions/v1/current-sky';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_LQ7hC_WSow7T09CAlSHV9A_25oG7QBu';

const ZODIAC: ZodiacSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const ASPECTS: Array<{
  aspect: Aspect;
  angle: number;
  maxOrb: number;
}> = [
  { aspect: 'conjunction', angle: 0, maxOrb: 6 },
  { aspect: 'opposition', angle: 180, maxOrb: 6 },
  { aspect: 'square', angle: 90, maxOrb: 5 },
  { aspect: 'trine', angle: 120, maxOrb: 5 },
  { aspect: 'sextile', angle: 60, maxOrb: 4 },
];

const TRANSIT_PLANETS: Planet[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

interface ApiPlanet {
  sign: ZodiacSign;
  degree: number;
  longitude: number;
  retrograde?: boolean;
}

interface CurrentSkyApiResponse {
  generatedAt: string;
  observedAt: string;
  planets: Partial<Record<Planet, ApiPlanet>>;
  moonPhase:
    | 'new_moon'
    | 'waxing_crescent'
    | 'first_quarter'
    | 'waxing_gibbous'
    | 'full_moon'
    | 'waning_gibbous'
    | 'last_quarter'
    | 'waning_crescent';
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function shortestAngularDistance(a: number, b: number) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(diff, 360 - diff);
}

function natalLongitude(position: PlanetPosition) {
  const signIndex = ZODIAC.indexOf(position.sign);

  if (signIndex < 0) {
    throw new Error(`Unknown zodiac sign: ${position.sign}`);
  }

  return signIndex * 30 + position.degree;
}

function mapMoonPhase(
  phase: CurrentSkyApiResponse['moonPhase'],
): MoonPhase {
  const map: Record<CurrentSkyApiResponse['moonPhase'], MoonPhase> = {
    new_moon: 'new',
    waxing_crescent: 'waxing-crescent',
    first_quarter: 'first-quarter',
    waxing_gibbous: 'waxing-gibbous',
    full_moon: 'full',
    waning_gibbous: 'waning-gibbous',
    last_quarter: 'last-quarter',
    waning_crescent: 'waning-crescent',
  };

  return map[phase];
}

function toPlanetPosition(
  planet: Planet,
  value: ApiPlanet,
): PlanetPosition {
  return {
    planet,
    sign: value.sign,
    degree: value.degree,
    retrograde: value.retrograde,
  };
}

function natalPositions(natal: NatalSnapshot): PlanetPosition[] {
  return [
    natal.sun,
    natal.moon,
    natal.mercury,
    natal.venus,
    natal.mars,
  ].filter((position): position is PlanetPosition => Boolean(position));
}

function buildTransits(
  planets: CurrentSkyApiResponse['planets'],
  natal: NatalSnapshot,
): TransitAspect[] {
  const results: TransitAspect[] = [];
  const natalList = natalPositions(natal);

  for (const transitPlanet of TRANSIT_PLANETS) {
    const current = planets[transitPlanet];
    if (!current) continue;

    for (const natalPosition of natalList) {
      const separation = shortestAngularDistance(
        current.longitude,
        natalLongitude(natalPosition),
      );

      let best:
        | {
            aspect: Aspect;
            orb: number;
          }
        | undefined;

      for (const definition of ASPECTS) {
        const orb = Math.abs(separation - definition.angle);

        if (
          orb <= definition.maxOrb &&
          (!best || orb < best.orb)
        ) {
          best = {
            aspect: definition.aspect,
            orb,
          };
        }
      }

      if (!best) continue;

      results.push({
        transitPlanet,
        aspect: best.aspect,
        natalPlanet: natalPosition.planet,
        orb: Number(best.orb.toFixed(2)),
        // Applying/separating için iki zaman noktasındaki gerçek hareket
        // gerekiyor. Backend bunu sağlamaya başladığında burada dolduracağız.
      });
    }
  }

  return results;
}

export const velaCurrentSkyProvider: CurrentSkyProvider = {
  async getCurrentSky({ at, natal }): Promise<CurrentSkySnapshot> {
    const url = new URL(CURRENT_SKY_URL);

    if (at) {
      url.searchParams.set('at', at.toISOString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `VELA current-sky HTTP ${response.status}: ${body}`,
      );
    }

    const data = (await response.json()) as CurrentSkyApiResponse;

    const mercury = data.planets.mercury;
    const moon = data.planets.moon;

    if (!mercury || !moon) {
      throw new Error(
        'VELA current-sky response is missing Mercury or Moon.',
      );
    }

    return {
      calculatedAt: data.generatedAt,
      mercury: toPlanetPosition('mercury', mercury),
      venus: data.planets.venus
        ? toPlanetPosition('venus', data.planets.venus)
        : undefined,
      mars: data.planets.mars
        ? toPlanetPosition('mars', data.planets.mars)
        : undefined,
      moon: toPlanetPosition('moon', moon),
      moonPhase: mapMoonPhase(data.moonPhase),
      transits: buildTransits(data.planets, natal),
    };
  },
};
