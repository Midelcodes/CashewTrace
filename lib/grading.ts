// Pure grading logic — no DB access, so it can be unit-tested and reused by the seed.

export type Grade = "A" | "B" | "C" | "FAIL";

// Thresholds are configurable defaults, to be calibrated with buyers.
// They always come from the Settings row — never hard-code them at call sites.
export type GradingThresholds = {
  moistureMaxPct: number;
  gradeA_minKor: number;
  gradeB_minKor: number;
  gradeC_minKor: number;
};

export function gradeLot(
  { moistureAfter, korLbs }: { moistureAfter: number; korLbs: number },
  t: GradingThresholds,
): Grade {
  if (moistureAfter > t.moistureMaxPct) return "FAIL"; // needs more drying
  if (korLbs >= t.gradeA_minKor) return "A";
  if (korLbs >= t.gradeB_minKor) return "B";
  if (korLbs >= t.gradeC_minKor) return "C";
  return "FAIL";
}
