import { createHash } from "node:crypto";

export const SOURCE_ID = "chaco-datosabiertos-ejecucion-presupuestaria";
export const SCHEMA_VERSION = "0.1.0";
export const TRANSFORMATION_VERSION = "0.1.0";
export const QUALITY_VERSION = "0.1.0";
export const STAGES = [
  "Q_ASIG",
  "Q_VIG",
  "Q_COMP",
  "Q_ORD",
  "Q_PAG",
  "Q_SAL",
] as const;
export type Stage = (typeof STAGES)[number];
export type View = "finalidad_fuente" | "objeto_fuente";
export type Amounts = Record<Stage, string>;

export interface BudgetDocument {
  sourceId: typeof SOURCE_ID;
  documentId: string;
  datasetUrl: string;
  resourceUrl: string;
  sha256: string;
  byteLength: number;
  parseEncoding: "windows-1252";
  delimiter: ";";
  year: 2022;
  periodStart: "2022-01-01";
  periodEnd: "2022-12-31";
  periodBasis: "resource_title";
  view: View;
  schemaVersion: typeof SCHEMA_VERSION;
  transformationVersion: typeof TRANSFORMATION_VERSION;
  rightsStatus: "pending";
  publicationAllowed: false;
  currency: null;
  unitLabel: null;
}

interface RowBase {
  documentSha256: string;
  sourceLine: number;
  rawLineSha256: string;
  rawCells: Record<string, string>;
  entityCode: string;
  entityName: string;
  amounts: Amounts;
  normalizedAmounts: Amounts;
  reportedVariation: string;
  normalizedVariation: string;
  currency: null;
  unitLabel: null;
  interpretationStatus: "unconfirmed";
  isPublished: false;
}

export type RawBudgetRow = RowBase & {
  classification:
    | {
        view: "finalidad_fuente";
        finalidad: string;
        finalidadName: string;
        functionN2: string | null;
        functionN1: string;
        functionName: string | null;
        fundingCode: string;
        fundingName: string;
      }
    | {
        view: "objeto_fuente";
        groupCode: string;
        groupName: string;
        partidaCode: string;
        partidaName: string;
        fundingCode: string;
      };
};

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// Exact signed decimal represented by an unscaled integer and its decimal scale.
export interface Decimal {
  value: bigint;
  scale: number;
}
export function decimal(input: string): Decimal {
  if (!/^-?(?:0|[1-9]\d*)(?:[,.]\d+)?$/.test(input))
    throw new Error("invalid decimal");
  const [whole, fraction = ""] = input.split(/[,.]/);
  const digits = `${whole}${fraction}`;
  return { value: BigInt(digits), scale: fraction.length };
}
export function sourceDecimal(input: string): Decimal {
  if (!/^-?(?:0|[1-9]\d*)(?:,\d+)?$/.test(input))
    throw new Error("invalid decimal");
  return decimal(input);
}
export function canonical(n: Decimal): string {
  const negative = n.value < 0n;
  const digits = (negative ? -n.value : n.value)
    .toString()
    .padStart(n.scale + 1, "0");
  return `${negative ? "-" : ""}${n.scale ? `${digits.slice(0, -n.scale)}.${digits.slice(-n.scale)}` : digits}`;
}
export function align(a: Decimal, b: Decimal): [bigint, bigint, number] {
  const scale = Math.max(a.scale, b.scale);
  return [
    a.value * 10n ** BigInt(scale - a.scale),
    b.value * 10n ** BigInt(scale - b.scale),
    scale,
  ];
}
export function add(a: Decimal, b: Decimal): Decimal {
  const [x, y, scale] = align(a, b);
  return { value: x + y, scale };
}
export function subtract(a: Decimal, b: Decimal): Decimal {
  const [x, y, scale] = align(a, b);
  return { value: x - y, scale };
}
export function compare(a: Decimal, b: Decimal): number {
  const [x, y] = align(a, b);
  return x < y ? -1 : x > y ? 1 : 0;
}
export function absolute(a: Decimal): Decimal {
  return { value: a.value < 0n ? -a.value : a.value, scale: a.scale };
}
export function multiply(a: Decimal, b: Decimal): Decimal {
  return { value: a.value * b.value, scale: a.scale + b.scale };
}
// Test |numerator / denominator - expected| > tolerance without rounding.
export function ratioOutside(
  numerator: Decimal,
  denominator: Decimal,
  expected: Decimal,
  tolerance: Decimal,
): boolean {
  if (denominator.value === 0n) throw new Error("zero denominator");
  const difference = absolute(
    subtract(numerator, multiply(expected, denominator)),
  );
  return compare(difference, multiply(tolerance, absolute(denominator))) > 0;
}
