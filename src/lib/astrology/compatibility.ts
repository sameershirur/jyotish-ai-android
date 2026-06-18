import type { BirthChart } from "./types";
import { NAKSHATRAS } from "./nakshatras";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KootaScore = { score: number; max: number };

export type AshtakootBreakdown = {
  varna:       KootaScore; // max 1
  vashya:      KootaScore; // max 2
  tara:        KootaScore; // max 3
  yoni:        KootaScore; // max 4
  grahaMaitri: KootaScore; // max 5
  gana:        KootaScore; // max 6
  bhakoot:     KootaScore; // max 7
  nadi:        KootaScore; // max 8
};

export type ManglikResult = {
  personA: boolean;
  personB: boolean;
  cancels: boolean;
};

export type CompatibilityResult = {
  totalScore: number;
  maxScore: 36;
  rating: "not_recommended" | "acceptable" | "good" | "excellent";
  breakdown: AshtakootBreakdown;
  manglik: ManglikResult;
  personANakshatra: string;
  personBNakshatra: string;
  personAMoonSign: string;
  personBMoonSign: string;
};

// ─── Lookup tables ────────────────────────────────────────────────────────────

// Varna rank by Moon sign index (0-11): Brahmin=3, Kshatriya=2, Vaishya=1, Shudra=0
// Aries=K, Taurus=V, Gemini=S, Cancer=B, Leo=K, Virgo=V, Libra=S, Scorpio=B, Sag=K, Cap=V, Aqu=S, Pisces=B
const VARNA_BY_SIGN = [2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3] as const;

// Vashya group by sign index: 1=Chatushpada, 2=Dwipada, 3=Jalchar, 4=Keeta
const VASHYA_GROUP = [1, 1, 2, 3, 1, 2, 2, 4, 2, 1, 2, 3] as const;
const VASHYA_COMPAT: number[][] = [
  //  1  2  3  4
  [2, 1, 0, 0], // group 1
  [1, 2, 0, 0], // group 2
  [0, 0, 2, 1], // group 3
  [0, 0, 1, 2], // group 4
];

// Yoni animal by nakshatra index (0-26)
type Yoni =
  | "horse" | "elephant" | "goat" | "serpent" | "dog" | "cat"
  | "rat" | "cow" | "buffalo" | "tiger" | "deer" | "monkey" | "lion" | "mongoose";

const YONI_BY_NAK: Yoni[] = [
  "horse",    // 0  Ashwini
  "elephant", // 1  Bharani
  "goat",     // 2  Krittika
  "serpent",  // 3  Rohini
  "serpent",  // 4  Mrigashira
  "dog",      // 5  Ardra
  "cat",      // 6  Punarvasu
  "goat",     // 7  Pushya
  "cat",      // 8  Ashlesha
  "rat",      // 9  Magha
  "rat",      // 10 Purva Phalguni
  "cow",      // 11 Uttara Phalguni
  "buffalo",  // 12 Hasta
  "tiger",    // 13 Chitra
  "buffalo",  // 14 Swati
  "tiger",    // 15 Vishakha
  "deer",     // 16 Anuradha
  "deer",     // 17 Jyeshtha
  "dog",      // 18 Mula
  "monkey",   // 19 Purva Ashadha
  "mongoose", // 20 Uttara Ashadha
  "monkey",   // 21 Shravana
  "lion",     // 22 Dhanishtha
  "horse",    // 23 Shatabhisha
  "lion",     // 24 Purva Bhadrapada
  "cow",      // 25 Uttara Bhadrapada
  "elephant", // 26 Revati
];

// Classical vaira (enemy) Yoni pairs → 0 points
const YONI_ENEMIES = new Set<string>([
  "horse:buffalo", "buffalo:horse",
  "dog:deer",      "deer:dog",
  "elephant:lion", "lion:elephant",
  "goat:monkey",   "monkey:goat",
  "serpent:mongoose", "mongoose:serpent",
  "cat:rat",       "rat:cat",
  "cow:tiger",     "tiger:cow",
]);

// Gana by nakshatra index
type Gana = "dev" | "manushya" | "rakshasa";
const GANA_BY_NAK: Gana[] = [
  "dev",      // 0  Ashwini
  "manushya", // 1  Bharani
  "rakshasa", // 2  Krittika
  "manushya", // 3  Rohini
  "dev",      // 4  Mrigashira
  "manushya", // 5  Ardra
  "dev",      // 6  Punarvasu
  "dev",      // 7  Pushya
  "rakshasa", // 8  Ashlesha
  "rakshasa", // 9  Magha
  "manushya", // 10 Purva Phalguni
  "manushya", // 11 Uttara Phalguni
  "dev",      // 12 Hasta
  "rakshasa", // 13 Chitra
  "dev",      // 14 Swati
  "rakshasa", // 15 Vishakha
  "dev",      // 16 Anuradha
  "rakshasa", // 17 Jyeshtha
  "rakshasa", // 18 Mula
  "manushya", // 19 Purva Ashadha
  "manushya", // 20 Uttara Ashadha
  "dev",      // 21 Shravana
  "rakshasa", // 22 Dhanishtha
  "rakshasa", // 23 Shatabhisha
  "manushya", // 24 Purva Bhadrapada
  "manushya", // 25 Uttara Bhadrapada
  "dev",      // 26 Revati
];

// Nadi by nakshatra index: 0=Adi (Vata), 1=Madhya (Pitta), 2=Antya (Kapha)
// Pattern repeats: [0,1,2, 2,1,0, 0,1,2] × 3
const NADI_BY_NAK: number[] = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, // 0-8
  2, 1, 0, 0, 1, 2, 2, 1, 0, // 9-17
  0, 1, 2, 2, 1, 0, 0, 1, 2, // 18-26
];

// Natural (naisargika) planetary affinity for Graha Maitri
type Affinity = "friend" | "neutral" | "enemy";
const PLANET_AFFINITY: Record<string, Record<string, Affinity>> = {
  Sun: {
    Sun: "friend", Moon: "friend", Mars: "friend",    Mercury: "neutral",
    Jupiter: "friend",  Venus: "enemy",  Saturn: "enemy", Rahu: "enemy", Ketu: "enemy",
  },
  Moon: {
    Sun: "friend", Moon: "friend", Mars: "neutral",  Mercury: "friend",
    Jupiter: "neutral", Venus: "neutral", Saturn: "neutral", Rahu: "enemy", Ketu: "enemy",
  },
  Mars: {
    Sun: "friend", Moon: "friend", Mars: "friend",   Mercury: "enemy",
    Jupiter: "friend",  Venus: "neutral", Saturn: "neutral", Rahu: "enemy", Ketu: "neutral",
  },
  Mercury: {
    Sun: "friend", Moon: "enemy",  Mars: "neutral",  Mercury: "friend",
    Jupiter: "neutral", Venus: "friend",  Saturn: "neutral", Rahu: "neutral", Ketu: "neutral",
  },
  Jupiter: {
    Sun: "friend", Moon: "friend", Mars: "friend",   Mercury: "enemy",
    Jupiter: "friend",  Venus: "enemy",  Saturn: "neutral", Rahu: "enemy", Ketu: "neutral",
  },
  Venus: {
    Sun: "enemy",  Moon: "enemy",  Mars: "neutral",  Mercury: "friend",
    Jupiter: "neutral", Venus: "friend",  Saturn: "friend", Rahu: "friend", Ketu: "neutral",
  },
  Saturn: {
    Sun: "enemy",  Moon: "enemy",  Mars: "enemy",    Mercury: "friend",
    Jupiter: "neutral", Venus: "friend",  Saturn: "friend", Rahu: "friend", Ketu: "neutral",
  },
  Rahu: {
    Sun: "enemy",  Moon: "enemy",  Mars: "enemy",    Mercury: "friend",
    Jupiter: "neutral", Venus: "friend",  Saturn: "friend", Rahu: "friend", Ketu: "enemy",
  },
  Ketu: {
    Sun: "enemy",  Moon: "enemy",  Mars: "friend",   Mercury: "neutral",
    Jupiter: "neutral", Venus: "friend",  Saturn: "friend", Rahu: "enemy", Ketu: "friend",
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function nakIdx(longitude: number): number {
  return Math.floor((longitude % 360) / (360 / 27));
}

// ─── Koota functions ──────────────────────────────────────────────────────────

// 1. Varna (1 pt): personA assumed groom — score 1 if groom varna >= bride varna
function computeVarna(signA: number, signB: number): KootaScore {
  return { score: VARNA_BY_SIGN[signA] >= VARNA_BY_SIGN[signB] ? 1 : 0, max: 1 };
}

// 2. Vashya (2 pt): based on Moon sign control groups
function computeVashya(signA: number, signB: number): KootaScore {
  const gA = VASHYA_GROUP[signA] - 1;
  const gB = VASHYA_GROUP[signB] - 1;
  return { score: VASHYA_COMPAT[gA][gB], max: 2 };
}

// 3. Tara (3 pt): count of nakshatras A→B and B→A, check auspicious Tara position
function computeTara(nakA: number, nakB: number): KootaScore {
  const BAD = new Set([3, 5, 7]);
  const taraA = ((nakB - nakA + 27) % 27) % 9 + 1;
  const taraB = ((nakA - nakB + 27) % 27) % 9 + 1;
  const aGood = !BAD.has(taraA);
  const bGood = !BAD.has(taraB);
  const score = aGood && bGood ? 3 : aGood || bGood ? 1.5 : 0;
  return { score, max: 3 };
}

// 4. Yoni (4 pt): animal symbol compatibility
function computeYoni(nakA: number, nakB: number): KootaScore {
  const yA = YONI_BY_NAK[nakA];
  const yB = YONI_BY_NAK[nakB];
  if (yA === yB) return { score: 4, max: 4 };
  if (YONI_ENEMIES.has(`${yA}:${yB}`)) return { score: 0, max: 4 };
  return { score: 2, max: 4 }; // neutral
}

// 5. Graha Maitri (5 pt): nakshatra lord friendship
function computeGrahaMaitri(nakA: number, nakB: number): KootaScore {
  const lordA = NAKSHATRAS[nakA].lord;
  const lordB = NAKSHATRAS[nakB].lord;
  if (lordA === lordB) return { score: 5, max: 5 };
  const ab = PLANET_AFFINITY[lordA]?.[lordB] ?? "neutral";
  const ba = PLANET_AFFINITY[lordB]?.[lordA] ?? "neutral";
  let score: number;
  if (ab === "friend" && ba === "friend")   score = 5;
  else if (ab === "friend" && ba === "neutral") score = 4;
  else if (ab === "neutral" && ba === "friend") score = 4;
  else if (ab === "neutral" && ba === "neutral") score = 3;
  else if ((ab === "friend" && ba === "enemy") || (ab === "enemy" && ba === "friend")) score = 1;
  else if ((ab === "neutral" && ba === "enemy") || (ab === "enemy" && ba === "neutral")) score = 0.5;
  else score = 0; // both enemy
  return { score, max: 5 };
}

// 6. Gana (6 pt): temperament match
function computeGana(nakA: number, nakB: number): KootaScore {
  const gA = GANA_BY_NAK[nakA];
  const gB = GANA_BY_NAK[nakB];
  if (gA === gB) return { score: 6, max: 6 };
  if ((gA === "dev" && gB === "manushya") || (gA === "manushya" && gB === "dev")) return { score: 5, max: 6 };
  if ((gA === "dev" && gB === "rakshasa") || (gA === "rakshasa" && gB === "dev")) return { score: 1, max: 6 };
  return { score: 0, max: 6 }; // manushya ↔ rakshasa
}

// 7. Bhakoot (7 pt): Moon sign relationship — 0 for Shadashtak(6/8) or Dwirdwadasha(12/2)
function computeBhakoot(signA: number, signB: number): KootaScore {
  const ab = (signB - signA + 12) % 12 + 1;
  const ba = (signA - signB + 12) % 12 + 1;
  const bad = (ab === 6 && ba === 8) || (ab === 8 && ba === 6)
           || (ab === 12 && ba === 2) || (ab === 2 && ba === 12);
  return { score: bad ? 0 : 7, max: 7 };
}

// 8. Nadi (8 pt): same Nadi = Nadi Dosha (0 pts), different = 8 pts
function computeNadi(nakA: number, nakB: number): KootaScore {
  return { score: NADI_BY_NAK[nakA] === NADI_BY_NAK[nakB] ? 0 : 8, max: 8 };
}

// ─── Manglik ──────────────────────────────────────────────────────────────────

export function computeManglik(chart: BirthChart): boolean {
  const mars = chart.planets.find((p) => p.planet === "Mars");
  return mars ? [1, 4, 7, 8, 12].includes(mars.house) : false;
}

export function checkManglikCancellation(chartA: BirthChart, chartB: BirthChart): boolean {
  const mA = computeManglik(chartA);
  const mB = computeManglik(chartB);
  if (mA && mB) return true; // mutual cancellation
  const marsA = chartA.planets.find((p) => p.planet === "Mars");
  const marsB = chartB.planets.find((p) => p.planet === "Mars");
  // Mars in own sign (Aries=0, Scorpio=7) or exalted (Capricorn=9) cancels individual dosha
  if (mA && marsA && [0, 7, 9].includes(marsA.signIndex)) return true;
  if (mB && marsB && [0, 7, 9].includes(marsB.signIndex)) return true;
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function computeCompatibility(
  chartA: BirthChart,
  chartB: BirthChart
): CompatibilityResult {
  const moonA = chartA.planets.find((p) => p.planet === "Moon")!;
  const moonB = chartB.planets.find((p) => p.planet === "Moon")!;
  const nakA = nakIdx(moonA.longitude);
  const nakB = nakIdx(moonB.longitude);

  const breakdown: AshtakootBreakdown = {
    varna:       computeVarna(moonA.signIndex, moonB.signIndex),
    vashya:      computeVashya(moonA.signIndex, moonB.signIndex),
    tara:        computeTara(nakA, nakB),
    yoni:        computeYoni(nakA, nakB),
    grahaMaitri: computeGrahaMaitri(nakA, nakB),
    gana:        computeGana(nakA, nakB),
    bhakoot:     computeBhakoot(moonA.signIndex, moonB.signIndex),
    nadi:        computeNadi(nakA, nakB),
  };

  const totalScore = Object.values(breakdown).reduce((sum, k) => sum + k.score, 0);

  const rating =
    totalScore >= 32 ? "excellent" :
    totalScore >= 24 ? "good" :
    totalScore >= 18 ? "acceptable" : "not_recommended";

  return {
    totalScore,
    maxScore: 36,
    rating,
    breakdown,
    manglik: {
      personA: computeManglik(chartA),
      personB: computeManglik(chartB),
      cancels: checkManglikCancellation(chartA, chartB),
    },
    personANakshatra: NAKSHATRAS[nakA].name,
    personBNakshatra: NAKSHATRAS[nakB].name,
    personAMoonSign:  moonA.sign,
    personBMoonSign:  moonB.sign,
  };
}
