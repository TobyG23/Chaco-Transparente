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
        <p className="eyebrow">PRIVACIDAD · AVISO PROPUESTO PARA REVISIÓN</p>
        <h2 id="privacidad">Qué ocurre al visitar este portal</h2>
        <p>
          Esta versión editorial estática no ofrece cuentas ni formularios y el
          código propio revisado no incorpora analítica, píxeles de seguimiento,
          cookies ni almacenamiento deliberado en el navegador. Tampoco solicita
          archivos presupuestarios desde el navegador. Las páginas, sus activos
          y la navegación necesitan solicitudes al alojamiento; eso no equivale
          a afirmar que no se traten datos personales.
        </p>
        <p>
          Netlify y su red de entrega pueden tratar datos técnicos de las
          solicitudes, como dirección IP, URL, fecha y hora o agente de usuario.
          No tenemos acceso en este proyecto a la configuración efectiva de
          registros, métricas o cookies de la cuenta, ni a sus plazos de
          conservación, accesos y jurisdicciones. Estas prácticas y cualquier
          opción activada deben confirmarse en el panel y las condiciones del
          proveedor antes de aprobar este aviso. La identificación y el contacto
          de la persona responsable del portal también están pendientes: este
          texto no es todavía un aviso de privacidad aprobado.
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
          abiertas. El código original del proyecto se ofrece bajo MIT; los
          textos editoriales y el diseño originales, bajo CC BY 4.0. Las
          dependencias conservan sus licencias y avisos propios. Estas licencias
          no abarcan recursos oficiales ni conceden permiso para republicar
          datos.
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
