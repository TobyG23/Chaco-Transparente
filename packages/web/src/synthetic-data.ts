// Every row, label and amount is hand-authored fiction, not a transformed public record.
export type View = "finalidad" | "objeto";

export type SyntheticRow = Readonly<{
  id: string;
  view: View;
  entity: string;
  category: string;
  partida?: string; // Fictional object-view label only.
  source: string;
  amount: number; // Fictional units, not pesos or any actual budget amount.
}>;

export const DEMO_LABEL =
  "Datos sintéticos de demostración · no son registros oficiales";
export const AMOUNT_LABEL = "Unidades ficticias";

export const viewLabels: Readonly<Record<View, string>> = {
  finalidad: "Finalidad (ejemplo ficticio)",
  objeto: "Objeto del gasto (ejemplo ficticio)",
};

const rowsByView: Readonly<Record<View, readonly SyntheticRow[]>> = {
  finalidad: [
    {
      id: "f-01",
      view: "finalidad",
      entity: "Club Cometa",
      category: "Taller de cometas",
      source: "Fondo de papel",
      amount: 120,
    },
    {
      id: "f-02",
      view: "finalidad",
      entity: "Casa Nube",
      category: "Jardines imaginarios",
      source: "Fondo de papel",
      amount: 75,
    },
    {
      id: "f-03",
      view: "finalidad",
      entity: "Mesa Arcoíris",
      category: "Biblioteca de nubes",
      source: "Caja de colores",
      amount: 200,
    },
    {
      id: "f-04",
      view: "finalidad",
      entity: "Club Cometa",
      category: "Taller de cometas",
      source: "Caja de colores",
      amount: 45,
    },
    {
      id: "f-05",
      view: "finalidad",
      entity: "Casa Nube",
      category: "Jardines imaginarios",
      source: "Caja de colores",
      amount: 90,
    },
    {
      id: "f-06",
      view: "finalidad",
      entity: "Mesa Arcoíris",
      category: "Biblioteca de nubes",
      source: "Fondo de papel",
      amount: 120,
    },
    {
      id: "f-07",
      view: "finalidad",
      entity: "Club Cometa",
      category: "Festival de estrellas",
      source: "Fondo de papel",
      amount: 30,
    },
    {
      id: "f-08",
      view: "finalidad",
      entity: "Casa Nube",
      category: "Festival de estrellas",
      source: "Caja de colores",
      amount: 150,
    },
  ],
  objeto: [
    {
      id: "o-01",
      view: "objeto",
      partida: "Partida ficticia de muestra",
      entity: "Club Cometa",
      category: "Lápices mágicos",
      source: "Caja de colores",
      amount: 35,
    },
    {
      id: "o-02",
      view: "objeto",
      partida: "Partida ficticia de ejemplo",
      entity: "Casa Nube",
      category: "Cartón estelar",
      source: "Fondo de papel",
      amount: 120,
    },
    {
      id: "o-03",
      view: "objeto",
      partida: "Partida ficticia de muestra",
      entity: "Mesa Arcoíris",
      category: "Cintas de arcoíris",
      source: "Caja de colores",
      amount: 60,
    },
    {
      id: "o-04",
      view: "objeto",
      partida: "Partida ficticia de muestra",
      entity: "Club Cometa",
      category: "Lápices mágicos",
      source: "Fondo de papel",
      amount: 85,
    },
    {
      id: "o-05",
      view: "objeto",
      partida: "Partida ficticia de muestra",
      entity: "Casa Nube",
      category: "Cartón estelar",
      source: "Caja de colores",
      amount: 20,
    },
    {
      id: "o-06",
      view: "objeto",
      partida: "Partida ficticia de muestra",
      entity: "Mesa Arcoíris",
      category: "Cintas de arcoíris",
      source: "Fondo de papel",
      amount: 50,
    },
    {
      id: "o-07",
      view: "objeto",
      partida: "Partida ficticia de muestra",
      entity: "Casa Nube",
      category: "Tinta de luna",
      source: "Fondo de papel",
      amount: 100,
    },
    {
      id: "o-08",
      view: "objeto",
      partida: "Partida ficticia de muestra",
      entity: "Club Cometa",
      category: "Tinta de luna",
      source: "Caja de colores",
      amount: 70,
    },
  ],
};

export const syntheticRows: readonly SyntheticRow[] = [
  ...rowsByView.finalidad,
  ...rowsByView.objeto,
];

export type SortBy = "entity" | "category" | "source" | "amount";
export type SortDirection = "asc" | "desc";

export type QueryOptions = Readonly<{
  view: View;
  search?: string;
  entity?: string;
  category?: string;
  partida?: string;
  source?: string;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}>;

export type QueryResult = Readonly<{
  rows: readonly SyntheticRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}>;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-AR")
    .trim();
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
  return value;
}

/** Search entity/category/source (case- and accent-insensitive), exact-filter, sort, then paginate. */
export function querySyntheticRows({
  view,
  search = "",
  entity,
  category,
  partida,
  source,
  sortBy = "category",
  sortDirection = "asc",
  page = 1,
  pageSize = 10,
}: QueryOptions): QueryResult {
  positiveInteger(page, "page");
  positiveInteger(pageSize, "pageSize");
  const needle = normalize(search);
  const filtered = syntheticRows
    .filter((row) => row.view === view)
    .filter(
      (row) =>
        (!needle ||
          normalize(
            `${row.entity} ${row.category} ${row.partida ?? ""} ${row.source}`,
          ).includes(needle)) &&
        (!entity || row.entity === entity) &&
        (!category || row.category === category) &&
        (!partida || (view === "objeto" && row.partida === partida)) &&
        (!source || row.source === source),
    );
  const direction = sortDirection === "desc" ? -1 : 1;
  const rows = [...filtered].sort((a, b) => {
    const primary =
      sortBy === "amount"
        ? a.amount - b.amount
        : a[sortBy].localeCompare(b[sortBy], "es-AR");
    return primary * direction || a.id.localeCompare(b.id);
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    page: currentPage,
    pageSize,
    pageCount,
  };
}
