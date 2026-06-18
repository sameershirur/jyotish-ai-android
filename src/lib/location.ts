import * as Location from "expo-location";
import { getPreference, setPreference } from "@/lib/db";

export type GeocodedPlace = {
  place: string;
  latitude: number;
  longitude: number;
  timezone: number;
};

const RECENT_PLACES_KEY = "recent_places";
const MAX_RECENT = 10;

/** Geocodes a place name to coordinates. Requires connectivity. */
export async function geocodePlace(query: string): Promise<GeocodedPlace[]> {
  const results = await Location.geocodeAsync(query);
  return results.map((r) => ({
    place: query,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: estimateTimezoneOffset(r.longitude),
  }));
}

/** Rough UTC offset estimate from longitude, used only as a starting default — user can override. */
function estimateTimezoneOffset(longitude: number): number {
  return Math.round((longitude / 15) * 2) / 2;
}

export async function cacheRecentPlace(place: GeocodedPlace): Promise<void> {
  const existing = await getRecentPlaces();
  const deduped = [place, ...existing.filter((p) => p.place !== place.place)].slice(
    0,
    MAX_RECENT
  );
  await setPreference(RECENT_PLACES_KEY, JSON.stringify(deduped));
}

export async function getRecentPlaces(): Promise<GeocodedPlace[]> {
  const raw = await getPreference(RECENT_PLACES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GeocodedPlace[];
  } catch {
    return [];
  }
}
