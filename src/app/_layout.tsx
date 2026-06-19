import { ClerkProvider } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { secureTokenCache } from '@/lib/auth/tokenCache';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ClerkProvider tokenCache={secureTokenCache}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ title: 'Sign in', presentation: 'modal' }} />
          <Stack.Screen name="sign-up" options={{ title: 'Sign up', presentation: 'modal' }} />
          <Stack.Screen name="chart/[id]" options={{ title: 'Birth Chart' }} />
        </Stack>
      </ThemeProvider>
    </ClerkProvider>
  );
}
