import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BirthProfile } from '@/astrology';

const ASTRO_PROFILE_STORAGE_KEY = '@vela/astro-profile';
const ASTRO_ONBOARDING_COMPLETE_KEY = '@vela/astro-onboarding-complete';

interface AstroProfileContextValue {
  profile: BirthProfile | null;
  setProfile: (profile: BirthProfile) => Promise<void>;
  skipProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
  hasProfile: boolean;
  onboardingComplete: boolean;
  isHydrated: boolean;
}

const AstroProfileContext = createContext<AstroProfileContextValue | null>(null);

export function AstroProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfileState] = useState<BirthProfile | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const [rawProfile, rawComplete] = await Promise.all([
          AsyncStorage.getItem(ASTRO_PROFILE_STORAGE_KEY),
          AsyncStorage.getItem(ASTRO_ONBOARDING_COMPLETE_KEY),
        ]);

        if (!mounted) return;

        if (rawProfile) {
          setProfileState(JSON.parse(rawProfile) as BirthProfile);
          setOnboardingComplete(true);
        } else {
          setOnboardingComplete(rawComplete === 'true');
        }
      } catch (error) {
        console.warn('[VELA] Astro profile could not be restored.', error);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const setProfile = async (nextProfile: BirthProfile) => {
    setProfileState(nextProfile);
    setOnboardingComplete(true);

    try {
      await Promise.all([
        AsyncStorage.setItem(
          ASTRO_PROFILE_STORAGE_KEY,
          JSON.stringify(nextProfile),
        ),
        AsyncStorage.setItem(ASTRO_ONBOARDING_COMPLETE_KEY, 'true'),
      ]);
    } catch (error) {
      console.warn('[VELA] Astro profile could not be saved.', error);
    }
  };

  const skipProfile = async () => {
    setProfileState(null);
    setOnboardingComplete(true);

    try {
      await Promise.all([
        AsyncStorage.removeItem(ASTRO_PROFILE_STORAGE_KEY),
        AsyncStorage.setItem(ASTRO_ONBOARDING_COMPLETE_KEY, 'true'),
      ]);
    } catch (error) {
      console.warn('[VELA] Astro onboarding skip could not be saved.', error);
    }
  };

  const clearProfile = async () => {
    setProfileState(null);
    setOnboardingComplete(false);

    try {
      await Promise.all([
        AsyncStorage.removeItem(ASTRO_PROFILE_STORAGE_KEY),
        AsyncStorage.removeItem(ASTRO_ONBOARDING_COMPLETE_KEY),
      ]);
    } catch (error) {
      console.warn('[VELA] Astro profile could not be cleared.', error);
    }
  };

  const value = useMemo<AstroProfileContextValue>(
    () => ({
      profile,
      setProfile,
      skipProfile,
      clearProfile,
      hasProfile: profile !== null,
      onboardingComplete,
      isHydrated,
    }),
    [profile, onboardingComplete, isHydrated],
  );

  return (
    <AstroProfileContext.Provider value={value}>
      {children}
    </AstroProfileContext.Provider>
  );
}

export function useAstroProfile() {
  const context = useContext(AstroProfileContext);

  if (!context) {
    throw new Error(
      'useAstroProfile must be used inside AstroProfileProvider',
    );
  }

  return context;
}
