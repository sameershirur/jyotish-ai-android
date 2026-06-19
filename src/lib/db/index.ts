import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import type { BirthChart, ChartInput } from "@/lib/astrology/types";

const dbPromise = SQLite.openDatabaseAsync("jyotish.db");

let initialized: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      const db = await dbPromise;
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS saved_charts (
          id TEXT PRIMARY KEY,
          name TEXT,
          label TEXT,
          dob TEXT NOT NULL,
          tob TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          timezone TEXT NOT NULL,
          chart_data TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS user_preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    })();
  }
  return initialized;
}

export type SavedChartRow = {
  id: string;
  name: string | null;
  label: string | null;
  dob: string;
  tob: string;
  lat: number;
  lng: number;
  timezone: string;
  chart_data: string;
  synced: number;
  created_at: string;
  updated_at: string;
};

export type SavedChart = Omit<SavedChartRow, "chart_data" | "synced"> & {
  chart: BirthChart;
  synced: boolean;
};

function rowToSavedChart(row: SavedChartRow): SavedChart {
  return {
    ...row,
    chart: JSON.parse(row.chart_data) as BirthChart,
    synced: row.synced === 1,
  };
}

export async function saveChart(
  input: ChartInput,
  chart: BirthChart,
  label?: string
): Promise<SavedChart> {
  await initDb();
  const db = await dbPromise;
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO saved_charts (id, name, label, dob, tob, lat, lng, timezone, chart_data, synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      id,
      input.place,
      label ?? input.place,
      input.date,
      input.time,
      input.latitude,
      input.longitude,
      String(input.timezone),
      JSON.stringify(chart),
      now,
      now,
    ]
  );

  return {
    id,
    name: input.place,
    label: label ?? input.place,
    dob: input.date,
    tob: input.time,
    lat: input.latitude,
    lng: input.longitude,
    timezone: String(input.timezone),
    chart,
    synced: false,
    created_at: now,
    updated_at: now,
  };
}

export async function listCharts(): Promise<SavedChart[]> {
  await initDb();
  const db = await dbPromise;
  const rows = await db.getAllAsync<SavedChartRow>(
    "SELECT * FROM saved_charts ORDER BY created_at DESC"
  );
  return rows.map(rowToSavedChart);
}

export async function getChart(id: string): Promise<SavedChart | null> {
  await initDb();
  const db = await dbPromise;
  const row = await db.getFirstAsync<SavedChartRow>(
    "SELECT * FROM saved_charts WHERE id = ?",
    [id]
  );
  return row ? rowToSavedChart(row) : null;
}

export async function deleteChart(id: string): Promise<void> {
  await initDb();
  const db = await dbPromise;
  await db.runAsync("DELETE FROM saved_charts WHERE id = ?", [id]);
}

export async function getUnsyncedCharts(): Promise<SavedChart[]> {
  await initDb();
  const db = await dbPromise;
  const rows = await db.getAllAsync<SavedChartRow>(
    "SELECT * FROM saved_charts WHERE synced = 0"
  );
  return rows.map(rowToSavedChart);
}

export async function markSynced(id: string, updatedAt: string): Promise<void> {
  await initDb();
  const db = await dbPromise;
  await db.runAsync(
    "UPDATE saved_charts SET synced = 1, updated_at = ? WHERE id = ?",
    [updatedAt, id]
  );
}

/** Insert or update a row from a server-side chart record during pull sync. */
export async function upsertFromRemote(remote: {
  id: string;
  label: string | null;
  chart: BirthChart;
  updatedAt: string;
}): Promise<void> {
  await initDb();
  const db = await dbPromise;
  const existing = await db.getFirstAsync<{ updated_at: string }>(
    "SELECT updated_at FROM saved_charts WHERE id = ?",
    [remote.id]
  );

  // Last-write-wins (FR-11.5): skip if our local copy is already newer than the server's.
  if (existing && new Date(existing.updated_at) >= new Date(remote.updatedAt)) {
    return;
  }

  const input = remote.chart.input;
  if (existing) {
    await db.runAsync(
      `UPDATE saved_charts SET name = ?, label = ?, dob = ?, tob = ?, lat = ?, lng = ?, timezone = ?, chart_data = ?, synced = 1, updated_at = ?
       WHERE id = ?`,
      [
        input.place,
        remote.label,
        input.date,
        input.time,
        input.latitude,
        input.longitude,
        String(input.timezone),
        JSON.stringify(remote.chart),
        remote.updatedAt,
        remote.id,
      ]
    );
  } else {
    await db.runAsync(
      `INSERT INTO saved_charts (id, name, label, dob, tob, lat, lng, timezone, chart_data, synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        remote.id,
        input.place,
        remote.label,
        input.date,
        input.time,
        input.latitude,
        input.longitude,
        String(input.timezone),
        JSON.stringify(remote.chart),
        remote.updatedAt,
        remote.updatedAt,
      ]
    );
  }
}

export async function countCharts(): Promise<number> {
  await initDb();
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM saved_charts"
  );
  return row?.count ?? 0;
}

export async function getPreference(key: string): Promise<string | null> {
  await initDb();
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_preferences WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

export async function setPreference(key: string, value: string): Promise<void> {
  await initDb();
  const db = await dbPromise;
  await db.runAsync(
    "INSERT INTO user_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}
