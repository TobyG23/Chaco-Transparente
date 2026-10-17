import { describe, expect, test } from "bun:test";
import { canonical, compare, decimal, sha256, subtract } from "@chaco/core";
import { HEADERS, parseDocument } from "../src/parser.ts";

const encoder = new TextEncoder();
function fixture(
  row: string,
  header = HEADERS.finalidad_fuente.join(";"),
): Uint8Array {
  return encoder.encode(`${header}\r\n${row}\r\n`);
}
const base =
  "0001;Entidad;1;Finalidad;-;1;-;1;Fuente;10,00;10,00;8,00;7,00;6,00;2,00;80,00";

describe("CSV sintético, nunca datos oficiales", () => {
  test("preserva código, bytes y líneas; separa decimal original", () => {
    const bytes = fixture(base);
    const { document, rows } = parseDocument(bytes, "finalidad_fuente", false);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.sourceLine).toBe(2);
    expect(rows[0]?.entityCode).toBe("0001");
    expect(rows[0]?.rawCells.FUNC_N2).toBe("-");
    expect(rows[0]?.classification.view).toBe("finalidad_fuente");
    expect(rows[0]?.amounts.Q_VIG).toBe("10,00");
    expect(rows[0]?.normalizedAmounts.Q_VIG).toBe("10.00");
    expect(rows[0]?.rawLineSha256).toBe(sha256(encoder.encode(base)));
    expect(document.publicationAllowed).toBe(false);
    expect(rows[0]?.isPublished).toBe(false);
  });
  test("acepta delimitador y comilla entre comillas", () => {
    const row = base.replace("Entidad", '"Entidad; ""prueba"""');
    expect(
      parseDocument(fixture(row), "finalidad_fuente", false).rows[0]
        ?.entityName,
    ).toBe('Entidad; "prueba"');
  });
  test("rechaza cabecera alterada y fila truncada", () => {
    expect(() =>
      parseDocument(fixture(base, "Q_ENT;OTRO"), "finalidad_fuente", false),
    ).toThrow("header mismatch");
    expect(() =>
      parseDocument(fixture("0001"), "finalidad_fuente", false),
    ).toThrow("non-rectangular");
  });
  test("rechaza LF sin CR, decimal inválido y multilinea entre comillas", () => {
    expect(() =>
      parseDocument(
        encoder.encode(`${HEADERS.finalidad_fuente.join(";")}\n${base}\n`),
        "finalidad_fuente",
        false,
      ),
    ).toThrow("CRLF");
    expect(() =>
      parseDocument(
        fixture(base.replace("10,00", "10.00")),
        "finalidad_fuente",
        false,
      ),
    ).toThrow("invalid decimal");
    expect(() =>
      parseDocument(
        fixture(base.replace("Entidad", '"Entidad\r\notra"')),
        "finalidad_fuente",
        false,
      ),
    ).toThrow();
  });
  test("objeto conserva saldos negativos y código de fuente", () => {
    const row = "0001;Entidad;1;Grupo;10;Partida;001;10;10;12;11;10;-2;120";
    const bytes = fixture(row, HEADERS.objeto_fuente.join(";"));
    const parsed = parseDocument(bytes, "objeto_fuente", false).rows[0];
    expect(parsed?.classification).toMatchObject({
      view: "objeto_fuente",
      fundingCode: "001",
    });
    expect(parsed?.normalizedAmounts.Q_SAL).toBe("-2");
  });
  test("exactitud decimal en sumas y negativos", () => {
    expect(canonical(subtract(decimal("0,3"), decimal("0,2")))).toBe("0.1");
    expect(compare(decimal("-530728389,5"), decimal("0"))).toBe(-1);
  });
});
