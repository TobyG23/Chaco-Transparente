import type { View } from "@chaco/core";
import { HEADERS } from "../../ingestion/src/parser.ts";

const sources: Record<View, string> = {
  finalidad_fuente:
    "https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/c45515ce-881d-4623-b10d-f422e395c3ca",
  objeto_fuente:
    "https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/3ffb2f1f-656f-486d-8496-a36366e6cf25",
};
const descriptions: Record<string, string> = {
  Q_ENT:
    "Código de entidad/jurisdicción; no homologar entre clasificaciones sin revisión.",
  Q_NOMENT: "Nombre de entidad/jurisdicción.",
  FINALIDAD: "Código de finalidad del gasto.",
  NOMFIN: "Nombre de finalidad.",
  FUNC_N2: "Código funcional; '-' se interpreta como marcador nulo.",
  FUNC_N1: "Código funcional; jerarquía precisa pendiente de confirmación.",
  "NOMFUN_N1.1": "Nombre de función; '-' se interpreta como marcador nulo.",
  CODFTE:
    "Código de fuente en vista finalidad; equivalencia con Q_FTE no confirmada.",
  NOMFTE: "Nombre de fuente en vista finalidad.",
  Q_GRUPO: "Código de grupo del objeto del gasto.",
  Q_NOMGRUPO: "Nombre de grupo del objeto del gasto.",
  Q_PARTIDA: "Código de partida del objeto del gasto.",
  Q_NOMPARTIDA: "Nombre de partida del objeto del gasto.",
  Q_FTE:
    "Código de fuente en vista objeto; equivalencia con CODFTE no confirmada.",
  Q_ASIG: "Presupuesto asignado por ley, según la ficha del portal.",
  Q_VIG: "Presupuesto vigente, según la ficha del portal.",
  Q_COMP: "Comprometido, según la ficha; interpretación normativa pendiente.",
  Q_ORD: "Ordenado, según la ficha; interpretación normativa pendiente.",
  Q_PAG: "Pagado, según la ficha; no prueba transferencia bancaria individual.",
  Q_SAL: "Vigente menos comprometido, según ambas fichas; verificar por fila.",
  Q_VAR:
    "Definiciones contradictorias entre fichas (cociente/variación); fórmula y unidad pendientes.",
};

export function dictionary(view: View): string[] {
  return HEADERS[view].map(
    (key) =>
      `${key}: ${descriptions[key] ?? "Sin definición corroborada."}\n  Ficha: ${sources[view]}`,
  );
}

export function evidence(): string[] {
  return [
    "Matriz de evidencia: descripciones del portal, no certificación normativa ni permiso editorial.",
    ...["Q_ASIG", "Q_VIG", "Q_COMP", "Q_ORD", "Q_PAG", "Q_SAL", "Q_VAR"].map(
      (key) =>
        `${key}: ${descriptions[key]} | Decisión independiente: pendiente para publicación.`,
    ),
    "Moneda/unidad: campos de unidad vacíos; ninguna moneda o escala confirmada.",
    "Período: acumulado enero–diciembre 2022 según títulos, no serie mensual.",
    "Clasificaciones: dos desgloses de la misma ejecución; no sumar vistas ni equiparar códigos de fuentes.",
    "Derechos/privacidad: licencia, atribución por recurso y revisión de filas pendientes; publicación bloqueada.",
    `Finalidad: ${sources.finalidad_fuente}`,
    `Objeto: ${sources.objeto_fuente}`,
    "Detalle de evaluación individual: PROVENANCE.md y CONTENT-STATUS.md.",
  ];
}
