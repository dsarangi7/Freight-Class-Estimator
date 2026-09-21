/**
 * Golden regression tests for freight class density math.
 * Run: npm run test:golden
 *
 * Boundaries follow NMFTA Jul 2025 13-class scale:
 * inclusive-lower / exclusive-upper.
 */
import {
  volumeFt3,
  densityLbPerFt3,
  classFromDensity,
  dimWeightLb,
  estimateShipment,
  CUBIC_IN_PER_FT3,
} from "../src/lib/freightClass.ts";

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  } else {
    console.log("ok:", msg);
  }
}

function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

// --- Golden example from brief ---
// 48×40×48 in @ 350 lb → vol = 48*40*48/1728 = 53.333… → density ≈ 6.5625 → class 125
{
  const vol = volumeFt3(48, 40, 48);
  assert(approx(vol, (48 * 40 * 48) / CUBIC_IN_PER_FT3), "golden volume 48×40×48");
  assert(approx(vol, 53.333333333333336, 1e-6), "golden volume ≈ 53.333 ft³");
  const dens = densityLbPerFt3(350, vol);
  assert(dens !== null && approx(dens, 6.5625, 1e-6), "golden density ≈ 6.5625");
  assert(classFromDensity(dens) === 125, "golden class 125");
  const ship = estimateShipment([{ lengthIn: 48, widthIn: 40, heightIn: 48, weightLb: 350 }]);
  assert(ship.freightClass === 125, "estimateShipment golden → 125");
  assert(ship.error === undefined, "estimateShipment no error");
}

// --- nmfta-2025-07-13-sub: inclusive-lower breakpoint FACTS ---
{
  const nmftaBreakpoints = [
    [50, 50],
    [35, 55],
    [30, 60],
    [22.5, 65],
    [15, 70],
    [12, 85],
    [10, 92.5],
    [8, 100],
    [6, 125],
    [4, 175],
    [2, 250],
    [1, 300],
    [0.999, 400],
  ];
  for (const [d, cls] of nmftaBreakpoints) {
    assert(classFromDensity(d) === cls, `nmfta-2025-07-13-sub: density ${d} → class ${cls}`);
  }
}

// --- Inclusive-lower / exclusive-upper edges around each break ---
const boundaries = [
  [50, 50],
  [49.9999999, 55],
  [35, 55],
  [34.9999999, 60],
  [30, 60],
  [29.9999999, 65],
  [22.5, 65],
  [22.4999999, 70],
  [15, 70],
  [14.9999999, 85],
  [12, 85],
  [11.9999999, 92.5],
  [10, 92.5],
  [9.9999999, 100],
  [8, 100],
  [7.9999999, 125],
  [6, 125],
  [5.9999999, 175],
  [4, 175],
  [3.9999999, 250],
  [2, 250],
  [1.9999999, 300],
  [1, 300],
  [0.9999999, 400],
  [0.5, 400],
  [0, 400],
];

for (const [d, cls] of boundaries) {
  assert(classFromDensity(d) === cls, `density ${d} → class ${cls}`);
}

// Mid-bucket spot checks
assert(classFromDensity(60) === 50, "60 → 50");
assert(classFromDensity(40) === 55, "40 → 55");
assert(classFromDensity(32) === 60, "32 → 60");
assert(classFromDensity(25) === 65, "25 → 65");
assert(classFromDensity(18) === 70, "18 → 70");
assert(classFromDensity(13) === 85, "13 → 85");
assert(classFromDensity(11) === 92.5, "11 → 92.5");
assert(classFromDensity(9) === 100, "9 → 100");
assert(classFromDensity(7) === 125, "7 → 125");
assert(classFromDensity(5) === 175, "5 → 175");
assert(classFromDensity(3) === 250, "3 → 250");
assert(classFromDensity(1.5) === 300, "1.5 → 300");
assert(classFromDensity(0.1) === 400, "0.1 → 400");

// Invalid density → null (not mapped to 400)
assert(classFromDensity(NaN) === null, "NaN → null");
assert(classFromDensity(-1) === null, "negative → null");

// Divide-by-zero / zero volume
assert(densityLbPerFt3(100, 0) === null, "density null on zero volume");
assert(volumeFt3(0, 40, 48) === 0, "zero length → 0 volume");
assert(volumeFt3(-1, 40, 48) === 0, "negative dim → 0 volume");

// DIM weight educational
{
  const vol = volumeFt3(48, 40, 48);
  const dim250 = dimWeightLb(vol, 250);
  const dim194 = dimWeightLb(vol, 194);
  assert(dim250 !== null && approx(dim250, vol * 250, 1e-6), "DIM factor 250");
  assert(dim194 !== null && approx(dim194, vol * 194, 1e-6), "DIM factor 194");
  assert(dimWeightLb(0, 250) === null, "DIM null on zero volume");
}

// Multi-pallet: sum volumes & weights, one density
{
  const a = { lengthIn: 48, widthIn: 40, heightIn: 48, weightLb: 350 };
  const b = { lengthIn: 48, widthIn: 40, heightIn: 48, weightLb: 350 };
  const ship = estimateShipment([a, b]);
  // Two identical full pallets → same density 6.5625 → 125
  assert(approx(ship.totalWeightLb, 700), "multi total weight 700");
  assert(approx(ship.totalVolumeFt3, 2 * ((48 * 40 * 48) / 1728), 1e-6), "multi total volume");
  assert(ship.freightClass === 125, "multi-pallet same density → 125");
}

// Empty pallets error
{
  const ship = estimateShipment([]);
  assert(ship.freightClass === null && ship.error, "empty pallets → error");
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll golden tests passed.");
