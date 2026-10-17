import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../src/components/page-intro";
import { views } from "../../src/content";

export const metadata: Metadata = { title: "Catálogo de datos" };

export default function DatosPage() {
  return (
    <>
      <PageIntro eyebrow="01 / CATÁLOGO" title="Qué estamos examinando.">
        Dos desgloses de la ejecución presupuestaria provincial acumulada de
        enero a diciembre de 2022. Por ahora, este catálogo describe su alcance:
        no ofrece consultas, importes ni descargas.
      </PageIntro>
      <section
        className="shell section compact-section"
        aria-labelledby="vistas"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECURSOS EN EVALUACIÓN</p>
            <h2 id="vistas">Las dos vistas</h2>
          </div>
          <p>Son perspectivas de una misma ejecución. No se suman entre sí.</p>
        </div>
        <div className="view-grid">
          {views.map((view, index) => (
            <article className="view-card" key={view.title}>
              <span className="view-index">VISTA 0{index + 1}</span>
              <h3>{view.title}</h3>
              <p>{view.description}</p>
              <span className="view-tag">
                Sólo metadatos · importes no disponibles
              </span>
            </article>
          ))}
        </div>
        <aside className="notice">
          <span className="notice-icon" aria-hidden="true">
            i
          </span>
          <div>
            <h3>¿Por qué no hay cifras?</h3>
            <p>
              Antes de publicar, debemos confirmar el significado de las etapas,
              moneda y unidad, revisar privacidad y resolver derechos y
              atribución. El procesamiento técnico no es autorización de
              publicación.
            </p>
            <Link href="/estado">
              Ver el estado y los pendientes <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
