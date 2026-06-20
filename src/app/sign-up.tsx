import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useSignUp, useSSO } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  function errorMessage(e: unknown, fallback: string) {
    return e && typeof e === 'object' && 'errors' in e
      ? (e as { errors?: { message?: string }[] }).errors?.[0]?.message ?? fallback
      : fallback;
  }

  // Clerk's SSO flow creates the account automatically if one doesn't exist yet,
  // so sign-up and sign-in share the same Google flow.
  const handleGoogleSignUp = useCallback(async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { createdSessionId, setActive: setActiveSSO } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: Linking.createURL('/sign-up'),
      });
      if (createdSessionId && setActiveSSO) {
        await setActiveSSO({ session: createdSessionId });
        router.back();
      }
    } catch (e) {
      setError(errorMessage(e, 'Google sign-up failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, router]);

  async function handleSignUp() {
    if (!isLoaded || !email || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (e) {
      setError(errorMessage(e, 'Sign up failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded || !code) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.back();
      } else {
        setError('Verification incomplete — try again.');
      }
    } catch (e) {
      setError(errorMessage(e, 'Invalid code.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingVerification) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Check your email</ThemedText>
        <ThemedText themeColor="textSecondary">Enter the verification code we sent to {email}.</ThemedText>
        <View style={styles.field}>
          <ThemedText type="smallBold">Verification code</ThemedText>
          <TextInput style={styles.input} value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="123456" />
        </View>
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Pressable style={styles.button} onPress={handleVerify} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Verify</ThemedText>}
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sign up</ThemedText>
      <ThemedText themeColor="textSecondary">Same account works on the web app too.</ThemedText>

      <Pressable style={styles.googleButton} onPress={handleGoogleSignUp} disabled={googleLoading}>
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
          placeholder="••••••••"
        />
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Pressable style={styles.button} onPress={handleSignUp} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Sign up</ThemedText>}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
});
