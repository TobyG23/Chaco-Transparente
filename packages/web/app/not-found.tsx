import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <section
      className="shell page-intro"
      aria-labelledby="pagina-no-encontrada"
    >
      <p className="eyebrow">ERROR 404 / PÁGINA NO ENCONTRADA</p>
      <h1 id="pagina-no-encontrada">No encontramos esta página.</h1>
      <p className="page-lede">
        La dirección puede haber cambiado o no existir. Podés volver al inicio
        para consultar las fuentes, la metodología y el estado del proyecto.
      </p>
      <Link className="button button-primary not-found-action" href="/">
        Volver al inicio <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
