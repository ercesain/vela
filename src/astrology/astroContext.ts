import { selectRelevantAstroSignals } from './transitRelevance';
import type {
  AstroContext,
  BirthProfile,
  CurrentSkySnapshot,
  NatalSnapshot,
  ReadingTopic,
} from './types';

interface BuildAstroContextInput {
  birthProfile: BirthProfile;
  natal: NatalSnapshot;
  currentSky: CurrentSkySnapshot;
  topic: ReadingTopic;
  maxSignals?: number;
}

export function buildAstroContext({
  birthProfile,
  natal,
  currentSky,
  topic,
  maxSignals = 3,
}: BuildAstroContextInput): AstroContext {
  const relevantSignals = selectRelevantAstroSignals(
    currentSky,
    topic,
    maxSignals,
  );

  const headline = relevantSignals[0]?.title;

  return {
    generatedAt: new Date().toISOString(),
    birthProfile,
    natal,
    currentSky,
    relevantSignals,
    headline,
  };
}

/**
 * AI katmanına gidecek kısa ve kontrollü bağlam.
 *
 * Burada yorum yapılmaz; sadece hesaplanmış/verilmiş astrolojik veriler
 * okunabilir bir forma çevrilir. Modelin "bugün Merkür retro mu?" gibi
 * güncel bilgileri kendisinin tahmin etmemesi için bu katman ayrı tutulur.
 */
export function serializeAstroContextForAI(context: AstroContext) {
  return {
    generatedAt: context.generatedAt,
    natal: {
      sun: context.natal.sun,
      moon: context.natal.moon ?? null,
      ascendant: context.natal.ascendant ?? null,
      mercury: context.natal.mercury ?? null,
      venus: context.natal.venus ?? null,
      mars: context.natal.mars ?? null,
    },
    currentSky: {
      mercury: context.currentSky.mercury,
      moon: context.currentSky.moon,
      moonPhase: context.currentSky.moonPhase,
    },
    relevantSignals: context.relevantSignals.map((signal) => ({
      kind: signal.kind,
      title: signal.title,
      detail: signal.detail,
    })),
  };
}
