# Privacidad y derechos — decisiones pendientes

Estado: revisión técnica del frontend editorial, **no** análisis jurídico ni auditoría de tráfico de un host. No se ha elegido proveedor ni publicado el portal.

## Qué hace hoy el código

La exportación estática tiene seis rutas y JavaScript de navegación de Next. Las rutas y componentes propios revisados no contienen formularios, cuentas, analítica, píxeles de seguimiento, uso explícito de cookies, almacenamiento del navegador, lecturas de los CSV ni solicitudes programadas a una API. Los enlaces externos a [Datos Abiertos Chaco](https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto) y [GitHub](https://github.com/TobyG23/Chaco-Transparente) se activan al navegar; no son recursos incrustados en la interfaz. Se usan fuentes de sistema y CSS compilado localmente. Las páginas y activos necesariamente generan solicitudes al host, y Next podría precargar rutas. La desactivación de telemetría durante `web:verify` corresponde al **build local**, no prueba nada sobre el visitante. No afirmar «cero solicitudes externas» ni «cero datos personales» sin inspección de red del artefacto alojado.

El proveedor de hosting/CDN podría registrar dirección IP, URL solicitada, marca temporal, agente de usuario y otros metadatos; sus opciones de métricas, cookies, retención, acceso y jurisdicción requieren revisión de contrato y configuración reales. Redactar un aviso de privacidad proporcional a esas prácticas antes de abrir el sitio a visitas. Si se incorporan analítica, formularios o terceros, revisar nuevamente política, consentimiento y cabeceras; no se autoriza agregarlos en esta misión.

## Derechos y procedencia

El portal actual describe **metadatos** de dos recursos provinciales acumulados de 2022 y enlaza al conjunto oficial; no aloja ni redistribuye CSV, filas, importes o JSON derivados. Eso no implica permiso para publicarlos después. Los recursos aparecen etiquetados CC BY 4.0 en el portal; comprobar titular, versiones, atribución concreta, avisos y posible diferencia entre la etiqueta de recursos y cualquier texto general del portal antes de reutilizar contenido. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) contempla atribución, enlace a licencia e indicación de cambios según corresponda; no presumir que su aplicación concreta está resuelta ni que exige compartir adaptaciones bajo idéntica licencia. Revisar privacidad fila por fila, derechos y semántica `Q_*` antes de cualquier dato público. El proyecto no está afiliado ni avalado por el gobierno.

La licencia del **código propio** continúa pendiente (`LICENSE` no existe). Publicar código en GitHub no equivale por sí mismo a conceder una licencia general de reutilización; véase la [orientación de GitHub sobre licencias](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository). Las licencias transitivas y avisos de dependencias no han sido inventariados por completo. Consultar asesoramiento competente donde el alcance de derechos o la privacidad no puedan resolverse técnicamente.

## Borrador mínimo para una futura publicación — no aprobado

> Este portal editorial muestra información sobre fuentes y metodología; no ofrece cuentas ni formularios. En la versión de código revisada no incorporamos analítica, píxeles publicitarios ni almacenamiento deliberado en el navegador. Al visitar páginas y descargar activos, su navegador se comunica con el proveedor de alojamiento/CDN, que puede tratar dirección IP, URL, fecha/hora y datos técnicos en registros operativos. **Antes de publicar:** identificar responsable y contacto, proveedor, finalidades concretas, acceso, retención, jurisdicción y configuración real de métricas y cookies. Los enlaces al portal oficial y a GitHub se siguen por elección del visitante; esos destinos aplican sus propias prácticas y pueden recibir información del referente según la cabecera final. Si se añaden formularios, analítica o recursos de terceros, revisar este aviso previamente.

Es una propuesta técnica, no una política vigente ni una garantía de que el proveedor no coloque cookies. Revisar contrato y tráfico de red real antes de aprobar el texto. Separar logs operativos de prácticas del código cliente y no afirmar «cero datos personales».

La decisión de licencia tiene cuatro ámbitos independientes: **código propio** (sin `LICENSE`, `private: true` en paquetes no es licencia); **textos y diseño editorial originales** (definir alcance y contribuciones); **dependencias de terceros** (inventario de licencias y avisos transitivos, no atribuirlas al proyecto); **metadatos/recursos oficiales** (titularidad, versión, etiqueta CC BY 4.0, atribución concreta, derechos ajenos y privacidad por fila). Una licencia de software no debe cubrir automáticamente los recursos gubernamentales. [GitHub sobre licencias](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [Creative Commons sobre software](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Ningún ámbito se da por aprobado aquí.

## Decisiones del propietario

1. Seleccionar proveedor, jurisdicción, retención/acceso a logs, métricas y cookies; aprobar un aviso de privacidad basado en su configuración y la captura de tráfico final.
2. Resolver licencia del código propio, contribuciones y avisos de dependencias.
3. Confirmar versión exacta, titularidad, derechos y atribución de ambos recursos oficiales, y la diferencia entre metadatos editoriales y una eventual redistribución; mantener la revisión legal y de privacidad por fila como puerta separada para cifras.
4. Decidir si la interfaz futura debe mostrar UUID/huellas exactos de las fuentes y cómo archivará actualizaciones; hoy la página Fuentes enlaza al conjunto general.

Fuentes técnicas: `packages/web/app/layout.tsx`, `packages/web/src/content.ts`, `packages/web/src/components/site-header.tsx`, `PROVENANCE.md`, `CONTENT-STATUS.md` y [guía de exportación estática de Next](https://nextjs.org/docs/app/guides/static-exports). Ninguna conclusión de este documento constituye permiso de despliegue o republicación.
