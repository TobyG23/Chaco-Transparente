# Validación Misiones 003.1 y 003.2 — historial 2026-10-17

**Estado vigente:** `MISSION-003-FINAL.md` registra la preparación de 003.3. Esta página preserva los resultados y bloqueos históricos de 003.1 y 003.2; las frases sobre dependencias ausentes o Turbo 2.5.8 no deben extrapolarse al manifiesto de 003.3 sin verificar el lockfile y la instalación.

## Estado histórico de Misión 003.1
La sección siguiente describe el bloqueo anterior, resuelto después por la autorización expresa de Misión 003.2. El estado actual figura al final de este informe.

**Parcial; ejecución bloqueada por permisos.** No se ejecutó el binario Bun descargado, ni `bun install`, tests, integración de la implementación, typecheck, lint o CLI. No existe tarea build. No hay lockfile ni dependencias resueltas. Estos puntos **no están aprobados** y no se infiere éxito del perfil Python de la misión anterior.

## Comprobaciones realizadas
| Comando/acción | Resultado |
|---|---|
| `node --version`, `npm --version`, `git --version` | v22.22.2, 10.9.7, 2.52.0.windows.1 |
| `Get-Command` / `command -v` / `where bun` / ubicaciones del perfil / `winget list` | No se halló instalación de Bun; PATH de PowerShell/Bash/CMD no lo resuelve |
| `Get-FileHash` en originales externos | Ambos SHA-256 coinciden con el contrato; 87.111/918.019 bytes |
| `gh repo view ... --json isEmpty`, `git ls-remote` | Remoto existente vacío; cero refs observadas |
| `git rev-parse --is-inside-work-tree` | Código 128, proyecto no es Git |
| `curl` a release oficial Bun v1.4.3 y `sha256sum` | ZIP verificado contra digest SHA-256 expuesto por GitHub API; no ejecutado |
| Comando de extracción/copia/ejecución Bun | **Denegado** por control de permisos: `[Code from External]` |
| Comando combinado de `git init` y `git remote add origin` | **Denegado** por control de permisos: `[Remote Repoint]`; ningún cambio hecho |

Los comandos anteriores son comprobaciones rápidas, no una cronometría formal; no se registró duración exacta. El informe `ENVIRONMENT-REPORT.md` detalla plataforma, fuentes y dependencias. No se modificaron tests para forzar un pase.

## Correcciones locales realizadas sin ejecución
- Se rechazaron output symlinks y rutas de versión que no sean directorios ordinarios; los archivos archivados y JSON existentes se revisan ante enlaces simbólicos. Se documentó que el directorio padre de salida debe existir y estar bajo control exclusivo del operador; aún falta validación adversarial en Windows (junctions/TOCTOU y ACL).
- QA independiente detectó un posible fallo TS2532 por índices de `Promise.all`; se corrigió comprobando ambas entradas antes de acceder a `rows`. Los hallazgos de reconciliación ahora indican la etapa. Queda pendiente la ejecución real para confirmar ambas correcciones.
- Se retiró una ruta absoluta a los originales de la documentación compartible.
- Se revisaron los scripts directos y se recomendó instalar dependencias con scripts de ciclo de vida deshabilitados, sujeto a inspección del lockfile real.

## Integridad y riesgos restantes
El perfil previo de los mismos hashes contabilizó 504 y 6.153 registros, 233 saldos negativos de objeto y diferencias pequeñas; **la CLI nueva no procesó esas filas en esta misión**. No se comprobaron en ejecución trazabilidad por línea, conservación de ceros, decimal exacto, idempotencia, reportes ni exportación. `publicationAllowed=false` sigue establecido en el código y no hay ruta de publicación, pero no sustituye revisión legal/privacidad.

QA independiente también señaló que una escritura interrumpida de un derivado ya existente puede dejar un archivo parcial que impida la siguiente ejecución, y que las pruebas no cubren todavía el gate completo de CLI ni rutas adversariales; además, `biome check` probablemente encuentre formato por corregir. No se presentan estos puntos como superados. No hay Git local ni `origin`; `.gitignore` excluye `data/`, `*.csv`, `.env*`, caches y dependencias. Revisar exhaustivamente la lista de archivos antes de un futuro commit. El control de permisos debe autorizar explícitamente ejecutar el Bun v1.4.3 del ZIP oficial verificado y añadir el remoto nombrado, si se pretende completar estas fases. **No usar otra herramienta o agente para eludir las denegaciones.**

## Estado actual — Misión 003.2
Tras aprobación explícita del propietario para el ZIP oficial de `https://github.com/oven-sh/bun/releases/download/bun-v1.4.3/bun-windows-x64.zip` y el origin nombrado, se reconfirmó SHA-256 `0bf84e808552beea67bf1202a287a35c6c825d837b287b3f8e9dd513dba35d3d`, se extrajo al perfil y se ejecutó `bun --version` (**1.4.3**) y `bun --revision` (**1.4.3+c6da4a4d3**). PATH sólo se antepuso por proceso, no se alteró globalmente. `bun install --ignore-scripts` resolvió 11 paquetes en 4,10 s y generó `bun.lock` real; dependencias directas Biome 2.5.15, tipos Bun 1.3.0, Turbo 2.5.8 y TypeScript 5.9.3. No hay script build.

| Comando medido | Resultado |
|---|---|
| `bun run test` sin variables de integración | 7 pass, 1 skip, 0 fail; 129 ms. El skip se informó, no se consideró aprobación. |
| `bun run test` con ambas variables a originales externos | 8 pass, 0 fail, 34 expect; 558 ms. Tras prueba de recuperación: 8 pass, 0 fail, 37 expect; 360 ms. |
| `bun run typecheck` | Primero falló por `packageManager` faltante; después TS18048 en parser. Se corrigieron ambos. Dos paquetes exitosos; 6,728 s sin caché, última ejecución 2,162 s con core cacheado. |
| `bun run lint` | Primero falló por formato/imports y `noImplicitAnyLet` en `archive.ts`; se aplicaron arreglos de Biome y tipo explícito. Último resultado: 16 archivos, sin errores, 31 ms. |
| `bun run ingest -- <dos CSV originales> data` dos veces | Ambos: 504/6.153 filas, estado `review_required`, `publicationAllowed=false`, idéntico directorio de versión. Una tercera ejecución tras corrección de recuperación mantuvo la versión. |
| Test sintético de JSON derivado truncado | Se trunca un JSON en directorio temporal de fixture; siguiente `archive` restaura bytes idénticos y no deja `.tmp`. No se dañaron derivados reales. |

Los originales conservan SHA-256 `5ecf7a89a9df8c8a4d4cc1b44464cf6cf4f46108634faedc4639c794679cdab7` y `300bd7ce059bf22c94cbbe793326eac04153b93467841a75302828d21b43b5e0`. La integración comprobó 54 entidades por vista, 233 saldos negativos de objeto, 89/183 avisos de redondeo, cero errores QA, última línea física 6154 en objeto y publicación bloqueada. Tests sintéticos cubren cero inicial, decimales exactos, CRLF y hash de línea. Se verificaron hashes de los originales archivados y de las salidas; no se hicieron sumas entre vistas para publicar importes.

Git local fue inicializado en `main` sólo después de confirmar que `gh repo view` reportaba remoto vacío y `git ls-remote` no veía refs; `origin` apunta a `https://github.com/TobyG23/Chaco-Transparente.git`. `git status --short` sólo lista código y documentación nuevos no rastreados, incluido `bun.lock`; no lista originales, derivados, `node_modules`, `.env` ni cachés. No se hizo add/commit/push/merge.

**Revalidación tras correcciones finales de parser, archivo y salida:** `bun run test` con ambos originales externos: 8 pass, 0 fail, 41 aserciones; sin variables: 7 pass, 1 skip, 0 fail (la integración se omite deliberadamente). `bun run typecheck`: 2 paquetes exitosos; `bun run lint`: 16 archivos, cero errores. Dos ejecuciones consecutivas de la CLI con los originales y salida predeterminada dieron 504/6.153, `review_required`, `publicationAllowed=false` y el mismo directorio `data/5a29e4e2fa708498d834f4693b590a479d7e5804eaca972f71c88ee359ffd8f6`. Los CSV de ese directorio conservan ambos SHA-256 originales. La prueba sintética ahora verifica recuperación de CSV archivado faltante, además de JSON truncado, y que cambiar el reporte de calidad cambia el digest. `data/` tiene **dos** carpetas de versión: la anterior `5731758e6aefe7f134c051405944da45555a74cfd29f60a72c931df05cc17051` y la nueva; no se eliminó la anterior. `git status --short --untracked-files=all` sólo lista código, documentación y lockfile, no `data/` ni originales. No se hizo add/commit/push/merge.

**Revisión independiente final:** detectó que `archive()` permitía crear una versión nueva con bytes que no coincidían con el hash/tamaño del documento y que restaurar un CSV ausente directamente en su ruta final podía dejarlo parcial tras una interrupción. Se añadió verificación de hash y longitud antes de crear directorios, recuperación por archivo temporal sincronizado y enlace exclusivo al nombre definitivo, y prueba sintética de bytes alterados; los tests con originales ahora dan **9 pass, 0 fail, 44 aserciones**. Typecheck y lint pasaron de nuevo, y otras dos ejecuciones CLI mantuvieron la misma versión y estado. La recuperación de CSV se prueba ante ausencia, no mediante inyección de fallo real durante la escritura; una copia ya corrupta se rechaza deliberadamente y exige intervención manual. Las dos carpetas locales de versión permanecen intactas.

**Riesgos aún abiertos:** los umbrales de QA son provisionales; moneda, unidad, semántica contable y licencia/privacidad no confirmadas. El test de interrupción simula archivo truncado, no un corte real de proceso a mitad de syscall. En Windows, junctions/ACL y reemplazos concurrentes de directorios requieren pruebas y política de acceso adicionales: `publicationAllowed=false` es dato de control, no una barrera del sistema operativo. Los avisos [GHSA-3qcw-2rhx-2726](https://github.com/advisories/GHSA-3qcw-2rhx-2726) y [GHSA-hcf7-66rw-9f5r](https://github.com/advisories/GHSA-hcf7-66rw-9f5r) afectan a `turbo@2.5.8` y se corrigen en 2.9.14; las condiciones descritas (repositorio con configuración Yarn maliciosa y login/SSO de endpoint self-hosted, respectivamente) no se ejercieron en esta validación Bun offline. La dependencia sigue pendiente de actualización/revalidación: no se declara libre de vulnerabilidades. No iniciar frontend ni nuevas fuentes hasta decidir estos puntos y revisar la evidencia.
