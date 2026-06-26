import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import type { BirthChart } from '@/lib/astrology/types';
import { PlanRequiredError, streamInterpretation, type InterpretDepth } from '@/lib/interpret';

const DEPTHS: InterpretDepth[] = ['beginner', 'intermediate', 'expert'];

export default function InterpretationSection({ chart }: { chart: BirthChart }) {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [online, setOnline] = useState(true);

  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [depth, setDepth] = useState<InterpretDepth>('intermediate');
  const [detailed, setDetailed] = useState('');
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  useEffect(() => {
    NetInfo.fetch().then((s) => setOnline(Boolean(s.isConnected && s.isInternetReachable !== false)));
    const unsubscribe = NetInfo.addEventListener((s) =>
      setOnline(Boolean(s.isConnected && s.isInternetReachable !== false))
    );
    return unsubscribe;
  }, []);

  async function generateSummary() {
    const token = await getToken();
    if (!token) { setSummaryError('Session expired — please sign out and sign in again.'); return; }
    setSummaryLoading(true);
    setSummary('');
    setSummaryError(null);
    try {
      await streamInterpretation({
        chart,
        token,
        mode: 'summary',
        onChunk: (chunk) => setSummary((prev) => prev + chunk),
      });
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function generateDetailed() {
    const token = await getToken();
    if (!token) { setDetailedError('Session expired — please sign out and sign in again.'); return; }
    setDetailedLoading(true);
    setDetailed('');
    setDetailedError(null);
    try {
      await streamInterpretation({
        chart,
        token,
        mode: 'detailed',
        depth,
        onChunk: (chunk) => setDetailed((prev) => prev + chunk),
      });
    } catch (e) {
      if (e instanceof PlanRequiredError) {
        setDetailedError('Detailed Reading is a Pro feature — upgrade on the web app to unlock it.');
      } else {
        setDetailedError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    } finally {
      setDetailedLoading(false);
    }
  }

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>AI Reading</ThemedText>
        <ThemedText themeColor="textSecondary">
          Sign in to get an AI-generated interpretation of this chart.
        </ThemedText>
        <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
          <ThemedText style={styles.buttonText}>Sign in</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!online) {
    return (
      <View style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>AI Reading</ThemedText>
        <ThemedText themeColor="textSecondary">Interpretation requires internet connection.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>AI Reading</ThemedText>

      {!summary && !summaryLoading && (
        <Pressable style={styles.button} onPress={generateSummary}>
          <ThemedText style={styles.buttonText}>Generate Reading</ThemedText>
        </Pressable>
      )}

      {(summary || summaryLoading) && (
        <View style={styles.card}>
          {summaryLoading && !summary && (
            <ActivityIndicator />
          )}
          <ThemedText style={styles.body}>{summary}</ThemedText>
          {summaryError && <ThemedText style={styles.error}>{summaryError}</ThemedText>}
          {!summaryLoading && summary && (
            <Pressable onPress={generateSummary}>
              <ThemedText type="link">Regenerate</ThemedText>
            </Pressable>
          )}
        </View>
      )}

      {!summaryLoading && summary && (
        <View style={styles.detailedBlock}>
          <ThemedText type="smallBold">Detailed Reading (Pro)</ThemedText>
          <View style={styles.chipRow}>
            {DEPTHS.map((d) => (
              <Pressable
                key={d}
                style={[styles.chip, depth === d && styles.chipActive]}
                onPress={() => setDepth(d)}
              >
                <ThemedText type="small">{d}</ThemedText>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.button} onPress={generateDetailed} disabled={detailedLoading}>
            {detailedLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {detailed ? 'Regenerate Detailed' : 'Get Detailed Reading'}
              </ThemedText>
            )}
          </Pressable>
          {detailedError && <ThemedText style={styles.error}>{detailedError}</ThemedText>}
          {detailed && (
            <View style={styles.card}>
              <ThemedText style={styles.body}>{detailed}</ThemedText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginTop: 8 },
  title: { fontSize: 20, lineHeight: 26 },
  button: {
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  card: { gap: 8, padding: 12, borderWidth: 1, borderColor: '#6366f1', borderRadius: 10 },
  body: { lineHeight: 22 },
  error: { color: '#dc2626' },
  detailedBlock: { gap: 8, marginTop: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#999', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
});
