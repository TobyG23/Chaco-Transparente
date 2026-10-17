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
    "Proyecto independiente de transparencia: fuentes y metodología visibles. Los importes presupuestarios aún no están publicados.",
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
        <main id="contenido" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
