export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type Planet =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

export type Aspect =
  | 'conjunction'
  | 'opposition'
  | 'trine'
  | 'square'
  | 'sextile';

export type MoonPhase =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface BirthProfile {
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm; omitted if unknown
  birthPlace: string;
  birthTimeKnown: boolean;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export interface PlanetPosition {
  planet: Planet;
  sign: ZodiacSign;
  degree: number;
  retrograde?: boolean;
}

export interface NatalSnapshot {
  sun: PlanetPosition;
  moon?: PlanetPosition;
  ascendant?: {
    sign: ZodiacSign;
    degree: number;
  };
  mercury?: PlanetPosition;
  venus?: PlanetPosition;
  mars?: PlanetPosition;
}

export interface TransitAspect {
  transitPlanet: Planet;
  aspect: Aspect;
  natalPlanet: Planet;
  orb: number;
  applying?: boolean;
}

export interface CurrentSkySnapshot {
  calculatedAt: string; // ISO timestamp
  mercury: PlanetPosition;
  venus?: PlanetPosition;
  mars?: PlanetPosition;
  moon: PlanetPosition;
  moonPhase: MoonPhase;
  transits: TransitAspect[];
}

export type ReadingTopic =
  | 'love'
  | 'connection'
  | 'self'
  | 'career'
  | 'money'
  | 'communication'
  | 'future'
  | 'general';

export interface TarotContext {
  cardId: string;
  cardName: string;
  orientation: 'upright' | 'reversed';
  topic: ReadingTopic;
}

export interface RelevantAstroSignal {
  id: string;
  kind: 'retrograde' | 'moon' | 'transit';
  score: number;
  title: string;
  detail: string;
  planets?: Planet[];
}

export interface AstroContext {
  generatedAt: string;
  birthProfile: BirthProfile;
  natal: NatalSnapshot;
  currentSky: CurrentSkySnapshot;
  relevantSignals: RelevantAstroSignal[];
  headline?: string;
}

export interface OracleReadingContext {
  oracleId: string;
  question?: string;
  tarot: TarotContext;
  astro: AstroContext;
}
