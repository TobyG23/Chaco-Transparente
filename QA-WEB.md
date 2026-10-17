# QA web — Misión 004

Fecha de revisión: 2026-10-17. Implementación **local**, sin `git add`, commit, push ni despliegue.

| Verificación | Resultado |
| --- | --- |
| `bun install --frozen-lockfile --ignore-scripts` | Pasó: 57 instalaciones/126 paquetes, sin cambios. |
| `bun audit` | Sin vulnerabilidades conocidas entre 121 paquetes comprobados; no garantiza ausencia de riesgos. |
| `bun run test` | 16 pasaron, 1 omitida, 0 fallaron, 74 aserciones en 5 archivos. La integración opcional con CSV originales externos **no se ejecutó** en esta corrida. |
| Typecheck directo de `@chaco/core`, `@chaco/ingestion`, `@chaco/web` | Pasaron los tres, sin depender de la caché. |
| `bun run typecheck` | Pasó con tres tareas; Turbo 2.9.14 advierte que no interpreta `bun.lock` v2, por lo que no se asegura el grafo/caché. |
| `bun run lint` | Pasó: Biome revisó 35 archivos. Se excluyó la salida generada `.next/` y `out/`; se corrigió una advertencia CSS de especificidad. |
| `NEXT_TELEMETRY_DISABLED=1 bun run web:build` | Pasó; las seis rutas y 404 se prerenderizaron de forma estática. |
| HTML exportado | Existen seis `index.html` en sus directorios; una comprobación local encontró `main`, `noindex` y destinos internos presentes en las seis páginas. |
| Contraste calculado | Pares principales: texto secundario/fondo 6.73:1, azul/fondo 6.92:1, foco/fondo 5.31:1, pie claro/oscuro 8.83:1. No cubre todos los estados ni sustituye una auditoría visual. |
| Salida de archivos y patrones | No se hallaron CSV, JSON, mapas o `.env` en `out/`; escaneo de JS exportado no halló nombres de variables de CSV, hashes de originales ni `publicationAllowed=true`. El HTML sí menciona `Q_PAG` para advertir sobre su interpretación; eso es texto editorial, no una fila o importe. |

Revisiones independientes de fuente y exportación señalaron dos problemas de navegación: enlaces móviles ocultos por desplazamiento horizontal y ausencia de indicación de ruta actual. Se cambió la navegación para envolver enlaces y añadir `aria-current="page"` más subrayado; lint, tests, typecheck web y build pasaron después. También se detectó que la exportación inicial generaba páginas `.html` con enlaces de ruta limpia; se configuró `trailingSlash: true` y se comprobaron los destinos `index.html` locales. Persiste el requisito de alojar en raíz o configurar/verificar `basePath` si se usa un subdirectorio. La página de fuentes remite al conjunto, pero no presenta los identificadores/huellas de las dos copias; queda como mejora editorial antes de publicar datos.

**No ejecutado durante la Misión 004:** navegador real, captura de pantalla escritorio/móvil, recorrido por teclado/lector de pantalla, auditoría automatizada WCAG, zoom y medición completa a 320 px. La Misión 004.1 realizó posteriormente pruebas locales con Chrome a 320/390/1440 px, capturas y una comprobación de teclado del enlace de salto; ver `NIGHT-004-REPORT.md`. Siguen pendientes lector de pantalla, auditoría WCAG completa y zoom. Tampoco se probaron cabeceras de un host futuro ni tráfico de red del runtime. La exportación local y `noindex` no autorizan ni protegen una publicación. Las licencias de todas las dependencias transitivas no se inventariaron individualmente. Antes de desplegar se requiere revisión separada de alojamiento, accesibilidad real, derechos, privacidad y bloqueo de cifras.
