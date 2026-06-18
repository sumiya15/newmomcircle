/**
 * app/_layout.tsx
 * Root layout for the Expo Router app.
 * - Loads Poppins font family
 * - Hydrates auth state from Supabase
 * - Initialises i18n
 * - Sets up the navigation stack with SplashScreen management
 */

import "../global.css";
import "../i18n"; // initialise i18next
import React, { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";

if (Platform.OS === 'web') {
  // NativeWind v4 on web requires class-based dark mode
  (StyleSheet as any).setFlag?.('darkMode', 'class');
}
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";

// Keep the native splash visible while assets load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const loadLanguage = useAppStore((s) => s.loadLanguage);

  useEffect(() => {
    const unsubAuth = hydrateAuth();
    loadLanguage();
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {Platform.OS !== 'web' && <StatusBar style="light" />}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Onboarding / Auth */}
        <Stack.Screen name="onboarding/splash" />
        <Stack.Screen name="onboarding/language" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(auth)/forgot-password" />
        {/* Main tabs */}
        <Stack.Screen name="(main)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
