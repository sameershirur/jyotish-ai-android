import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!isLoaded || !email || !password) return;
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
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sign in</ThemedText>
      <ThemedText themeColor="textSecondary">
        Same account as the web app. Needed for AI interpretation, sync, and plan status — chart
        generation works without signing in.
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="smallBold">Email</ThemedText>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
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
  link: { textAlign: 'center' },
});
