import {
  type BudgetDocument,
  canonical,
  type RawBudgetRow,
  SCHEMA_VERSION,
  SOURCE_ID,
  STAGES,
  sha256,
  sourceDecimal,
  TRANSFORMATION_VERSION,
  type View,
} from "@chaco/core";

export const HEADERS: Record<View, readonly string[]> = {
  finalidad_fuente: [
    "Q_ENT",
    "Q_NOMENT",
    "FINALIDAD",
    "NOMFIN",
    "FUNC_N2",
    "FUNC_N1",
    "NOMFUN_N1.1",
    "CODFTE",
    "NOMFTE",
    "Q_ASIG",
    "Q_VIG",
    "Q_COMP",
    "Q_ORD",
    "Q_PAG",
    "Q_SAL",
    "Q_VAR",
  ],
  objeto_fuente: [
    "Q_ENT",
    "Q_NOMENT",
    "Q_GRUPO",
    "Q_NOMGRUPO",
    "Q_PARTIDA",
    "Q_NOMPARTIDA",
    "Q_FTE",
    "Q_ASIG",
    "Q_VIG",
    "Q_COMP",
    "Q_ORD",
    "Q_PAG",
    "Q_SAL",
    "Q_VAR",
  ],
};
export const RESOURCES: Record<
  View,
  {
    id: string;
    url: string;
    expectedHash: string;
    expectedBytes: number;
    expectedRows: number;
  }
> = {
  finalidad_fuente: {
    id: "c45515ce-881d-4623-b10d-f422e395c3ca",
    url: "https://datosabiertos.chaco.gob.ar/dataset/f95d3d0c-64e6-48a5-9105-b966bf311502/resource/c45515ce-881d-4623-b10d-f422e395c3ca/download/fyf-acum-01-al-12.csv",
    expectedHash:
      "5ecf7a89a9df8c8a4d4cc1b44464cf6cf4f46108634faedc4639c794679cdab7",
    expectedBytes: 87111,
    expectedRows: 504,
  },
  objeto_fuente: {
    id: "3ffb2f1f-656f-486d-8496-a36366e6cf25",
    url: "https://datosabiertos.chaco.gob.ar/dataset/f95d3d0c-64e6-48a5-9105-b966bf311502/resource/3ffb2f1f-656f-486d-8496-a36366e6cf25/download/obj-del-gto-acum-1-al-12.csv",
    expectedHash:
      "300bd7ce059bf22c94cbbe793326eac04153b93467841a75302828d21b43b5e0",
    expectedBytes: 918019,
    expectedRows: 6153,
  },
};
const DATASET_URL =
  "https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto";
const MAX_BYTES = 2_000_000;
const MAX_LINES = 10_000;
const MAX_LINE_BYTES = 16_384;

function linesOf(bytes: Uint8Array): Uint8Array[] {
  if (bytes.length > MAX_BYTES || bytes.length === 0)
    throw new Error("invalid file size");
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
    throw new Error("unexpected BOM");
  const result: Uint8Array[] = [];
  let start = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 10) {
      if (i === start || bytes[i - 1] !== 13) throw new Error("expected CRLF");
      if (i - start - 1 > MAX_LINE_BYTES) throw new Error("line too long");
      result.push(bytes.subarray(start, i - 1));
      start = i + 1;
      if (result.length > MAX_LINES) throw new Error("too many lines");
    } else if (bytes[i] === 13 && bytes[i + 1] !== 10)
      throw new Error("unexpected CR");
  }
  if (start < bytes.length) {
    if (bytes.length - start > MAX_LINE_BYTES) throw new Error("line too long");
    result.push(bytes.subarray(start));
    if (result.length > MAX_LINES) throw new Error("too many lines");
  }
  return result;
}

function cellsOf(text: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let state: "start" | "plain" | "quoted" | "closed" = "start";
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127)
      throw new Error("control character in cell");
    if (ch === ";" && state !== "quoted") {
      cells.push(cell);
      cell = "";
      state = "start";
      continue;
    }
    if (state === "start") {
      if (ch === '"') state = "quoted";
      else {
        cell += ch;
        state = "plain";
      }
    } else if (state === "plain") {
      if (ch === '"') throw new Error("quote inside unquoted cell");
      cell += ch;
    } else if (state === "quoted") {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') state = "closed";
      else cell += ch;
    } else throw new Error("characters after closing quote");
    if (cell.length > 8192) throw new Error("cell too long");
  }
  if (state === "quoted") throw new Error("unclosed quote or multiline field");
  cells.push(cell);
  return cells;
}

export function parseDocument(
  bytes: Uint8Array,
  view: View,
  enforceOriginal = true,
): { document: BudgetDocument; rows: RawBudgetRow[] } {
  const resource = RESOURCES[view];
  const hash = sha256(bytes);
  if (
    enforceOriginal &&
    (hash !== resource.expectedHash || bytes.length !== resource.expectedBytes)
  )
    throw new Error(`${view}: original hash or size mismatch`);
  const lines = linesOf(bytes);
  if (lines.length < 2) throw new Error(`${view}: no data rows`);
  const decoder = new TextDecoder("windows-1252", { fatal: true });
  const headers = HEADERS[view];
  if (
    JSON.stringify(cellsOf(decoder.decode(lines[0]))) !==
    JSON.stringify(headers)
  )
    throw new Error(`${view}: header mismatch`);
  const rows: RawBudgetRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length === 0)
      throw new Error(`${view}: empty line ${i + 1}`);
    try {
      const cells = cellsOf(decoder.decode(line));
      if (cells.length !== headers.length)
        throw new Error("non-rectangular row");
      const raw = Object.fromEntries(
        headers.map((key, j) => [key, cells[j] ?? ""]),
      );
      const get = (key: string): string => {
        const value = raw[key];
        if (value === undefined || value === "")
          throw new Error(`missing ${key}`);
        return value;
      };
      const amounts = Object.fromEntries(
        STAGES.map((stage) => [stage, get(stage)]),
      ) as RawBudgetRow["amounts"];
      const normalizedAmounts = Object.fromEntries(
        STAGES.map((stage) => [
          stage,
          canonical(sourceDecimal(amounts[stage])),
        ]),
      ) as RawBudgetRow["normalizedAmounts"];
      const classification: RawBudgetRow["classification"] =
        view === "finalidad_fuente"
          ? {
              view,
              finalidad: get("FINALIDAD"),
              finalidadName: get("NOMFIN"),
              functionN2: get("FUNC_N2") === "-" ? null : get("FUNC_N2"),
              functionN1: get("FUNC_N1"),
              functionName:
                get("NOMFUN_N1.1") === "-" ? null : get("NOMFUN_N1.1"),
              fundingCode: get("CODFTE"),
              fundingName: get("NOMFTE"),
            }
          : {
              view,
              groupCode: get("Q_GRUPO"),
              groupName: get("Q_NOMGRUPO"),
              partidaCode: get("Q_PARTIDA"),
              partidaName: get("Q_NOMPARTIDA"),
              fundingCode: get("Q_FTE"),
            };
      rows.push({
        documentSha256: hash,
        sourceLine: i + 1,
        rawLineSha256: sha256(line),
        rawCells: raw,
        entityCode: get("Q_ENT"),
        entityName: get("Q_NOMENT"),
        classification,
        amounts,
        normalizedAmounts,
        reportedVariation: get("Q_VAR"),
        normalizedVariation: canonical(sourceDecimal(get("Q_VAR"))),
        currency: null,
        unitLabel: null,
        interpretationStatus: "unconfirmed",
        isPublished: false,
      });
    } catch (cause) {
      throw new Error(
        `${view}: invalid line ${i + 1}: ${cause instanceof Error ? cause.message : "unknown"}`,
      );
    }
  }
  if (enforceOriginal && rows.length !== resource.expectedRows)
    throw new Error(`${view}: unexpected row count`);
  const document: BudgetDocument = {
    sourceId: SOURCE_ID,
    documentId: resource.id,
    datasetUrl: DATASET_URL,
    resourceUrl: resource.url,
    sha256: hash,
    byteLength: bytes.length,
    parseEncoding: "windows-1252",
    delimiter: ";",
    year: 2022,
    periodStart: "2022-01-01",
    periodEnd: "2022-12-31",
    periodBasis: "resource_title",
    view,
    schemaVersion: SCHEMA_VERSION,
    transformationVersion: TRANSFORMATION_VERSION,
    rightsStatus: "pending",
    publicationAllowed: false,
    currency: null,
    unitLabel: null,
  };
  return { document, rows };
}
