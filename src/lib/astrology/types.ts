export const SIGNS = [
  "Mesha",    // Aries        0
  "Vrishabha",// Taurus       1
  "Mithuna",  // Gemini       2
  "Karka",    // Cancer       3
  "Simha",    // Leo          4
  "Kanya",    // Virgo        5
  "Tula",     // Libra        6
  "Vrischika",// Scorpio      7
  "Dhanu",    // Sagittarius  8
  "Makara",   // Capricorn    9
  "Kumbha",   // Aquarius    10
  "Meena",    // Pisces      11
] as const;

export const SIGN_LORDS = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
] as const;

export const SIGN_ELEMENTS = [
  "Fire", "Earth", "Air", "Water", "Fire", "Earth",
  "Air", "Water", "Fire", "Earth", "Air", "Water",
] as const;

export const PLANETS = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
] as const;

export type Planet = (typeof PLANETS)[number];
export type Sign = (typeof SIGNS)[number];

export type PlanetPosition = {
  planet: Planet;
  longitude: number;     // 0–360° sidereal
  sign: Sign;
  signIndex: number;     // 0–11
  degree: number;        // 0–30° within sign
  house: number;         // 1–12
  isRetrograde?: boolean;
  nakshatra: string;
  nakshatraLord: string;
  nakshatraPada: number; // 1–4
};

export type ChartInput = {
  date: string;         // ISO date e.g. "1990-06-15"
  time: string;         // HH:MM in local time
  latitude: number;
  longitude: number;
  timezone: number;     // UTC offset in hours e.g. 5.5
  place: string;        // for display
};

export type YogaResult = {
  name: string;
  present: boolean;
  description: string;
  strength?: "strong" | "moderate" | "weak";
};

export type DoshaResult = {
  name: string;
  present: boolean;
  severity?: "high" | "moderate" | "low";
  description: string;
  remedy?: string;
};

export type DashaInfo = {
  planet: Planet;
  startDate: string;
  endDate: string;
  years: number;
  currentAntardasha: {
    planet: Planet;
    startDate: string;
    endDate: string;
  };
};

export type BirthChart = {
  input: ChartInput;
  ascendant: {
    longitude: number;
    sign: Sign;
    signIndex: number;
    degree: number;
  };
  planets: PlanetPosition[];
  houses: { houseNumber: number; sign: Sign; signIndex: number }[];
  yogas: YogaResult[];
  doshas: DoshaResult[];
  currentDasha: DashaInfo;
  dashaSequence: DashaInfo[];
  lagnaLord: string;
  moonSign: Sign;
  sunSign: Sign;
};
