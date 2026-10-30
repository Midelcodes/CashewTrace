import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeLot } from "./grading";
import { calculateSale } from "./money";

const t = { moistureMaxPct: 10, gradeA_minKor: 48, gradeB_minKor: 45, gradeC_minKor: 42 };

test("too wet fails regardless of KOR", () => {
  assert.equal(gradeLot({ moistureAfter: 10.1, korLbs: 52 }, t), "FAIL");
});

test("KOR bands, inclusive lower bounds", () => {
  assert.equal(gradeLot({ moistureAfter: 10, korLbs: 48 }, t), "A");
  assert.equal(gradeLot({ moistureAfter: 8, korLbs: 47.9 }, t), "B");
  assert.equal(gradeLot({ moistureAfter: 8, korLbs: 45 }, t), "B");
  assert.equal(gradeLot({ moistureAfter: 8, korLbs: 42 }, t), "C");
  assert.equal(gradeLot({ moistureAfter: 8, korLbs: 41.9 }, t), "FAIL");
});

test("sale breakdown", () => {
  const s = calculateSale(
    { weightKg: 800, bags: 10, pricePerTonneNgn: 1_900_000 },
    { commissionRate: 0.02, dryingTestFeePerBagNgn: 500 },
  );
  assert.deepEqual(s, {
    totalValueNgn: 1_520_000,
    commissionNgn: 30_400,
    farmerFeesNgn: 5_000,
    farmerPayoutNgn: 1_515_000,
  });
});
