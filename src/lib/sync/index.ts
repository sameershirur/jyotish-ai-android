import NetInfo from "@react-native-community/netinfo";
import { getUnsyncedCharts, markSynced, upsertFromRemote } from "@/lib/db";
import type { BirthChart } from "@/lib/astrology/types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://bhavishyadeepa.com";

export type SyncResult = { pushed: number; pulled: number; errors: string[] };

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

type RemoteChart = {
  id: string;
  name: string | null;
  chart_data: BirthChart;
  updated_at: string;
};

async function pushUnsyncedCharts(token: string): Promise<{ count: number; errors: string[] }> {
  const unsynced = await getUnsyncedCharts();
  let count = 0;
  const errors: string[] = [];

  for (const saved of unsynced) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/charts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: saved.id,
          name: saved.label ?? saved.chart.input.place,
          place: saved.chart.input.place,
          date_of_birth: `${saved.dob} ${saved.tob}`,
          chart_data: saved.chart,
          updated_at: saved.updated_at,
        }),
      });

      if (!res.ok) {
        errors.push(`Push failed for "${saved.label}": HTTP ${res.status}`);
        continue;
      }

      const data = (await res.json()) as { updated_at?: string };
      await markSynced(saved.id, data.updated_at ?? new Date().toISOString());
      count++;
    } catch (e) {
      errors.push(`Push failed for "${saved.label}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { count, errors };
}

async function pullRemoteCharts(token: string): Promise<{ count: number; errors: string[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/charts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { count: 0, errors: [`Pull failed: HTTP ${res.status}`] };

    const remoteCharts = (await res.json()) as RemoteChart[];
    for (const r of remoteCharts) {
      await upsertFromRemote({ id: r.id, label: r.name, chart: r.chart_data, updatedAt: r.updated_at });
    }
    return { count: remoteCharts.length, errors: [] };
  } catch (e) {
    return { count: 0, errors: [e instanceof Error ? e.message : String(e)] };
  }
}

/**
 * Foreground sync: triggered on app focus/connectivity change while the app is
 * open (JAA-152). Not an OS-level background task — Android background fetch
 * for a free-tier MVP app adds significant complexity or battery-permission
 * friction users won't expect, so it was scoped out in favor of this.
 */
export async function runSync(getToken: () => Promise<string | null>): Promise<SyncResult> {
  const online = await isOnline();
  if (!online) return { pushed: 0, pulled: 0, errors: ["Offline"] };

  const token = await getToken();
  if (!token) return { pushed: 0, pulled: 0, errors: ["Not signed in"] };

  const push = await pushUnsyncedCharts(token);
  const pull = await pullRemoteCharts(token);

  return { pushed: push.count, pulled: pull.count, errors: [...push.errors, ...pull.errors] };
}
