import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useAutoSync } from '@/hooks/useAutoSync';

export default function TabsLayout() {
  // Keeps the connectivity listener alive across all tabs, not just Saved.
  useAutoSync();

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Generate',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
