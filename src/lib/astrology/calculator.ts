import type { PlanetPosition, Planet, Sign } from "./types";
import { SIGNS, SIGN_LORDS } from "./types";
import { getNakshatra } from "./nakshatras";

import { julian, moonposition, moonnode, sidereal, planetposition } from "astronomia";
import earthData    from "astronomia/data/vsop87Bearth";
import marsData     from "astronomia/data/vsop87Bmars";
import venusData    from "astronomia/data/vsop87Bvenus";
import mercuryData  from "astronomia/data/vsop87Bmercury";
import jupiterData  from "astronomia/data/vsop87Bjupiter";
import saturnData   from "astronomia/data/vsop87Bsaturn";

const earth   = new planetposition.Planet(earthData);
const marsP   = new planetposition.Planet(marsData);
const venusP  = new planetposition.Planet(venusData);
const mercP   = new planetposition.Planet(mercuryData);
const jupP    = new planetposition.Planet(jupiterData);
const satP    = new planetposition.Planet(saturnData);

const PI2 = 2 * Math.PI;

/** Lahiri (Chitrapaksha) ayanamsa in degrees for a given year */
export function lahiriAyanamsa(year: number): number {
  return 23.8507 + (year - 2000) * 0.0136;
}

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function tropicalToSidereal(tropLon: number, ayanamsa: number): number {
  return norm360(tropLon - ayanamsa);
}

function planetInfo(sidLon: number, houseOffset: number, planet: Planet): PlanetPosition {
  const signIdx = Math.floor(sidLon / 30);
  const house = ((signIdx - houseOffset + 12) % 12) + 1;
  const nak = getNakshatra(sidLon);
  return {
    planet,
    longitude: sidLon,
    sign: SIGNS[signIdx] as Sign,
    signIndex: signIdx,
    degree: sidLon % 30,
    house,
    nakshatra: nak.name,
    nakshatraLord: nak.lord,
    nakshatraPada: nak.pada,
  };
}

export type RawPositions = {
  sun: number; moon: number; mars: number; mercury: number;
  jupiter: number; venus: number; saturn: number; rahu: number; ketu: number;
  ascendant: number;
};

/** Compute all tropical longitudes from a Julian Date + birth location */
export function computeTropicalPositions(
  jd: number,
  latDeg: number,
  lonDeg: number
): RawPositions {
  // Sun: geocentric = Earth heliocentric lon + 180°
  const eLon = earth.position(jd).lon as number;
  const sunTrop = norm360((eLon + Math.PI) * 180 / Math.PI);

  // Moon
  const moonTrop = norm360((moonposition.position(jd).lon as number) * 180 / Math.PI);

  // Outer planets (heliocentric ~= geocentric for slow planets, good enough for Vedic)
  function getLon(p: { position: (jd: number) => { lon: number } }): number {
    return norm360((p.position(jd).lon as number) * 180 / Math.PI);
  }

  // Rahu (North lunar node) — always retrograde
  const rahuTrop = norm360((moonnode.ascending(jd) as number) * 180 / Math.PI);
  const ketuTrop = norm360(rahuTrop + 180);

  // Ascendant: from Local Mean Sidereal Time
  const gastRad = ((sidereal.apparent(jd) as number) % PI2 + PI2) % PI2;
  const lmst = ((gastRad + (lonDeg * Math.PI / 180)) % PI2 + PI2) % PI2;
  const eps = 23.44 * Math.PI / 180;
  const lat = latDeg * Math.PI / 180;
  const ascRaw = Math.atan2(
    -Math.cos(lmst),
    Math.sin(lmst) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)
  );
  const ascTrop = norm360(ascRaw * 180 / Math.PI);

  return {
    sun: sunTrop,
    moon: moonTrop,
    mars: getLon(marsP),
    mercury: getLon(mercP),
    jupiter: getLon(jupP),
    venus: getLon(venusP),
    saturn: getLon(satP),
    rahu: rahuTrop,
    ketu: ketuTrop,
    ascendant: ascTrop,
  };
}

/** Convert all tropical longitudes to sidereal and build PlanetPosition array */
export function buildPlanetPositions(
  raw: RawPositions,
  ayanamsa: number
): { planets: PlanetPosition[]; ascendantSid: number } {
  const sid = {
    sun:       tropicalToSidereal(raw.sun, ayanamsa),
    moon:      tropicalToSidereal(raw.moon, ayanamsa),
    mars:      tropicalToSidereal(raw.mars, ayanamsa),
    mercury:   tropicalToSidereal(raw.mercury, ayanamsa),
    jupiter:   tropicalToSidereal(raw.jupiter, ayanamsa),
    venus:     tropicalToSidereal(raw.venus, ayanamsa),
    saturn:    tropicalToSidereal(raw.saturn, ayanamsa),
    rahu:      tropicalToSidereal(raw.rahu, ayanamsa),
    ketu:      tropicalToSidereal(raw.ketu, ayanamsa),
    ascendant: tropicalToSidereal(raw.ascendant, ayanamsa),
  };

  const lagnaSignIdx = Math.floor(sid.ascendant / 30);

  const planets: PlanetPosition[] = [
    planetInfo(sid.sun,     lagnaSignIdx, "Sun"),
    planetInfo(sid.moon,    lagnaSignIdx, "Moon"),
    planetInfo(sid.mars,    lagnaSignIdx, "Mars"),
    planetInfo(sid.mercury, lagnaSignIdx, "Mercury"),
    planetInfo(sid.jupiter, lagnaSignIdx, "Jupiter"),
    planetInfo(sid.venus,   lagnaSignIdx, "Venus"),
    planetInfo(sid.saturn,  lagnaSignIdx, "Saturn"),
    { ...planetInfo(sid.rahu, lagnaSignIdx, "Rahu"), isRetrograde: true },
    { ...planetInfo(sid.ketu, lagnaSignIdx, "Ketu"), isRetrograde: true },
  ];

  return { planets, ascendantSid: sid.ascendant };
}

/** Julian Date from date string (YYYY-MM-DD), local time HH:MM, and UTC offset */
export function toJulianDate(date: string, time: string, utcOffset: number): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const utcDecimal = h + min / 60 - utcOffset;
  const utcDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  utcDate.setUTCHours(0);
  // Pass as a JS Date to julian.DateToJD
  const baseJd: number = julian.DateToJD(utcDate);
  return baseJd + utcDecimal / 24;
}

export { SIGNS, SIGN_LORDS };
