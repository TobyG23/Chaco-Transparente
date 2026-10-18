import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../src/components/page-intro";

export const metadata: Metadata = { title: "Cobertura de datos" };

const sources = [
  {
    title: "Emisiones y financiamiento",
    status: "Archivo provincial de emisiones; no es una serie de stock",
    description:
      "Hacienda publica antecedentes de letras y financiamiento. Para una serie separada de stock provincial sin deuda flotante, consultá la sección de deuda de este portal.",
    href: "https://hacienda.chaco.gob.ar/secciones/8",
    label: "Consultar archivo de Hacienda",
  },
  {
    title: "Transferencias a municipios",
    status: "Planillas de coparticipación; no son todas las transferencias",
    description:
      "Hacienda ofrece planillas mensuales de distribución a municipios. Se enlazan en origen; no reproducimos filas ni calculamos una serie sin revisar alcance y condiciones de reutilización.",
    href: "https://hacienda.chaco.gob.ar/secciones/7",
    label: "Consultar coparticipación municipal",
  },
  {
    title: "Compras y contrataciones",
    status: "Buscador oficial disponible en origen",
    description:
      "El sistema provincial permite buscar compras por año y jurisdicción. Este portal no replica expedientes, oferentes ni adjudicaciones.",
    href: "https://app.chaco.gob.ar/proveedores/servlet/com.ecom.wpconsultacompras",
    label: "Abrir buscador de compras",
  },
] as const;

export default function CoberturaPage() {
  return (
    <>
      <PageIntro eyebrow="COBERTURA" title="Cada tema, con su alcance real.">
        Consultá las fuentes públicas en sus sitios de origen. La serie de stock
        provincial revisada se puede explorar en la sección de deuda; las
        planillas de transferencias y los procedimientos de compra siguen en
        origen.
      </PageIntro>
      <section className="shell section compact-section prose-section">
        <h2>Fuentes para seguir explorando</h2>
        <p>
          <Link href="/deuda">Explorar la serie oficial de stock de deuda</Link>
          . El archivo de emisiones provincial tiene un alcance distinto.
        </p>
        <p>
          Enlaces oficiales consultados el 18 de octubre de 2026. Su
          disponibilidad y actualización dependen de los organismos; enlazarlos
          no implica que sus datos se hayan incorporado o auditado por este
          proyecto.
        </p>
        {sources.map((source) => (
          <article key={source.href} className="coverage-source">
            <h3>{source.title}</h3>
            <p>
              <strong>Estado:</strong> {source.status}.
            </p>
            <p>{source.description}</p>
            <a className="text-link" href={source.href}>
              {source.label} <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
        <p>
          Para gastos de 2022, el{" "}
          <Link href="/datos#catalogo-oficial">catálogo de ejecución</Link>{" "}
          enlaza dos clasificaciones del mismo período; no se suman entre sí. No
          hay aquí registros de transferencias o contrataciones ni permisos de
          republicación confirmados para sus archivos.
        </p>
      </section>
    </>
  );
}
