import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

      {isSignedIn ? (
        <>
          <ThemedText themeColor="textSecondary">
            Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </ThemedText>
          <Pressable style={styles.button} onPress={() => signOut()}>
            <ThemedText style={styles.buttonText}>Sign out</ThemedText>
          </Pressable>
        </>
      ) : (
        <>
          <ThemedText themeColor="textSecondary">
            Chart generation works fully offline without an account. Sign in for AI interpretation,
            cloud sync, and plan status.
          </ThemedText>
          <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
            <ThemedText style={styles.buttonText}>Sign in</ThemedText>
          </Pressable>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
