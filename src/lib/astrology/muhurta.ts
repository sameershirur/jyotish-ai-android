import { toJulianDate } from "./calculator";
import { computePanchang, BAD_YOGAS } from "./panchang";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType =
  | "marriage" | "business" | "travel" | "property"
  | "medical"  | "education" | "naming";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  marriage:  "Marriage / Vivah",
  business:  "Business Start / Vyapaar",
  travel:    "Travel / Yatra",
  property:  "Property / Griha Pravesh",
  medical:   "Medical Procedure",
  education: "Education / Vidyarambha",
  naming:    "Naming Ceremony / Namkaran",
};

export type MuhurtaSlot = {
  date: string;         // "YYYY-MM-DD"
  dayOfWeek: string;
  startTime: string;    // "HH:MM"
  endTime: string;
  tithi: number;
  tithiName: string;
  vara: number;
  varaName: string;
  nakshatra: number;
  nakshatraName: string;
  yoga: number;
  yogaName: string;
  karana: number;
  karanaName: string;
  score: number;        // 0-100
  rating: "good" | "very_good" | "excellent";
};

// ─── Event scoring rules ──────────────────────────────────────────────────────

type EventRules = {
  favTithis: Set<number>;
  badTithis: Set<number>;
  favVaras:  Set<number>;
  badVaras:  Set<number>;
  favNaks:   Set<number>;
  badNaks:   Set<number>;
};

const RULES: Record<EventType, EventRules> = {
  marriage: {
    favTithis: new Set([2,3,5,7,10,11,13]),
    badTithis: new Set([1,4,6,8,9,12,14,30]),
    favVaras:  new Set([1,3,4,5]),         // Mon,Wed,Thu,Fri
    badVaras:  new Set([0,2,6]),           // Sun,Tue,Sat
    favNaks:   new Set([3,4,9,11,12,14,16,20,25,26]),
    badNaks:   new Set([8,17,18]),
  },
  business: {
    favTithis: new Set([2,3,5,7,10,11,13]),
    badTithis: new Set([4,8,9,14,30]),
    favVaras:  new Set([1,3,4,5]),
    badVaras:  new Set([2,6]),
    favNaks:   new Set([0,3,7,12,13,14,21,22,23]),
    badNaks:   new Set([8,17,18]),
  },
  travel: {
    favTithis: new Set([2,3,5,7,10,11,12,13]),
    badTithis: new Set([4,8,9,14,30]),
    favVaras:  new Set([1,3,4]),
    badVaras:  new Set([0,2,6]),
    favNaks:   new Set([0,4,6,7,12,16,21]),
    badNaks:   new Set([8,17,18]),
  },
  property: {
    favTithis: new Set([2,3,5,7,10,11,13]),
    badTithis: new Set([4,8,9,14,30]),
    favVaras:  new Set([1,3,4,5]),
    badVaras:  new Set([2,6]),
    favNaks:   new Set([3,11,20,25]),
    badNaks:   new Set([18,8]),
  },
  medical: {
    favTithis: new Set([2,3,5,7,10,11,13]),
    badTithis: new Set([8,9,14,15,30]),
    favVaras:  new Set([1,3,4]),
    badVaras:  new Set([2,6]),
    favNaks:   new Set([0,7,12,21]),
    badNaks:   new Set([17,18]),
  },
  education: {
    favTithis: new Set([2,5,7,10,11,13]),
    badTithis: new Set([4,8,9,14,30]),
    favVaras:  new Set([1,3,4]),
    badVaras:  new Set([2,6]),
    favNaks:   new Set([0,3,12,13,14,21,22,23,26]),
    badNaks:   new Set([8,18]),
  },
  naming: {
    favTithis: new Set([2,3,5,7,10,11,13]),
    badTithis: new Set([4,8,9,14,30]),
    favVaras:  new Set([1,3,4,5]),
    badVaras:  new Set([2,6]),
    favNaks:   new Set([0,3,4,6,7,12,14,16,21,26]),
    badNaks:   new Set([8,17,18]),
  },
};

function scoreSlot(panchang: ReturnType<typeof computePanchang>, rules: EventRules): number {
  let s = 50; // base
  if (rules.favTithis.has(panchang.tithi))    s += 20;
  if (rules.badTithis.has(panchang.tithi))    s -= 20;
  if (rules.favVaras.has(panchang.vara))      s += 15;
  if (rules.badVaras.has(panchang.vara))      s -= 15;
  if (rules.favNaks.has(panchang.nakshatra))  s += 25;
  if (rules.badNaks.has(panchang.nakshatra))  s -= 15;
  if (BAD_YOGAS.has(panchang.yoga))           s -= 20;
  if (panchang.karana === 6)                  s -= 15; // Vishti/Bhadra
  return Math.max(0, Math.min(100, s));
}

function rating(score: number): "good" | "very_good" | "excellent" {
  if (score >= 75) return "excellent";
  if (score >= 55) return "very_good";
  return "good";
}

// ─── Main function ────────────────────────────────────────────────────────────

const VARA_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function padTime(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function findMuhurtaSlots(
  eventType: EventType,
  startDate: string,   // "YYYY-MM-DD"
  endDate: string,     // max 90 days ahead
  timezone: number,    // UTC offset (e.g., 5.5 for IST)
): MuhurtaSlot[] {
  const rules = RULES[eventType];
  const results: MuhurtaSlot[] = [];

  // Clamp window to 90 days
  const start = new Date(startDate + "T00:00:00Z");
  const end   = new Date(endDate   + "T00:00:00Z");
  const maxEnd = new Date(start);
  maxEnd.setUTCDate(maxEnd.getUTCDate() + 90);
  const effectiveEnd = end < maxEnd ? end : maxEnd;

  let current = new Date(start);

  while (current <= effectiveEnd) {
    const dateStr = current.toISOString().split("T")[0];

    // 12 two-hour slots per day starting at local midnight (00:00)
    for (let h = 0; h < 24; h += 2) {
      const midH = h + 1; // midpoint hour
      const midTime = padTime(midH);
      const jd = toJulianDate(dateStr, midTime, timezone);
      const panchang = computePanchang(jd);
      const score = scoreSlot(panchang, rules);
      if (score < 30) { current.setUTCDate(current.getUTCDate() + 0); continue; } // filter low scores

      results.push({
        date:          dateStr,
        dayOfWeek:     VARA_NAMES[panchang.vara],
        startTime:     padTime(h),
        endTime:       h + 2 < 24 ? padTime(h + 2) : "00:00",
        tithi:         panchang.tithi,
        tithiName:     panchang.tithiName,
        vara:          panchang.vara,
        varaName:      panchang.varaName,
        nakshatra:     panchang.nakshatra,
        nakshatraName: panchang.nakshatraName,
        yoga:          panchang.yoga,
        yogaName:      panchang.yogaName,
        karana:        panchang.karana,
        karanaName:    panchang.karanaName,
        score,
        rating:        rating(score),
      });
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Sort by score desc, return top 10
  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
