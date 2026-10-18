"use client";

import { useState } from "react";
import {
  debtObservations,
  formatMillions,
  millionsOfPesos,
} from "../debt-data";
import styles from "./debt-explorer.module.css";

const width = 760;
const height = 290;
const left = 75;
const right = 24;
const top = 22;
const bottom = 72;
const plotWidth = width - left - right;
const plotHeight = height - top - bottom;

type Range = "all" | "annual" | "2026";

export function DebtExplorer() {
  const [range, setRange] = useState<Range>("all");
  const [active, setActive] = useState<string | null>(null);
  const rows = debtObservations.filter(
    (row) =>
      range === "all" ||
      (range === "annual"
        ? row.date.endsWith("12-31")
        : row.date.startsWith("2026")),
  );
  const values = rows.map(millionsOfPesos);
  const ceiling = Math.ceil(Math.max(...values) / 200000) * 200000;
  const ticks = Array.from(
    { length: ceiling / 200000 + 1 },
    (_, index) => index * 200000,
  );
  const dates = rows.map((row) => Date.parse(`${row.date}T00:00:00Z`));
  const start = dates[0] ?? 0;
  const span = (dates[dates.length - 1] ?? start) - start || 1;
  const points = rows.map((row, index) => ({
    row,
    value: values[index] ?? 0,
    x: left + (((dates[index] ?? start) - start) / span) * plotWidth,
    y: top + plotHeight * (1 - (values[index] ?? 0) / ceiling),
  }));
  const selected = points.find((point) => point.row.date === active);

  return (
    <section aria-labelledby="debt-series-title" className={styles.explorer}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">SERIE OFICIAL EXTRAÍDA</p>
          <h2 id="debt-series-title">Stock de deuda de Chaco</h2>
        </div>
        <span className={styles.unit}>Millones de pesos corrientes</span>
      </div>
      <p className={styles.context}>
        Total sin deuda flotante, al cierre de cada fecha. Son saldos nominales,
        no gastos, desembolsos ni deuda por habitante. El eje horizontal
        representa tiempo transcurrido: cuatro cierres anuales y dos cortes
        trimestrales en 2026.
      </p>
      <div className={styles.controls}>
        <label htmlFor="debt-range">Períodos mostrados</label>
        <select
          id="debt-range"
          value={range}
          onChange={(event) => {
            setRange(event.target.value as Range);
            setActive(null);
          }}
        >
          <option value="all">Todos los cortes (2022–2026)</option>
          <option value="annual">Cierres de diciembre (2022–2025)</option>
          <option value="2026">Cortes trimestrales (2026)</option>
        </select>
      </div>
      <div className={styles.figure}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          aria-labelledby="debt-chart-title debt-chart-desc"
          className={styles.chart}
        >
          <title id="debt-chart-title">
            Stock de deuda de Chaco en {rows.length} cortes
          </title>
          <desc id="debt-chart-desc">
            Valores en millones de pesos corrientes, con fechas espaciadas según
            el tiempo transcurrido. La tabla siguiente ofrece valores y fuentes.
          </desc>
          {ticks.map((tick) => {
            const y = top + plotHeight * (1 - tick / ceiling);
            return (
              <g key={tick}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                  className={styles.grid}
                />
                <text
                  x={left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className={styles.axis}
                >
                  {tick === 0 ? "0" : `${tick / 1000} mil`}
                </text>
              </g>
            );
          })}
          <polyline
            points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
            fill="none"
            className={styles.line}
          />
          {points.map(({ row, x, y, value }) => (
            <g key={row.date}>
              <circle cx={x} cy={y} r={4.5} className={styles.dot} />
              <a
                href={`#debt-row-${row.date}`}
                aria-label={`${row.period}: ${formatMillions(value)} millones de pesos; ver fila de origen`}
                onMouseEnter={() => setActive(row.date)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(row.date)}
                onBlur={() => setActive(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={16}
                  fill="transparent"
                  className={styles.hit}
                />
              </a>
              <text
                x={x}
                y={height - 30}
                textAnchor="middle"
                className={styles.axis}
              >
                {row.period.split(" ")[0]}
              </text>
              <text
                x={x}
                y={height - 15}
                textAnchor="middle"
                className={styles.axis}
              >
                {row.period.split(" ")[1]}
              </text>
            </g>
          ))}
        </svg>
        <p className={styles.readout} aria-live="polite">
          {selected
            ? `${selected.row.period}: ${formatMillions(selected.value)} millones de pesos (redondeado).`
            : "Pasá el cursor o enfocá un punto para consultar su valor; la tabla ofrece los valores de origen."}
        </p>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption>
            Chaco · total sin deuda flotante · cifras en millones redondeadas a
            dos decimales
          </caption>
          <thead>
            <tr>
              <th scope="col">Fecha de corte</th>
              <th scope="col">Stock (millones de pesos)</th>
              <th scope="col">Valor y unidad originales</th>
              <th scope="col">Celda en origen</th>
              <th scope="col">Planilla oficial</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} id={`debt-row-${row.date}`}>
                <th scope="row">
                  <time dateTime={row.date}>{row.period}</time>
                </th>
                <td className={styles.numeric}>
                  {formatMillions(millionsOfPesos(row))}
                </td>
                <td className={styles.raw}>
                  {row.sourceValue} {row.sourceUnit}
                </td>
                <td>
                  {row.sheet}, {row.cell}
                </td>
                <td>
                  <a href={row.sourceUrl}>Abrir archivo de origen ↗</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.context}>
        La columna en millones se redondea a dos decimales. Diciembre de 2022 se
        publica en <strong>miles</strong> de pesos y aquí se divide por 1.000
        para expresarlo en millones, como las restantes planillas. Sin ajuste
        por inflación o tipo de cambio, los cambios de nivel no miden por sí
        mismos cambios de carga real ni sus causas.
      </p>
    </section>
  );
}
