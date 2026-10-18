# Estado y trazabilidad del contenido

| Afirmación editorial | Respaldo | Estado/límite |
| --- | --- | --- |
| Dos vistas de ejecución provincial acumulada enero–diciembre 2022 | Títulos de los dos recursos auditados; `PROVENANCE.md` y `README.md` | El período proviene de títulos, no de una interpretación normativa certificada; no es serie mensual ni presupuesto municipal completo. |
| Vistas por finalidad/fuente y objeto del gasto/fuente | Recursos identificados en `PROVENANCE.md`; `packages/web/src/content.ts` | Son desgloses de una misma ejecución; no sumar. La página Fuentes enlaza al conjunto y a las fichas de metadatos oficiales de dos recursos, no hospeda copias ni descarga CSV. |
| Cotejo de tamaño y SHA-256, trazabilidad por línea y cálculo decimal exacto | Núcleo de `packages/ingestion` y `packages/core`; `MISSION-003-FINAL.md` | Describe capacidad local para las copias auditadas, no actualización automática ni certificación de cifras. |
| Etiqueta CC BY 4.0 en el portal | `PROVENANCE.md` | La formulación de atribución, republicación y privacidad requieren revisión legal separada. |
| Proyecto independiente y publicación bloqueada | `README.md`, contrato `publicationAllowed=false` en el núcleo y Misión 004 | No implica aval gubernamental; el frontend no publica filas, CSV, derivados ni importes. |

Avisos visibles: datos en revisión; cifras no publicadas; moneda, unidad, definiciones `Q_*`, derechos, privacidad y política de actualización/archivo pendientes. `Q_PAG` no se equipara con desembolso efectivo. El código original tiene licencia MIT y los textos y diseño originales CC BY 4.0; esto no licencia recursos oficiales ni autoriza desplegar. Las referencias a Mendoza Transparente indican sólo inspiración arquitectónica, sin copiar materiales ni sugerir afiliación.

Antes de publicar datos deberán identificarse las versiones exactas y huellas para lectores, decidir atribución, verificar semántica y completar privacidad fila por fila. La página Fuentes muestra identificadores y enlaces a fichas oficiales de dos recursos, pero no las huellas/versiones de las copias auditadas: están sólo en el código de ingestión. Las fichas se comprobaron como páginas de metadatos el 2026-10-17; su vista previa de datos no estaba disponible. Los metadatos de robots no autorizan publicar el sitio.
