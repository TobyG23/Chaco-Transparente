import { expect, test } from "bun:test";
import {
  budget2024Amendment,
  budget2024Hash,
  budget2024Rows,
  budget2024Source,
  budget2024Totals,
} from "../src/budget-2024-data";

test("eleven institutional rows cross-foot to the enacted article 1 totals", () => {
  expect(budget2024Rows).toHaveLength(11);
  expect(new Set(budget2024Rows.map((row) => row.organism)).size).toBe(11);
  for (const row of budget2024Rows) {
    expect(row.current + row.capital).toBe(row.total);
    expect(row.current).toBeGreaterThanOrEqual(0);
    expect(row.capital).toBeGreaterThanOrEqual(0);
  }
  for (const field of ["current", "capital", "total"] as const)
    expect(budget2024Rows.reduce((sum, row) => sum + row[field], 0)).toBe(
      budget2024Totals[field],
    );
  expect(budget2024Totals.current + budget2024Totals.capital).toBe(
    budget2024Totals.total,
  );
});

test("legislative PDF version and later amendment are separate sources", () => {
  expect(budget2024Source).toContain("nombreArchivo=L.3968.F.pdf");
  expect(budget2024Amendment).toContain("nombreArchivo=L.4035.F.pdf");
  expect(budget2024Hash).toMatch(/^[a-f0-9]{64}$/);
});
