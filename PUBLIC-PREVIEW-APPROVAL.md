# Aprobación humana — previsualización pública

**Misión 005.5C · 2026-10-17 · NO-GO para crear o publicar.** Este paquete permite al propietario revisar una eventual previsualización editorial **pública** de Chaco Transparente en Netlify. No concede autorización de publicación, aprobación jurídica ni permiso para republicar datos presupuestarios. `publicationAllowed=false` e `isPublished=false` permanecen intactos. Revisar `NETLIFY-DEPLOYMENT.md` y `NETLIFY-READINESS.md` junto con el artefacto exacto antes de decidir.

## Textos que verá cualquier visitante

- Aviso común, en todas las páginas, incluidos los tres HTML de error: **«Versión preliminar · Proyecto independiente, no oficial del Gobierno del Chaco.»** En `packages/web/app/layout.tsx`, «Versión preliminar» está en `<strong>`; la frase completa cruza ese elemento y un salto de línea de fuente, por lo que se debe revisar también en navegador.
- Independencia adicional en el pie: **«No afiliado al Gobierno de la Provincia del Chaco.»** En la página Proyecto: **«Este proyecto no es un sitio del Gobierno de la Provincia del Chaco ni cuenta con su aval.»** El nombre del proyecto no constituye marca o aval gubernamental.
- Estado editorial: portada **«Sin importes ni registros publicados por este proyecto»** y **«La publicación de cifras permanece bloqueada.»** No mostrar cifras, filas, CSV ni derivados en esta versión.

## Fuentes, enlaces y atribución

El contenido describe dos recursos de una misma ejecución presupuestaria provincial acumulada de enero a diciembre de 2022, según los títulos de recursos. Los únicos destinos HTTP(S) absolutos identificados en el HTML del export son el [conjunto Ejecución Presupuestaria del portal de Datos Abiertos Chaco](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto) y el [repositorio público del proyecto](https://github.com/TobyG23/Chaco-Transparente); los enlaces internos llevan a las seis rutas editoriales. La página Fuentes indica que el portal de origen **etiqueta los recursos CC BY 4.0**, sin afirmar que se haya resuelto la atribución concreta, la titularidad o el permiso de redistribución. No se alojan originales, tablas ni cifras. Enlazar la fuente no implica aval oficial. El período descrito no es una serie mensual.

## Licencias y decisiones de derechos

La etiqueta **CC BY 4.0** atribuida a los recursos debe cotejarse con la versión/titular exactos y las condiciones de atribución antes de cualquier redistribución; no se traslada automáticamente a código ni textos del proyecto. **No hay licencia del código propio aprobada ni archivo LICENSE del proyecto**; `private: true` en paquetes no equivale a una licencia. Textos y diseño originales, contribuciones y avisos/licencias de dependencias transitivas requieren delimitación e inventario. No asignar al proyecto derechos sobre registros oficiales o materiales ajenos; consultar asesoramiento competente cuando corresponda. La previsualización editorial también debe recibir una decisión expresa sobre qué textos/diseño se autoriza a mostrar públicamente.

## Datos personales, proveedor y privacidad

El frontend editorial revisado no contiene formulario, cuenta, analítica propia ni almacenamiento deliberado de visitantes; no lee originales ni API oficial. El export debe inspeccionarse completo de nuevo tras cada build: búsquedas de patrones no certifican ausencia de secretos, identificadores inusuales o información ofuscada. Si se publicaran datos presupuestarios en otra misión, requerirían revisión de privacidad **fila por fila**, derechos y semántica por separado. Los visitantes sí harán solicitudes al host; Netlify/CDN puede tratar IP, URL, fecha/hora, agente de usuario y registros operativos, y sus cookies, métricas, retención, accesos y jurisdicción **no se han comprobado en esta cuenta ni en un sitio alojado**. Preparar y aprobar aviso real de privacidad/responsable/contacto conforme a la configuración efectiva; inspeccionar red y cookies tras un despliegue autorizado. Los enlaces externos son navegación elegida por la persona visitante, no recursos incrustados, pero los destinos tienen prácticas propias. `_headers` propone `Referrer-Policy: no-referrer`; sólo una respuesta HTTP real podrá confirmar su aplicación.

## Riesgos que debe aceptar el propietario antes de publicar

1. **Exposición inmediata:** producción, draft, alias, activos y permalink pueden ser accesibles a cualquiera sin sesión; no anunciar la URL y `noindex` no son controles de acceso. Un rollback o eliminación posterior no borra necesariamente caches, capturas, registros ni copias.
2. **Derechos/representación:** nombre, procedencia, CC BY 4.0 y avisos de independencia deben revisarse; ninguna licencia ni revisión legal se considera aprobada por este documento.
3. **Privacidad:** el proveedor puede registrar visitas; faltan titular/responsable, retención, jurisdicción, acceso a logs y aviso público aprobado. La CSP actual es **Report-Only**, no bloqueo exigible.
4. **Calidad y costos:** faltan pruebas reales de HTTP 404, cabeceras, navegación, lector de pantalla, zoom y red/cookies en el host. El saldo **400 créditos reportados** y la condición Free no se han comprobado en Netlify; la tabla genérica indica 300 créditos mensuales, 15 por deploy exitoso de producción, y consumo por tráfico/solicitudes. Un bot puede consumir créditos aun sin anunciar el sitio. Al agotarse pueden pausarse proyectos del equipo.

## Decisiones humanas, separadas y sin marcar

- [ ] Aprobar el **texto exacto** del aviso preliminar e independencia y comprobar cómo se ve en las seis rutas y 404.
- [ ] Aprobar alcance editorial, enlaces externos, procedencia/atribución, licencias y derechos de textos/diseño; definir si hacen falta avisos de dependencias.
- [ ] Identificar responsable/contacto, proveedor, plan real, logs, métricas/cookies, retención/jurisdicción y aviso de privacidad para visitantes públicos.
- [ ] Revisar manualmente **todos** los archivos del export fresco y su manifiesto SHA-256 externo, sin datos, secretos ni contenido no autorizado; conservar exactamente los bytes aprobados. Un nuevo build invalida ese manifiesto.
- [ ] Completar teclado, lector de pantalla, zoom real 200/400 %, contraste y otras puertas locales de `PREDEPLOY-CHECKLIST.md`; definir qué verificaciones sólo podrán hacerse después de publicar y cómo se detendrá o revertirá ante fallo.
- [ ] Confirmar en la cuenta el equipo `tobiasgarcia183-team`, nombre disponible `chaco-transparente-preview`, Free y saldo/ciclo/consumo reales; aprobar expresamente la exposición pública y costo posible.
- [ ] Dar autorizaciones **independientes** para crear el proyecto remoto y para subir/publicar el artefacto exacto. Un draft también sube bytes. Ninguna casilla marcada constituye por sí sola autorización para actuar.

**Veredicto de este paquete:** NO-GO para crear recursos o desplegar hasta recibir decisiones del propietario y autorizaciones específicas. Después de una eventual publicación autorizada, verificar desde fuera del host todas las URL reales, rutas, HTTP 404, HTTPS, cabeceras/CSP, activos, accesibilidad, red y créditos antes de difundir la URL. Mantener bloqueada toda publicación presupuestaria.
