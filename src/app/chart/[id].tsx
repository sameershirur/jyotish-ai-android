import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import SouthIndianChart from '@/components/SouthIndianChart';
import InterpretationSection from '@/components/InterpretationSection';
import { getChart, type SavedChart } from '@/lib/db';

export default function ChartDisplayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [saved, setSaved] = useState<SavedChart | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    getChart(id).then((c) => (c ? setSaved(c) : setNotFound(true)));
  }, [id]);

  if (notFound) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Chart not found.</ThemedText>
      </ThemedView>
    );
  }

  if (!saved) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  const { chart } = saved;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">{saved.label}</ThemedText>
      <ThemedText themeColor="textSecondary">
        {chart.input.date} {chart.input.time} — {chart.input.place}
      </ThemedText>

      <View style={styles.chartWrap}>
        <SouthIndianChart chart={chart} />
      </View>

      <Section title="Lagna">
        <ThemedText>
          {chart.ascendant.sign} ({chart.ascendant.degree.toFixed(2)}°) — Lord: {chart.lagnaLord}
        </ThemedText>
      </Section>

      <Section title="Planets">
        {chart.planets.map((p) => (
          <Row key={p.planet}>
            <ThemedText type="smallBold" style={styles.col1}>{p.planet}{p.isRetrograde ? ' (R)' : ''}</ThemedText>
            <ThemedText type="small" style={styles.col2}>{p.sign} {p.degree.toFixed(2)}°</ThemedText>
            <ThemedText type="small" style={styles.col3}>House {p.house}</ThemedText>
          </Row>
        ))}
      </Section>

      <Section title="Yogas">
        {chart.yogas.filter((y) => y.present).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">None detected.</ThemedText>
        ) : (
          chart.yogas.filter((y) => y.present).map((y) => (
            <View key={y.name} style={styles.listItem}>
              <ThemedText type="smallBold">{y.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{y.description}</ThemedText>
            </View>
          ))
        )}
      </Section>

      <Section title="Doshas">
        {chart.doshas.filter((d) => d.present).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">None detected.</ThemedText>
        ) : (
          chart.doshas.filter((d) => d.present).map((d) => (
            <View key={d.name} style={styles.listItem}>
              <ThemedText type="smallBold">{d.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{d.description}</ThemedText>
            </View>
          ))
        )}
      </Section>

      <Section title="Vimshottari Dasha">
        <ThemedText type="smallBold">
          Current: {chart.currentDasha.planet} ({chart.currentDasha.startDate} – {chart.currentDasha.endDate})
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Antardasha: {chart.currentDasha.currentAntardasha.planet} ({chart.currentDasha.currentAntardasha.startDate} – {chart.currentDasha.currentAntardasha.endDate})
        </ThemedText>
        {chart.dashaSequence.map((d) => (
          <Row key={d.planet}>
            <ThemedText type="small" style={styles.col1}>{d.planet}</ThemedText>
            <ThemedText type="small" style={styles.col2}>{d.startDate} – {d.endDate}</ThemedText>
            <ThemedText type="small" style={styles.col3}>{d.years}y</ThemedText>
          </Row>
        ))}
      </Section>

      <InterpretationSection chart={chart} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  chartWrap: { alignItems: 'center', marginVertical: 12 },
  section: { gap: 6, marginTop: 8 },
  sectionTitle: { fontSize: 20, lineHeight: 26 },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  col1: { flex: 1 },
  col2: { flex: 1.5 },
  col3: { flex: 1 },
  listItem: { gap: 2, paddingVertical: 4 },
});
