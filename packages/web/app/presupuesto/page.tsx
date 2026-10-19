import type { Metadata } from "next";
import Link from "next/link";
import {
  budget2024Amendment,
  budget2024Hash,
  budget2024Source,
  budget2024Totals,
  formatBudgetPesos,
} from "../../src/budget-2024-data";
import { Budget2024Explorer } from "../../src/components/budget-2024-explorer";
import { PageIntro } from "../../src/components/page-intro";

export const metadata: Metadata = {
  title: "Presupuesto aprobado 2024",
  description:
    "Organismos y erogaciones corrientes y de capital de la Ley 3968-F, artículo 1, con referencia al documento legislativo original.",
};

export default function PresupuestoPage() {
  return (
    <>
      <PageIntro
        eyebrow="PRESUPUESTO / LEY PROVINCIAL"
        title="Presupuesto aprobado para 2024."
      >
        El artículo 1 de la Ley 3968-F fija las erogaciones de la Administración
        Pública Provincial no Financiera. Son autorizaciones iniciales, no
        gastos ejecutados ni pagos.
      </PageIntro>
      <section
        className="shell section compact-section prose-section"
        aria-labelledby="budget-total"
      >
        <h2 id="budget-total">
          Total aprobado: {formatBudgetPesos(budget2024Totals.total)} pesos
        </h2>
        <p>
          Erogaciones corrientes: {formatBudgetPesos(budget2024Totals.current)}{" "}
          pesos. Erogaciones de capital:{" "}
          {formatBudgetPesos(budget2024Totals.capital)} pesos. El alcance de la
          ley es Administración Central y Organismos Descentralizados; no
          equivale a todo el sector público provincial.
        </p>
        <p>
          Esta es una fotografía del presupuesto original sancionado para 2024.
          La <a href={budget2024Amendment}>Ley 4035-F, artículo 1</a>, modificó
          posteriormente las erogaciones; la tabla siguiente{" "}
          <strong>
            no representa el presupuesto vigente tras modificaciones
          </strong>
          . Tampoco es comparable sin ajustes con la ejecución de 2022 ni con el
          stock de deuda.
        </p>
      </section>
      <div className="shell">
        <Budget2024Explorer />
      </div>
      <section
        className="shell section compact-section prose-section"
        aria-labelledby="budget-source"
      >
        <h2 id="budget-source">Documento, transcripción y límites</h2>
        <p>
          Fuente primaria:{" "}
          <a href={budget2024Source}>
            Cámara de Diputados de la Provincia del Chaco, Ley 3968-F, artículo
            1, página 1, copia digital del Digesto legislativo
          </a>
          . Consultada el 19 de octubre de 2026. La tabla transcribe únicamente
          11 renglones institucionales y los totales de ese artículo; conserva
          importes originales en pesos. Cada renglón y las tres columnas se
          cotejaron con el PDF; las sumas de renglones y de componentes
          coinciden con los totales impresos.
        </p>
        <p>
          Huella SHA-256 del PDF consultado: <code>{budget2024Hash}</code>. Los
          nombres extensos de algunos organismos se desarrollan a partir de las
          abreviaturas del cuadro legislativo. Las cifras se citan como hechos
          públicos de una ley con atribución y enlace;{" "}
          <strong>
            no se aloja ni se declara bajo una licencia abierta el PDF
          </strong>
          . La ausencia de licencia expresa en la copia legislativa no se
          traslada como una licencia a sus anexos. No se incluyen nombres de
          personas ni registros individuales.
        </p>
        <p>
          Para ejecución real y sus límites, consultá{" "}
          <Link href="/datos">las fichas de 2022</Link>: son otro período y otra
          medida.
        </p>
      </section>
    </>
  );
}
