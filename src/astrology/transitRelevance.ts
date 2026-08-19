import type {
  CurrentSkySnapshot,
  Planet,
  ReadingTopic,
  RelevantAstroSignal,
  TransitAspect,
} from './types';

const ASPECT_BASE = {
  conjunction: 5.0,
  opposition: 4.6,
  square: 4.4,
  trine: 3.4,
  sextile: 2.8,
} as const;

const PLANET_BASE: Record<Planet, number> = {
  sun: 1.15,
  moon: 1.10,
  mercury: 1.10,
  venus: 1.15,
  mars: 1.05,
  jupiter: 1.00,
  saturn: 1.10,
  uranus: 1.00,
  neptune: 0.95,
  pluto: 1.00,
};

const TOPIC_PLANET_MULTIPLIER: Record<
  ReadingTopic,
  Partial<Record<Planet, number>>
> = {
  love: {
    venus: 2.0,
    moon: 1.7,
    mars: 1.45,
    saturn: 1.35,
    pluto: 1.35,
    mercury: 1.2,
  },
  connection: {
    venus: 1.8,
    moon: 1.65,
    mercury: 1.65,
    saturn: 1.35,
    pluto: 1.25,
  },
  self: {
    sun: 1.9,
    moon: 1.7,
    saturn: 1.5,
    pluto: 1.45,
    neptune: 1.25,
  },
  career: {
    sun: 1.8,
    saturn: 1.8,
    jupiter: 1.55,
    mars: 1.4,
    mercury: 1.25,
  },
  money: {
    venus: 1.75,
    jupiter: 1.7,
    saturn: 1.6,
    mercury: 1.25,
  },
  communication: {
    mercury: 2.0,
    moon: 1.45,
    venus: 1.35,
    mars: 1.2,
  },
  future: {
    saturn: 1.65,
    jupiter: 1.55,
    uranus: 1.5,
    pluto: 1.45,
    sun: 1.25,
  },
  general: {},
};

function orbMultiplier(orb: number) {
  if (orb <= 1) return 1.5;
  if (orb <= 2) return 1.0;
  return 0.5;
}

function applyingMultiplier(applying?: boolean) {
  if (applying === true) return 1.2;
  if (applying === false) return 0.8;
  return 1.0;
}

function topicMultiplier(
  transitPlanet: Planet,
  natalPlanet: Planet,
  readingTopic: ReadingTopic,
) {
  const weights = TOPIC_PLANET_MULTIPLIER[readingTopic];

  const transitWeight = weights[transitPlanet] ?? 1;
  const natalWeight = weights[natalPlanet] ?? 1;

  return Math.min(
    2.4,
    Math.max(transitWeight, natalWeight) *
      Math.sqrt(Math.min(transitWeight, natalWeight)),
  );
}

function transitScore(
  transit: TransitAspect,
  readingTopic: ReadingTopic,
) {
  const aspectBase = ASPECT_BASE[transit.aspect] ?? 1;
  const orb = orbMultiplier(transit.orb);
  const direction = applyingMultiplier(transit.applying);

  const planetImportance = Math.sqrt(
    PLANET_BASE[transit.transitPlanet] *
      PLANET_BASE[transit.natalPlanet],
  );

  const topicWeight = topicMultiplier(
    transit.transitPlanet,
    transit.natalPlanet,
    readingTopic,
  );

  return aspectBase * orb * direction * planetImportance * topicWeight;
}

function transitTitle(transit: TransitAspect) {
  return `${transit.transitPlanet} ${transit.aspect} natal ${transit.natalPlanet}`;
}

function transitDetail(transit: TransitAspect) {
  const direction =
    transit.applying === true
      ? 'yaklaşan'
      : transit.applying === false
        ? 'uzaklaşan'
        : 'etkin';

  return `${direction} açı · orb ${transit.orb.toFixed(1)}°`;
}

function buildGlobalSignals(
  sky: CurrentSkySnapshot,
  topic: ReadingTopic,
): RelevantAstroSignal[] {
  const globals: RelevantAstroSignal[] = [];

  if (sky.mercury.retrograde) {
    const mercuryTopicMultiplier =
      topic === 'communication'
        ? 2.0
        : topic === 'connection'
          ? 1.7
          : topic === 'love'
            ? 1.4
            : 1.0;

    globals.push({
      id: 'mercury-retrograde',
      kind: 'retrograde',
      score: 5 * mercuryTopicMultiplier,
      title: 'Merkür retro',
      detail:
        'İletişim, eski konuşmalar ve yeniden değerlendirme temaları astrolojik bağlamda öne çıkabilir.',
      planets: ['mercury'],
    });
  }

  const moonTopicMultiplier =
    topic === 'love' || topic === 'connection' || topic === 'self'
      ? 1.5
      : 1.0;

  globals.push({
    id: 'current-moon',
    kind: 'moon',
    score: 4 * moonTopicMultiplier,
    title: `Ay ${sky.moon.sign}`,
    detail: `Ay fazı: ${sky.moonPhase}`,
    planets: ['moon'],
  });

  return globals.sort((a, b) => b.score - a.score);
}

export function selectRelevantAstroSignals(
  sky: CurrentSkySnapshot,
  topic: ReadingTopic,
  maxPersonalSignals = 3,
): RelevantAstroSignal[] {
  const personalSignals: RelevantAstroSignal[] = sky.transits
    .map((transit, index) => ({
      id: `transit-${index}`,
      kind: 'transit' as const,
      score: transitScore(transit, topic),
      title: transitTitle(transit),
      detail: transitDetail(transit),
      planets: [transit.transitPlanet, transit.natalPlanet],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, maxPersonalSignals));

  const [topGlobalSignal] = buildGlobalSignals(sky, topic);

  return topGlobalSignal
    ? [...personalSignals, topGlobalSignal]
    : personalSignals;
}
