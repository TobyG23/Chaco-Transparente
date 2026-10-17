# Sistema visual

Identidad editorial original y no gubernamental: marca tipográfica `CT.`, sin escudos, banderas ni iconografía oficial. Tipografía de sistema Arial/Helvetica para cuerpo y Georgia/Times para titulares, sin descarga de fuentes. Tokens en `app/globals.css`: fondo `#f7f5ef`, papel `#fff`, tinta `#202b2b`, texto secundario `#475a55`, azul verdoso `#185d63`, oscuro `#273d3b`, acento/foco `#a9472d`, borde `#cbd3cf` y superficie suave `#e9eeea`. Tailwind v4 se incluye mediante PostCSS; las composiciones de esta versión usan clases CSS explícitas.

La composición utiliza una columna limitada a 1200 px, grillas que pasan a una columna en móvil y navegación que envuelve los enlaces para que los seis destinos sean visibles. Los puntos de ajuste principales son 1080 y 760 px; la anchura móvil deja 16 px laterales. Incluye enlace de salto, landmarks, jerarquía de títulos, `aria-current` para la ruta activa, foco visible y preferencia por movimiento reducido.

Objetivo de revisión: WCAG 2.2 AA, contraste de texto 4.5:1, componentes 3:1, teclado, zoom y 320 px. El código incorpora medidas orientadas a ello; **no se certifica conformidad** sin pruebas de navegador, lector de pantalla y contrastes calculados en todos los estados. Las vistas carecen deliberadamente de gráficos o cifras de demostración que puedan confundirse con datos oficiales.
