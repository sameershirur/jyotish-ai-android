export const NAKSHATRAS = [
  { name: "Ashwini",           lord: "Ketu",    dashaYears: 7  },
  { name: "Bharani",           lord: "Venus",   dashaYears: 20 },
  { name: "Krittika",          lord: "Sun",     dashaYears: 6  },
  { name: "Rohini",            lord: "Moon",    dashaYears: 10 },
  { name: "Mrigashira",        lord: "Mars",    dashaYears: 7  },
  { name: "Ardra",             lord: "Rahu",    dashaYears: 18 },
  { name: "Punarvasu",         lord: "Jupiter", dashaYears: 16 },
  { name: "Pushya",            lord: "Saturn",  dashaYears: 19 },
  { name: "Ashlesha",          lord: "Mercury", dashaYears: 17 },
  { name: "Magha",             lord: "Ketu",    dashaYears: 7  },
  { name: "Purva Phalguni",    lord: "Venus",   dashaYears: 20 },
  { name: "Uttara Phalguni",   lord: "Sun",     dashaYears: 6  },
  { name: "Hasta",             lord: "Moon",    dashaYears: 10 },
  { name: "Chitra",            lord: "Mars",    dashaYears: 7  },
  { name: "Swati",             lord: "Rahu",    dashaYears: 18 },
  { name: "Vishakha",          lord: "Jupiter", dashaYears: 16 },
  { name: "Anuradha",          lord: "Saturn",  dashaYears: 19 },
  { name: "Jyeshtha",          lord: "Mercury", dashaYears: 17 },
  { name: "Mula",              lord: "Ketu",    dashaYears: 7  },
  { name: "Purva Ashadha",     lord: "Venus",   dashaYears: 20 },
  { name: "Uttara Ashadha",    lord: "Sun",     dashaYears: 6  },
  { name: "Shravana",          lord: "Moon",    dashaYears: 10 },
  { name: "Dhanishtha",        lord: "Mars",    dashaYears: 7  },
  { name: "Shatabhisha",       lord: "Rahu",    dashaYears: 18 },
  { name: "Purva Bhadrapada",  lord: "Jupiter", dashaYears: 16 },
  { name: "Uttara Bhadrapada", lord: "Saturn",  dashaYears: 19 },
  { name: "Revati",            lord: "Mercury", dashaYears: 17 },
] as const;

export const VIMSHOTTARI_ORDER = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
] as const;

export const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

export function getNakshatra(siderealLon: number) {
  const nakshatraSpan = 360 / 27;
  const idx = Math.floor(siderealLon / nakshatraSpan);
  const progress = (siderealLon % nakshatraSpan) / nakshatraSpan;
  const pada = Math.floor(progress * 4) + 1;
  return { ...NAKSHATRAS[idx], index: idx, pada, progress };
}
