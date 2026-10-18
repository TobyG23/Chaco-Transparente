import type { Metadata } from "next";
import Link from "next/link";
import { DebtExplorer } from "../../src/components/debt-explorer";
import { PageIntro } from "../../src/components/page-intro";
import {
  debtAttribution,
  debtLicenseUrl,
  debtObservations,
  debtSourcePage,
} from "../../src/debt-data";

export const metadata: Metadata = {
  title: "Deuda provincial — stock oficial",
  description:
    "Seis cortes del stock de deuda de Chaco extraídos de planillas consolidadas del Gobierno nacional, con fuente, unidades y límites metodológicos.",
};

export default function DeudaPage() {
  return (
    <>
      <PageIntro
        eyebrow="DEUDA / FUENTE NACIONAL"
        title="Deuda: una serie con límites claros."
      >
        Seis cortes del stock provincial publicados en planillas consolidadas
        del Gobierno nacional. Es una extracción independiente de un indicador
        oficial, no un registro propio ni una publicación avalada por el
        Gobierno del Chaco.
      </PageIntro>
      <div className="shell">
        <DebtExplorer />
      </div>
      <section
        className="shell section compact-section prose-section"
        aria-labelledby="debt-method"
      >
        <h2 id="debt-method">Qué incluye y qué no</h2>
        <p>
          Se toma exclusivamente la fila <strong>Chaco</strong>, columna
          <strong> “Total sin deuda flotante”</strong>, de seis libros de stock
          consolidado publicados por la Subsecretaría de Coordinación Fiscal
          Provincial. No usamos la planilla provincial separada: esta selección
          mantiene el mismo campo de las planillas consolidadas en todos los
          cortes. Las notas de origen declaran los datos preliminares y sujetos
          a revisión, excluyen la deuda flotante y contingente y expresan los
          bonos a valor residual. En la planilla de diciembre de 2025 se añade
          que la información publicada fue remitida por la Provincia.
        </p>
        <p>
          No es el total de todas las obligaciones posibles ni una medida de
          pagos, vencimientos o nuevos préstamos. No se atribuye una variación a
          una gestión, operación o causa particular. Tampoco se compara este
          stock con los gastos presupuestarios de{" "}
          <Link href="/datos">la demostración de datos</Link>.
        </p>
        <h2>Origen, atribución y control</h2>
        <p>
          Fuente:{" "}
          <a href={debtSourcePage}>
            {debtAttribution} · Evolución de stock de deuda pública provincial
          </a>
          . Extracción y conversión de unidades realizadas por este proyecto
          independiente. Página y archivos oficiales consultados el 18 de
          octubre de 2026. El sitio oficial publica sus contenidos bajo{" "}
          <a href={debtLicenseUrl}>
            Creative Commons Atribución 4.0, salvo indicación contraria
          </a>
          . Se reproducen sólo seis valores agregados; los libros originales no
          se alojan aquí. Las filas seleccionadas son agregados jurisdiccionales
          y no contienen datos personales ni identifican personas. Las hojas y
          celdas se muestran junto a cada observación.
        </p>
        <details>
          <summary>Comprobar versiones de los archivos (SHA-256)</summary>
          <ul>
            {debtObservations.map((row) => (
              <li key={row.date}>
                {row.period} · hoja {row.sheet}, celda {row.cell} · unidad
                original: {row.sourceUnit} · <code>{row.sha256}</code>
              </li>
            ))}
          </ul>
          <p>
            Las huellas identifican los archivos descargados durante esta
            revisión; un archivo actualizado en origen puede tener una huella
            diferente y requerir nueva verificación antes de actualizar la
            serie.
          </p>
        </details>
      </section>
    </>
  );
}
