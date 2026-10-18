import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "../src/components/site-footer";
import { SiteHeader } from "../src/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Chaco Transparente — datos con contexto",
    template: "%s | Chaco Transparente",
  },
  description:
    "Proyecto independiente de transparencia: serie oficial de deuda provincial, fuentes de gasto y metodología visibles. Los importes de ejecución presupuestaria aún no están publicados.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <SiteHeader />
        <div className="preview-banner">
          <p className="shell">
            <strong>Versión preliminar</strong> · Proyecto independiente, no
            oficial del Gobierno del Chaco.
          </p>
        </div>
        <main id="contenido" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
