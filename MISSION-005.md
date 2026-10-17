# Misión 005 — arquitectura de previsualización segura

**Estado:** preparación local de documentación; no se ha desplegado el portal, creado cuenta o recurso externo, configurado DNS, Pages, Actions ni cabeceras remotas. Referencia de código: `a85fd140a2cb237fb3aad27e22cfeb513a226b56` en `main`. El núcleo mantiene `publicationAllowed=false` y no se publican importes ni registros presupuestarios.

## Alcance y diseño

Se comparan Cloudflare Pages, GitHub Pages, Vercel y VPS propio en `HOSTING-COMPARISON.md`. Se propone elegir una plataforma **sólo tras** la decisión del propietario sobre gastos, dominio, logs y operación. La arquitectura separa checkout limpio sin originales, verificación local, artefacto estático inmutable e inspeccionado, aprobación humana, promoción manual y verificación externa. Ver `DEPLOYMENT-PLAN.md`.

`SECURITY-HEADERS.md` plantea cabeceras HTTP y CSP por hashes asociados al build, inicialmente Report-Only. `PRIVACY-AND-RIGHTS.md` separa comportamiento del código, posibles logs del proveedor, licencia propia pendiente y derechos de los recursos oficiales. `PREDEPLOY-CHECKLIST.md` contiene la matriz de QA y los bloqueos para una previsualización pública. El hosting debe servir rutas `/ruta/index.html`, 404 real y activos de Next, y asumir raíz del dominio salvo cambio verificado de `basePath`. `noindex` no limita el acceso.

## Validaciones locales de esta misión

En 2026-10-17, `bun run web:verify` reconstruyó seis rutas y 404: 2 pruebas de exportación, 290 aserciones, cero fallos. `bun run test`: 18 aprobadas, una omitida (integración con originales externos), cero fallos y 364 aserciones. Typecheck directo de core, ingestion y web: pasaron; `bun run lint`: 37 archivos, sin errores; `bun audit`: ninguna vulnerabilidad conocida entre 121 paquetes. El árbol exportado observado contiene 9 HTML, 28 TXT, 11 JS y un CSS; se ignora en Git. La ausencia de una vulnerabilidad conocida no certifica seguridad. La verificación del host, accesibilidad ampliada, derechos, privacidad y cabeceras **no** se puede dar por aprobada a partir de estas pruebas locales.

## Continuación — Misión 005.1

Se conservan los resultados históricos anteriores. La comparación específica Pages Direct Upload/Workers Static Assets, la decisión técnica condicionada y las pruebas nuevas se registran en `MISSION-005-DECISION.md`. Se añadieron scripts locales de inventario/verificación SHA-256; no constituyen inspección humana ni permiso de publicación. Un ensayo de reflow equivalente a zoom 200 %/400 % sobre el export existente no equivale a zoom real de navegador ni auditoría WCAG. Se mantiene **NO-GO para despliegue**.

## Puertas y autoridad

El propietario debe seleccionar plataforma/plan y autorizar por separado cuenta, dominio, DNS, cabeceras, despliegue y todo gasto. También quedan pendientes revisión de accesibilidad con lector de pantalla/zoom, política de logs y privacidad, atribución, licencia del código, evaluación de terceros y prueba del host real. Publicar metadatos editoriales no autoriza publicar cifras o derivados. **NO-GO para despliegue ahora**; GO únicamente para revisar y decidir la arquitectura. No hubo `git add`, commit ni push durante esta misión.
