# Hermes Verification (JAA-148)

Biggest flagged risk for S9: does `astronomia`'s VSOP87 calculation engine actually
run correctly under Hermes (React Native's JS engine), not just Node/V8?

## Confirmed so far (this environment, no emulator/device available)

- `npx tsc --noEmit` — the ported `src/lib/astrology/*` typechecks cleanly.
- `npx tsx scripts/verify/compare-charts.ts` — output is byte-identical to the
  web app's copy of the same code for 3 reference birth charts, running under
  Node/V8.
- `npx expo export --platform android` — Metro successfully bundled the entire
  app, including `astronomia`'s VSOP87 data modules, and **compiled it to Hermes
  bytecode (`.hbc`)** with no errors. This confirms the code is syntactically
  and structurally compatible with Hermes's compiler.

## Still unverified — requires a device or emulator

Compiling to Hermes bytecode does not guarantee identical *runtime* behavior.
Hermes and V8 can differ in floating-point edge cases, `Date`/`Intl` behavior,
and JS engine quirks that only show up when the code actually executes.

**Before trusting this for production, run the app on a real Android device or
emulator and confirm:**

1. `npx expo start`, scan the QR code with Expo Go (or `npx expo run:android`
   for a dev build).
2. Generate the same 3 reference charts used in `scripts/verify/compare-charts.ts`
   on-device.
3. Compare the on-device output (planet longitudes, ascendant, dasha dates)
   against the web app's `/api/chart` response for the same inputs — should
   match exactly (whole-degree level differences would indicate a real bug;
   sub-arcsecond floating-point drift is expected and fine).

If results diverge, the likely culprits are floating-point precision in
`Math.atan2`/trig calls in `lib/astrology/calculator.ts`, since that's the only
code path doing nontrivial floating-point math close to comparison thresholds
(e.g. sign boundaries near 0°/30°).
