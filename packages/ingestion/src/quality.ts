import {
  absolute,
  add,
  canonical,
  compare,
  decimal,
  multiply,
  QUALITY_VERSION,
  type RawBudgetRow,
  ratioOutside,
  STAGES,
  type Stage,
  subtract,
  type View,
} from "@chaco/core";

export interface Finding {
  code: string;
  view: View | "both";
  lines: number[];
  count: number;
  severity: "warning" | "error";
}
export interface QualityReport {
  version: typeof QUALITY_VERSION;
  counts: Record<View, number>;
  entities: Record<View, number>;
  negativeBalances: Record<View, number>;
  totalsByView: Record<View, Record<Stage, string>>;
  crossViewDifferences: Record<Stage, string>;
  findings: Finding[];
  state: "review_required" | "rejected";
  publicationAllowed: false;
  thresholds: {
    variationPoints: "0.011";
    balanceWarning: "0.011";
    balanceError: "1";
    reconciliation: "3";
  };
}
const THRESHOLDS = {
  variationPoints: decimal("0,011"),
  balanceWarning: decimal("0,011"),
  balanceError: decimal("1"),
  reconciliation: decimal("3"),
};

export function assess(
  finalidad: RawBudgetRow[],
  objeto: RawBudgetRow[],
): QualityReport {
  const views: Record<View, RawBudgetRow[]> = {
    finalidad_fuente: finalidad,
    objeto_fuente: objeto,
  };
  const findings: Finding[] = [];
  const counts = {
    finalidad_fuente: finalidad.length,
    objeto_fuente: objeto.length,
  };
  const entities = { finalidad_fuente: 0, objeto_fuente: 0 };
  const negativeBalances = { finalidad_fuente: 0, objeto_fuente: 0 };
  const totalsByView = {} as QualityReport["totalsByView"];
  function mark(
    code: string,
    view: View,
    line: number,
    severity: Finding["severity"],
  ): void {
    let finding = findings.find(
      (f) => f.code === code && f.view === view && f.severity === severity,
    );
    if (!finding) {
      finding = { code, view, lines: [], count: 0, severity };
      findings.push(finding);
    }
    finding.count++;
    if (finding.lines.length < 20) finding.lines.push(line);
  }
  for (const view of ["finalidad_fuente", "objeto_fuente"] as const) {
    const rows = views[view];
    const seen = new Set<string>();
    entities[view] = new Set(rows.map((r) => r.entityCode)).size;
    const totals = Object.fromEntries(
      STAGES.map((stage) => [stage, decimal("0")]),
    ) as Record<Stage, ReturnType<typeof decimal>>;
    for (const row of rows) {
      if (row.classification.view !== view)
        throw new Error("classification/view mismatch");
      const raw = row.rawCells;
      const key =
        view === "finalidad_fuente"
          ? ["Q_ENT", "FINALIDAD", "FUNC_N2", "FUNC_N1", "CODFTE"]
          : ["Q_ENT", "Q_GRUPO", "Q_PARTIDA", "Q_FTE"];
      const identity = JSON.stringify(key.map((k) => raw[k]));
      if (seen.has(identity))
        mark("duplicate_dimension_key", view, row.sourceLine, "error");
      seen.add(identity);
      for (const stage of STAGES)
        totals[stage] = add(
          totals[stage],
          decimal(row.normalizedAmounts[stage]),
        );
      const vig = decimal(row.normalizedAmounts.Q_VIG);
      const comp = decimal(row.normalizedAmounts.Q_COMP);
      const ord = decimal(row.normalizedAmounts.Q_ORD);
      const pag = decimal(row.normalizedAmounts.Q_PAG);
      const sal = decimal(row.normalizedAmounts.Q_SAL);
      if (compare(sal, decimal("0")) < 0) negativeBalances[view]++;
      if (compare(comp, ord) < 0 || compare(ord, pag) < 0)
        mark("stage_order", view, row.sourceLine, "warning");
      const residual = absolute(subtract(sal, subtract(vig, comp)));
      if (compare(residual, THRESHOLDS.balanceError) > 0)
        mark("balance_over_one", view, row.sourceLine, "error");
      else if (compare(residual, THRESHOLDS.balanceWarning) > 0)
        mark("balance_rounding", view, row.sourceLine, "warning");
      if (compare(vig, decimal("0")) === 0) {
        if (compare(decimal(row.normalizedVariation), decimal("0")) !== 0)
          mark("variation_zero_denominator", view, row.sourceLine, "warning");
      } else if (
        ratioOutside(
          multiply(comp, decimal("100")),
          vig,
          decimal(row.normalizedVariation),
          THRESHOLDS.variationPoints,
        )
      ) {
        mark("variation_mismatch", view, row.sourceLine, "warning");
      }
    }
    totalsByView[view] = Object.fromEntries(
      STAGES.map((stage) => [stage, canonical(totals[stage])]),
    ) as Record<Stage, string>;
    const expected = view === "finalidad_fuente" ? 504 : 6153;
    if (rows.length !== expected || entities[view] !== 54)
      mark("unexpected_coverage", view, 0, "error");
  }
  const crossViewDifferences = {} as Record<Stage, string>;
  for (const stage of STAGES) {
    const difference = absolute(
      subtract(
        decimal(totalsByView.finalidad_fuente[stage]),
        decimal(totalsByView.objeto_fuente[stage]),
      ),
    );
    crossViewDifferences[stage] = canonical(difference);
    if (compare(difference, THRESHOLDS.reconciliation) > 0)
      findings.push({
        code: `view_reconciliation_${stage}`,
        view: "both",
        lines: [],
        count: 1,
        severity: "error",
      });
  }
  return {
    version: QUALITY_VERSION,
    counts,
    entities,
    negativeBalances,
    totalsByView,
    crossViewDifferences,
    findings,
    state: findings.some((f) => f.severity === "error")
      ? "rejected"
      : "review_required",
    publicationAllowed: false,
    thresholds: {
      variationPoints: "0.011",
      balanceWarning: "0.011",
      balanceError: "1",
      reconciliation: "3",
    },
  };
}
