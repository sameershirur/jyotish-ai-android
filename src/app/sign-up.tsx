import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function errorMessage(e: unknown, fallback: string) {
    return e && typeof e === 'object' && 'errors' in e
      ? (e as { errors?: { message?: string }[] }).errors?.[0]?.message ?? fallback
      : fallback;
  }

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
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
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
});
