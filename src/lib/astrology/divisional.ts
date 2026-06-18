import type { PlanetPosition, Planet, Sign } from "./types";
import { SIGNS } from "./types";

export type DivisionalPlanetPosition = {
  planet: Planet;
  sign: Sign;
  signIndex: number;
  house: number; // 1–12, relative to divisional lagna
};

export type DivisionalChartResult = {
  division: 9 | 10 | 12 | 7;
  lagna: { sign: Sign; signIndex: number };
  planets: DivisionalPlanetPosition[];
};

// Navamsa (D-9): each sign has 9 padas of 3°20'. Starting sign depends on element:
// Fire (0,4,8) → Aries(0), Earth (1,5,9) → Capricorn(9), Air (2,6,10) → Libra(6), Water (3,7,11) → Cancer(3)
const D9_STARTS = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3] as const;

// In Jyotish, sign numbering is 1-based: Aries=1(odd), Taurus=2(even)...
// 0-indexed: even index = Jyotish odd sign; odd index = Jyotish even sign
function isJyotishOdd(signIdx: number): boolean {
  return signIdx % 2 === 0;
}

function getDivisionalSignIdx(longitude: number, division: 9 | 10 | 12 | 7): number {
  const signIdx = Math.floor(longitude / 30) % 12;
  const degree = longitude % 30;
  const odd = isJyotishOdd(signIdx);

  switch (division) {
    case 9: {
      // 9 divisions of 3°20' each
      const pada = Math.floor(degree / (30 / 9));
      return (D9_STARTS[signIdx] + pada) % 12;
    }
    case 10: {
      // 10 divisions of 3° each; odd signs count from same sign, even from 9th
      const pos = Math.floor(degree / 3);
      return odd ? (signIdx + pos) % 12 : (signIdx + 8 + pos) % 12;
    }
    case 12: {
      // 12 divisions of 2.5° each; all signs count from same sign
      const pos = Math.floor(degree / 2.5);
      return (signIdx + pos) % 12;
    }
    case 7: {
      // 7 divisions of ~4°17' each; odd signs count from same sign, even from 7th
      const pos = Math.floor(degree / (30 / 7));
      return odd ? (signIdx + pos) % 12 : (signIdx + 6 + pos) % 12;
    }
  }
}

export function computeDivisionalChart(
  natalPlanets: PlanetPosition[],
  ascendantLongitude: number,
  division: 9 | 10 | 12 | 7
): DivisionalChartResult {
  const lagnaSignIdx = getDivisionalSignIdx(ascendantLongitude, division);

  const planets: DivisionalPlanetPosition[] = natalPlanets.map((p) => {
    const signIdx = getDivisionalSignIdx(p.longitude, division);
    const house = ((signIdx - lagnaSignIdx + 12) % 12) + 1;
    return {
      planet: p.planet,
      sign: SIGNS[signIdx] as Sign,
      signIndex: signIdx,
      house,
    };
  });

  return {
    division,
    lagna: { sign: SIGNS[lagnaSignIdx] as Sign, signIndex: lagnaSignIdx },
    planets,
  };
}
