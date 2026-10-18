import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../src/components/page-intro";
import { SyntheticExplorer } from "../../src/components/synthetic-explorer";
import { datasetUrl, resourcePages, views } from "../../src/content";

export const metadata: Metadata = { title: "Explorador de datos" };

export default function DatosPage() {
  return (
    <>
      <PageIntro eyebrow="01 / DATOS" title="Explorar sin confundir.">
        Consultá las fichas de los dos recursos oficiales de 2022 y probá la
        navegación en una demostración separada. Registros oficiales: consultar
        en origen; no alojados aquí.
      </PageIntro>
      <section
        className="shell section compact-section"
        aria-labelledby="catalogo-oficial"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">CATÁLOGO DE ORIGEN · GASTO 2022</p>
            <h2 id="catalogo-oficial">
              Dos recursos oficiales, sin copias alojadas
            </h2>
          </div>
          <p>Registros oficiales: consultar en origen; no alojados aquí.</p>
        </div>
        <div className="view-grid">
          {resourcePages.map((resource, index) => (
            <article className="view-card" key={resource.id}>
              <span className="view-index">RECURSO 0{index + 1}</span>
              <h3>{resource.title}</h3>
              <p>{resource.dimensions}</p>
              <p>
                Identificador: <code>{resource.id}</code>
              </p>
              <p>
                Período declarado en el título: acumulado enero–diciembre 2022.
                No es una serie mensual ni un cierre certificado.
              </p>
              <p>
                Metadatos consultados:{" "}
                <time dateTime={resource.metadataChecked}>
                  {resource.metadataChecked}
                </time>
                . Esta fecha no indica cuándo se obtuvo el CSV.
              </p>
              <a className="text-link" href={resource.href}>
                Abrir ficha en el portal oficial{" "}
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
        <p>
          Fuente:{" "}
          <a className="text-link" href={datasetUrl}>
            Datos Abiertos Chaco · Ejecución Presupuestaria
          </a>
          . Son dos clasificaciones de una misma ejecución provincial del gasto;
          no se suman entre sí. El proyecto es independiente y no está avalado
          por el organismo.
        </p>
        <p>
          Los nombres técnicos de columnas publicados por las fichas son{" "}
          <code>Q_ASIG</code>, <code>Q_VIG</code>, <code>Q_COMP</code>,{" "}
          <code>Q_ORD</code>, <code>Q_PAG</code>, <code>Q_SAL</code> y{" "}
          <code>Q_VAR</code>. Sus valores originales no se muestran aquí:
          derechos por recurso, privacidad por fila y tratamiento editorial
          requieren revisión y una autorización posterior. No se asigna moneda,
          escala ni unidad.
        </p>
        <p>
          Para explorar filas oficiales por entidad, clasificación, fuente o
          partida, seguí los enlaces a las fichas de origen. Los filtros
          interactivos de abajo <strong>no consultan datos oficiales</strong>.
        </p>
      </section>
      <div className="shell">
        <SyntheticExplorer />
      </div>
      <section
        className="shell section compact-section"
        aria-labelledby="vistas"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">DEMOSTRACIÓN DE NAVEGACIÓN</p>
            <h2 id="vistas">Cómo se distinguen las vistas</h2>
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
                Ejemplo sintético · importes oficiales no disponibles
              </span>
            </article>
          ))}
        </div>
        <aside className="notice" aria-labelledby="pendientes-datos">
          <span className="notice-icon" aria-hidden="true">
            i
          </span>
          <div>
            <h3 id="pendientes-datos">Datos pendientes de aclaración</h3>
            <ul>
              <li>
                <code>Q_VAR</code> tiene descripciones contradictorias entre las
                dos fichas: cociente frente a variación; no se fija una fórmula.
              </li>
              <li>
                El control aritmético local halló diferencias entre algunos{" "}
                <code>Q_SAL</code> y <code>Q_VIG − Q_COMP</code>. Sin detalle
                contable no explican causas ni implican irregularidad.
              </li>
              <li>
                Los recursos declaran enero–diciembre 2022; el metadato temporal
                del conjunto termina en agosto de 2022.
              </li>
              <li>
                Moneda, escala, unidad y nivel legal de control del crédito no
                están confirmados para este export. <code>Q_PAG</code> no
                verifica una transferencia individual.
              </li>
            </ul>
            <p>
              Para enviar documentación o corregir una definición, indicá
              recurso, campo y respaldo público; no compartas expedientes
              privados ni datos personales.
            </p>
            <Link href="/proyecto#colaboracion">
              Cómo aportar una aclaración <span aria-hidden="true">→</span>
            </Link>
            {" · "}
            <Link href="/estado">
              Ver impedimentos de publicación <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
