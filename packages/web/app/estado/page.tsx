import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../src/components/page-intro";
import { pendingDecisions } from "../../src/content";

export const metadata: Metadata = { title: "Estado de revisión" };

export default function EstadoPage() {
  return (
    <>
      <PageIntro
        eyebrow="05 / ESTADO ACTUAL"
        title="En revisión. Sin cifras publicadas."
      >
        El núcleo local pasó controles técnicos para las copias auditadas, pero
        su resultado exige revisión humana. Ningún importe ni registro
        presupuestario se conecta a este portal.
      </PageIntro>
      <section className="shell section compact-section">
        <div className="state-panel">
          <div>
            <p className="eyebrow">DISPONIBILIDAD</p>
            <h2>Qué se puede consultar hoy</h2>
            <p>
              La descripción de las dos vistas, sus fuentes, el método y los
              límites del proyecto. El catálogo no ofrece tablas, descargas ni
              importes.
            </p>
          </div>
          <span className="state-pill">
            <span className="status-light" aria-hidden="true" /> Datos en
            revisión
          </span>
        </div>
        <div className="section-heading">
          <div>
            <p className="eyebrow">ANTES DE PUBLICAR</p>
            <h2>Decisiones abiertas</h2>
          </div>
          <p>
            Un resultado de validación técnica no resuelve estas cuestiones.
          </p>
        </div>
        <ol className="pending-list">
          {pendingDecisions.map((item, index) => (
            <li key={item}>
              <span>0{index + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
        <aside className="notice">
          <span className="notice-icon" aria-hidden="true">
            i
          </span>
          <div>
            <h2>Bloqueo explícito</h2>
            <p>
              El contrato de los documentos mantiene{" "}
              <code>publicationAllowed=false</code>; las filas permanecen no
              publicadas. El estado local <code>review_required</code> no
              equivale a autorización legal ni a una garantía de privacidad.
            </p>
            <Link href="/metodologia">
              Leer cómo se valida <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
