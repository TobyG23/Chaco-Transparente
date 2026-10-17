import { describe, expect, test } from "bun:test";
import { readOriginal } from "../src/archive.ts";
import { parseDocument, RESOURCES } from "../src/parser.ts";
import { assess } from "../src/quality.ts";

const paths = [process.env.CHACO_FINALIDAD_CSV, process.env.CHACO_OBJETO_CSV];
const integration = paths.every(Boolean) ? describe : describe.skip;
integration(
  "dos originales locales verificados, nunca incluidos en Git",
  () => {
    test("hash, filas, trazabilidad y bloqueo de publicación", async () => {
      const first = RESOURCES.finalidad_fuente;
      const second = RESOURCES.objeto_fuente;
      const finalidad = parseDocument(
        await readOriginal(
          paths[0] as string,
          first.expectedBytes,
          first.expectedHash,
        ),
        "finalidad_fuente",
      );
      const objeto = parseDocument(
        await readOriginal(
          paths[1] as string,
          second.expectedBytes,
          second.expectedHash,
        ),
        "objeto_fuente",
      );
      const report = assess(finalidad.rows, objeto.rows);
      expect(report.counts).toEqual({
        finalidad_fuente: 504,
        objeto_fuente: 6153,
      });
      expect(report.entities).toEqual({
        finalidad_fuente: 54,
        objeto_fuente: 54,
      });
      expect(report.negativeBalances.objeto_fuente).toBe(233);
      expect(
        report.findings.find(
          (f) => f.code === "balance_rounding" && f.view === "finalidad_fuente",
        )?.count,
      ).toBe(89);
      expect(
        report.findings.find(
          (f) => f.code === "balance_rounding" && f.view === "objeto_fuente",
        )?.count,
      ).toBe(183);
      expect(
        report.findings.filter((f) => f.severity === "error"),
      ).toHaveLength(0);
      expect(report.state).toBe("review_required");
      expect(report.publicationAllowed).toBe(false);
      expect(finalidad.document.publicationAllowed).toBe(false);
      expect(objeto.rows.at(-1)?.sourceLine).toBe(6154);
    });
  },
);
