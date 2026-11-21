import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BootStage, LaunchSplash } from '@/components/ui/LaunchSplash';
import { ToastOverlay } from '@/components/ui/ToastOverlay';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getCurrentUserLocation } from '@/services/geo';
import { requestLocalNotificationPermission } from '@/services/notifications';
import { useCarryGoStore } from '@/store/useCarryGoStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { isDark, palette } = useAppTheme();
  const hydrateSupabaseSession = useCarryGoStore((s) => s.hydrateSupabaseSession);
  const resumeActiveSimulations = useCarryGoStore((s) => s.resumeActiveSimulations);
  const setPickup = useCarryGoStore((s) => s.setPickup);

  const [bootStage, setBootStage] = useState<BootStage>('hydrating');
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    let active = true;

    // Hard failsafe so splash never traps the app even if OS prompts stall
    const hardFailsafe = setTimeout(() => {
      if (active) {
        setBootStage('ready');
        setSplashVisible(false);
      }
      SplashScreen.hideAsync().catch(() => {});
    }, 3500);

    async function boot() {
      // Immediately replace static native splash with our animated CarryGo LaunchSplash
      await SplashScreen.hideAsync().catch(() => {});

      const minSplashDelay = new Promise((resolve) => setTimeout(resolve, 1400));

      try {
        await Promise.race([
          hydrateSupabaseSession().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ]);
        resumeActiveSimulations();
        requestLocalNotificationPermission().catch(() => {});

        if (active) {
          setBootStage('locating');
        }

        // Pre-fetch current GPS pickup location in background (capped at 2s for splash)
        const gpsPromise = getCurrentUserLocation()
          .then((loc) => {
            if (loc) {
              setPickup(loc);
            }
          })
          .catch(() => {});

        await Promise.all([
          minSplashDelay,
          Promise.race([
            gpsPromise,
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]),
        ]);
      } finally {
        clearTimeout(hardFailsafe);
        if (active) {
          setBootStage('ready');
          setTimeout(() => {
            if (active) setSplashVisible(false);
          }, 260);
        }
      }
    }

    boot();

    return () => {
      active = false;
      clearTimeout(hardFailsafe);
    };
  }, [hydrateSupabaseSession, resumeActiveSimulations, setPickup]);

  const handleFadeComplete = useCallback(() => {
    setSplashMounted(false);
  }, []);

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: palette.background,
          card: palette.surface,
          text: palette.ink,
          border: palette.border,
          primary: palette.brand,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: palette.background,
          card: palette.surface,
          text: palette.ink,
          border: palette.border,
          primary: palette.brand,
        },
      };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={splashVisible || isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/signup" />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="booking/address-picker"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="booking/checkout" />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen
              name="chat/[orderId]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="wallet" />
            <Stack.Screen name="addresses" />
            <Stack.Screen name="payment-methods" />
          </Stack>
          <ToastOverlay />
          {splashMounted && (
            <LaunchSplash
              stage={bootStage}
              visible={splashVisible}
              onFadeComplete={handleFadeComplete}
            />
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
