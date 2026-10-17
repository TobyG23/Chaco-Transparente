# Chaco Transparente — núcleo offline (Misión 003)

Prototipo local para **dos** vistas de la ejecución presupuestaria provincial acumulada enero–diciembre 2022. No es una serie mensual ni un presupuesto municipal completo. Las vistas son desgloses distintos de la misma ejecución: **no sumarlas entre sí**. Fuente: [Ejecución Presupuestaria, Datos Abiertos Chaco](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto), organismo CKAN «MINISTERIO DE PLANIFICACION, ECONOMIA E INFRAESTRUCTURA». Los recursos están etiquetados CC BY 4.0 por el portal; su formulación legal/atribución y permisos de republicación requieren revisión.

Los códigos `Q_*` se conservan tal como aparecen; la moneda, unidad y definiciones normativas de las etapas **no están confirmadas**. En particular `Q_PAG` no se presenta como desembolso efectivamente pagado. `publicationAllowed` e `isPublished` son siempre `false`, aunque la validación técnica local termine sin errores. No hay red, API, servidor ni ruta de publicación.

## Ejecución

Requiere Bun y dependencias fijadas, obtenidos de fuentes aprobadas y verificadas. Instalar dependencias tras revisar manifiesto y scripts, preferentemente con `bun install --ignore-scripts`, y conservar el lockfile real; no ejecutar instaladores desde la carpeta de datos. Desde el directorio raíz del código:

```text
bun run ingest -- <ruta-absoluta-finalidad-original.csv> <ruta-absoluta-objeto-original.csv> [data/directorio-salida]
bun run test
bun run typecheck
bun run lint
```

Los dos argumentos de entrada son obligatorios; la salida sólo puede estar dentro de `data/` ignorado por Git. Si se indica un subdirectorio de salida nuevo, su padre inmediato ya debe existir y estar bajo control del operador (sin junctions/symlinks ni permisos de escritura de terceros). Los bytes deben corresponder exactamente a las copias auditadas: finalidad 87.111 bytes SHA-256 `5ecf7a89a9df8c8a4d4cc1b44464cf6cf4f46108634faedc4639c794679cdab7`; objeto 918.019 bytes SHA-256 `300bd7ce059bf22c94cbbe793326eac04153b93467841a75302828d21b43b5e0`. El hash se comprueba de nuevo cada vez, antes de parsear. Para activar la prueba de integración, proporcionar las rutas en `CHACO_FINALIDAD_CSV` y `CHACO_OBJETO_CSV`; sin ellas el test se omite. Los originales no forman parte de este proyecto.

La salida predeterminada es `data/` (ignorada por Git): versiones por hash, bytes sin modificar, JSON de filas y `quality.json`. El archivo conserva `sourceLine` físico 1-based y SHA-256 de los bytes de esa línea **sin CRLF**. Se rechazan campos CSV multilínea para mantener esa correspondencia. El CSV se decodifica como Windows-1252 compatible, no como codificación declarada oficialmente. Los importes normalizados son cadenas decimales exactas, nunca flotantes binarios. Los umbrales de QA se versionan y provienen de estas muestras; los saldos negativos y diferencias pequeñas se conservan, no se corrigen.

## Reproducción y estado de validación

El ZIP oficial de Bun v1.4.3 para Windows x64 se verificó contra el SHA-256 expuesto por GitHub y, tras autorización expresa, se extrajo al perfil de usuario. `bun --version` devolvió 1.4.3 y se generó `bun.lock` real con `bun install --ignore-scripts`. En Misión 003.2 se obtuvieron 9 tests (incluida integración real), typecheck, lint y dos ejecuciones idénticas de CLI. En Misión 003.3 se instaló Turbo 2.9.14 con scripts deshabilitados y se regeneró `bun.lock`; pasaron 14 tests (incluida integración), typecheck y lint, y dos ejecuciones CLI conservaron la misma versión local. Turbo advierte que no interpreta el lockfile Bun v2, aunque ejecuta las tareas; ver limitación en `MISSION-003-FINAL.md`. Los resultados y riesgos están en `MISSION-003-VALIDATION.md` y `MISSION-003-FINAL.md`. Para reproducirlos, hacer disponible el Bun verificado en el PATH de la sesión, asignar `CHACO_FINALIDAD_CSV` y `CHACO_OBJETO_CSV` a las copias externas verificadas y ejecutar los comandos anteriores. No interpretar un test omitido como integración aprobada.

Pendiente antes de cualquier publicación: definición oficial de las etapas, unidad/moneda, licencia/atribución, revisión de privacidad fila por fila y política de archivado/actualizaciones. La licencia del código propio tampoco está decidida: no hay `LICENSE`. Ningún archivo de datos debe subirse a un servicio externo ni incorporarse a Git. Ver `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` y `PROVENANCE.md` para colaboración, reportes y referencias arquitectónicas.
