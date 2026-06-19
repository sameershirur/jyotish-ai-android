import { Tabs } from 'expo-router';

import { useAutoSync } from '@/hooks/useAutoSync';

export default function TabsLayout() {
  // Keeps the connectivity listener alive across all tabs, not just Saved.
  useAutoSync();

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Generate' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
