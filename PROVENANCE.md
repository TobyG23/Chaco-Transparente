# Procedencia y referencias

## Datos de Chaco

El núcleo de ingestión **local** lee dos copias externas de recursos del conjunto [Ejecución Presupuestaria del portal de Datos Abiertos de Chaco](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto), identificadas por los títulos como acumuladas enero–diciembre 2022. Las [fichas oficiales de Finalidad/Función](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/c45515ce-881d-4623-b10d-f422e395c3ca) y [objeto del gasto](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/3ffb2f1f-656f-486d-8496-a36366e6cf25) son referencias de metadatos; no se alojan sus descargas en el sitio. `packages/ingestion/src/parser.ts` conserva UUID, URL, tamaño y SHA-256 esperados de las copias auditadas. Los originales, sus filas y sus importes no forman parte de Git ni del explorador sintético. El hash coteja **identidad e integridad de bytes locales**, no certifica exactitud de cifras, semántica, autorización de uso, versión actual del portal ni autenticidad institucional del sitio.

### Diccionario acotado de las dos fichas (consultadas 2026-10-18)

| Vista | Identificadores y clasificación presentes en el CSV | Alcance verificado |
| --- | --- | --- |
| Finalidad/Función y fuente | `Q_ENT`, `Q_NOMENT`, `FINALIDAD`, `NOMFIN`, `FUNC_N2`, `FUNC_N1`, `NOMFUN_N1.1`, `CODFTE`, `NOMFTE` | Entidad, finalidad/función y fuente según la ficha de Finalidad/Función; no se ha certificado jerarquía ni equivalencia entre códigos de distintas vistas. |
| Objeto del gasto y fuente | `Q_ENT`, `Q_NOMENT`, `Q_GRUPO`, `Q_NOMGRUPO`, `Q_PARTIDA`, `Q_NOMPARTIDA`, `Q_FTE` | Entidad, grupo/partida y fuente según la ficha de objeto; no se debe equiparar `Q_FTE` con el par `CODFTE`/`NOMFTE` sin validación. |

### Matriz de evidencia por indicador

En la matriz, **F** es la [ficha oficial de Finalidad/Función](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/c45515ce-881d-4623-b10d-f422e395c3ca) y **O** la [ficha oficial de objeto del gasto](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/3ffb2f1f-656f-486d-8496-a36366e6cf25). Son **metadatos descriptivos del portal**, no definiciones normativas verificadas ni comprobantes de operaciones. Ambas fichas tipan los siete campos como número decimal y dejan vacía la unidad de medida.

| Indicador | Evidencia descriptiva F | Evidencia descriptiva O | Límite de prueba / estado editorial |
| --- | --- | --- | --- |
| `Q_ASIG` | Importe previsto en la Ley de Presupuesto. | Importe del presupuesto asignado por ley. | Coincidencia descriptiva; falta cotejar ley, jurisdicción y versión aplicable. |
| `Q_VIG` | Presupuesto inicial asignado, actualizado al período. | Importe del presupuesto vigente. | No prueba actos de modificación presupuestaria ni corte exacto más allá del título. |
| `Q_COMP` | Importe comprometido para gastos, derivado de órdenes de compra. | Reserva preventiva del crédito que impide destinarlo a otro fin. | Redacciones distintas; no se ha verificado el alcance jurídico/contable de la etapa. |
| `Q_ORD` | Importe resultante de órdenes de pago. | Afectación definitiva de los créditos presupuestarios. | No equivale por sí mismo a pago ejecutado; definición normativa pendiente. |
| `Q_PAG` | Importe efectivamente pagado. | Entrega material del dinero. | Sólo son glosas de metadatos: no demuestran transferencia bancaria, beneficiario ni fecha de desembolso; no afirmar pago efectivo comprobado. |
| `Q_SAL` | Diferencia entre presupuesto vigente e importe comprometido. | Diferencia entre presupuesto vigente y compromiso. | Coinciden las glosas, pero no se ha validado cálculo fila por fila ni regla normativa. |
| `Q_VAR` | Cociente entre importe comprometido y presupuesto vigente; la glosa añade «expresado en pesos». | Variación entre compromiso y presupuesto vigente. | **Conflicto explícito** entre cociente y variación; la frase «en pesos» de F tampoco resuelve la unidad vacía de ambas fichas. No fijar fórmula, porcentaje, moneda ni unidad. |

### Alcance transversal de la evidencia

| Aspecto | Evidencia oficial | Límite / pendiente |
| --- | --- | --- |
| Moneda y unidad | F y O dejan vacía la unidad de los siete campos decimales; F menciona «pesos» sólo dentro de la glosa conflictiva de `Q_VAR`. | No hay base para atribuir pesos, porcentaje u otra unidad a las columnas, ni para interpretar `Q_VAR` como razón publicable. Confirmar con documentación normativa y autoridad de origen. |
| Período | Los títulos de [F](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/c45515ce-881d-4623-b10d-f422e395c3ca) y [O](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto/archivo/3ffb2f1f-656f-486d-8496-a36366e6cf25) indican acumulado enero–diciembre de 2022. | No son doce observaciones mensuales ni acreditan una serie temporal o un cierre normativo auditado. |
| Clasificaciones | F identifica entidad, finalidad/función y fuente (`Q_ENT`, `Q_NOMENT`, `FINALIDAD`, `NOMFIN`, `FUNC_N2`, `FUNC_N1`, `NOMFUN_N1.1`, `CODFTE`, `NOMFTE`); O identifica entidad, grupo/partida y fuente (`Q_ENT`, `Q_NOMENT`, `Q_GRUPO`, `Q_NOMGRUPO`, `Q_PARTIDA`, `Q_NOMPARTIDA`, `Q_FTE`). | Vistas distintas de ejecución acumulada, no sumables. No se ha probado jerarquía ni equivalencia de fuentes `Q_FTE` ↔ `CODFTE`/`NOMFTE`; hace falta catálogo oficial y conciliación. |
| Derechos y privacidad | El [conjunto oficial](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto) muestra CC BY 4.0; [«Acerca del portal»](https://datosabiertos.chaco.gob.ar/acerca) pide atribuir y compartir con la misma licencia con que se publicaron los datos. | Etiqueta del conjunto y texto general, no autorización individual de republicación. Confirmar titular, licencia por recurso/versión, atribución, condiciones sobre derivados y privacidad fila por fila antes de cualquier uso público. |

Esta matriz sólo registra lo que dicen las fichas: para respaldar afirmaciones normativas harían falta ley, normas contables, catálogos y documentos oficiales aplicables, cotejados con la autoridad competente. No se han aportado esas pruebas ni se concede permiso de publicación.

El explorador interactivo usa registros y cantidades **sintéticos de demostración**, separados de los CSV originales y de los derivados de ingestión. El aviso inequívoco de su interfaz es «Datos sintéticos de demostración · no son registros oficiales». Las fichas oficiales explican contexto y procedencia del trabajo local, **no** son fuente de las cifras sintéticas ni las avalan. Las dos clasificaciones son vistas diferentes de una ejecución acumulada, no partes para sumar; no se infiere de ellas una serie mensual ni un presupuesto municipal completo. La fórmula de `Q_VAR`, la interpretación normativa exhaustiva de las etapas `Q_*` (incluido `Q_PAG`), la moneda y la unidad siguen sin confirmar; no afirmar un desembolso bancario comprobado a partir de `Q_PAG` ni asignar unidad a ninguna columna a partir de su nombre.

El conjunto oficial muestra una etiqueta [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), mientras que [«Acerca del portal»](https://datosabiertos.chaco.gob.ar/acerca) pide atribuir y compartir con la misma licencia con que se publicaron los datos. **La diferencia entre esa redacción general y la etiqueta del conjunto no se resuelve aquí**: confirmar con la autoridad/titular la licencia aplicable a cada recurso y sus versiones, atribución y avisos exigidos, alcance sobre derivados y revisión de privacidad fila por fila antes de cualquier reutilización pública. Ni la etiqueta ni esta referencia licencian el código de este repositorio o autorizan republicar originales, derivados o importes.

## Mendoza Transparente

[Mendoza Transparente](https://github.com/unllamas/mendoza-transparente), revisión examinada `72b14c8d36938050e1641f555fca45a4c3ed59f0`, fue una **referencia arquitectónica** durante el reconocimiento de Misión 001. Se observaron la separación de paquetes, el archivado con hash (`packages/core/src/fetch.ts`), el parser genérico (`packages/core/src/csv.ts`) y el pipeline de catálogo/exportación; el prototipo de Chaco implementa por separado una ingestión offline de CSV `;` y sus reglas específicas. Los informes de reconocimiento `01-original-architecture.md`, `02-reuse-matrix.md`, `04-security-licenses.md` y `07-executive-summary.md` se guardaron fuera de este repositorio durante la auditoría. No se trasladaron código, datos, geografía, scrapers, interfaz ni activos de Mendoza al destino. El metadato MIT observado para aquel repositorio no determinó la licencia de Chaco: el titular eligió por separado MIT para el código original del proyecto y CC BY 4.0 para sus textos y diseño originales. Ninguna de ellas concede derechos sobre materiales de Mendoza.

Ninguna relación de referencia implica aval de Mendoza Transparente ni del Gobierno del Chaco.
