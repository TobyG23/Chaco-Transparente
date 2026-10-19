// Transcripción de la tabla del artículo 1, página 1, de la copia digital legislativa.
export const budget2024Source =
  "https://digesto.legislaturachaco.gob.ar/Documentos/Documento/GetDocumentoFisico?nombreArchivo=L.3968.F.pdf";
export const budget2024Hash =
  "dfd48a97c3c4f177d66db5aa013dc7161b0f6f3e3ec167a082e6b7fec9164b78";
export const budget2024Amendment =
  "https://digesto.legislaturachaco.gob.ar/Documentos/Documento/GetDocumentoFisico?nombreArchivo=L.4035.F.pdf";

export const budget2024Rows = [
  {
    organism: "Poder Legislativo",
    current: 26553517834,
    capital: 1439000000,
    total: 27992517834,
  },
  {
    organism: "Poder Judicial",
    current: 69998061735,
    capital: 10572858000,
    total: 80570919735,
  },
  {
    organism: "Poder Ejecutivo",
    current: 1149137726879,
    capital: 333376239127,
    total: 1482513966006,
  },
  {
    organism: "Tribunal Electoral",
    current: 833574035,
    capital: 6076300,
    total: 839650335,
  },
  {
    organism: "Fiscalía de Estado",
    current: 4147654686,
    capital: 240000000,
    total: 4387654686,
  },
  {
    organism: "Fiscalía de Investigaciones Administrativas",
    current: 645611419,
    capital: 10000000,
    total: 655611419,
  },
  {
    organism: "Tribunal de Cuentas",
    current: 7189692624,
    capital: 45707625,
    total: 7235400249,
  },
  {
    organism: "Fondo Especial de Retiro Voluntario del Poder Judicial",
    current: 1212072484,
    capital: 0,
    total: 1212072484,
  },
  {
    organism: "Retiro Voluntario del Poder Legislativo",
    current: 1480428513,
    capital: 0,
    total: 1480428513,
  },
  {
    organism: "Instituto del Defensor del Pueblo",
    current: 246431315,
    capital: 4009300,
    total: 250440615,
  },
  {
    organism: "Consejo de la Magistratura y Jurado de Enjuiciamiento",
    current: 330176495,
    capital: 27450000,
    total: 357626495,
  },
] as const;

export const budget2024Totals = {
  current: 1261774948019,
  capital: 345721340352,
  total: 1607496288371,
} as const;

export const formatBudgetPesos = (amount: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount);
