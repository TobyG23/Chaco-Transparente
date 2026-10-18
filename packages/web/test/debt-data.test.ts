import { expect, test } from "bun:test";
import {
  debtAttribution,
  debtLicenseUrl,
  debtObservations,
  debtSourcePage,
  formatMillions,
  millionsOfPesos,
} from "../src/debt-data";

const expected = [
  [
    "2022-12-31",
    "Dic-22",
    "B12",
    "miles de pesos",
    "101190519.09306316",
    "749843a90f0ca0b6e5aa100213e758492b6604ca9219f416b7f7df51cd0fe0ce",
  ],
  [
    "2023-12-31",
    "Dic-23",
    "B18",
    "millones de pesos",
    "349106.42889352847",
    "42f8e9840dac0b37bd01676715fd2ae30f7105b78fdbc5a73436ffb9d52ecf25",
  ],
  [
    "2024-12-31",
    "Diciembre-24",
    "B18",
    "millones de pesos",
    "537293.4633925447",
    "7fe3116536758389efb385d5820b1151844bd8c2cd54fb646ae317867d59eb86",
  ],
  [
    "2025-12-31",
    "Dic-25 millones",
    "B18",
    "millones de pesos",
    "703527.51727823308",
    "208f1f8ce031538aae6442e68d4602319a39da62547d4105d12cca80116071a7",
  ],
  [
    "2026-03-31",
    "Mar-26 millones",
    "B18",
    "millones de pesos",
    "660611.02867401857",
    "75f02a9eb0ae184433c4f038a6ba8d48122b6724d4fe614c93cc971f1f77e6e0",
  ],
  [
    "2026-06-30",
    "Jun-26 millones",
    "B18",
    "millones de pesos",
    "610194.83629409899",
    "10a4b2d1cb9c2973a69a547858e7667e5c222729a477e562ce9d2658b95b9533",
  ],
] as const;

test("six official consolidated Chaco observations carry auditable provenance", () => {
  expect(debtObservations).toHaveLength(6);
  expect(
    debtObservations.map((row) => [
      row.date,
      row.sheet,
      row.cell,
      row.sourceUnit,
      row.sourceValue,
      row.sha256,
    ]),
  ).toEqual(expected);
  expect(new Set(debtObservations.map((row) => row.date)).size).toBe(6);
  for (const row of debtObservations) {
    expect(row.sourceUrl).toStartWith(
      "https://www.argentina.gob.ar/sites/default/files/stock_",
    );
    expect(row.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(Number(row.sourceValue)).toBeGreaterThan(0);
  }
  expect(debtSourcePage).toContain("/evolucion-de-stock");
  expect(debtLicenseUrl).toBe(
    "https://www.argentina.gob.ar/terminos-y-condiciones",
  );
  expect(debtAttribution).toContain("Subsecretaría");
});

test("2022 thousands are normalized once, while later millions remain unchanged", () => {
  const first = debtObservations[0];
  const second = debtObservations[1];
  if (!first || !second) throw new Error("Missing debt observations");
  expect(millionsOfPesos(first)).toBeCloseTo(
    Number(first.sourceValue) / 1000,
    7,
  );
  expect(millionsOfPesos(second)).toBe(Number(second.sourceValue));
  expect(
    debtObservations.map((row) => formatMillions(millionsOfPesos(row))),
  ).toEqual([
    "101.190,52",
    "349.106,43",
    "537.293,46",
    "703.527,52",
    "660.611,03",
    "610.194,84",
  ]);
});
