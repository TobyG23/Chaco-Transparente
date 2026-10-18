import { expect, test } from "bun:test";
import {
  AMOUNT_LABEL,
  DEMO_LABEL,
  querySyntheticRows,
  syntheticRows,
  type View,
  viewLabels,
} from "../src/synthetic-data";

const views: View[] = ["finalidad", "objeto"];

test("fixture is explicitly fictional and has unique view-specific IDs", () => {
  expect(DEMO_LABEL).toBe(
    "Datos sintéticos de demostración · no son registros oficiales",
  );
  expect(AMOUNT_LABEL).toBe("Unidades ficticias");
  expect(Object.keys(viewLabels).sort()).toEqual([...views].sort());
  const ids = new Set<string>();
  for (const view of views) {
    expect(
      syntheticRows.filter((row) => row.view === view).length,
    ).toBeGreaterThanOrEqual(8);
    for (const row of syntheticRows.filter((row) => row.view === view)) {
      expect(row.view).toBe(view);
      expect(row.id.startsWith(view === "finalidad" ? "f-" : "o-")).toBe(true);
      expect(ids.has(row.id)).toBe(false);
      ids.add(row.id);
      expect(row.entity.length).toBeGreaterThan(0);
      expect(row.category.length).toBeGreaterThan(0);
      expect(row.source.length).toBeGreaterThan(0);
      expect(Number.isSafeInteger(row.amount) && row.amount >= 0).toBe(true);
    }
  }
});

test("queries never leak rows across views or mutate the fixture", () => {
  for (const view of views) {
    const original = [...syntheticRows.filter((row) => row.view === view)];
    const result = querySyntheticRows({
      view,
      sortBy: "amount",
      sortDirection: "desc",
    });
    expect(result.rows).toHaveLength(original.length);
    expect(result.total).toBe(original.length);
    expect(result.rows.every((row) => row.view === view)).toBe(true);
    expect(syntheticRows.filter((row) => row.view === view)).toEqual(original);
  }
});

test("search is case- and accent-insensitive over entity, category and source", () => {
  expect(
    querySyntheticRows({ view: "objeto", search: "  LAPICES  " }).rows.map(
      (r) => r.id,
    ),
  ).toEqual(["o-01", "o-04"]);
  expect(
    querySyntheticRows({ view: "finalidad", search: "arcoiris" }).rows.map(
      (r) => r.id,
    ),
  ).toEqual(["f-03", "f-06"]);
  expect(
    querySyntheticRows({ view: "finalidad", search: "fondo de papel" }).total,
  ).toBe(4);
  expect(
    querySyntheticRows({ view: "objeto", search: "no existe" }).rows,
  ).toEqual([]);
});

test("exact filters combine with search and remain scoped to a view", () => {
  expect(
    querySyntheticRows({
      view: "finalidad",
      entity: "Club Cometa",
      category: "Taller de cometas",
      source: "Caja de colores",
    }).rows.map((r) => r.id),
  ).toEqual(["f-04"]);
  expect(
    querySyntheticRows({
      view: "objeto",
      category: "Cartón estelar",
      source: "Fondo de papel",
      search: "casa nube",
    }).rows.map((r) => r.id),
  ).toEqual(["o-02"]);
  expect(
    querySyntheticRows({ view: "objeto", category: "Taller de cometas" }).total,
  ).toBe(0);
  expect(
    querySyntheticRows({ view: "finalidad", category: "taller de cometas" })
      .total,
  ).toBe(0);
  expect(
    querySyntheticRows({ view: "finalidad", category: "", source: "" }).total,
  ).toBe(8);
});

test("sorts every field in both directions with deterministic ID tie-breaks", () => {
  for (const view of views) {
    for (const field of ["entity", "category", "source", "amount"] as const) {
      const asc = querySyntheticRows({
        view,
        sortBy: field,
        sortDirection: "asc",
      }).rows;
      const desc = querySyntheticRows({
        view,
        sortBy: field,
        sortDirection: "desc",
      }).rows;
      const compare = (a: (typeof asc)[number], b: (typeof asc)[number]) =>
        field === "amount"
          ? a.amount - b.amount
          : a[field].localeCompare(b[field], "es-AR");
      for (let index = 1; index < asc.length; index++) {
        expect(compare(asc[index - 1], asc[index])).toBeLessThanOrEqual(0);
        expect(compare(desc[index - 1], desc[index])).toBeGreaterThanOrEqual(0);
        if (compare(asc[index - 1], asc[index]) === 0) {
          expect(asc[index - 1].id < asc[index].id).toBe(true);
        }
      }
    }
  }
  expect(
    querySyntheticRows({
      view: "finalidad",
      sortBy: "amount",
      sortDirection: "asc",
    })
      .rows.slice(0, 2)
      .map((r) => r.id),
  ).toEqual(["f-07", "f-04"]);
  expect(
    querySyntheticRows({
      view: "finalidad",
      sortBy: "amount",
      sortDirection: "desc",
    }).rows[0].id,
  ).toBe("f-03");
});

test("pagination happens after filters and sorting; empty and out-of-range pages are safe", () => {
  const first = querySyntheticRows({
    view: "objeto",
    pageSize: 3,
    page: 1,
    sortBy: "amount",
  });
  const second = querySyntheticRows({
    view: "objeto",
    pageSize: 3,
    page: 2,
    sortBy: "amount",
  });
  const third = querySyntheticRows({
    view: "objeto",
    pageSize: 3,
    page: 3,
    sortBy: "amount",
  });
  expect([first.total, first.pageCount, first.pageSize, first.page]).toEqual([
    8, 3, 3, 1,
  ]);
  expect([first.rows.length, second.rows.length, third.rows.length]).toEqual([
    3, 3, 2,
  ]);
  expect(
    [...first.rows, ...second.rows, ...third.rows].map((r) => r.amount),
  ).toEqual([20, 35, 50, 60, 70, 85, 100, 120]);
  const filtered = querySyntheticRows({
    view: "objeto",
    source: "Fondo de papel",
    page: 2,
    pageSize: 2,
  });
  expect([filtered.total, filtered.pageCount, filtered.rows.length]).toEqual([
    4, 2, 2,
  ]);
  const beyond = querySyntheticRows({ view: "objeto", page: 5, pageSize: 3 });
  expect([
    beyond.total,
    beyond.pageCount,
    beyond.page,
    beyond.rows.length,
  ]).toEqual([8, 3, 3, 2]);
  const empty = querySyntheticRows({
    view: "finalidad",
    search: "not-found",
    page: 7,
  });
  expect([empty.total, empty.pageCount, empty.page, empty.rows.length]).toEqual(
    [0, 1, 1, 0],
  );
});

test("page and pageSize reject invalid numbers", () => {
  for (const invalid of [
    0,
    -1,
    1.5,
    Number.NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    expect(() =>
      querySyntheticRows({ view: "finalidad", page: invalid }),
    ).toThrow(RangeError);
    expect(() =>
      querySyntheticRows({ view: "finalidad", pageSize: invalid }),
    ).toThrow(RangeError);
  }
});
