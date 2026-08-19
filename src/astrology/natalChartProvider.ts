import type { BirthProfile, NatalSnapshot } from './types';

export interface NatalChartProvider {
  getNatalChart(input: {
    birthProfile: BirthProfile;
  }): Promise<NatalSnapshot>;
}
