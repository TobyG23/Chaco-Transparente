export const datasetUrl =
  "https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto";
export const repositoryUrl = "https://github.com/TobyG23/Chaco-Transparente";

export const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/datos", label: "Datos" },
  { href: "/fuentes", label: "Fuentes" },
  { href: "/metodologia", label: "Metodología" },
  { href: "/proyecto", label: "Proyecto" },
  { href: "/estado", label: "Estado" },
] as const;

export const views = [
  {
    title: "Finalidad y fuente",
    description:
      "Vista de la ejecución presupuestaria provincial acumulada entre enero y diciembre de 2022, organizada por finalidad y fuente de financiamiento.",
  },
  {
    title: "Objeto del gasto y fuente",
    description:
      "Otra vista del mismo período acumulado, organizada por objeto del gasto y fuente de financiamiento.",
  },
] as const;

export const pendingDecisions = [
  "Confirmar la moneda y la unidad de los importes.",
  "Verificar la definición normativa de las etapas Q_*, incluida Q_PAG.",
  "Resolver derechos, atribución y condiciones de republicación.",
  "Completar una revisión de privacidad fila por fila y definir la política de actualización y archivo.",
] as const;
