import { moonposition, planetposition } from "astronomia";
import earthData from "astronomia/data/vsop87Bearth";
import { lahiriAyanamsa } from "./calculator";

const earth = new planetposition.Planet(earthData);
const PI = Math.PI;

function norm360(d: number): number {
  return ((d % 360) + 360) % 360;
}

// ─── Name tables ──────────────────────────────────────────────────────────────

export const TITHI_NAMES = [
  "Shukla Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima",
  "Krishna Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Amavasya",
] as const;

export const VARA_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export const NAKSHATRA_NAMES = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu",
  "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta",
  "Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha",
  "Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada",
  "Uttara Bhadrapada","Revati",
] as const;

export const YOGA_NAMES = [
  "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda",
  "Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata",
  "Harshana","Vajra","Siddhi","Vyatipata","Variyan","Parigha","Shiva",
  "Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti",
] as const;

export const KARANA_NAMES = [
  "Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti",
  "Shakuni","Chatushpada","Naga","Kimstughna",
] as const;

// Yogas considered inauspicious for auspicious events
export const BAD_YOGAS = new Set([0, 5, 8, 9, 12, 14, 16, 18, 26]);

// ─── Types ────────────────────────────────────────────────────────────────────

export type PanchangResult = {
  tithi: number;      // 1-30
  tithiName: string;
  vara: number;       // 0-6 (Sun=0, Mon=1, ..., Sat=6)
  varaName: string;
  nakshatra: number;  // 0-26
  nakshatraName: string;
  yoga: number;       // 0-26
  yogaName: string;
  karana: number;     // 0-10
  karanaName: string;
};

// ─── Core computation ─────────────────────────────────────────────────────────

function getSunMoonSidereal(jd: number): { sun: number; moon: number } {
  const year = 2000 + (jd - 2451545.0) / 365.25;
  const ayanamsa = lahiriAyanamsa(year);
  const sunTrop  = norm360((earth.position(jd).lon + PI) * 180 / PI);
  const moonTrop = norm360(moonposition.position(jd).lon * 180 / PI);
  return {
    sun:  norm360(sunTrop  - ayanamsa),
    moon: norm360(moonTrop - ayanamsa),
  };
}

export function computePanchang(jd: number): PanchangResult {
  const { sun, moon } = getSunMoonSidereal(jd);

  // Tithi: how far Moon is ahead of Sun in multiples of 12°
  const diff = norm360(moon - sun);
  const tithi = Math.floor(diff / 12) + 1; // 1-30

  // Vara: weekday from JD (0=Sunday, 1=Monday, ..., 6=Saturday)
  const vara = Math.floor((jd + 1.5) % 7);

  // Nakshatra: Moon's sidereal position divided into 27 equal parts
  const nakshatra = Math.floor((moon * 27) / 360);

  // Yoga: sum of Sun + Moon sidereal longitudes / (360/27)
  const yoga = Math.floor(norm360(sun + moon) * 27 / 360) % 27;

  // Karana: every half-Tithi (each 6° of elongation)
  const karanaSeq = Math.floor(diff / 6); // 0-59
  let karana: number;
  if (karanaSeq === 0) karana = 10;                   // Kimstughna (fixed)
  else if (karanaSeq >= 57) karana = 7 + (karanaSeq - 57); // Shakuni, Chatushpada, Naga
  else karana = (karanaSeq - 1) % 7;                  // 7 movable, cycling

  return {
    tithi,
    tithiName:    TITHI_NAMES[tithi - 1],
    vara,
    varaName:     VARA_NAMES[vara],
    nakshatra,
    nakshatraName: NAKSHATRA_NAMES[nakshatra],
    yoga,
    yogaName:     YOGA_NAMES[yoga],
    karana,
    karanaName:   KARANA_NAMES[karana],
  };
}
