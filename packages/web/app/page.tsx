import Link from "next/link";
import { datasetUrl, views } from "../src/content";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" /> PROYECTO INDEPENDIENTE · CHACO,
              ARGENTINA
            </p>
            <h1>
              Los datos públicos merecen <em>contexto.</em>
            </h1>
            <p className="hero-lede">
              Chaco Transparente prepara una forma clara y responsable de
              explorar la ejecución presupuestaria provincial. Hoy compartimos
              las fuentes, el método y lo que todavía falta verificar.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/datos">
                Explorar el catálogo <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" href="/estado">
                Ver estado del proyecto <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="hero-footnote">
              <span className="status-light" aria-hidden="true" /> Sin importes
              ni registros publicados por este proyecto
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-top">
              <span>CT / 001</span>
              <span>UNA MIRADA MÁS CLARA</span>
            </div>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-shape">
              <div className="art-shape-inner" />
            </div>
            <div className="art-bottom">
              <span>FUENTES</span>
              <span>·</span>
              <span>MÉTODO</span>
              <span>·</span>
              <span>CONTEXTO</span>
            </div>
          </div>
        </div>
      </section>

      <section className="status-strip" aria-label="Estado de la información">
        <div className="shell strip-inner">
          <span className="strip-label">ESTADO ACTUAL</span>
          <strong>Los datos están en revisión.</strong>
          <span>La publicación de cifras permanece bloqueada.</span>
          <Link href="/estado">
            Entender por qué <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="section shell" aria-labelledby="que-encontras">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / EL PUNTO DE PARTIDA</p>
            <h2 id="que-encontras">
              Transparencia también es decir <em>qué falta.</em>
            </h2>
          </div>
          <p>
            Antes de mostrar una cifra, necesitamos saber de dónde viene, qué
            significa y si corresponde publicarla.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">
              01 <span aria-hidden="true">↗</span>
            </span>
            <h3>Fuentes identificadas</h3>
            <p>
              Trabajamos con dos vistas del conjunto oficial de ejecución
              presupuestaria provincial acumulada de 2022.
            </p>
            <Link href="/fuentes">
              Conocer las fuentes <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="feature-card">
            <span className="feature-number">
              02 <span aria-hidden="true">↗</span>
            </span>
            <h3>Método a la vista</h3>
            <p>
              El núcleo local verifica copias, conserva trazabilidad y señala
              diferencias sin corregirlas silenciosamente.
            </p>
            <Link href="/metodologia">
              Leer la metodología <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="feature-card">
            <span className="feature-number">
              03 <span aria-hidden="true">↗</span>
            </span>
            <h3>Límites explícitos</h3>
            <p>
              Moneda, unidad, interpretación, derechos y privacidad aún
              requieren revisión antes de compartir importes.
            </p>
            <Link href="/estado">
              Consultar pendientes <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      <section
        className="section muted-section"
        aria-labelledby="catalogo-inicio"
      >
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / ALCANCE</p>
              <h2 id="catalogo-inicio">
                Dos vistas. <em>Una misma ejecución.</em>
              </h2>
            </div>
            <p>
              Son desgloses distintos del mismo período acumulado, no una serie
              mensual ni valores que deban sumarse entre sí.
            </p>
          </div>
          <div className="view-grid">
            {views.map((view, index) => (
              <article className="view-card" key={view.title}>
                <span className="view-index">VISTA 0{index + 1}</span>
                <h3>{view.title}</h3>
                <p>{view.description}</p>
                <span className="view-tag">
                  Metadatos disponibles · cifras no publicadas
                </span>
              </article>
            ))}
          </div>
          <p className="section-note">
            Fuente:{" "}
            <a href={datasetUrl}>
              portal de Datos Abiertos Chaco <span aria-hidden="true">↗</span>
            </a>
            . El período se toma del título de los recursos.
          </p>
        </div>
      </section>

      <section className="section shell closing-section">
        <div>
          <p className="eyebrow">03 / SUMATE AL PROCESO</p>
          <h2>
            La claridad se <em>construye.</em>
          </h2>
          <p>
            Este proyecto está en desarrollo. Podés conocer cómo trabajamos,
            revisar el código y aportar preguntas o correcciones sin compartir
            datos sensibles en público.
          </p>
        </div>
        <Link className="button button-dark" href="/proyecto">
          Conocer el proyecto <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </>
  );
}
