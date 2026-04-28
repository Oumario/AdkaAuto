import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { useEffect } from 'react';
import { checkAndApplyScheduledTariff } from '@/services/storageService';

function AppInitializer() {
  useEffect(() => {
    // On every app launch, check if a scheduled tariff's effective date has passed
    checkAndApplyScheduledTariff().catch(() => {});
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AppInitializer />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="invoice-detail" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
