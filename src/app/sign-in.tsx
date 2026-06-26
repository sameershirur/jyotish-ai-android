import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useSignIn, useSSO } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Required once at module scope so the OAuth browser redirect resolves back
// into the app instead of leaving the browser tab open.
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-warms the browser so the OAuth flow opens faster (Android only, no-op elsewhere).
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { createdSessionId, setActive: setActiveSSO } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: Linking.createURL('/sign-in'),
      });
      if (createdSessionId && setActiveSSO) {
        await setActiveSSO({ session: createdSessionId });
        router.back();
      }
      // No createdSessionId means the user cancelled/dismissed the browser - not an error.
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'errors' in e
          ? (e as { errors?: { message?: string }[] }).errors?.[0]?.message
          : undefined;
      setError(message ?? 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, router]);

  async function handleSignIn() {
    if (!isLoaded) { setError('Still loading — please wait a moment.'); return; }
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.back();
      } else {
        setError('Additional verification required — please sign in on the web app first.');
      }
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'errors' in e
          ? (e as { errors?: { message?: string }[] }).errors?.[0]?.message
          : undefined;
      setError(message ?? 'Sign in failed. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">Sign in</ThemedText>
        <ThemedText themeColor="textSecondary">
          Same account as the web app. Needed for AI interpretation, sync, and plan status — chart
          generation works without signing in.
        </ThemedText>

        <Pressable style={styles.googleButton} onPress={handleGoogleSignIn} disabled={googleLoading}>
          {googleLoading ? (
            <ActivityIndicator color="#1f2937" />
          ) : (
            <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <ThemedText type="small" themeColor="textSecondary">or</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Password</ThemedText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
            autoComplete="off"
            placeholder="••••••••"
          />
        </View>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Pressable style={styles.button} onPress={handleSignIn} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Sign in</ThemedText>}
        </Pressable>

        <Pressable onPress={() => router.push('/sign-up')}>
          <ThemedText type="link" style={styles.link}>Don&apos;t have an account? Sign up</ThemedText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 16 },
  field: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: { color: '#dc2626' },
  button: {
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleButtonText: { color: '#1f2937', fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#d1d5db' },
  link: { textAlign: 'center' },
});
