import Link from "next/link";
import { datasetUrl, repositoryUrl } from "../content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <strong>
            Chaco Transparente<span className="accent">.</span>
          </strong>
          <p>
            Un proyecto independiente para explicar datos públicos con cuidado.
          </p>
          <small>No afiliado al Gobierno de la Provincia del Chaco.</small>
        </div>
        <div className="footer-links">
          <Link href="/estado">Estado de los datos</Link>
          <Link href="/metodologia">Metodología</Link>
          <a href={datasetUrl}>
            Fuente oficial <span aria-hidden="true">↗</span>
          </a>
          <a href={repositoryUrl}>
            Código del proyecto <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="shell footer-bottom">
        Primero el contexto. Después, los datos.
      </div>
    </footer>
  );
}
