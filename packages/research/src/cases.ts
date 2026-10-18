import {
  absolute,
  canonical,
  compare,
  decimal,
  type RawBudgetRow,
  subtract,
} from "@chaco/core";

const zero = decimal("0");
const warning = decimal("0.011");
const error = decimal("1");

export function diagnose(row: RawBudgetRow) {
  const sal = decimal(row.normalizedAmounts.Q_SAL);
  const vig = decimal(row.normalizedAmounts.Q_VIG);
  const comp = decimal(row.normalizedAmounts.Q_COMP);
  const calculated = subtract(vig, comp);
  const residual = subtract(sal, calculated);
  const magnitude = absolute(residual);
  return {
    negative: compare(sal, zero) < 0,
    residualNonzero: compare(residual, zero) !== 0,
    zeroVigPositiveComp: compare(vig, zero) === 0 && compare(comp, zero) > 0,
    warning: compare(magnitude, warning) > 0,
    error: compare(magnitude, error) > 0,
    calculated: canonical(calculated),
    residual: canonical(residual),
  };
}

export function priorityCases(rows: readonly RawBudgetRow[]) {
  const negative = rows.filter((row) => diagnose(row).negative);
  const residual = negative.filter((row) => diagnose(row).residualNonzero);
  const zeroVig = negative.filter((row) => diagnose(row).zeroVigPositiveComp);
  const residualLines = new Set(residual.map((row) => row.sourceLine));
  const zeroLines = new Set(zeroVig.map((row) => row.sourceLine));
  const union = negative.filter(
    (row) => residualLines.has(row.sourceLine) || zeroLines.has(row.sourceLine),
  );
  return {
    negative,
    residual,
    zeroVig,
    overlap: zeroVig.filter((row) => residualLines.has(row.sourceLine)),
    union,
  };
}

export type Anomaly = "none" | "negative" | "residual" | "zero-vig";

export function matchesAnomaly(row: RawBudgetRow, anomaly: Anomaly): boolean {
  if (anomaly === "none") return true;
  const result = diagnose(row);
  return anomaly === "negative"
    ? result.negative
    : anomaly === "residual"
      ? result.negative && result.residualNonzero
      : result.negative && result.zeroVigPositiveComp;
}
