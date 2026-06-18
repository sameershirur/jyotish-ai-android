import { julian } from "astronomia";
import {
  computeTropicalPositions,
  buildPlanetPositions,
  lahiriAyanamsa,
} from "./calculator";
import type { BirthChart, PlanetPosition } from "./types";
import { SIGNS } from "./types";

export type SadesatiResult = {
  active: boolean;
  phase: "rising" | "peak" | "setting" | null;
};

export type SignificantTransit = {
  transitPlanet: string;
  natalPlanet: string;
  aspect: "conjunction" | "opposition";
  transitSign: string;
  transitHouse: number;
};

export type TransitResult = {
  transitDate: string;
  transitPlanets: PlanetPosition[];
  sadesati: SadesatiResult;
  significantTransits: SignificantTransit[];
};

// JAA-107: Saturn in 12th from Moon = rising, 1st = peak, 2nd = setting
export function detectSadesati(
  natalMoonSignIdx: number,
  transitSaturnSignIdx: number
): SadesatiResult {
  const diff = (transitSaturnSignIdx - natalMoonSignIdx + 12) % 12;
  if (diff === 11) return { active: true, phase: "rising" };
  if (diff === 0)  return { active: true, phase: "peak" };
  if (diff === 1)  return { active: true, phase: "setting" };
  return { active: false, phase: null };
}

// JAA-106: compute current planetary positions and overlay on natal chart
export function computeTransits(
  natalChart: BirthChart,
  transitDate?: Date
): TransitResult {
  const now = transitDate ?? new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  // Use noon UTC on the transit date for stable daily positions
  const noonUtc = new Date(Date.UTC(y, m, d, 12, 0, 0));
  const jd: number = julian.DateToJD(noonUtc);
  const ayanamsa = lahiriAyanamsa(y);

  // Compute transit positions using natal birth location (ascendant not used for transits)
  const raw = computeTropicalPositions(
    jd,
    natalChart.input.latitude,
    natalChart.input.longitude
  );
  const { planets: transitRaw } = buildPlanetPositions(raw, ayanamsa);

  // Re-map transit planets to natal houses (relative to natal lagna)
  const natalLagnaIdx = natalChart.ascendant.signIndex;
  const transitPlanets: PlanetPosition[] = transitRaw.map((p) => ({
    ...p,
    house: ((p.signIndex - natalLagnaIdx + 12) % 12) + 1,
  }));

  // Sadesati check
  const natalMoon = natalChart.planets.find((p) => p.planet === "Moon");
  const transitSaturn = transitRaw.find((p) => p.planet === "Saturn");
  const sadesati: SadesatiResult =
    natalMoon && transitSaturn
      ? detectSadesati(natalMoon.signIndex, transitSaturn.signIndex)
      : { active: false, phase: null };

  // Significant transits: conjunctions and oppositions within 5° orb
  const ORB = 5;
  const significantTransits: SignificantTransit[] = [];

  for (const tp of transitRaw) {
    for (const np of natalChart.planets) {
      const diff = Math.abs(tp.longitude - np.longitude);
      const arc = Math.min(diff, 360 - diff);
      if (arc <= ORB) {
        significantTransits.push({
          transitPlanet: tp.planet,
          natalPlanet: np.planet,
          aspect: "conjunction",
          transitSign: SIGNS[tp.signIndex],
          transitHouse: ((tp.signIndex - natalLagnaIdx + 12) % 12) + 1,
        });
      } else if (Math.abs(arc - 180) <= ORB) {
        significantTransits.push({
          transitPlanet: tp.planet,
          natalPlanet: np.planet,
          aspect: "opposition",
          transitSign: SIGNS[tp.signIndex],
          transitHouse: ((tp.signIndex - natalLagnaIdx + 12) % 12) + 1,
        });
      }
    }
  }

  const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return { transitDate: dateStr, transitPlanets, sadesati, significantTransits };
}
