/**
 * Density-based NMFC-style freight class estimator (educational).
 * Table effective 2025-07-19 (NMFTA Jul 2025 13-class density scale).
 * Not ClassIT+, not a rate quote.
 *
 * Inclusive-lower / exclusive-upper mapping:
 *   ≥ 50 → 50
 *   ≥ 35 and < 50 → 55
 *   ≥ 30 and < 35 → 60
 *   ≥ 22.5 and < 30 → 65
 *   ≥ 15 and < 22.5 → 70
 *   ≥ 12 and < 15 → 85
 *   ≥ 10 and < 12 → 92.5
 *   ≥ 8 and < 10 → 100
 *   ≥ 6 and < 8 → 125
 *   ≥ 4 and < 6 → 175
 *   ≥ 2 and < 4 → 250
 *   ≥ 1 and < 2 → 300
 *   < 1 → 400
 *
 * Invalid / NaN / negative density → null (callers must guard).
 */

export type FreightClass =
  | 50
  | 55
  | 60
  | 65
  | 70
  | 85
  | 92.5
  | 100
  | 125
  | 175
  | 250
  | 300
  | 400;

export interface PalletDims {
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightLb: number;
}

export interface ShipmentResult {
  totalVolumeFt3: number;
  totalWeightLb: number;
  densityLbPerFt3: number | null;
  freightClass: FreightClass | null;
  dimWeightLb: number | null;
  error?: string;
}

/** Cubic inches per cubic foot. */
export const CUBIC_IN_PER_FT3 = 1728;

/** Common educational DIM factors (lb per ft³). Carrier factors vary. */
export const DEFAULT_DIM_FACTOR = 250;

/**
 * Volume in ft³ from inches. Returns 0 for non-positive dimensions.
 */
export function volumeFt3(lengthIn: number, widthIn: number, heightIn: number): number {
  if (!(lengthIn > 0) || !(widthIn > 0) || !(heightIn > 0)) return 0;
  return (lengthIn * widthIn * heightIn) / CUBIC_IN_PER_FT3;
}

/**
 * Density lb/ft³. Null if volume is zero or non-positive weight with zero volume.
 */
export function densityLbPerFt3(weightLb: number, volumeFt3Value: number): number | null {
  if (!(volumeFt3Value > 0)) return null;
  if (!(weightLb >= 0) || Number.isNaN(weightLb)) return null;
  return weightLb / volumeFt3Value;
}

/**
 * Map density (lb/ft³) to NMFC-style freight class (Jul 2025 13-class,
 * inclusive-lower / exclusive-upper). Returns null for NaN / negative.
 */
export function classFromDensity(density: number): FreightClass | null {
  if (!(density >= 0) || Number.isNaN(density)) {
    return null;
  }
  if (density >= 50) return 50;
  if (density >= 35) return 55; // ≥35 and <50
  if (density >= 30) return 60;
  if (density >= 22.5) return 65;
  if (density >= 15) return 70;
  if (density >= 12) return 85;
  if (density >= 10) return 92.5;
  if (density >= 8) return 100;
  if (density >= 6) return 125;
  if (density >= 4) return 175;
  if (density >= 2) return 250;
  if (density >= 1) return 300;
  return 400; // < 1
}

/**
 * Educational dimensional weight: volume_ft3 × dim_factor.
 * Default factor 250 (common for some LTL/air modes). Label as educational only.
 */
export function dimWeightLb(volumeFt3Value: number, dimFactor: number = DEFAULT_DIM_FACTOR): number | null {
  if (!(volumeFt3Value > 0)) return null;
  if (!(dimFactor > 0)) return null;
  return volumeFt3Value * dimFactor;
}

/**
 * Multi-pallet MVP: sum all volumes & weights, then one density → one class.
 */
export function estimateShipment(
  pallets: PalletDims[],
  dimFactor: number = DEFAULT_DIM_FACTOR,
): ShipmentResult {
  if (!pallets.length) {
    return {
      totalVolumeFt3: 0,
      totalWeightLb: 0,
      densityLbPerFt3: null,
      freightClass: null,
      dimWeightLb: null,
      error: "Add at least one pallet.",
    };
  }

  let totalVolumeFt3 = 0;
  let totalWeightLb = 0;

  for (const p of pallets) {
    const v = volumeFt3(p.lengthIn, p.widthIn, p.heightIn);
    if (v <= 0) {
      return {
        totalVolumeFt3: 0,
        totalWeightLb: 0,
        densityLbPerFt3: null,
        freightClass: null,
        dimWeightLb: null,
        error: "Each pallet needs positive length, width, and height (inches).",
      };
    }
    if (!(p.weightLb >= 0) || Number.isNaN(p.weightLb)) {
      return {
        totalVolumeFt3: 0,
        totalWeightLb: 0,
        densityLbPerFt3: null,
        freightClass: null,
        dimWeightLb: null,
        error: "Each pallet needs a non-negative weight (lb).",
      };
    }
    totalVolumeFt3 += v;
    totalWeightLb += p.weightLb;
  }

  const density = densityLbPerFt3(totalWeightLb, totalVolumeFt3);
  if (density === null) {
    return {
      totalVolumeFt3,
      totalWeightLb,
      densityLbPerFt3: null,
      freightClass: null,
      dimWeightLb: dimWeightLb(totalVolumeFt3, dimFactor),
      error: "Cannot compute density (check volume and weight).",
    };
  }

  return {
    totalVolumeFt3,
    totalWeightLb,
    densityLbPerFt3: density,
    freightClass: classFromDensity(density),
    dimWeightLb: dimWeightLb(totalVolumeFt3, dimFactor),
  };
}

/** Human-readable density range label for a class (inclusive-lower / exclusive-upper). */
export const CLASS_DENSITY_RANGES: Record<FreightClass, string> = {
  50: "≥50 lb/ft³",
  55: "35–<50 lb/ft³",
  60: "30–<35 lb/ft³",
  65: "22.5–<30 lb/ft³",
  70: "15–<22.5 lb/ft³",
  85: "12–<15 lb/ft³",
  92.5: "10–<12 lb/ft³",
  100: "8–<10 lb/ft³",
  125: "6–<8 lb/ft³",
  175: "4–<6 lb/ft³",
  250: "2–<4 lb/ft³",
  300: "1–<2 lb/ft³",
  400: "<1 lb/ft³",
};
