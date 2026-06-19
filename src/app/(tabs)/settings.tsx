import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUserPlan } from '@/hooks/useUserPlan';

export default function SettingsScreen() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { plan, verifiedAt, loading } = useUserPlan();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

      {isSignedIn ? (
        <>
          <ThemedText themeColor="textSecondary">
            Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </ThemedText>

          <ThemedView style={styles.planCard}>
            <ThemedText type="smallBold">Plan: {plan === 'pro' ? 'Pro' : 'Free'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {loading
                ? 'Checking…'
                : verifiedAt
                  ? `Last verified: ${new Date(verifiedAt).toLocaleString()}`
                  : 'Not verified yet — connect to the internet to check.'}
            </ThemedText>
            {plan === 'free' && (
              <ThemedText type="small" themeColor="textSecondary">
                Free: 1 saved chart, summary reading only. Upgrade to Pro on the web app for
                unlimited charts and detailed readings.
              </ThemedText>
            )}
          </ThemedView>

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
  planCard: {
    gap: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
