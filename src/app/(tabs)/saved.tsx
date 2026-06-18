import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { deleteChart, listCharts, type SavedChart } from '@/lib/db';

export default function SavedScreen() {
  const router = useRouter();
  const [charts, setCharts] = useState<SavedChart[]>([]);

  const refresh = useCallback(() => {
    listCharts().then(setCharts);
  }, []);

  useFocusEffect(refresh);

  function confirmDelete(chart: SavedChart) {
    Alert.alert('Delete chart', `Remove "${chart.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteChart(chart.id);
          refresh();
        },
      },
    ]);
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={charts}
      keyExtractor={(c) => c.id}
      ListEmptyComponent={
        <ThemedView style={styles.empty}>
          <ThemedText themeColor="textSecondary">No saved charts yet. Generate one from the Generate tab.</ThemedText>
        </ThemedView>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/chart/${item.id}`)}>
          <View style={styles.rowText}>
            <ThemedText type="smallBold">{item.label}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.dob} {item.tob} — {item.synced ? 'synced' : 'local only'}
            </ThemedText>
          </View>
          <Pressable onPress={() => confirmDelete(item)}>
            <ThemedText style={styles.delete}>Delete</ThemedText>
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  empty: { padding: 32, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
  },
  rowText: { gap: 2 },
  delete: { color: '#dc2626' },
});
