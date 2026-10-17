# Informe local — Misión 003 (historial; 2026-10-17)

**Estado vigente:** consultar `README.md` y `MISSION-003-FINAL.md`. Las afirmaciones de falta de Git, Bun y pruebas en las secciones 003 y 003.1 siguientes describen el momento en que fueron escritas; quedaron superadas por la validación 003.2 y no deben usarse como diagnóstico presente.

## Entrega
Se creó el esqueleto del monorepo Bun/TypeScript/Turborepo y un prototipo offline independiente para las dos vistas oficiales de 2022. Los originales permanecen exclusivamente fuera del proyecto. Hay contrato tipado, parser CSV estricto con trazabilidad por línea, aritmética decimal exacta, controles de calidad/reconciliación, archivo local por hash, bloqueo de publicación y pruebas sintéticas e integración opcional. No se añadieron conexiones de red, descargas, API, servidor ni interfaz pública.

## Preflight comprobado
- Finalidad: SHA-256 `5ecf7a89a9df8c8a4d4cc1b44464cf6cf4f46108634faedc4639c794679cdab7`.
- Objeto: SHA-256 `300bd7ce059bf22c94cbbe793326eac04153b93467841a75302828d21b43b5e0`.
- Las copias siguen en carpetas separadas del directorio temporal de auditoría, fuera del proyecto; no se copiaron al repositorio.
- El destino era vacío y `git rev-parse --is-inside-work-tree` falla porque **no es repositorio Git**. No se hizo `git init`, commit, push ni despliegue.

## Verificación pendiente por entorno
`bun`, `tsc` y `turbo` no se localizaron en PATH ni en ubicaciones comunes de Bun; el caché npm examinado no contenía Bun/Biome. Al cerrar la Misión 003 todavía no se habían descargado ni ejecutado paquetes de Internet. Por tanto **no se corrieron** `bun install`, `bun run test`, `bun run typecheck`, `bun run lint`, ni ejecuciones completas/idempotentes de la CLI; no se generó `bun.lock`. Las pruebas incluidas son código sin resultado observado: no se afirma que pasen. La revisión read-only de ambos originales confirmó 504/6.153 registros y líneas menores que el límite del parser, pero no equivale a ejecutar la implementación.

## Actualización Misión 003.1
Se verificó un ZIP oficial Bun v1.4.3 (hash concordante) sin ejecutarlo; la política de permisos denegó la extracción/ejecución y también el comando combinado para preparar Git y `origin`. Continúan sin ejecutar instalación, pruebas y CLI; no se generó lockfile ni se inicializó Git. Se revisó el remoto, que existe y aparece vacío, y se hizo una revisión independiente de seguridad. Se reforzaron controles locales de rutas de salida, pendientes de prueba. Ver `ENVIRONMENT-REPORT.md` y `MISSION-003-VALIDATION.md` para comandos, denegaciones y pasos restantes. El estado anterior de esta página corresponde a la Misión 003 antes de esta actualización.

## Actualización Misión 003.2
El propietario autorizó explícitamente la URL y hash de Bun y el remoto Git. Bun v1.4.3 quedó instalado en el perfil; `bun.lock` fue generado por instalación con scripts deshabilitados. Los tests (9/9, incluida integración offline; 44 aserciones tras revisión independiente final), typecheck y lint pasan; dos ejecuciones de CLI produjeron la misma versión local y publicación bloqueada. Se probó recuperación de JSON truncado y CSV archivado faltante con un fixture sintético; cambiar la calidad cambia el digest. El nuevo algoritmo generó una segunda versión local, sin eliminar la anterior. Git local `main` y `origin` están configurados hacia el repositorio remoto vacío, sin commits, pushes ni merges. Ver la sección actual de `MISSION-003-VALIDATION.md` y `ENVIRONMENT-REPORT.md` para resultados y riesgos. El texto histórico de Misión 003/003.1 debajo refleja el estado de entonces, no el actual.

## Límites
Los 233 saldos negativos, diferencias de redondeo y dos vistas acumuladas exigen interpretación humana. `Q_PAG`, moneda/unidad y atribución/reutilización aún no están validados oficialmente. Los umbrales de calidad son provisionales, derivados de la muestra. `publicationAllowed=false` es un bloqueo técnico, no un permiso para difundir ni garantía de privacidad. Antes de usar o divulgar los derivados, inspeccionar el informe de QA, actualizar y revalidar la dependencia Turbo con avisos publicados, y validar licencia, campos y privacidad. Bun y las dependencias actuales se instalaron y verificaron como se documenta en `MISSION-003-VALIDATION.md`; ello no resuelve las decisiones legales ni semánticas.
