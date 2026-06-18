import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Stub for S9 — wires up to Clerk in S10 (FR-11.3). Chart generation does not require sign-in.
export default function SignInScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sign in</ThemedText>
      <ThemedText themeColor="textSecondary">
        Clerk sign-in arrives in the next milestone (S10), needed for AI interpretation and cloud sync.
        Offline chart generation works without an account.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
});
