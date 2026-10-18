// Extracted from the national government's consolidated provincial-stock workbooks.
// The source files are linked, not bundled or served by this application.
export const debtSourcePage =
  "https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/deuda-publica-provincial/evolucion-de-stock";
export const debtLicenseUrl =
  "https://www.argentina.gob.ar/terminos-y-condiciones";
export const debtAttribution =
  "Subsecretaría de Coordinación Fiscal Provincial, Gobierno de la Nación Argentina";

export type DebtObservation = {
  date: string;
  period: string;
  /** Numeric value exactly as read from the workbook, before unit conversion. */
  sourceValue: string;
  sourceUnit: "miles de pesos" | "millones de pesos";
  sheet: string;
  cell: string;
  sourceUrl: string;
  sha256: string;
};

export const debtObservations: readonly DebtObservation[] = [
  {
    date: "2022-12-31",
    period: "Dic 2022",
    sourceValue: "101190519.09306316",
    sourceUnit: "miles de pesos",
    sheet: "Dic-22",
    cell: "B12",
    sourceUrl:
      "https://www.argentina.gob.ar/sites/default/files/stock_consolidado_2022_-_3112.xlsx",
    sha256: "749843a90f0ca0b6e5aa100213e758492b6604ca9219f416b7f7df51cd0fe0ce",
  },
  {
    date: "2023-12-31",
    period: "Dic 2023",
    sourceValue: "349106.42889352847",
    sourceUnit: "millones de pesos",
    sheet: "Dic-23",
    cell: "B18",
    sourceUrl:
      "https://www.argentina.gob.ar/sites/default/files/stock_consolidado_2023_-_3112.xlsx",
    sha256: "42f8e9840dac0b37bd01676715fd2ae30f7105b78fdbc5a73436ffb9d52ecf25",
  },
  {
    date: "2024-12-31",
    period: "Dic 2024",
    sourceValue: "537293.4633925447",
    sourceUnit: "millones de pesos",
    sheet: "Diciembre-24",
    cell: "B18",
    sourceUrl:
      "https://www.argentina.gob.ar/sites/default/files/stock_consolidado_2024_-_3112_0.xls",
    sha256: "7fe3116536758389efb385d5820b1151844bd8c2cd54fb646ae317867d59eb86",
  },
  {
    date: "2025-12-31",
    period: "Dic 2025",
    sourceValue: "703527.51727823308",
    sourceUnit: "millones de pesos",
    sheet: "Dic-25 millones",
    cell: "B18",
    sourceUrl:
      "https://www.argentina.gob.ar/sites/default/files/stock_iv_trim_2025_2.xlsx",
    sha256: "208f1f8ce031538aae6442e68d4602319a39da62547d4105d12cca80116071a7",
  },
  {
    date: "2026-03-31",
    period: "Mar 2026",
    sourceValue: "660611.02867401857",
    sourceUnit: "millones de pesos",
    sheet: "Mar-26 millones",
    cell: "B18",
    sourceUrl:
      "https://www.argentina.gob.ar/sites/default/files/stock_i_trim_2026.xlsx",
    sha256: "75f02a9eb0ae184433c4f038a6ba8d48122b6724d4fe614c93cc971f1f77e6e0",
  },
  {
    date: "2026-06-30",
    period: "Jun 2026",
    sourceValue: "610194.83629409899",
    sourceUnit: "millones de pesos",
    sheet: "Jun-26 millones",
    cell: "B18",
    sourceUrl:
      "https://www.argentina.gob.ar/sites/default/files/stock_ii_trim_2026.xlsx",
    sha256: "10a4b2d1cb9c2973a69a547858e7667e5c222729a477e562ce9d2658b95b9533",
  },
] as const;

/** Convert the one thousands-of-pesos workbook to the millions used throughout the series. */
export function millionsOfPesos(row: DebtObservation): number {
  return row.sourceUnit === "miles de pesos"
    ? Number(row.sourceValue) / 1000
    : Number(row.sourceValue);
}

export function formatMillions(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
