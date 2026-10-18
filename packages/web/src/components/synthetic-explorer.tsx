"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_LABEL,
  querySyntheticRows,
  syntheticRows,
  type View,
  viewLabels,
} from "../synthetic-data";

type LoadState = "loading" | "ready" | "error";
type SortBy = "entity" | "category" | "source" | "amount";

const pageSize = 5;

function loadDemo(fail: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (fail) reject(new Error("No se pudo cargar la demostración."));
      else resolve();
    }, 120);
  });
}

export function SyntheticExplorer() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [view, setView] = useState<View>("finalidad");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("entity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    loadDemo(false).then(
      () => {
        if (active) setLoadState("ready");
      },
      () => {
        if (active) setLoadState("error");
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const choices = useMemo(
    () => syntheticRows.filter((row) => row.view === view),
    [view],
  );
  const categories = [...new Set(choices.map((row) => row.category))].sort();
  const sources = [...new Set(choices.map((row) => row.source))].sort();
  const result = querySyntheticRows({
    view,
    search,
    category,
    source,
    sortBy,
    sortDirection,
    page,
    pageSize,
  });
  const maxAmount = Math.max(1, ...result.rows.map((row) => row.amount));

  function changeView(next: View) {
    setView(next);
    setSearch("");
    setCategory("");
    setSource("");
    setPage(1);
  }

  function sort(column: SortBy) {
    if (sortBy === column)
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function reload(fail: boolean) {
    setLoadState("loading");
    loadDemo(fail).then(
      () => setLoadState("ready"),
      () => setLoadState("error"),
    );
  }

  return (
    <section className="explorer" aria-labelledby="explorer-title">
      <div className="explorer-heading">
        <div>
          <p className="eyebrow">EXPLORADOR INTERACTIVO</p>
          <h2 id="explorer-title">Probá las consultas</h2>
        </div>
        <strong className="demo-badge">{DEMO_LABEL}</strong>
      </div>
      <p className="explorer-context">
        Las categorías, entidades y cantidades de esta demostración fueron
        inventadas. No proceden de las fichas oficiales. Las dos vistas ilustran
        desgloses distintos del mismo período acumulado enero–diciembre 2022 y
        nunca se suman entre sí.
      </p>
      <div className="explorer-controls">
        <label>
          Vista
          <select
            aria-label="Vista"
            value={view}
            onChange={(event) => changeView(event.target.value as View)}
          >
            <option value="finalidad">{viewLabels.finalidad}</option>
            <option value="objeto">{viewLabels.objeto}</option>
          </select>
        </label>
        <label>
          Buscar en la vista
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Entidad, categoría o fuente"
          />
        </label>
        <label>
          Categoría
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fuente
          <select
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las fuentes</option>
            {sources.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="explorer-status" role="status" aria-live="polite">
        {loadState === "loading"
          ? "Cargando demostración sintética…"
          : loadState === "error"
            ? "No se pudo cargar la demostración sintética."
            : `${result.total} ${result.total === 1 ? "resultado sintético" : "resultados sintéticos"} · página ${result.page} de ${result.pageCount}`}
      </p>
      {loadState === "error" ? (
        <div className="explorer-message" role="alert">
          <p>
            La demostración no está disponible. Ningún recurso oficial se ha
            consultado.
          </p>
          <button type="button" onClick={() => reload(false)}>
            Reintentar
          </button>
        </div>
      ) : loadState === "loading" ? (
        <div className="explorer-message" aria-busy="true">
          Preparando las filas ficticias…
        </div>
      ) : (
        <>
          <section
            className="explorer-table-wrap"
            aria-label="Tabla de datos sintéticos, desplazable horizontalmente"
          >
            <table className="explorer-table">
              <caption>
                {DEMO_LABEL}. Cantidades en unidades ficticias, sin equivalencia
                monetaria.
              </caption>
              <thead>
                <tr>
                  {(
                    [
                      ["entity", "Entidad ficticia"],
                      [
                        "category",
                        view === "finalidad"
                          ? "Finalidad ficticia"
                          : "Objeto ficticio",
                      ],
                      ["source", "Fuente ficticia"],
                      ["amount", "Unidades ficticias"],
                    ] as const
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      scope="col"
                      aria-sort={
                        sortBy === key
                          ? sortDirection === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button type="button" onClick={() => sort(key)}>
                        {label}{" "}
                        <span aria-hidden="true">
                          {sortBy === key
                            ? sortDirection === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.entity}</th>
                    <td>{row.category}</td>
                    <td>{row.source}</td>
                    <td className="numeric">
                      {row.amount.toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {result.total === 0 ? (
            <div className="explorer-message">
              No hay coincidencias en esta demostración. Probá otra búsqueda o
              quitá filtros.
            </div>
          ) : (
            <>
              <nav
                className="explorer-pages"
                aria-label="Paginación de resultados sintéticos"
              >
                <button
                  type="button"
                  disabled={result.page <= 1}
                  onClick={() => setPage(result.page - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {result.page} de {result.pageCount}
                </span>
                <button
                  type="button"
                  disabled={result.page >= result.pageCount}
                  onClick={() => setPage(result.page + 1)}
                >
                  Siguiente
                </button>
              </nav>
              <section
                className="explorer-visual"
                aria-labelledby="visual-title"
              >
                <h3 id="visual-title">Comparación de filas visibles</h3>
                <p>
                  <strong>{DEMO_LABEL}</strong> · unidades ficticias. Este
                  gráfico no representa presupuesto ni compara las dos vistas.
                </p>
                <ul className="mini-bars">
                  {result.rows.map((row) => (
                    <li key={row.id}>
                      <span>{row.entity}</span>
                      <div className="mini-bar-track" aria-hidden="true">
                        <span
                          style={{
                            width: `${(100 * row.amount) / maxAmount}%`,
                          }}
                        />
                      </div>
                      <strong>{row.amount.toLocaleString("es-AR")}</strong>
                    </li>
                  ))}
                </ul>
                <p className="visual-alternative">
                  Alternativa textual: los nombres y cantidades exactas están en
                  la tabla anterior, en el mismo orden.
                </p>
              </section>
            </>
          )}
        </>
      )}
      <details className="demo-diagnostics">
        <summary>Probar estado de error de la demostración</summary>
        <button type="button" onClick={() => reload(true)}>
          Simular fallo de carga
        </button>
      </details>
    </section>
  );
}
