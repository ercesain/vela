import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { OracleWorldScreen } from '@/components';
import { getOracleById } from '@/data';
import { getOracleWorldConfig } from '@/data/oracleWorlds';
import { velaNatalChartProvider } from '@/astrology';

/**
 * `/oracle/[id]/world` — the cinematic welcome screen a "DÜNYASINA GİR"
 * takeover lands on. Only Luna has a config today; any other id (or one
 * that isn't implemented yet) bounces back Home instead of rendering a
 * broken screen.
 */
export default function OracleWorldRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const oracle = id ? getOracleById(id) : undefined;
  const config = id ? getOracleWorldConfig(id) : undefined;

  useEffect(() => {
    if (!oracle || !config) {
      router.replace('/');
    }
  }, [oracle, config]);

  if (!oracle || !config) {
    return null;
  }

  return (
    <OracleWorldScreen
      oracle={oracle}
      config={config}
      natalChartProvider={velaNatalChartProvider}
    />
  );
}
