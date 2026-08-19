import type { BirthProfile, NatalSnapshot } from './types';
import type { NatalChartProvider } from './natalChartProvider';

export async function createNatalChart(input: {
  provider: NatalChartProvider;
  birthProfile: BirthProfile;
}): Promise<NatalSnapshot> {
  return input.provider.getNatalChart({
    birthProfile: input.birthProfile,
  });
}
