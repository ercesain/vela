import type { BirthProfile, CurrentSkySnapshot, NatalSnapshot } from './types';

export interface CurrentSkyProvider {
  getCurrentSky(input: {
    at?: Date;
    birthProfile: BirthProfile;
    natal: NatalSnapshot;
  }): Promise<CurrentSkySnapshot>;
}
