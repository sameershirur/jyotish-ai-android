import type { BirthChart, ChartInput } from "./types";
import { SIGNS, SIGN_LORDS } from "./types";
import { toJulianDate, computeTropicalPositions, buildPlanetPositions, lahiriAyanamsa } from "./calculator";
import { detectYogas } from "./yogas";
import { detectDoshas } from "./doshas";
import { calculateVimshottariDasha } from "./dasha";

export function generateBirthChart(input: ChartInput): BirthChart {
  const year = parseInt(input.date.split("-")[0]);
  const ayanamsa = lahiriAyanamsa(year);

  const jd = toJulianDate(input.date, input.time, input.timezone);
  const raw = computeTropicalPositions(jd, input.latitude, input.longitude);
  const { planets, ascendantSid } = buildPlanetPositions(raw, ayanamsa);

  const ascSignIdx = Math.floor(ascendantSid / 30);

  // Build 12 houses (whole-sign system from Lagna)
  const houses = Array.from({ length: 12 }, (_, i) => ({
    houseNumber: i + 1,
    signIndex: (ascSignIdx + i) % 12,
    sign: SIGNS[(ascSignIdx + i) % 12],
  }));

  const moonPlanet = planets.find((p) => p.planet === "Moon")!;
  const sunPlanet  = planets.find((p) => p.planet === "Sun")!;

  const yogas  = detectYogas(planets, ascSignIdx);
  const doshas = detectDoshas(planets);
  const { currentDasha, dashaSequence } = calculateVimshottariDasha(
    moonPlanet.longitude,
    input.date
  );

  return {
    input,
    ascendant: {
      longitude: ascendantSid,
      sign: SIGNS[ascSignIdx],
      signIndex: ascSignIdx,
      degree: ascendantSid % 30,
    },
    planets,
    houses,
    yogas,
    doshas,
    currentDasha,
    dashaSequence,
    lagnaLord: SIGN_LORDS[ascSignIdx],
    moonSign: moonPlanet.sign,
    sunSign: sunPlanet.sign,
  };
}

export type { BirthChart, ChartInput };
