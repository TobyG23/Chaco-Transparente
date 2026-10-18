import { expect, test } from "bun:test";
import type { RawBudgetRow } from "@chaco/core";
import { validatePaths } from "../src/cli.ts";
import { dictionary, evidence } from "../src/dictionary.ts";
import {
  duplicateLines,
  nullMarkers,
  type Query,
  queryRows,
  safeText,
} from "../src/query.ts";

function row(
  line: number,
  entity: string,
  value: string,
  description: string,
): RawBudgetRow {
  const rawCells = {
    Q_ENT: entity,
    Q_NOMENT: description,
    FINALIDAD: "01",
    NOMFIN: "Salud",
    FUNC_N2: "-",
    FUNC_N1: "01",
    "NOMFUN_N1.1": "-",
    CODFTE: "01",
    NOMFTE: "Fuente",
    Q_ASIG: value,
    Q_VIG: value,
    Q_COMP: "0",
    Q_ORD: "0",
    Q_PAG: "0",
    Q_SAL: value,
    Q_VAR: "0",
  };
  const amounts = {
    Q_ASIG: value,
    Q_VIG: value,
    Q_COMP: "0",
    Q_ORD: "0",
    Q_PAG: "0",
    Q_SAL: value,
  };
  return {
    documentSha256: "fixture",
    sourceLine: line,
    rawLineSha256: "fixture",
    rawCells,
    entityCode: entity,
    entityName: description,
    classification: {
      view: "finalidad_fuente",
      finalidad: "01",
      finalidadName: "Salud",
      functionN2: null,
      functionN1: "01",
      functionName: null,
      fundingCode: "01",
      fundingName: "Fuente",
    },
    amounts,
    normalizedAmounts: amounts,
    reportedVariation: "0",
    normalizedVariation: "0",
    currency: null,
    unitLabel: null,
    interpretationStatus: "unconfirmed",
    isPublished: false,
  };
}
const fixture = [
  row(4, "002", "10,01", "Árbol"),
  row(2, "001", "2,5", "Salud"),
  row(3, "001", "2,5", "Salud"),
];
const base: Query = {
  view: "finalidad_fuente",
  search: "",
  filters: {},
  sortBy: "Q_VIG",
  direction: "asc",
  page: 1,
  pageSize: 2,
};

test("search, combined filters, exact decimal sorting, stable ties and pagination", () => {
  expect(queryRows(fixture, base).rows.map((item) => item.sourceLine)).toEqual([
    2, 3,
  ]);
  expect(
    queryRows(fixture, { ...base, page: 2 }).rows.map(
      (item) => item.sourceLine,
    ),
  ).toEqual([4]);
  expect(queryRows(fixture, { ...base, search: "ARBOL" }).total).toBe(1);
  expect(
    queryRows(fixture, { ...base, filters: { Q_ENT: "001", Q_VIG: "2,5" } })
      .total,
  ).toBe(2);
  expect(
    queryRows(fixture, { ...base, sortBy: "Q_ENT", direction: "desc" }).rows[0]
      ?.entityCode,
  ).toBe("002");
  expect(queryRows(fixture, { ...base, page: 999 }).page).toBe(2);
  expect(
    queryRows(fixture, { ...base, filters: { Q_ENT: "none" } }).pages,
  ).toBe(1);
  expect(() => queryRows(fixture, { ...base, sortBy: "rawCells" })).toThrow();
});

test("null markers and duplicate dimension keys do not conflate missing required cells", () => {
  expect(nullMarkers(fixture, "finalidad_fuente")).toEqual({
    FUNC_N2: 3,
    "NOMFUN_N1.1": 3,
  });
  expect(duplicateLines(fixture, "finalidad_fuente")).toEqual([3]);
});

test("terminal output escapes untrusted control sequences and limits width", () => {
  expect(safeText("\u001b[31m\nhello")).toBe("\\u{1b}[31m\\u{a}hello");
  expect(safeText("abcdef", 3)).toBe("abc…");
});

test("dictionary and evidence identify conflicts without amounts", () => {
  expect(
    dictionary("objeto_fuente").some(
      (line) => line.includes("Q_VAR") && line.includes("contradictorias"),
    ),
  ).toBe(true);
  expect(evidence().join(" ")).toContain("publicación bloqueada");
});

test("entry requires two distinct absolute paths", () => {
  expect(() => validatePaths([])).toThrow();
  expect(() => validatePaths(["relative.csv", "other.csv"])).toThrow();
  const path =
    process.platform === "win32" ? "C:\\fixture.csv" : "/fixture.csv";
  expect(() => validatePaths([path, path])).toThrow();
});
