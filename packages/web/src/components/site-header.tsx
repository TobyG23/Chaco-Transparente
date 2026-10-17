"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "../content";

export function SiteHeader() {
  const pathname = usePathname().replace(/\/$/, "") || "/";

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link
          className="brand"
          href="/"
          aria-label="Chaco Transparente, inicio"
        >
          <span className="brand-symbol" aria-hidden="true">
            CT<span className="brand-dot">.</span>
          </span>
          <span className="brand-name">
            Chaco
            <br />
            Transparente
          </span>
        </Link>
        <nav className="primary-nav" aria-label="Navegación principal">
          {navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="header-status" href="/estado">
          <span className="status-light" aria-hidden="true" /> Datos en revisión{" "}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
