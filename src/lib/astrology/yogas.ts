import type { PlanetPosition, YogaResult } from "./types";

function inSameHouse(planets: PlanetPosition[], a: string, b: string): boolean {
  const pa = planets.find((p) => p.planet === a);
  const pb = planets.find((p) => p.planet === b);
  return !!pa && !!pb && pa.house === pb.house;
}

function getHouse(planets: PlanetPosition[], planet: string): number {
  return planets.find((p) => p.planet === planet)?.house ?? 0;
}

function inHouse(planets: PlanetPosition[], planet: string, ...houses: number[]): boolean {
  const h = getHouse(planets, planet);
  return houses.includes(h);
}

// Planets in kendra (1,4,7,10) or trikona (1,5,9)
function inKendra(h: number) { return [1, 4, 7, 10].includes(h); }
function inTrikona(h: number) { return [1, 5, 9].includes(h); }

export function detectYogas(planets: PlanetPosition[], lagnaSignIndex: number): YogaResult[] {
  const yogas: YogaResult[] = [];

  // Gaja Kesari Yoga: Moon and Jupiter in kendra from each other
  const moonH = getHouse(planets, "Moon");
  const jupH  = getHouse(planets, "Jupiter");
  const moonJupDiff = Math.abs(moonH - jupH);
  const gajaKesari = [0, 3, 6, 9].includes(moonJupDiff) || [12 - 3, 12 - 6, 12 - 9].includes(moonJupDiff);
  yogas.push({
    name: "Gaja Kesari Yoga",
    present: gajaKesari,
    strength: gajaKesari ? "strong" : undefined,
    description: "Moon and Jupiter in kendra from each other — wisdom, fame, and prosperity.",
  });

  // Budhaditya Yoga: Sun and Mercury in same house
  const budhaditya = inSameHouse(planets, "Sun", "Mercury");
  yogas.push({
    name: "Budhaditya Yoga",
    present: budhaditya,
    strength: budhaditya ? "moderate" : undefined,
    description: "Sun conjunct Mercury — sharp intellect, good communication, and analytical mind.",
  });

  // Panch Mahapurush: Mars/Mercury/Jupiter/Venus/Saturn in kendra in own/exalted sign
  const exaltationSigns: Record<string, number> = {
    Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
  };
  const ownSigns: Record<string, number[]> = {
    Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
  };

  for (const [planet, exaltSign] of Object.entries(exaltationSigns)) {
    const pl = planets.find((p) => p.planet === planet);
    if (!pl) continue;
    const inKend = inKendra(pl.house);
    const inExalt = pl.signIndex === exaltSign;
    const inOwn   = (ownSigns[planet] ?? []).includes(pl.signIndex);
    const mahaYogas: Record<string, string> = {
      Mars:    "Ruchaka Yoga",
      Mercury: "Bhadra Yoga",
      Jupiter: "Hamsa Yoga",
      Venus:   "Malavya Yoga",
      Saturn:  "Sasa Yoga",
    };
    if (mahaYogas[planet]) {
      const present = inKend && (inExalt || inOwn);
      yogas.push({
        name: mahaYogas[planet],
        present,
        strength: present ? "strong" : undefined,
        description: `${planet} in kendra in own/exaltation sign — one of the Panch Mahapurush Yogas conferring excellence in ${planet === "Jupiter" ? "wisdom and dharma" : planet === "Venus" ? "arts and luxury" : planet === "Mars" ? "leadership and courage" : planet === "Mercury" ? "intellect and business" : "discipline and authority"}.`,
      });
    }
  }

  // Raja Yoga: lord of kendra + lord of trikona in kendra/trikona
  const lagnaLordIdx = lagnaSignIndex;
  const sunH = getHouse(planets, "Sun");
  const rajYoga = (inKendra(sunH) && inTrikona(jupH)) || (inTrikona(sunH) && inKendra(jupH));
  yogas.push({
    name: "Raja Yoga (Sun-Jupiter)",
    present: rajYoga,
    strength: rajYoga ? "moderate" : undefined,
    description: "Sun and Jupiter in kendra/trikona combination — authority, leadership, and success in career.",
  });

  // Dhana Yoga: lords of 2nd and 11th together
  yogas.push({
    name: "Dhana Yoga",
    present: inSameHouse(planets, "Jupiter", "Venus"),
    description: "Jupiter and Venus conjunct — wealth, abundance, and material prosperity.",
  });

  // Viparita Raja Yoga: 6/8/12 lord in 6/8/12 house
  const marsHouse = getHouse(planets, "Mars");
  const satHouse  = getHouse(planets, "Saturn");
  const vipRaja = [6, 8, 12].includes(marsHouse) && [6, 8, 12].includes(satHouse);
  yogas.push({
    name: "Viparita Raja Yoga",
    present: vipRaja,
    description: "Malefics in dusthana houses — overcoming adversity leads to unexpected rise and success.",
  });

  return yogas;
}
