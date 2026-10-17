import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../../src/components/page-intro";
import { repositoryUrl } from "../../src/content";

export const metadata: Metadata = { title: "Acerca del proyecto" };

export default function ProyectoPage() {
  return (
    <>
      <PageIntro
        eyebrow="04 / EL PROYECTO"
        title="Información pública, sin atajos."
      >
        Chaco Transparente es un proyecto independiente en desarrollo. Nuestro
        punto de partida es explicar de dónde salen los datos, cómo se examinan
        y qué no se puede afirmar todavía.
      </PageIntro>
      <section className="shell section compact-section prose-section">
        <p className="eyebrow">PROPÓSITO</p>
        <h2>Claridad antes que velocidad.</h2>
        <p>
          El núcleo offline procesa dos vistas provinciales acumuladas de 2022 y
          conserva su procedencia. Este portal es por ahora una capa editorial:
          muestra fuentes, metodología y estado, no registros presupuestarios.
          No representa un presupuesto municipal completo ni una serie mensual.
        </p>
        <div className="rule" />
        <p className="eyebrow">INDEPENDENCIA</p>
        <h2>Sin afiliación oficial.</h2>
        <p>
          Este proyecto no es un sitio del Gobierno de la Provincia del Chaco ni
          cuenta con su aval. Mendoza Transparente fue una referencia
          arquitectónica, no una fuente de código, marca, diseño o respaldo
          institucional.
        </p>
        <div className="rule" />
        <p className="eyebrow">PRIVACIDAD · TEXTO PARA REVISIÓN</p>
        <h2 id="privacidad">Qué ocurre al visitar este portal</h2>
        <p>
          La versión editorial revisada no incorpora cuentas, formularios,
          analítica propia, píxeles de seguimiento ni almacenamiento deliberado
          en el navegador. No solicita los archivos presupuestarios desde el
          navegador. Las páginas y sus activos requieren solicitudes al
          alojamiento; el proveedor y su red de entrega pueden tratar datos
          técnicos de esas solicitudes, como dirección IP, URL, fecha y hora y
          agente de usuario. Todavía debemos confirmar en la configuración y
          condiciones reales de Netlify qué registros, métricas o cookies se
          generan, quién accede a ellos, durante cuánto tiempo se conservan y en
          qué jurisdicciones se tratan. También faltan la identificación y el
          contacto de la persona responsable del portal. Este texto es una
          explicación preliminar, no un aviso de privacidad aprobado.
        </p>
        <p>
          Los enlaces al portal oficial y a GitHub llevan a sitios ajenos sólo
          cuando decidís seguirlos; sus prácticas pueden ser diferentes. No
          ofrecemos datos presupuestarios, filas ni importes en esta versión.
        </p>
        <div className="rule" />
        <p className="eyebrow">COLABORACIÓN</p>
        <h2>Preguntas, correcciones y código.</h2>
        <p>
          Podés revisar el repositorio, los criterios de contribución y los
          pendientes. Evitá publicar información sensible en incidencias
          abiertas. La licencia del código propio sigue pendiente de decisión;
          el acceso al repositorio no implica permiso de reutilización.
        </p>
        <a className="button button-primary" href={repositoryUrl}>
          Ver el repositorio <span aria-hidden="true">↗</span>
        </a>
        <p className="secondary-action">
          <Link className="text-link" href="/estado">
            Ver estado y decisiones pendientes <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>
    </>
  );
}
