import { useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { colors, fontsToLoad } from '@/theme';
import { AstroProfileProvider } from '@/profile';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(() => {
    // No-op — splash is hidden by the effect above once fonts resolve.
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AstroProfileProvider>
          <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayoutRootView}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding/astro-profile" options={{ animation: 'fade' }} />
              <Stack.Screen name="oracle/[id]/world" options={{ animation: 'fade' }} />
              <Stack.Screen name="reading/intention" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="reading/result" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </View>
        </AstroProfileProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
