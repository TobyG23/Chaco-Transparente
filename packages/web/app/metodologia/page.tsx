import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../src/components/page-intro";

export const metadata: Metadata = { title: "Metodología" };

const steps = [
  {
    number: "01",
    title: "Verificar la copia",
    text: "El proceso offline coteja longitud y huella SHA-256 de cada archivo contra la copia auditada. No descarga nuevas fuentes ni consulta una API.",
  },
  {
    number: "02",
    title: "Conservar el rastro",
    text: "El lector separa campos por punto y coma, preserva códigos y celdas originales y registra línea física y huella de cada línea.",
  },
  {
    number: "03",
    title: "Señalar, no corregir",
    text: "La aritmética decimal exacta y los controles de calidad detectan incidencias. Los saldos negativos y las diferencias pequeñas no se alteran silenciosamente; los umbrales son provisionales.",
  },
  {
    number: "04",
    title: "Mantener el bloqueo",
    text: "La revisión técnica local no habilita la publicación. Los importes y registros permanecen fuera de esta interfaz hasta resolver interpretación, derechos y privacidad.",
  },
] as const;

export default function MetodologiaPage() {
  return (
    <>
      <PageIntro
        eyebrow="03 / CÓMO TRABAJAMOS"
        title="Un método que muestra sus límites."
      >
        La trazabilidad ayuda a reproducir el procesamiento. No reemplaza la
        interpretación contable, la revisión legal ni la evaluación de
        privacidad necesarias para publicar cifras.
      </PageIntro>
      <section
        className="shell section compact-section"
        aria-label="Etapas del proceso"
      >
        <div className="step-list">
          {steps.map((step) => (
            <article className="step" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
        <aside className="notice">
          <span className="notice-icon" aria-hidden="true">
            !
          </span>
          <div>
            <h2>Interpretaciones pendientes</h2>
            <p>
              La moneda, la unidad y la definición normativa de las etapas Q_*
              no están confirmadas. En particular, Q_PAG no se presenta como
              dinero efectivamente desembolsado. Las dos vistas son desgloses
              distintos de una misma ejecución y no se suman.
            </p>
            <Link href="/estado">
              Consultar lo que falta <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
