import { constants } from "node:fs";
import { lstat, mkdir, open } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { BudgetDocument, RawBudgetRow } from "@chaco/core";
import { diagnose, priorityCases } from "./cases.ts";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

export function dossierHtml(
  rows: readonly RawBudgetRow[],
  document: BudgetDocument,
): string {
  if (
    document.view !== "objeto_fuente" ||
    rows.some(
      (row) =>
        row.documentSha256 !== document.sha256 ||
        row.classification.view !== document.view,
    )
  )
    throw new Error("Recurso o fila incompatible.");
  const cases = priorityCases(rows);
  if (new Set(rows.map((row) => row.sourceLine)).size !== rows.length)
    throw new Error("Líneas de origen duplicadas.");
  const cells = (values: string[]) =>
    values.map((value) => `<td>${escapeHtml(value)}</td>`).join("");
  const body = cases.union
    .map((row) => {
      const d = diagnose(row);
      if (
        row.documentSha256 !== document.sha256 ||
        row.classification.view !== "objeto_fuente"
      )
        throw new Error("Caso fuera del documento original de objeto.");
      return `<tr>${cells([
        String(row.sourceLine),
        row.rawLineSha256,
        row.entityCode,
        row.entityName,
        row.rawCells.Q_GRUPO ?? "",
        row.rawCells.Q_PARTIDA ?? "",
        row.rawCells.Q_NOMPARTIDA ?? "",
        row.rawCells.Q_FTE ?? "",
        ...[
          "Q_ASIG",
          "Q_VIG",
          "Q_COMP",
          "Q_ORD",
          "Q_PAG",
          "Q_SAL",
          "Q_VAR",
        ].map((key) => row.rawCells[key] ?? ""),
        d.calculated,
        d.residual,
        d.residualNonzero ? "sí" : "no",
        d.zeroVigPositiveComp ? "sí" : "no",
      ])}</tr>`;
    })
    .join("\n");
  const headers = [
    "Línea física",
    "SHA-256 línea",
    "Entidad",
    "Nombre",
    "Grupo",
    "Partida",
    "Nombre partida",
    "Fuente",
    "Q_ASIG",
    "Q_VIG",
    "Q_COMP",
    "Q_ORD",
    "Q_PAG",
    "Q_SAL",
    "Q_VAR",
    "Q_VIG − Q_COMP",
    "Residual firmado",
    "Residual no nulo",
    "Vigente cero y compromiso positivo",
  ];
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Expediente Local 2022</title><style>body{font:16px/1.5 system-ui,sans-serif;background:#f7f5f0;color:#172635;margin:0;padding:24px max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}main{max-width:1100px;margin:auto}p{max-width:75ch}.table{overflow-x:auto}table{border-collapse:collapse;white-space:nowrap}th,td{border:1px solid #9daaad;padding:6px 9px;text-align:left}tr:nth-child(even){background:#e9edef}code{overflow-wrap:anywhere}</style></head><body><main><h1>Expediente local de conciliación · 2022</h1><p>Privado. No publicar ni subir a Git, CI o frontend. Los valores se conservan como cadenas originales sin moneda/unidad acreditada. No implican fraude, deuda ni compensación autorizada. Q_PAG no prueba transferencia efectiva.</p><p>Recurso: <code>${escapeHtml(document.resourceUrl)}</code><br>SHA-256 documento: <code>${escapeHtml(document.sha256)}</code><br>Período según título: ${escapeHtml(document.periodStart)}–${escapeHtml(document.periodEnd)}. Estado: publicationAllowed=false; isPublished=false.</p><p>Filas negativas: ${cases.negative.length}; residual no nulo dentro de negativas: ${cases.residual.length}; vigente cero y compromiso positivo dentro de negativas: ${cases.zeroVig.length}; intersección: ${cases.overlap.length}; unión sin duplicados: ${cases.union.length}. Residual = Q_SAL − (Q_VIG − Q_COMP), calculado con decimal exacto.</p><div class="table"><table><thead><tr>${headers.map((key) => `<th>${escapeHtml(key)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div><p>Para interpretar cada fila hacen falta el mayor por clave legal, modificaciones aprobadas y fechadas, movimientos y reversos, nivel legal de control, clasificador y especificación del export vigentes para 2022. La identidad SHA verifica esta copia local, no su exactitud institucional.</p></main></body></html>`;
}

export async function writeDossier(
  rows: readonly RawBudgetRow[],
  document: BudgetDocument,
  root: string,
): Promise<string> {
  if (
    document.view !== "objeto_fuente" ||
    !/^[a-f0-9]{64}$/.test(document.sha256)
  )
    throw new Error("Documento de objeto inválido.");
  const expectedRoot = resolve(
    fileURLToPath(new URL("../../../", import.meta.url)),
  );
  if (resolve(root) !== expectedRoot)
    throw new Error("Destino fuera del repositorio confiable.");
  const targetDir = resolve(expectedRoot, "data");
  await mkdir(targetDir, { recursive: true, mode: 0o700 });
  const info = await lstat(targetDir);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error("Directorio data inseguro.");
  const path = join(targetDir, `conciliation-${document.sha256}.html`);
  if (
    !rows.length ||
    rows.some(
      (row) =>
        row.documentSha256 !== document.sha256 ||
        row.classification.view !== "objeto_fuente",
    )
  )
    throw new Error(
      "El expediente exige únicamente filas verificadas del recurso objeto.",
    );
  const text = dossierHtml(rows, document);
  const handle = await open(
    path,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
    0o600,
  );
  try {
    await handle.writeFile(text, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  return path;
}
