import { compare, decimal, type RawBudgetRow, type View } from "@chaco/core";
import { HEADERS } from "../../ingestion/src/parser.ts";

export interface Query {
  view: View;
  search: string;
  filters: Readonly<Record<string, string>>;
  sortBy: string;
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
}

const numericFields = new Set([
  "Q_ASIG",
  "Q_VIG",
  "Q_COMP",
  "Q_ORD",
  "Q_PAG",
  "Q_SAL",
  "Q_VAR",
]);

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("es-AR");
}

export function assertColumn(view: View, column: string): void {
  if (!HEADERS[view].includes(column))
    throw new Error(`Columna desconocida: ${column}`);
}

export function queryRows(rows: readonly RawBudgetRow[], query: Query) {
  assertColumn(query.view, query.sortBy);
  for (const column of Object.keys(query.filters))
    assertColumn(query.view, column);
  const terms = normalize(query.search.trim()).split(/\s+/).filter(Boolean);
  const matching = rows.filter((row) => {
    const cells = row.rawCells;
    return (
      terms.every((term) =>
        HEADERS[query.view].some((header) =>
          normalize(cells[header] ?? "").includes(term),
        ),
      ) &&
      Object.entries(query.filters).every(
        ([key, value]) => cells[key] === value,
      )
    );
  });
  matching.sort((a, b) => {
    const left = a.rawCells[query.sortBy] ?? "";
    const right = b.rawCells[query.sortBy] ?? "";
    const order = numericFields.has(query.sortBy)
      ? compare(decimal(left), decimal(right))
      : left.localeCompare(right, "es-AR", { numeric: false });
    return order === 0
      ? a.sourceLine - b.sourceLine
      : query.direction === "asc"
        ? order
        : -order;
  });
  const pageSize =
    Number.isSafeInteger(query.pageSize) && query.pageSize > 0
      ? query.pageSize
      : 25;
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Number.isSafeInteger(query.page)
    ? Math.min(pages, Math.max(1, query.page))
    : 1;
  return {
    rows: matching.slice((page - 1) * pageSize, page * pageSize),
    total: matching.length,
    page,
    pages,
    matching,
  };
}

export function safeText(input: string, max = 42): string {
  const escaped = [...input]
    .map((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code < 32 ||
        code === 127 ||
        (code >= 0x80 && code <= 0x9f) ||
        (code >= 0x200b && code <= 0x200f) ||
        (code >= 0x202a && code <= 0x202e) ||
        code === 0x2028 ||
        code === 0x2029 ||
        (code >= 0x2060 && code <= 0x206f) ||
        code === 0x1b
        ? `\\u{${code.toString(16)}}`
        : character;
    })
    .join("");
  return escaped.length > max ? `${escaped.slice(0, max)}…` : escaped;
}

export function nullMarkers(
  rows: readonly RawBudgetRow[],
  view: View,
): Record<string, number> {
  if (view !== "finalidad_fuente") return {};
  return Object.fromEntries(
    ["FUNC_N2", "NOMFUN_N1.1"].map((key) => [
      key,
      rows.filter((row) => row.rawCells[key] === "-").length,
    ]),
  );
}

export function duplicateLines(
  rows: readonly RawBudgetRow[],
  view: View,
): number[] {
  const keys =
    view === "finalidad_fuente"
      ? ["Q_ENT", "FINALIDAD", "FUNC_N2", "FUNC_N1", "CODFTE"]
      : ["Q_ENT", "Q_GRUPO", "Q_PARTIDA", "Q_FTE"];
  const seen = new Set<string>();
  const result: number[] = [];
  for (const row of rows) {
    const identity = JSON.stringify(keys.map((key) => row.rawCells[key]));
    if (seen.has(identity)) result.push(row.sourceLine);
    seen.add(identity);
  }
  return result;
}
