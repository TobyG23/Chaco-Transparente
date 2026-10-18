import { expect, test } from "bun:test";
import type { BudgetDocument, RawBudgetRow } from "@chaco/core";
import { diagnose, matchesAnomaly, priorityCases } from "../src/cases.ts";
import { dossierHtml } from "../src/dossier.ts";

function fixture(
  line: number,
  sal: string,
  vig: string,
  comp: string,
): RawBudgetRow {
  const rawCells = {
    Q_ENT: "0001",
    Q_NOMENT: "Entidad ficticia",
    Q_GRUPO: "2",
    Q_NOMGRUPO: "Grupo ficticio",
    Q_PARTIDA: "123",
    Q_NOMPARTIDA: "Partida ficticia",
    Q_FTE: "10",
    Q_ASIG: "0",
    Q_VIG: vig,
    Q_COMP: comp,
    Q_ORD: "0",
    Q_PAG: "0",
    Q_SAL: sal,
    Q_VAR: "0",
  };
  const amounts = {
    Q_ASIG: "0",
    Q_VIG: vig,
    Q_COMP: comp,
    Q_ORD: "0",
    Q_PAG: "0",
    Q_SAL: sal,
  };
  return {
    documentSha256: "a".repeat(64),
    sourceLine: line,
    rawLineSha256: "b".repeat(64),
    rawCells,
    entityCode: "0001",
    entityName: "Entidad ficticia",
    classification: {
      view: "objeto_fuente",
      groupCode: "2",
      groupName: "Grupo ficticio",
      partidaCode: "123",
      partidaName: "Partida ficticia",
      fundingCode: "10",
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

const document: BudgetDocument = {
  sourceId: "chaco-datosabiertos-ejecucion-presupuestaria",
  documentId: "fixture",
  datasetUrl: "https://example.invalid/fake",
  resourceUrl: "https://example.invalid/fake",
  sha256: "a".repeat(64),
  byteLength: 1,
  parseEncoding: "windows-1252",
  delimiter: ";",
  year: 2022,
  periodStart: "2022-01-01",
  periodEnd: "2022-12-31",
  periodBasis: "resource_title",
  view: "objeto_fuente",
  schemaVersion: "0.1.0",
  transformationVersion: "0.1.0",
  rightsStatus: "pending",
  publicationAllowed: false,
  currency: null,
  unitLabel: null,
};

test("exact signed residual and strict QA thresholds remain distinct", () => {
  expect(diagnose(fixture(2, "-1", "1", "2"))).toMatchObject({
    negative: true,
    residualNonzero: false,
    residual: "0",
    calculated: "-1",
    warning: false,
  });
  expect(diagnose(fixture(3, "-1.001", "1", "2"))).toMatchObject({
    residual: "-0.001",
    residualNonzero: true,
    warning: false,
  });
  expect(diagnose(fixture(4, "-1.011", "1", "2"))).toMatchObject({
    residual: "-0.011",
    warning: false,
  });
  expect(diagnose(fixture(5, "-1.012", "1", "2"))).toMatchObject({
    residual: "-0.012",
    warning: true,
    error: false,
  });
  expect(diagnose(fixture(6, "-2", "1", "2"))).toMatchObject({ error: false });
  expect(diagnose(fixture(7, "-2.001", "1", "2"))).toMatchObject({
    error: true,
  });
});

test("priority union counts intersection only once and selectors distinguish cases", () => {
  const rows = [
    fixture(2, "-1", "1", "2"),
    fixture(3, "-0.9", "1", "2"),
    fixture(4, "-0.1", "0", "1"),
    fixture(5, "-1", "0", "1"),
    fixture(6, "1", "2", "1"),
  ];
  const cases = priorityCases(rows);
  expect([
    cases.negative.length,
    cases.residual.length,
    cases.zeroVig.length,
    cases.overlap.length,
    cases.union.length,
  ]).toEqual([4, 2, 2, 1, 3]);
  expect(cases.union.map((row) => row.sourceLine)).toEqual([3, 4, 5]);
  expect(matchesAnomaly(rows[2] as RawBudgetRow, "residual")).toBe(true);
  expect(matchesAnomaly(rows[3] as RawBudgetRow, "zero-vig")).toBe(true);
  expect(matchesAnomaly(rows[4] as RawBudgetRow, "negative")).toBe(false);
});

test("private dossier preserves original values, provenance and escapes source cells", () => {
  const row = fixture(4, "-0.1", "0", "1");
  row.rawCells.Q_NOMPARTIDA = "<script>";
  const html = dossierHtml([row], document);
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("b".repeat(64));
  expect(html).toContain("-0.1");
  expect(html).toContain("0.9");
  expect(html).toContain("intersección: 1; unión sin duplicados: 1");
});
