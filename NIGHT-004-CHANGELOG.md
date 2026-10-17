# Cambios — Misión 004.1-NIGHT

Fecha: 2026-10-17. Todo permanece local y sin preparar en Git.

1. `packages/web/app/globals.css`: se sustituyó la supresión de contorno del `main` enfocado por un contorno visible. Motivación: destino del enlace «Saltar al contenido» sin indicación visual. Se amplió la tipografía `.eyebrow` de 0.72 a 0.8 rem para legibilidad.
2. `packages/web/src/components/site-footer.tsx`: la flecha de los dos enlaces externos se marcó decorativa con `aria-hidden`. Motivación: no añadir un carácter ambiguo al nombre accesible.
3. `packages/web/src/components/site-header.tsx`: se normalizó la barra final de `usePathname()` antes de comparar la ruta activa. Motivación: `trailingSlash: true` generaba HTML sin `aria-current` al comparar `/datos/` con `/datos`; el build renovado ahora incluye `aria-current="page"`.
4. `packages/web/test/export.test.ts`: se añadieron dos pruebas del árbol estático: existencia de las seis rutas/404/activos y resolución de enlaces, metadatos, ruta activa y barrido de nombres/formatos peligrosos y avisos editoriales. Una segunda revisión independiente señaló que se omitían extensiones no enumeradas: ahora falla para cualquier archivo exportado que no sea HTML, TXT, JS o CSS. Motivación: la prueba anterior sólo examinaba una lista fija de fuentes. No es una prueba exhaustiva de secretos ni de privacidad; `bun run test` por sí solo puede omitir estas pruebas si no existe export o revisar uno antiguo.
5. `package.json`: nuevo comando `web:verify` que construye la exportación con `NEXT_TELEMETRY_DISABLED=1` y ejecuta las pruebas del artefacto fresco en secuencia, evitando la falsa confianza de probar un `out/` antiguo. La segunda revisión detectó y motivó desactivar telemetría explícitamente en este comando.
6. `packages/web/test/browser-check.mjs`: comprobador local de Chrome ya instalado mediante CDP para seis rutas a 320, 390 y 1440 px, desbordamiento horizontal, landmarks, estado activo y enlace de salto con Tab/Enter. Requiere un servidor local y Chrome con puerto de depuración, no forma parte del build ni se conecta a datos.
7. `README.md` y `CONTRIBUTING.md`: se precisó que la ausencia de servidor/red describe la CLI offline, no el frontend, y se agregó validación del export sin equiparar `noindex` con seguridad.

No se editó `packages/core`, `packages/ingestion`, el contrato de publicación ni se añadieron dependencias. Los documentos de Misión 004 preexistentes se conservaron; este registro separa las nuevas comprobaciones de sus resultados históricos.
