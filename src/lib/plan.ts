import { getPreference, setPreference } from "@/lib/db";
import { isOnline } from "@/lib/sync";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://bhavishyadeepa.com";
const PLAN_CACHE_KEY = "plan_status";

export type Plan = "free" | "pro";

export function isPro(plan: Plan): boolean {
  return plan === "pro";
}

export type CachedPlan = { plan: Plan; verifiedAt: string };

export async function getCachedPlan(): Promise<CachedPlan> {
  const raw = await getPreference(PLAN_CACHE_KEY);
  if (!raw) return { plan: "free", verifiedAt: "" };
  try {
    return JSON.parse(raw) as CachedPlan;
  } catch {
    return { plan: "free", verifiedAt: "" };
  }
}

/**
 * Re-validates plan status against the server when online (FR-11.4/FR-11.6),
 * caching the result so Pro features stay gated correctly while offline based
 * on the last known-good answer rather than defaulting to "free" every launch.
 */
export async function refreshPlan(token: string): Promise<CachedPlan> {
  const online = await isOnline();
  if (!online) return getCachedPlan();

  try {
    const res = await fetch(`${API_BASE_URL}/api/plan`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getCachedPlan();

    const data = (await res.json()) as { plan: Plan };
    const cached: CachedPlan = { plan: data.plan, verifiedAt: new Date().toISOString() };
    await setPreference(PLAN_CACHE_KEY, JSON.stringify(cached));
    return cached;
  } catch {
    return getCachedPlan();
  }
}
