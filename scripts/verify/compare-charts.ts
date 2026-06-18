// One-off verification for JAA-148: confirms the ported lib/astrology/* under
// src/lib/astrology produces output identical to the web app's copy, for
// several reference birth charts. Run under Node/V8 — does NOT verify Hermes
// behavior on-device (see docs/HERMES_VERIFICATION.md for that follow-up).
import { generateBirthChart as generateWeb } from "../../../jyotish-ai/lib/astrology";
import { generateBirthChart as generateRN } from "../../src/lib/astrology";
import type { ChartInput } from "../../src/lib/astrology/types";

const referenceCharts: { label: string; input: ChartInput }[] = [
  {
    label: "Mumbai noon birth",
    input: { date: "1990-06-15", time: "12:00", latitude: 18.975, longitude: 72.8258, timezone: 5.5, place: "Mumbai" },
  },
  {
    label: "Delhi early morning birth",
    input: { date: "1985-01-26", time: "04:30", latitude: 28.6139, longitude: 77.209, timezone: 5.5, place: "Delhi" },
  },
  {
    label: "Chennai evening birth, post-2000",
    input: { date: "2005-09-09", time: "19:45", latitude: 13.0827, longitude: 80.2707, timezone: 5.5, place: "Chennai" },
  },
];

let allPassed = true;

for (const { label, input } of referenceCharts) {
  const web = generateWeb(input);
  const rn = generateRN(input);
  const webJson = JSON.stringify(web);
  const rnJson = JSON.stringify(rn);

  if (webJson === rnJson) {
    console.log(`PASS — ${label}`);
  } else {
    allPassed = false;
    console.log(`FAIL — ${label}`);
    console.log("  web:", webJson.slice(0, 300));
    console.log("  rn: ", rnJson.slice(0, 300));
  }
}

if (!allPassed) {
  console.error("\nOne or more reference charts diverged between web and RN ports.");
  process.exit(1);
}

console.log("\nAll reference charts match exactly between web and RN ports (Node/V8).");
