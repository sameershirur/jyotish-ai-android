import type { DashaInfo, Planet } from "./types";
import { VIMSHOTTARI_ORDER, DASHA_YEARS, getNakshatra } from "./nakshatras";

const DAYS_PER_YEAR = 365.25;

export function calculateVimshottariDasha(
  moonSiderealLon: number,
  birthDate: string
): { currentDasha: DashaInfo; dashaSequence: DashaInfo[] } {
  const nak = getNakshatra(moonSiderealLon);
  const nakLord = nak.lord as Planet;
  const totalYears = DASHA_YEARS[nakLord];

  // How much of the first dasha has already elapsed (based on Moon's position in nakshatra)
  const elapsed = nak.progress; // 0–1
  const remainingYears = totalYears * (1 - elapsed);

  const birth = new Date(birthDate);

  // Build full dasha sequence starting from the nakshatra lord
  const lordIdx = VIMSHOTTARI_ORDER.indexOf(nakLord as (typeof VIMSHOTTARI_ORDER)[number]);
  const sequence: DashaInfo[] = [];
  let cursor = new Date(birth.getTime() - elapsed * totalYears * DAYS_PER_YEAR * 86400000);

  for (let i = 0; i < 9; i++) {
    const planet = VIMSHOTTARI_ORDER[(lordIdx + i) % 9] as Planet;
    const years = DASHA_YEARS[planet];
    const start = new Date(cursor);
    const end   = new Date(cursor.getTime() + years * DAYS_PER_YEAR * 86400000);

    // Calculate antardasha (sub-period) for the current dasha
    // Antardasha lords in same order starting from the mahadasha lord
    const antStart = new Date(start);
    const antLordIdx = (lordIdx + i) % 9;

    let antarCursor = new Date(start);
    let currentAntar: DashaInfo["currentAntardasha"] | null = null;
    const now = new Date();

    for (let j = 0; j < 9; j++) {
      const antPlanet = VIMSHOTTARI_ORDER[(antLordIdx + j) % 9] as Planet;
      const antYears = (years * DASHA_YEARS[antPlanet]) / 120;
      const antEnd = new Date(antarCursor.getTime() + antYears * DAYS_PER_YEAR * 86400000);
      if (antarCursor <= now && now < antEnd) {
        currentAntar = {
          planet: antPlanet,
          startDate: antarCursor.toISOString().split("T")[0],
          endDate: antEnd.toISOString().split("T")[0],
        };
      }
      antarCursor = antEnd;
    }

    sequence.push({
      planet,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      years,
      currentAntardasha: currentAntar ?? {
        planet: VIMSHOTTARI_ORDER[(antLordIdx) % 9] as Planet,
        startDate: start.toISOString().split("T")[0],
        endDate: start.toISOString().split("T")[0],
      },
    });

    cursor = end;
  }

  const now = new Date();
  const currentDasha = sequence.find((d) => {
    return new Date(d.startDate) <= now && now <= new Date(d.endDate);
  }) ?? sequence[0];

  return { currentDasha, dashaSequence: sequence };
}
