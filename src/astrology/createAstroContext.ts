import { buildAstroContext } from './astroContext';
import type { CurrentSkyProvider } from './currentSkyProvider';
import type {
  AstroContext,
  BirthProfile,
  NatalSnapshot,
  ReadingTopic,
} from './types';

interface CreateAstroContextInput {
  provider: CurrentSkyProvider;
  birthProfile: BirthProfile;
  natal: NatalSnapshot;
  topic: ReadingTopic;
  at?: Date;
}

export async function createAstroContext({
  provider,
  birthProfile,
  natal,
  topic,
  at,
}: CreateAstroContextInput): Promise<AstroContext> {
  const currentSky = await provider.getCurrentSky({
    at,
    birthProfile,
    natal,
  });

  return buildAstroContext({
    birthProfile,
    natal,
    currentSky,
    topic,
  });
}
