# 5. Sistema de diseño

> **Versión 2 · «Satín».** La interfaz pasó del azul del manual a **lilas y morados**: banners en satín (ciruela → lila → malva) como firma, neutros con tinte violeta (bruma), componentes con volumen (degradado sutil, brillo interno, sombra lila) y filtros en chips. Las escalas del manual LinkTIC siguen en `tokens.ts` como referencia y los tests verifican sus valores, pero ya no pintan la interfaz. El lenguaje de líneas, nodos, glifos y palabra clave en serif se mantiene.

## 5.0e Ajustes v2.4 · tela de satín y login

- La red de nodos y las líneas diagonales se reemplazaron por **`TelaSatin`**: un shader de Three.js con pliegues de tela que ondulan, brillo satinado en las crestas y una leve deformación hacia el cursor. Se renderiza a 0,75× de resolución, se pausa fuera de pantalla y queda quieta con «reducir movimiento». Paleta por tema.
- **Login a pantalla completa** con la tela de fondo y una tarjeta con borde degradado lila → malva, franja superior, campos con ícono (44 px), mostrar/ocultar contraseña, botón con estado de carga y errores anunciados (`role="alert"`). Componentes `CampoAcceso` y `BotonAcceso`, usados también en recuperar y definir contraseña.

## 5.0d Ajustes v2.3 · sin punteados y fondo más neutro

- Se quitaron todos los bordes punteados (costura del banner, avatares, chips vacíos, separadores).
- Tema oscuro: fondo grafito `noche.900` (#18181D) en lugar de casi negro; tarjetas un escalón más claras (`noche.850/820`); aurora casi imperceptible; banner en grafito con un solo brillo lila en la esquina (`profundoOscuro`).
- Tema claro: aurora y malla más tenues; el fondo es casi blanco con un toque lila.

## 5.0c Ajustes v2.2 · todas las pantallas iguales

- **Tipografía**: Bricolage Grotesque (títulos y cifras) + Plus Jakarta Sans (interfaz, cifras tabulares) + Instrument Serif itálica (palabra clave). Reemplazan a Sora y Manrope.
- **`Encabezado` = banner satinado** en todas las páginas, con `datos` (cifras animadas), `previo` (p. ej. «← Productos») y acciones. Dentro del banner los botones se adaptan solos: primario blanco, secundario/peligro de vidrio.
- **Botón secundario con color** (tinte lila, texto lila) en lugar de blanco.
- **`TablaDatos`** (`components/TablaDatos.tsx`): una sola tabla para todo (proveedores, usuarios, productos, costos, variantes, lotes, tasas). Cabecera con ícono y conteo, orden por columna con `aria-sort`, filas con acento y, por debajo de `md`, tarjetas apiladas con etiqueta: valor y acciones al pie.
- **Filtros en chips con buscador** en Productos, Lotes, Proveedores, Usuarios y Costos del producto.
- **Mismo ancho** en todas las pantallas (se quitaron los `max-w` propios de Configuración y Usuarios) y retícula de KPIs unificada (`gap-4`, 2 → 4 columnas).
- **Responsive** verificado a 390 px: banners apilados, chips que se acomodan, pestañas con scroll horizontal sin barra, tablas como tarjetas.

## 5.0b Ajustes v2.1 · «más vida»

| Cambio | Implementación |
|---|---|
| Fondo vivo en ambos temas | `FondoAurora` (Shell): tres manchas lila / malva / durazno que derivan (CSS, 26–38 s) + malla de puntos tipo powernet. Tokens `--mt-aurora1..3`, `--mt-malla` por tema. |
| Tarjetas de vidrio | `tarjeta` con superficie translúcida + `backdrop-filter`: la aurora tiñe cada tarjeta. |
| Reflejo que sigue al cursor | `tarjeta-luz` (gráficos, tablas, paneles) y `tarjeta-viva` (KPIs, listas; además se eleva). Un solo listener en Shell fija `--mx/--my`. Borde degradado lila → malva al pasar el mouse. |
| Botones | Primario con destello que lo cruza e ícono que se desplaza; secundario se eleva. |
| Tablas | Cabecera tintada, filas alternas, barra de acento lila en la fila activa y entrada en cascada. |
| Filtros | `BarraFiltros` de vidrio, fija arriba al hacer scroll (sombra al «flotar»); contador con rebote. |
| Sidebar | Panel flotante de vidrio, navegación agrupada (Análisis / Operación / Organización), píldora satinada que se desliza y acceso rápido «Nuevo producto» en satín. |
| Dashboard en mosaico | KPIs con minigráfica o medidor de margen, evolución + anillo «Salud del catálogo», alertas con medidor hacia el mínimo y precio sugerido, ranking visual de costo por unidad. |

Todo respeta «reducir movimiento»: la aurora queda quieta (regla CSS global) y GSAP no anima.

## 5.0 Dirección v2

| Decisión | Por qué |
|---|---|
| **Satín lila/morado** en banners (`--mt-gradiente-profundo`: malla de brillos malva y lila sobre ciruela) | Martha es para una marca de fajas: la referencia es la tela (satín, powernet), no la tecnología. |
| **Brillo que recorre la tela** (GSAP) y glows que respiran | El satín «se mueve» sin distraer; se desactiva con reducir movimiento. |
| **Bruma** (neutros violeta) en lugar de grafito | Superficies y textos armonizan con el lila; nada se ve azulado. |
| **Volumen**: `tarjeta` con `--mt-gradiente-superficie` + `--mt-sombra-realce` + sombra ciruela; `tarjeta-viva` se eleva al pasar el cursor | Pedido explícito: «está todo muy plano». |
| **Encabezados como `banda`**: lila muy suave + brillo malva + glifos tenues | Cada página tiene presencia sin competir con el banner. |
| **Filtros en chips** (`components/Filtros.tsx`): vacíos con borde punteado, activos con degradado lila y ×, menú propio con búsqueda y check, periodo con atajos, contador y «Limpiar» | Más claros y agradables que selects nativos; se ve qué está filtrado. |
| **Pestañas tipo segmento** con píldora deslizante | Coherentes con los chips. |
| **Productos en tarjetas** con barra de margen frente al objetivo (alternable con tabla) | El margen se lee de un vistazo. |

El sistema visual de Martha se deriva del **Manual de Marca LinkTIC v3 (agosto 2026)**. La guía viva está en la app, en **`/sistema-diseno`**.

> El manual indica que toda aplicación creativa de la marca LinkTIC debe aprobarla el equipo de diseño. Martha **no usa el logotipo ni el pájaro de LinkTIC**: toma la paleta, la tipografía y el lenguaje gráfico, y tiene su propio isotipo. Si Martha se presenta como producto LinkTIC, valida el resultado con ese equipo.

## 5.1 Qué se tomó del manual

| Del manual | En Martha |
|---|---|
| Azul Premium `#2709CD` (primario) | v1: acción principal. **v2: reemplazado por Lila `#7A43E3`** (se conserva en `premium`) |
| Azul Light / Azul LinkTIC `#0094FF` | Acento informativo, serie de datos 2, gradientes (`azul.500`) |
| Cian LinkTIC `#00D9FF` | Nodos, detalles sobre fondos oscuros, foco en tema oscuro (`cian.400`) |
| Negro Grafito `#1E232F` | Texto principal; superficie del tema oscuro (`grafito.900`) |
| Gris Azul `#516276` | Títulos y texto secundario (`grisAzul.600/700`) |
| Gris Tech `#E1E1E1` | Bordes y divisores (`grafito.200`) |
| Verdes del isologo `#1DCE00` / `#008800` | Semáforo «saludable» (`verde`) |
| Degradado del isologo | `--mt-gradiente-marca`: Premium → Light → Cian |
| Biko (logotipo) | **Bricolage Grotesque** (display: títulos y cifras; v2.2) |
| Blauer Nue Semibold (primaria) | **Plus Jakarta Sans** (interfaz; v2.2) |
| The Foriene serif italic (palabras clave) | **Instrument Serif itálica**: una palabra clave por título («Tu rentabilidad *hoy*») |
| Títulos con línea que termina en un punto | Componente `LineaNodo` bajo cada título |
| Sistema gráfico de la «K»: líneas, vértices, nodos | Isotipo «M» (dos astas + diagonales que se encuentran en un nodo), `LineaNodo`, glifos |
| Glifos geométricos (elementos de diagramación) | `Glifo` / `MosaicoGlifos` en estados vacíos, acceso y guía |
| Páginas claras con planos de luz diagonales | `--mt-fondo-planos` en el fondo de la app |
| Conexión + evolución + transformación | Principios del sistema de movimiento (ver 5.4) |

Lo que **no** está en el manual y se agregó: escalas 50–950 por color, **ámbar** y **rojo** para el semáforo, tema oscuro, tokens de movimiento y la paleta de datos.

Las fuentes del manual son licenciadas, así que se usan alternativas libres autoalojadas con `@fontsource` (sin CDN ni servicios externos). Si consigues las licencias, coloca los `.woff2` en `public/fonts`, decláralos con `@font-face` y cambia `tipografia.familias` en `tokens.ts`.

## 5.2 Tokens

```
src/design/tokens.ts      ← FUENTE ÚNICA (TypeScript, sin dependencias)
        │  npm run tokens
        ├──▶ src/design/tokens.css        variables --mt-* (tema claro, oscuro, reducir movimiento)
        └──▶ public/design-tokens.json    formato W3C Design Tokens (Figma Tokens / Style Dictionary)
src/app/globals.css       ← @theme inline: tokens → utilidades Tailwind (bg-marca, text-titulo, shadow-brillo…)
```

- **Primitivos**: `escalas.{premium, azul, cian, grafito, grisAzul, verde, ambar, rojo}` → `--mt-premium-600`.
- **Semánticos** (lo que usa la interfaz, cambian con el tema): `fondo`, `superficie`, `superficie-alta`, `hundido`, `linea`, `linea-fuerte`, `tinta`, `titulo`, `tinta-suave`, `tinta-tenue`, `marca`, `marca-oscuro`, `marca-suave`, `marca-contraste`, `acento`, `cian`, `foco`, `verde(-suave)`, `amarillo(-suave)`, `rojo(-suave)`, `datos-1…6`, `datos-rejilla` → `--mt-color-*` y clases `bg-*/text-*/border-*`.
- **Tipografía**: familias, escala `2xs … display` (tamaño, interlineado, tracking), pesos.
- **Espacio** (base 4 px), **radios** (`xs … 2xl`, `completo`), **sombras** por tema (incluye `brillo` Azul Premium), **movimiento** (duraciones, curvas CSS y sus equivalentes GSAP, escalonado), **capas** (z-index), **layout** y **gradientes**.

Reglas:

1. Los componentes solo usan tokens semánticos. Los hex viven únicamente en `tokens.ts` (los documentos PDF/Excel leen `escalas` porque no entienden variables CSS).
2. Para cambiar un color: edita `tokens.ts` → `npm run tokens` → `npm test`.
3. `src/design/tokens.test.ts` falla si los archivos generados no están sincronizados, si se altera un color exacto del manual o si un par texto/fondo no cumple contraste WCAG (4,5:1 texto, 7:1 texto principal, 3:1 metadatos) en **ambos** temas.
4. Gráficos y Three.js obtienen los colores resueltos con `useColoresTema()`, que se actualiza al cambiar de tema.

## 5.3 Temas

- `data-tema="claro" | "oscuro"` en `<html>`. Un script en `layout.tsx` lo aplica antes del primer pintado (sin parpadeo). **Claro por defecto**; oscuro solo si la persona lo eligió.
- `SelectorTema` (barra lateral y acceso): día / noche. Con la View Transitions API el cambio se revela en círculo desde el botón.
- En oscuro la acción principal pasa a `premium.300` con texto `premium.950` para mantener contraste AA.

## 5.4 Movimiento

| Principio | Implementación |
|---|---|
| **Evolución** (las cosas crecen) | `Revelar`: títulos y tarjetas suben y aparecen en secuencia al entrar a cada página. `ContadorAnimado`: los KPI cuentan hasta su valor. `BarraDesglose` crece por segmentos. |
| **Conexión** (líneas y nodos) | `LineaNodo` se dibuja de izquierda a derecha y el nodo aparece al final. Indicadores de navegación y pestañas se deslizan y terminan en un nodo. `TelaSatin` (Three.js, shader): pliegues de satín lila que ondulan en los banners y se curvan hacia el cursor (reemplaza la red de nodos de v1–v2). |
| **Transformación** (cambio de estado) | `MosaicoGlifos` rota glifos en cuartos de vuelta. Cambio de tema circular. Barra de progreso del asistente hacia el nodo final. Pulso en el semáforo rojo. |

- **GSAP** (`gsap` + `@gsap/react`) para coreografías de UI. Las curvas viven en tokens (`movimiento.gsap`).
- **Three.js** se carga bajo demanda (`import("three")`) solo donde hay un panel de marca. Usa shaders propios para nodos y líneas con transparencia, `devicePixelRatio` hasta 2, se pausa fuera de pantalla o con la pestaña oculta y libera la GPU al desmontarse. Sin WebGL, el panel se ve igual sin la red.
- **Reducir movimiento**: todas las duraciones pasan a 0 (tokens + regla CSS global), GSAP no anima y la red se dibuja una sola vez, estática.

## 5.5 Componentes y patrones

| Componente | Archivo | Notas |
|---|---|---|
| `Encabezado` | `components/ui.tsx` | `titulo` + `acento` (serif itálica) + `LineaNodo` + descripción + acciones |
| `Kpi` | `components/ui.tsx` | Con `numero` + `formato` cuenta animado; línea de gradiente al pasar el cursor |
| `BadgeMargen` | `components/ui.tsx` | Semáforo verde/amarillo/rojo/gris; el rojo pulsa |
| `Pestanas`, `Modal`, `Aviso`, `Etiqueta`, `Vacio`, `Campo` | `components/ui.tsx` | Solo tokens |
| Utilidades | `globals.css` | `tarjeta`, `btn-primario/secundario/fantasma/peligro`, `campo`, `etiqueta`, `acento-serif`, `texto-gradiente`, `fondo-marca`, `num` |
| `LogoMartha`, `IsotipoMartha` | `components/marca/LogoMartha.tsx` | Trazo animado; versión blanca sobre fondos de marca |
| `LineaNodo`, `Glifo`, `MosaicoGlifos`, `TelaSatin`, `Banner` | `components/marca/` | Sistema gráfico |
| `Revelar`, `ContadorAnimado`, `useColoresTema` | `components/movimiento/` | Movimiento y puente de colores |

Uso de los paneles de marca (`fondo-marca`): uno por pantalla como máximo (cabecera del dashboard, panel de acceso, portada de la guía). El resto de la interfaz es neutra con acentos de marca, como pide el manual: «paleta cromática neutra con acentos de color de marca».
