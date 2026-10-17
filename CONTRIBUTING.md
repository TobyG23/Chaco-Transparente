# Contribuir

Este repositorio contiene un núcleo **offline** de ingestión para dos vistas provinciales de 2022. No hay autorización para publicar importes ni para incorporar nuevas fuentes, frontend o datos oficiales a Git.

1. Proponer cambios pequeños y acompañarlos de pruebas con datos sintéticos. Conservar los códigos y celdas originales, trazabilidad por línea y aritmética decimal exacta.
2. Usar Bun 1.4.3 y el lockfile vigente. Instalar con `bun install --frozen-lockfile --ignore-scripts`; revisar cualquier cambio de dependencias y su integridad antes de ejecutar binarios nuevos. Turbo 2.9.14 ejecuta typecheck, pero avisa que no interpreta el lockfile Bun v2; ver `MISSION-003-FINAL.md` antes de depender de su grafo o caché.
3. Ejecutar `bun run test`, `bun run typecheck` y `bun run lint`. La integración opcional requiere rutas externas verificadas en `CHACO_FINALIDAD_CSV` y `CHACO_OBJETO_CSV`; un test omitido no equivale a una integración aprobada. La CLI escribe sólo bajo `data/`, que está ignorado por Git.
4. Revisar **cada archivo** antes de proponerlo: nunca incluir CSV oficiales, derivados presupuestarios, secretos, `.env`, logs, caches o carpetas temporales. `.gitignore` no impide `git add -f`.
5. No afirmar semántica normativa para `Q_*`, moneda/unidad, licencia de los datos ni permiso de publicación mientras permanezcan pendientes. No copiar código o activos de proyectos de referencia sin verificar sus derechos y atribución.

La licencia para el código propio todavía no está decidida; no se concede aquí permiso de reutilización. Para asuntos de seguridad, consultar `SECURITY.md`.
