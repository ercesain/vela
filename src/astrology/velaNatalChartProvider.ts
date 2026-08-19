import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NatalChartProvider } from './natalChartProvider';
import type { BirthProfile, NatalSnapshot } from './types';

const NATAL_CHART_URL =
  'https://sdcyuumfbqijxsewftkp.supabase.co/functions/v1/natal-chart';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_LQ7hC_WSow7T09CAlSHV9A_25oG7QBu';

const NATAL_CACHE_PREFIX = '@vela/natal-chart/';

const memoryCache = new Map<string, NatalSnapshot>();

function createNatalCacheKey(birthProfile: BirthProfile) {
  const identity = JSON.stringify({
    birthDate: birthProfile.birthDate,
    birthTime: birthProfile.birthTime ?? null,
    birthPlace: birthProfile.birthPlace.trim().toLowerCase(),
    birthTimeKnown: birthProfile.birthTimeKnown,
    timezone: birthProfile.timezone ?? null,
    latitude: birthProfile.latitude ?? null,
    longitude: birthProfile.longitude ?? null,
  });

  return `${NATAL_CACHE_PREFIX}${identity}`;
}

async function readCachedNatal(
  cacheKey: string,
): Promise<NatalSnapshot | null> {
  const memoryValue = memoryCache.get(cacheKey);

  if (memoryValue) {
    return memoryValue;
  }

  try {
    const raw = await AsyncStorage.getItem(cacheKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as NatalSnapshot;
    memoryCache.set(cacheKey, parsed);

    return parsed;
  } catch (error) {
    console.warn('[VELA] Natal cache could not be read.', error);
    return null;
  }
}

async function writeCachedNatal(
  cacheKey: string,
  natal: NatalSnapshot,
) {
  memoryCache.set(cacheKey, natal);

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(natal));
  } catch (error) {
    console.warn('[VELA] Natal cache could not be saved.', error);
  }
}

export const velaNatalChartProvider: NatalChartProvider = {
  async getNatalChart({ birthProfile }): Promise<NatalSnapshot> {
    const cacheKey = createNatalCacheKey(birthProfile);
    const cached = await readCachedNatal(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await fetch(NATAL_CHART_URL, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        birthDate: birthProfile.birthDate,
        birthTime: birthProfile.birthTime,
        birthPlace: birthProfile.birthPlace,
        birthTimeKnown: birthProfile.birthTimeKnown,
        timezone: birthProfile.timezone,
        latitude: birthProfile.latitude,
        longitude: birthProfile.longitude,
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `VELA natal-chart HTTP ${response.status}: ${body}`,
      );
    }

    const natal = (await response.json()) as NatalSnapshot;

    await writeCachedNatal(cacheKey, natal);

    return natal;
  },
};
