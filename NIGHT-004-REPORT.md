# Informe nocturno — Misión 004.1

**Fecha/hora local:** 2026-10-17, 01:45:13–01:57:53 (UTC−03:00). **Estado:** cambios locales sin staging, commit, push ni despliegue. Se conservaron los cambios preexistentes de Misión 004. El trabajo empezó con `git status` en `main`; no se modificaron núcleo de ingestión, originales, contratos de publicación ni configuraciones globales. Se coordinaron cuatro agentes de diagnóstico de sólo lectura (arquitectura, seguridad, accesibilidad/UX, testing/documentación) y un quinto agente independiente de revisión de las correcciones. No se usó OmniRoute como mecanismo específico porque no había una interfaz OmniRoute disponible; se utilizaron los agentes ofrecidos por la sesión sin eludir cuotas.

## Hallazgos priorizados y acciones

| Severidad | Hallazgo | Acción/estado |
| --- | --- | --- |
| Moderada | `trailingSlash: true` produce rutas `/datos/`, pero la navegación comparaba literalmente con `/datos` y el export no emitía `aria-current`. | Se normalizó la barra final en el encabezado; se comprobó `aria-current="page"` en las seis páginas exportadas y en Chrome. |
| Moderada | El destino del enlace de salto tenía `outline: none` sin sustituto. | Contorno visible en `main:focus`; Tab/Enter en Chrome enfocó `#contenido` con contorno sólido. |
| Moderada | No existía una prueba persistente del árbol exportado; la revisión inicial sólo buscaba imports en una lista fija. | Dos pruebas de exportación verifican rutas, assets/enlaces internos, estado y patrones prohibidos; `web:verify` fuerza build fresco y prueba después. Sigue sin ser una garantía exhaustiva de ausencia de datos privados. |
| Moderada | La primera versión de esa prueba permitía extensiones no enumeradas y el primer `web:verify` no desactivaba telemetría. | Revisión independiente; ahora sólo se aceptan HTML/TXT/JS/CSS en `out/` y `web:verify` fija `NEXT_TELEMETRY_DISABLED=1`. |
| Baja | Tamaño de microtexto y flechas externas accesibles inconsistentes. | Se elevó `.eyebrow` de 0.72 a 0.8 rem y se ocultaron las flechas decorativas del pie a tecnología asistiva. Pendiente evaluar toda la microtipografía bajo zoom. |
| Baja | README parecía atribuir ausencia de servidor/red a todo el proyecto. | Se limitó la frase a la CLI offline; CONTRIBUTING distingue verificación web, `noindex` y bloqueo de despliegue. |

Revisiones independientes no encontraron fuga actual de CSV, filas, importes ni secretos en la exportación inspeccionada. Identificaron riesgos condicionados: `publicationAllowed=false` es un contrato del núcleo y no un control automatizado universal de publicación de cualquier archivo futuro; la interfaz y metadatos pueden quedar desfasados respecto de nuevas copias; alojar bajo subruta requiere `basePath`; la página de fuentes no ofrece en pantalla los UUID/huellas exactos de las dos copias. No se corrigieron los últimos puntos introduciendo nuevas fuentes o conectando el frontend al archivo local.

## Validación final

- `bun run web:verify`: build estático de seis rutas más 404; **2 pruebas del export pasaron, 0 fallaron, 290 aserciones**. El chequeo de tipos del build pasó.
- `bun run test`: **18 pasaron, 1 omitida, 0 fallaron, 364 aserciones en 6 archivos**. La omitida es la integración con los CSV originales externos, que no se proporcionaron en esta sesión; no equivale a integración aprobada. Los tests del export se ejecutaron porque existía `out/`, pero sólo `web:verify` garantiza que sea fresco.
- Typechecks directos: `@chaco/core`, `@chaco/ingestion` y `@chaco/web` pasaron. `bun run lint`: Biome revisó 37 archivos, sin errores. `bun audit`: 0 vulnerabilidades conocidas entre 121 paquetes comprobados. `git diff --check`: sin errores; mostró únicamente avisos de conversión LF/CRLF.
- Chrome ya instalado, servido sólo desde `127.0.0.1`: 18 combinaciones de seis rutas y 320/390/1440 px; cada una cargó título y H1, seis enlaces de navegación, ruta activa, `main`, enlace de salto y sin desbordamiento horizontal medido. Tab/Enter en portada a 320 px enfocó el destino con contorno visible. Se generaron y observaron capturas locales en `%TEMP%/chaco-night-desktop.png`, `%TEMP%/chaco-night-mobile.png` y `%TEMP%/chaco-night-320.png`; la captura de 320 px corresponde a `/datos/`. No se adjuntaron al repositorio ni a servicios externos.
- El barrido del export incluyó HTML, JS, CSS y payloads TXT de Next; fallaría con formatos adicionales o ciertos identificadores de archivo originales. Los términos `Q_PAG` y `publicationAllowed=false` aparecen sólo como advertencias editoriales. No se hicieron consultas ni descargas de fuentes gubernamentales.

## Límites y bloqueos

No se ejecutó lector de pantalla, auditoría WCAG automática completa, zoom 200–400%, prueba en hosting real, verificación de cabeceras, captura de red integral ni inventario jurídico de licencias transitivas. El smoke de navegador sólo verifica estructura básica, no cada mensaje editorial; las pruebas de exportación usan patrones y no certifican confidencialidad. Chrome headless y el servidor local fueron temporales y no constituyen despliegue. La integración real requiere originales externos disponibles y autorizados; no se buscaron. Nuevas dependencias, publicación, staging/commit y conexión de datos estaban fuera de autorización.

## Git y recomendación

`main` conserva cambios de Misión 004 más las correcciones nocturnas: modificados `.gitignore`, `CONTRIBUTING.md`, `README.md`, `biome.json`, `bun.lock`, `package.json`; sin seguimiento los cinco documentos de Misión 004, estos dos documentos nocturnos y `packages/web/`. No hay archivos en staging ni operaciones remotas. Los CSV, derivados y `out/` siguen fuera de Git. **GO condicionado para preparar un commit local sólo tras autorización expresa y revisión de cada archivo; NO-GO para despliegue o publicación de cifras.** Antes de un despliegue, revisar derechos/privacidad, fuente exacta, hosting, seguridad y accesibilidad ampliada.
