import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../src/components/page-intro";
import { datasetUrl, resourcePages } from "../../src/content";

export const metadata: Metadata = { title: "Fuentes y procedencia" };

export default function FuentesPage() {
  return (
    <>
      <PageIntro eyebrow="02 / PROCEDENCIA" title="Volver siempre a la fuente.">
        La información examinada por el núcleo local procede de dos recursos del
        conjunto Ejecución Presupuestaria del portal de Datos Abiertos Chaco.
        Este sitio no aloja sus CSV ni publica derivados.
      </PageIntro>
      <section className="shell section compact-section prose-section">
        <p className="eyebrow">ORIGEN DOCUMENTADO</p>
        <h2>Un conjunto, dos recursos</h2>
        <p>
          Las copias auditadas corresponden a dos desgloses de la ejecución
          provincial acumulada de enero a diciembre de 2022, según los títulos
          de los recursos. Las huellas de las copias están registradas en el
          código de ingestión; el período no constituye una interpretación
          normativa certificada por este proyecto.
        </p>
        <ul>
          {resourcePages.map((resource) => (
            <li key={resource.id}>
              <a className="text-link" href={resource.href}>
                {resource.title} <span aria-hidden="true">↗</span>
              </a>{" "}
              (identificador: <code>{resource.id}</code>)
            </li>
          ))}
        </ul>
        <p>
          Los enlaces llevan a las fichas oficiales de cada recurso, no a copias
          ni descargas ofrecidas por este proyecto.
        </p>
        <a className="button button-primary" href={datasetUrl}>
          Visitar el conjunto oficial <span aria-hidden="true">↗</span>
        </a>
        <div className="rule" />
        <p className="eyebrow">DERECHOS Y ATRIBUCIÓN</p>
        <h2>Una etiqueta no resuelve todas las preguntas.</h2>
        <p>
          El portal identifica los recursos con la etiqueta CC BY 4.0. Sus
          condiciones precisas de atribución y republicación, así como la
          privacidad de los registros, requieren revisión antes de que este
          proyecto publique datos o derivados. Enlazar la fuente no implica aval
          del organismo público.
        </p>
        <Link className="text-link" href="/metodologia">
          Cómo se examinan las copias <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
