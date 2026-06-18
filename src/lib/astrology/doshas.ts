import type { PlanetPosition, DoshaResult } from "./types";

function getHouse(planets: PlanetPosition[], planet: string): number {
  return planets.find((p) => p.planet === planet)?.house ?? 0;
}

function inHouse(planets: PlanetPosition[], planet: string, ...houses: number[]): boolean {
  return houses.includes(getHouse(planets, planet));
}

export function detectDoshas(planets: PlanetPosition[]): DoshaResult[] {
  const doshas: DoshaResult[] = [];

  // Mangal (Manglik) Dosha: Mars in 1, 2, 4, 7, 8, or 12
  const marsH = getHouse(planets, "Mars");
  const manglik = [1, 2, 4, 7, 8, 12].includes(marsH);
  const mangalikHouses = [1, 2, 4, 7, 8, 12].filter((h) => h === marsH);
  doshas.push({
    name: "Mangal (Manglik) Dosha",
    present: manglik,
    severity: marsH === 7 || marsH === 8 ? "high" : manglik ? "moderate" : undefined,
    description: manglik
      ? `Mars in house ${marsH} creates Manglik Dosha, affecting marriage harmony and partnership dynamics.`
      : "No Manglik Dosha — Mars is not in any of the sensitive houses (1,2,4,7,8,12).",
    remedy: manglik
      ? "Remedies: Perform Mangal Puja on Tuesdays, recite Mangal Stotram, wear coral gemstone after consulting a jyotishi. Partner with Manglik can neutralize the dosha."
      : undefined,
  });

  // Kaal Sarpa Dosha: all planets between Rahu and Ketu (same hemicircle)
  const rahuH = getHouse(planets, "Rahu");
  const ketuH = getHouse(planets, "Ketu");
  const rahuSign = planets.find((p) => p.planet === "Rahu")?.signIndex ?? 0;
  const ketuSign = planets.find((p) => p.planet === "Ketu")?.signIndex ?? 6;

  const others = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const planetSigns = others.map((p) => planets.find((pl) => pl.planet === p)?.signIndex ?? -1);

  // Check if all planets are between Rahu and Ketu going one direction
  let allBetween = true;
  const start = rahuSign;
  const end   = ketuSign;
  for (const sign of planetSigns) {
    // Going from Rahu to Ketu in forward direction (Rahu is head, Ketu is tail)
    let inRange: boolean;
    if (start <= end) {
      inRange = sign >= start && sign <= end;
    } else {
      inRange = sign >= start || sign <= end;
    }
    if (!inRange) { allBetween = false; break; }
  }

  doshas.push({
    name: "Kaal Sarpa Dosha",
    present: allBetween,
    severity: allBetween ? "high" : undefined,
    description: allBetween
      ? "All planets are hemmed between Rahu and Ketu, creating Kaal Sarpa Dosha. This can create delays, obstacles, and karmic challenges, but also immense spiritual growth."
      : "No Kaal Sarpa Dosha — not all planets are hemmed between Rahu and Ketu.",
    remedy: allBetween
      ? "Remedies: Perform Kaal Sarpa Puja at Trimbakeshwar or Nasik. Chant Mahamrityunjaya mantra 108 times daily. Donate black sesame seeds on Saturdays."
      : undefined,
  });

  // Pitru Dosha: Sun or Moon afflicted by Rahu/Ketu, or Rahu in certain houses
  const sunH = getHouse(planets, "Sun");
  const moonH = getHouse(planets, "Moon");
  const sunSign = planets.find((p) => p.planet === "Sun")?.signIndex ?? -1;
  const moonSign = planets.find((p) => p.planet === "Moon")?.signIndex ?? -1;
  const pitruDosha = sunSign === rahuSign || sunSign === ketuSign || moonSign === rahuSign || inHouse(planets, "Rahu", 9);
  doshas.push({
    name: "Pitru Dosha",
    present: pitruDosha,
    severity: pitruDosha ? "moderate" : undefined,
    description: pitruDosha
      ? "Sun or Moon afflicted by Rahu/Ketu, or Rahu in 9th house indicates ancestral karmic debts (Pitru Dosha)."
      : "No prominent Pitru Dosha detected.",
    remedy: pitruDosha
      ? "Remedies: Perform Pitru Tarpan on Amavasya (new moon). Offer water to ancestors. Perform Narayan Nagbali puja if severe."
      : undefined,
  });

  // Shrapit Dosha: Saturn and Rahu conjunct
  const satSign = planets.find((p) => p.planet === "Saturn")?.signIndex ?? -1;
  const shrapit = satSign === rahuSign;
  doshas.push({
    name: "Shrapit Dosha",
    present: shrapit,
    severity: shrapit ? "high" : undefined,
    description: shrapit
      ? "Saturn conjunct Rahu — a powerful karmic dosha indicating past-life curses, creating significant life obstacles and delays."
      : "No Shrapit Dosha — Saturn and Rahu are in different signs.",
    remedy: shrapit
      ? "Remedies: Perform Shrapit Dosha Nivaran Puja. Chant Shani Beej mantra. Donate iron, black sesame, and oil on Saturdays."
      : undefined,
  });

  // Guru Chandal Dosha: Jupiter and Rahu conjunct
  const jupSign = planets.find((p) => p.planet === "Jupiter")?.signIndex ?? -1;
  const guruChandal = jupSign === rahuSign;
  doshas.push({
    name: "Guru Chandal Dosha",
    present: guruChandal,
    severity: guruChandal ? "moderate" : undefined,
    description: guruChandal
      ? "Jupiter conjunct Rahu — distorted wisdom, issues with gurus/teachers, unorthodox beliefs, and unconventional spiritual path."
      : "No Guru Chandal Dosha.",
    remedy: guruChandal
      ? "Remedies: Recite Guru mantra daily. Serve teachers and elders. Donate yellow items on Thursdays."
      : undefined,
  });

  return doshas;
}
