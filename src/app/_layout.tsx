import { ClerkProvider } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { secureTokenCache } from '@/lib/auth/tokenCache';

// Same Clerk instance/publishable key as the web app - not a secret, safe to
// hardcode as a fallback. EAS Build's env var injection for this var has
// proven unreliable (the build claims to load it but the bundled JS doesn't
// see it), so don't depend on EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY alone.
const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'pk_test_d29ya2luZy1idXJyby01NC5jbGVyay5hY2NvdW50cy5kZXYk';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={secureTokenCache}>
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
