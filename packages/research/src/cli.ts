import { isAbsolute, resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import type { RawBudgetRow, View } from "@chaco/core";
import { readOriginal } from "../../ingestion/src/archive.ts";
import {
  HEADERS,
  parseDocument,
  RESOURCES,
} from "../../ingestion/src/parser.ts";
import { assess } from "../../ingestion/src/quality.ts";
import { dictionary, evidence } from "./dictionary.ts";
import {
  assertColumn,
  duplicateLines,
  nullMarkers,
  type Query,
  queryRows,
  safeText,
} from "./query.ts";

export function validatePaths(paths: string[]): [string, string] {
  if (paths.length !== 2 || !paths.every((path) => path && isAbsolute(path)))
    throw new Error(
      "Uso: bun run research -- <ruta-absoluta-finalidad.csv> <ruta-absoluta-objeto.csv>",
    );
  const [first, second] = paths as [string, string];
  if (resolve(first) === resolve(second))
    throw new Error("Se requieren dos archivos distintos.");
  return [first, second];
}

export async function loadOriginals(paths: [string, string]) {
  const views = ["finalidad_fuente", "objeto_fuente"] as const;
  const documents = await Promise.all(
    views.map(async (view, index) => {
      const resource = RESOURCES[view];
      const bytes = await readOriginal(
        index === 0 ? paths[0] : paths[1],
        resource.expectedBytes,
        resource.expectedHash,
      );
      return parseDocument(bytes, view);
    }),
  );
  const [finalidad, objeto] = documents;
  if (!finalidad || !objeto) throw new Error("Faltan documentos.");
  return {
    rows: { finalidad_fuente: finalidad.rows, objeto_fuente: objeto.rows },
    report: assess(finalidad.rows, objeto.rows),
  };
}

const help = `Comandos: help; view finalidad|objeto; search <texto>; filter <COLUMNA> <valor exacto>; sort <COLUMNA> asc|desc; page <número>; inspect <línea física>; dictionary; quality; evidence; clear; quit.
Filtros combinados por AND; "filter COLUMNA" elimina el filtro. "clear" limpia búsqueda, filtros y orden. Exportación de filas deshabilitada: no hay destino local cuya seguridad esté garantizada.`;

export async function run(paths: [string, string]): Promise<void> {
  const { rows, report } = await loadOriginals(paths);
  const input = createInterface({
    input: stdin,
    output: stdout,
    terminal: stdin.isTTY,
  });
  let query: Query = {
    view: "finalidad_fuente",
    search: "",
    filters: {},
    sortBy: "Q_ENT",
    direction: "asc",
    page: 1,
    pageSize: 25,
  };
  const print = (text: string) => stdout.write(`${text}\n`);
  const current = (): RawBudgetRow[] => rows[query.view];
  function show(): void {
    const result = queryRows(current(), query);
    query = { ...query, page: result.page };
    print(
      `INVESTIGACIÓN LOCAL · NO PUBLICADO · ${query.view} · unidad/moneda no confirmadas · ${report.state}`,
    );
    print(
      `${result.total} resultados; página ${result.page}/${result.pages}; ${result.rows.length} filas visibles. Vistas de una misma ejecución: no sumar.`,
    );
    for (const row of result.rows) {
      const category =
        row.classification.view === "finalidad_fuente"
          ? row.classification.finalidadName
          : row.classification.partidaName;
      print(
        `${row.sourceLine}\t${safeText(row.entityCode, 12)}\t${safeText(row.entityName, 36)}\t${safeText(category, 36)}\tQ_VIG=${safeText(row.amounts.Q_VIG, 28)}`,
      );
    }
    if (!result.total)
      print("Sin coincidencias. Use clear o cambie los filtros.");
  }
  print(
    `Verificados ${rows.finalidad_fuente.length} y ${rows.objeto_fuente.length} registros; revisión ${report.state}; publicationAllowed=false.`,
  );
  print(help);
  show();
  try {
    const lines = input[Symbol.asyncIterator]();
    while (true) {
      stdout.write("investigar> ");
      const next = await lines.next();
      if (next.done) break;
      const answer = next.value.trim();
      if (!answer) continue;
      const separator = answer.indexOf(" ");
      const command = (
        separator < 0 ? answer : answer.slice(0, separator)
      ).toLowerCase();
      const argument = separator < 0 ? "" : answer.slice(separator + 1).trim();
      try {
        if (command === "quit" || command === "exit") break;
        if (command === "help") {
          print(help);
          continue;
        }
        if (command === "dictionary") {
          dictionary(query.view).forEach(print);
          continue;
        }
        if (command === "evidence") {
          evidence().forEach(print);
          continue;
        }
        if (command === "quality") {
          print(
            `QA: ${report.state}; publicationAllowed=false; totales numéricos no mostrados para evitar confusión de unidades.`,
          );
          print(
            `Campos obligatorios ausentes: ninguno (de otro modo fallaría la validación). Marcadores nulos: ${JSON.stringify(nullMarkers(current(), query.view))}.`,
          );
          print(
            `Claves dimensionales duplicadas, líneas completas: ${duplicateLines(current(), query.view).join(", ") || "ninguna"}. Saldos negativos: ${report.negativeBalances[query.view]}.`,
          );
          for (const finding of report.findings.filter(
            (item) => item.view === query.view || item.view === "both",
          )) {
            print(
              `${finding.severity} ${finding.code}: ${finding.count}; ejemplos (máximo 20, NO listado completo): ${finding.lines.join(", ") || "sin línea específica"}.`,
            );
          }
          print(
            "Q_VAR: comparación heurística de QA, no definición oficial. Las vistas no se suman.",
          );
          continue;
        }
        if (command === "inspect") {
          const line = Number(argument);
          if (!Number.isSafeInteger(line) || line < 2)
            throw new Error("Indique número de línea física válido.");
          const row = current().find((item) => item.sourceLine === line);
          if (!row) throw new Error("Línea no encontrada en esta vista.");
          print(
            `Línea ${line}; SHA-256 ${row.rawLineSha256}; interpretationStatus=${row.interpretationStatus}; isPublished=${row.isPublished}; moneda/unidad no confirmadas.`,
          );
          for (const key of HEADERS[query.view])
            print(
              `${key}: ${safeText(row.rawCells[key] ?? "", 8192)}${query.view === "finalidad_fuente" && (key === "FUNC_N2" || key === "NOMFUN_N1.1") && row.rawCells[key] === "-" ? " [marcador nulo]" : ""}`,
            );
          continue;
        }
        if (command === "view") {
          if (argument !== "finalidad" && argument !== "objeto")
            throw new Error("Use view finalidad|objeto.");
          const view: View =
            argument === "finalidad" ? "finalidad_fuente" : "objeto_fuente";
          query = {
            ...query,
            view,
            search: "",
            filters: {},
            sortBy: "Q_ENT",
            direction: "asc",
            page: 1,
          };
        } else if (command === "search")
          query = { ...query, search: argument, page: 1 };
        else if (command === "filter") {
          const match = /^(\S+)(?:\s+(.+))?$/.exec(argument);
          if (!match?.[1])
            throw new Error("Use filter COLUMNA [valor exacto].");
          assertColumn(query.view, match[1]);
          const filters = { ...query.filters };
          if (match[2] === undefined) delete filters[match[1]];
          else filters[match[1]] = match[2];
          query = { ...query, filters, page: 1 };
        } else if (command === "sort") {
          const match = /^(\S+)\s+(asc|desc)$/.exec(argument);
          if (!match?.[1] || (match[2] !== "asc" && match[2] !== "desc"))
            throw new Error("Use sort COLUMNA asc|desc.");
          assertColumn(query.view, match[1]);
          query = { ...query, sortBy: match[1], direction: match[2], page: 1 };
        } else if (command === "page") {
          const page = Number(argument);
          if (
            !/^\d+$/.test(argument) ||
            !Number.isSafeInteger(page) ||
            page < 1
          )
            throw new Error("Indique una página positiva.");
          query = { ...query, page };
        } else if (command === "clear")
          query = {
            ...query,
            search: "",
            filters: {},
            sortBy: "Q_ENT",
            direction: "asc",
            page: 1,
          };
        else throw new Error("Comando desconocido. Escriba help.");
        show();
      } catch (error) {
        print(
          `Error: ${error instanceof Error ? safeText(error.message, 200) : "error desconocido"}`,
        );
      }
    }
  } finally {
    input.close();
  }
}

if (import.meta.main) {
  try {
    await run(validatePaths(process.argv.slice(2)));
  } catch (error) {
    console.error(
      error instanceof Error
        ? safeText(error.message, 200)
        : "Error de validación.",
    );
    process.exitCode = 1;
  }
}
