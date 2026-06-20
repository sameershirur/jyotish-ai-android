import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { generateBirthChart } from '@/lib/astrology';
import type { ChartInput } from '@/lib/astrology/types';
import { saveChart, countCharts } from '@/lib/db';
import { cacheRecentPlace, geocodePlace, getRecentPlaces, type GeocodedPlace } from '@/lib/location';
import { runSync } from '@/lib/sync';
import { useUserPlan } from '@/hooks/useUserPlan';

const FREE_CHART_LIMIT = 1;

export default function GenerateScreen() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { plan } = useUserPlan();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [coords, setCoords] = useState<GeocodedPlace | null>(null);
  const [recent, setRecent] = useState<GeocodedPlace[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecentPlaces().then(setRecent);
  }, []);

  async function handleLookupPlace() {
    if (!place.trim()) return;
    setError(null);
    setGeocoding(true);
    try {
      const results = await geocodePlace(place.trim());
      if (results.length === 0) {
        setError('Place not found. Check spelling, or pick from recent places below.');
        return;
      }
      setCoords(results[0]);
      await cacheRecentPlace(results[0]);
      setRecent(await getRecentPlaces());
    } catch {
      setError('Geocoding needs an internet connection. Pick a previously used place instead.');
    } finally {
      setGeocoding(false);
    }
  }

  function pickRecent(p: GeocodedPlace) {
    setPlace(p.place);
    setCoords(p);
    setError(null);
  }

  async function handleGenerate() {
    if (!date || !time || !coords) {
      setError('Date, time, and a resolved place are required.');
      return;
    }

    if (plan !== 'pro') {
      const existing = await countCharts();
      if (existing >= FREE_CHART_LIMIT) {
        Alert.alert(
          'Free plan limit reached',
          `Free plan allows ${FREE_CHART_LIMIT} saved chart. Upgrade to Pro on the web app for unlimited charts.`
        );
        return;
      }
    }

    setGenerating(true);
    setError(null);
    try {
      const input: ChartInput = {
        date,
        time,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timezone: coords.timezone,
        place: coords.place,
      };
      const chart = generateBirthChart(input);
      const saved = await saveChart(input, chart, name || coords.place);
      if (isSignedIn) {
        // Fire-and-forget — Saved tab reflects the real synced state regardless of outcome.
        runSync(() => getToken()).catch(() => {});
      }
      router.push(`/chart/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate chart.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">New Chart</ThemedText>
        <ThemedText themeColor="textSecondary">
          Calculations run fully offline. Looking up a place name needs a connection once.
        </ThemedText>
      </ThemedView>

      <Field label="Name (optional)">
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Self"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <Field label="Date of birth (YYYY-MM-DD)">
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="1990-06-15"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="numbers-and-punctuation"
        />
      </Field>

      <Field label="Time of birth (HH:MM, 24h)">
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
          placeholder="12:00"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="numbers-and-punctuation"
        />
      </Field>

      <Field label="Place of birth">
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            value={place}
            onChangeText={(t) => { setPlace(t); setCoords(null); }}
            placeholder="Mumbai, India"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
          />
          <Pressable style={styles.lookupButton} onPress={handleLookupPlace} disabled={geocoding}>
            {geocoding ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.lookupButtonText}>Lookup</ThemedText>}
          </Pressable>
        </View>
        {coords && (
          <ThemedText type="small" themeColor="textSecondary">
            Resolved: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)} (UTC{coords.timezone >= 0 ? '+' : ''}{coords.timezone})
          </ThemedText>
        )}
      </Field>

      {recent.length > 0 && (
        <Field label="Recent places (work offline)">
          <View style={styles.chipRow}>
            {recent.map((p) => (
              <Pressable key={p.place} style={styles.chip} onPress={() => pickRecent(p)}>
                <ThemedText type="small">{p.place}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Field>
      )}

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Pressable style={styles.generateButton} onPress={handleGenerate} disabled={generating}>
        {generating ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.generateButtonText}>Generate Chart</ThemedText>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  section: { gap: 4 },
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex1: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  lookupButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  lookupButtonText: { color: '#fff', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  error: { color: '#dc2626' },
  generateButton: {
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
