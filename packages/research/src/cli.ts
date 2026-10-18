import { isAbsolute, resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import type { RawBudgetRow, View } from "@chaco/core";
import { readOriginal } from "../../ingestion/src/archive.ts";
import {
  HEADERS,
  parseDocument,
  RESOURCES,
} from "../../ingestion/src/parser.ts";
import { assess } from "../../ingestion/src/quality.ts";
import {
  type Anomaly,
  diagnose,
  matchesAnomaly,
  priorityCases,
} from "./cases.ts";
import { dictionary, evidence } from "./dictionary.ts";
import { writeDossier } from "./dossier.ts";
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
    documents: {
      finalidad_fuente: finalidad.document,
      objeto_fuente: objeto.document,
    },
    report: assess(finalidad.rows, objeto.rows),
  };
}

const help = `Comandos: help; entities; entity <código>|clear; view finalidad|objeto; search <texto>; filter <COLUMNA> <valor exacto>; anomaly none|negative|residual|zero-vig (solo objeto); cases; stats; source; sort <COLUMNA> asc|desc; page <número>; inspect <línea física>; dossier; dictionary; quality; evidence; clear; quit.
Filtros combinados por AND; "filter COLUMNA" elimina el filtro. "clear" limpia búsqueda, filtros, orden y anomalía, conserva entidad. "dossier" crea un expediente privado nuevo bajo data/; rechaza sobrescribir. No exportar filas a destinos arbitrarios.`;

export async function run(paths: [string, string]): Promise<void> {
  const { rows, documents, report } = await loadOriginals(paths);
  const repositoryRoot = resolve(
    fileURLToPath(new URL("../../../", import.meta.url)),
  );
  const entities = new Map(
    rows.finalidad_fuente.map((row) => [row.entityCode.trim(), row.entityName]),
  );
  let entity: string | null = null;
  let anomaly: Anomaly = "none";
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
  const current = (): RawBudgetRow[] =>
    rows[query.view].filter(
      (row) =>
        (!entity || row.entityCode.trim() === entity) &&
        (query.view !== "objeto_fuente" || matchesAnomaly(row, anomaly)),
    );
  function show(): void {
    const result = queryRows(current(), query);
    query = { ...query, page: result.page };
    print(
      `INVESTIGACIÓN LOCAL · NO PUBLICADO · ${query.view} · entidad ${entity ? safeText(entity) : "todas"} · anomalía ${query.view === "objeto_fuente" ? anomaly : "no aplica"} · unidad/moneda no confirmadas · ${report.state}`,
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
        `${row.sourceLine}\t${safeText(row.entityCode, 12)}\t${safeText(row.entityName, 36)}\t${safeText(category, 36)}\tQ_VIG=${safeText(row.amounts.Q_VIG, 28)}${query.view === "objeto_fuente" ? `\tQ_SAL=${safeText(row.amounts.Q_SAL, 28)}\tresidual=${diagnose(row).residual}` : ""}`,
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
        if (command === "entities") {
          for (const [code, name] of [...entities].sort(([a], [b]) =>
            a.localeCompare(b),
          )) {
            print(
              `${safeText(code, 16)}\t${safeText(name, 70)}\tfinalidad=${rows.finalidad_fuente.filter((r) => r.entityCode.trim() === code).length}\tobjeto=${rows.objeto_fuente.filter((r) => r.entityCode.trim() === code).length}`,
            );
          }
          continue;
        }
        if (command === "entity") {
          if (argument === "clear") entity = null;
          else if (entities.has(argument)) entity = argument;
          else
            throw new Error(
              "Código de entidad desconocido; use entities o entity clear.",
            );
          query = { ...query, page: 1 };
          show();
          continue;
        }
        if (command === "anomaly") {
          if (!["none", "negative", "residual", "zero-vig"].includes(argument))
            throw new Error("Use anomaly none|negative|residual|zero-vig.");
          if (query.view !== "objeto_fuente" && argument !== "none")
            throw new Error(
              "Anomalías focalizadas disponibles sólo en objeto.",
            );
          anomaly = argument as Anomaly;
          query = { ...query, page: 1 };
          show();
          continue;
        }
        if (command === "cases") {
          const cases = priorityCases(
            rows.objeto_fuente.filter(
              (row) => !entity || row.entityCode.trim() === entity,
            ),
          );
          print(
            `Objeto, entidad ${entity ? safeText(entity) : "todas"}: Q_SAL negativos ${cases.negative.length}; negativos con residual no nulo ${cases.residual.length}; negativos con Q_VIG=0 y Q_COMP>0 ${cases.zeroVig.length}; intersección ${cases.overlap.length}; unión ${cases.union.length}. Use view objeto; anomaly residual|zero-vig; page; inspect.`,
          );
          continue;
        }
        if (command === "stats") {
          const selected = current();
          const result = queryRows(selected, { ...query, page: 1 });
          print(
            `Estadísticas de ${query.view}, entidad ${entity ? safeText(entity) : "todas"}: ${result.total} filas coincidentes; recuentos, no importes. Vistas separadas.`,
          );
          const keys =
            query.view === "objeto_fuente"
              ? ["Q_GRUPO", "Q_PARTIDA", "Q_FTE"]
              : ["FINALIDAD", "CODFTE"];
          for (const key of keys) {
            const counts = new Map<string, number>();
            for (const row of result.matching) {
              const value = row.rawCells[key] ?? "";
              counts.set(value, (counts.get(value) ?? 0) + 1);
            }
            print(
              `${key}: ${counts.size} códigos distintos; ${[...counts]
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .slice(0, 15)
                .map(([value, count]) => `${safeText(value, 30)}=${count}`)
                .join("; ")}. Hasta 15, sin sumar vistas.`,
            );
          }
          continue;
        }
        if (command === "source" || command === "provenance") {
          const doc = documents[query.view];
          print(
            `Recurso ${safeText(doc.resourceUrl, 300)}; id ${doc.documentId}; SHA-256 ${doc.sha256}; bytes ${doc.byteLength}; período ${doc.periodStart} a ${doc.periodEnd} según título; codificación ${doc.parseEncoding}; esquema ${doc.schemaVersion}; publicationAllowed=${doc.publicationAllowed}.`,
          );
          print(
            "Normativa orientativa: https://contaduriageneral.chaco.gob.ar/leyes (Ley 1092-A, arts. 52, 57–61, 67–68); clasificadores y modificaciones: https://contaduriageneral.chaco.gob.ar/manuales-safyc . Vigencia 2022, nivel legal de control, movimientos fechados y diccionario Q_* pendientes; estos enlaces no explican una fila concreta.",
          );
          continue;
        }
        if (command === "dossier") {
          const path = await writeDossier(
            rows.objeto_fuente,
            documents.objeto_fuente,
            repositoryRoot,
          );
          print(
            `Expediente privado creado en ${safeText(path, 500)}. No compartir ni subir a Git/CI.`,
          );
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
            `Claves dimensionales duplicadas en selección, líneas completas: ${duplicateLines(current(), query.view).join(", ") || "ninguna"}. Saldos negativos en vista completa: ${report.negativeBalances[query.view]}.`,
          );
          print(
            "Los hallazgos QA siguientes corresponden a la vista completa, no a la entidad, filtros ni anomalía seleccionados.",
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
          const row = rows[query.view].find(
            (item) =>
              item.sourceLine === line &&
              (!entity || item.entityCode.trim() === entity),
          );
          if (!row)
            throw new Error("Línea no encontrada en esta vista y entidad.");
          print(
            `Vista ${query.view}; recurso ${documents[query.view].documentId}; SHA-256 documento ${row.documentSha256}; línea física ${line}; SHA-256 línea ${row.rawLineSha256}; interpretationStatus=${row.interpretationStatus}; isPublished=${row.isPublished}; moneda/unidad no confirmadas.`,
          );
          if (query.view === "objeto_fuente") {
            const d = diagnose(row);
            print(
              `Q_VIG − Q_COMP=${d.calculated}; residual firmado Q_SAL − (Q_VIG − Q_COMP)=${d.residual}; negativo=${d.negative}; residual no nulo=${d.residualNonzero}; vigente cero/compromiso positivo=${d.zeroVigPositiveComp}; alerta QA >0,011=${d.warning}; error QA >1=${d.error}. Son controles aritméticos, no juicio contable.`,
            );
          }
          print(
            "Q_PAG no acredita transferencia efectiva; ficha oficial y fuente: use dictionary y source.",
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
          anomaly = "none";
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
        } else if (command === "clear") {
          anomaly = "none";
          query = {
            ...query,
            search: "",
            filters: {},
            sortBy: "Q_ENT",
            direction: "asc",
            page: 1,
          };
        } else throw new Error("Comando desconocido. Escriba help.");
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
