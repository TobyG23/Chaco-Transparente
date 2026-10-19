"use client";

import { useState } from "react";
import {
  budget2024Rows,
  budget2024Source,
  budget2024Totals,
  formatBudgetPesos,
} from "../budget-2024-data";
import styles from "./budget-2024-explorer.module.css";

type Category = "all" | "current" | "capital";

export function Budget2024Explorer() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const rows = budget2024Rows.filter(
    (row) =>
      row.organism
        .toLocaleLowerCase("es-AR")
        .includes(search.trim().toLocaleLowerCase("es-AR")) &&
      (category === "all" || row[category] > 0),
  );
  const largest = budget2024Totals.total;
  const selectedRow = rows.find((row) => row.organism === selected);

  return (
    <section className={styles.explorer} aria-labelledby="budget-chart-title">
      <div className={styles.controls}>
        <label htmlFor="budget-search">Buscar organismo</label>
        <input
          id="budget-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label htmlFor="budget-category">Tipo de erogación</label>
        <select
          id="budget-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as Category)}
        >
          <option value="all">Todas</option>
          <option value="current">Con erogaciones corrientes</option>
          <option value="capital">Con erogaciones de capital</option>
        </select>
      </div>
      <p role="status">
        {rows.length} {rows.length === 1 ? "organismo" : "organismos"} de 11 ·
        Ley 3968-F, artículo 1
      </p>
      <figure className={styles.figure}>
        <h2 id="budget-chart-title">Erogaciones aprobadas por organismo</h2>
        <p>
          Pesos nominales. Cada barra muestra erogaciones corrientes y de
          capital; la escala permanece fija al filtrar. La tabla ofrece los
          valores exactos.
        </p>
        <div className={styles.legend}>
          <span className={styles.currentKey} /> Corrientes{" "}
          <span className={styles.capitalKey} /> Capital
        </div>
        {rows.length ? (
          <div className={styles.bars}>
            {rows.map((row) => (
              <a
                key={row.organism}
                className={styles.barRow}
                href={`#budget-row-${budget2024Rows.indexOf(row) + 1}`}
                onMouseEnter={() => setSelected(row.organism)}
                onMouseLeave={() => setSelected(null)}
                onFocus={() => setSelected(row.organism)}
                onBlur={() => setSelected(null)}
                aria-label={`${row.organism}: ${formatBudgetPesos(row.total)} pesos aprobados; ver fila de origen`}
              >
                <span className={styles.barName}>{row.organism}</span>
                <span className={styles.track} aria-hidden="true">
                  <span
                    className={styles.current}
                    style={{ width: `${(row.current / largest) * 100}%` }}
                  />
                  <span
                    className={styles.capital}
                    style={{ width: `${(row.capital / largest) * 100}%` }}
                  />
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p>
            No hay organismos que coincidan. Modificá la búsqueda o el filtro.
          </p>
        )}
        <figcaption aria-live="polite">
          {selectedRow
            ? `${selectedRow.organism}: ${formatBudgetPesos(selectedRow.total)} pesos aprobados.`
            : "La tabla ofrece importes exactos y el artículo de origen."}
        </figcaption>
      </figure>
      <div className={styles.tableWrap}>
        <table>
          <caption>
            Ley 3968-F · artículo 1, página 1 · importes originales en pesos
          </caption>
          <thead>
            <tr>
              <th scope="col">Organismo</th>
              <th scope="col">Corrientes</th>
              <th scope="col">Capital</th>
              <th scope="col">Total aprobado</th>
              <th scope="col">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                id={`budget-row-${budget2024Rows.indexOf(row) + 1}`}
                key={row.organism}
              >
                <th scope="row">{row.organism}</th>
                <td>{formatBudgetPesos(row.current)}</td>
                <td>{formatBudgetPesos(row.capital)}</td>
                <td>{formatBudgetPesos(row.total)}</td>
                <td>
                  <a href={budget2024Source}>Art. 1, p. 1 ↗</a>
                </td>
              </tr>
            ))}
          </tbody>
          {!search && category === "all" && (
            <tfoot>
              <tr>
                <th scope="row">Total de la ley</th>
                <td>{formatBudgetPesos(budget2024Totals.current)}</td>
                <td>{formatBudgetPesos(budget2024Totals.capital)}</td>
                <td>{formatBudgetPesos(budget2024Totals.total)}</td>
                <td>
                  <a href={budget2024Source}>Art. 1, p. 1 ↗</a>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {(search || category !== "all") && (
        <p>
          Los filtros muestran una selección; sus importes no sustituyen el
          total aprobado por ley.
        </p>
      )}
    </section>
  );
}
