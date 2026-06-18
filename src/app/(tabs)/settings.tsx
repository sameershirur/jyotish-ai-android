import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Auth (Clerk), plan status, and sync land in S10 (FR-11.3-11.6).
// This screen is the placeholder so the navigation IA matches the web app now.
export default function SettingsScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText themeColor="textSecondary">
        Sign-in, sync, and plan status arrive in the next milestone. For now this app works fully offline
        with local-only saved charts.
      </ThemedText>
      <ThemedText type="link" onPress={() => router.push('/sign-in')}>
        Preview sign-in screen
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
});
