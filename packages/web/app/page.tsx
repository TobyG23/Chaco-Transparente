import Link from "next/link";
import { datasetUrl, resourcePages } from "../src/content";

const topics = [
  {
    title: "Presupuesto",
    state: "Cobertura parcial",
    detail:
      "Hay fichas de ejecución del gasto de 2022. No presentamos aquí el presupuesto aprobado ni una serie histórica.",
    href: "/datos#catalogo-oficial",
    action: "Ver fichas de ejecución",
    available: true,
  },
  {
    title: "Gastos",
    state: "Fuentes enlazadas",
    detail:
      "Dos clasificaciones de la misma ejecución acumulada de enero a diciembre de 2022. Los registros se consultan en origen y las vistas no se suman.",
    href: "/datos#catalogo-oficial",
    action: "Consultar las dos vistas",
    available: true,
  },
  {
    title: "Deuda",
    state: "Sin cobertura en este portal",
    detail:
      "Todavía no incorporamos una fuente de deuda al catálogo. No mostramos saldos, vencimientos ni indicadores.",
    href: "/cobertura",
    action: "Consultar el alcance del tema",
    available: false,
  },
  {
    title: "Transferencias",
    state: "Sin cobertura en este portal",
    detail:
      "No hay registros de transferencias individuales publicados aquí. Una columna de pagos presupuestarios no identifica por sí sola a sus destinatarios.",
    href: "/cobertura",
    action: "Consultar el alcance del tema",
    available: false,
  },
  {
    title: "Contrataciones",
    state: "Sin cobertura en este portal",
    detail:
      "Aún no incorporamos expedientes, licitaciones ni adjudicaciones. No inferimos contratos a partir de partidas de gasto.",
    href: "/cobertura",
    action: "Consultar el alcance del tema",
    available: false,
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="shell home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-kicker">
              Chaco Transparente · proyecto independiente
            </p>
            <h1 id="home-title">
              Información pública, con sus límites a la vista.
            </h1>
            <p className="home-lede">
              Empezamos por enlazar fuentes oficiales de ejecución del gasto de
              Chaco. Podés consultar las fichas originales o probar cómo sería
              explorar datos con un ejemplo sintético. Ninguna cifra oficial se
              publica en este sitio.
            </p>
            <div className="home-actions">
              <Link
                className="button button-primary"
                href="/datos#catalogo-oficial"
              >
                Consultar fuentes enlazadas
              </Link>
              <Link className="text-link" href="#temas">
                Buscar por tema
              </Link>
            </div>
          </div>
          <aside
            className="home-availability"
            aria-label="Qué se puede consultar hoy"
          >
            <div className="home-availability-top">
              <span className="home-availability-mark" aria-hidden="true">
                CT
              </span>
              <span>Disponible en esta versión</span>
            </div>
            <div className="home-availability-body">
              <p>
                <strong>Fichas oficiales</strong>
                <span>
                  Enlaces al portal de origen, sin copias ni importes aquí.
                </span>
              </p>
              <p>
                <strong>Exploración de prueba</strong>
                <span>Datos inventados y señalados como sintéticos.</span>
              </p>
              <p>
                <strong>Cobertura pendiente</strong>
                <span>
                  Deuda, transferencias y contrataciones no están incorporadas.
                </span>
              </p>
            </div>
            <Link href="/estado">Conocer el estado de revisión</Link>
          </aside>
        </div>
      </section>

      <div className="home-boundary">
        <div className="shell home-boundary-inner">
          <strong>Una distinción importante</strong>
          <p>
            Las fichas oficiales se abren en Datos Abiertos Chaco. La
            demostración de este sitio no usa registros oficiales.
          </p>
          <Link href="/datos#explorer-title">Probar la demostración</Link>
        </div>
      </div>

      <section
        className="shell home-topics"
        id="temas"
        aria-labelledby="topics-title"
      >
        <div className="home-section-head">
          <div>
            <h2 id="topics-title">Elegí qué querés consultar</h2>
            <p>
              Cada tema indica el alcance real de este portal, no la
              disponibilidad de datos en toda la provincia.
            </p>
          </div>
          <Link href="/datos">Ir al catálogo y la demostración</Link>
        </div>
        <div className="home-topic-list">
          {topics.map((topic) => (
            <article className="home-topic" key={topic.title}>
              <div className="home-topic-name">
                <h3>{topic.title}</h3>
                <span
                  className={
                    topic.available
                      ? "home-topic-state is-linked"
                      : "home-topic-state"
                  }
                >
                  {topic.state}
                </span>
              </div>
              <p>{topic.detail}</p>
              <Link href={topic.href}>
                {topic.action}
                <span aria-hidden="true"> ↗</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-sources" aria-labelledby="sources-title">
        <div className="shell home-sources-grid">
          <div className="home-sources-intro">
            <h2 id="sources-title">Empezar por la fuente</h2>
            <p>
              El catálogo actual enlaza dos recursos de ejecución presupuestaria
              provincial. Ambos declaran un período acumulado de enero a
              diciembre de 2022 en sus títulos: son desgloses de la misma
              ejecución, no dos montos para sumar ni una serie mensual.
            </p>
            <Link href="/fuentes">Cómo identificamos las fuentes</Link>
          </div>
          <div className="home-source-list">
            {resourcePages.map((resource) => (
              <article className="home-source" key={resource.id}>
                <span>Ficha oficial · ejecución del gasto 2022</span>
                <h3>{resource.title}</h3>
                <p>{resource.dimensions}</p>
                <a href={resource.href}>
                  Abrir ficha en Datos Abiertos Chaco{" "}
                  <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
            <p className="home-source-note">
              Fuente:{" "}
              <a href={datasetUrl}>
                conjunto de Ejecución Presupuestaria en Datos Abiertos Chaco
              </a>
              . Este proyecto no es un sitio oficial ni publica aquí los
              registros originales.
            </p>
          </div>
        </div>
      </section>

      <section className="shell home-next" aria-labelledby="next-title">
        <div>
          <h2 id="next-title">Explorar sin confundir</h2>
          <p>
            La demostración permite probar filtros y vistas con cantidades
            ficticias. Para cualquier registro oficial, consultá las fichas de
            origen. Antes de publicar importes aquí faltan decisiones sobre
            unidad, significado, derechos y privacidad.
          </p>
        </div>
        <div className="home-next-actions">
          <Link className="button button-dark" href="/datos#explorer-title">
            Probar el ejemplo sintético
          </Link>
          <Link href="/metodologia">Leer la metodología</Link>
        </div>
      </section>
    </>
  );
}
