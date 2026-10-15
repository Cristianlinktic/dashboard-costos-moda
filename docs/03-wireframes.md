# 3. Pantallas principales (wireframes)

Principios: tarjetas con la cifra clave arriba, explicación corta debajo; tablas solo donde se compara; semáforo
**verde** (margen saludable) · **amarillo** (por debajo del mínimo) · **rojo** (pérdida). En móvil la navegación lateral
pasa a una barra inferior y las tablas se convierten en tarjetas apiladas.

## 3.1 Dashboard

```
┌ Martha ──────────────┬──────────────────────────────────────────────────────────────────────────┐
│ ▣ Dashboard          │ Dashboard                                     [Exportar PDF] [Excel]     │
│ ▢ Productos          │ Filtros: [Producto ▾] [Proveedor ▾] [Lote ▾] [Categoría ▾] [Desde][Hasta]│
│ ▢ Lotes              ├──────────────┬──────────────┬──────────────┬─────────────────────────────┤
│ ▢ Simulador          │ Inversión    │ Costo prom.  │ Mejor margen │ Peor margen                 │
│ ▢ Proveedores        │ $ 98,4 M     │ $ 61.250/u   │ 🟢 43 % Faja │ 🔴 −6 % Short levantacola   │
│ ▢ Configuración      │ total acum.  │ por unidad   │ clásica      │                             │
│                      ├──────────────┴──────────────┼──────────────┴─────────────────────────────┤
│ ── modo demo ──      │ Costos por categoría (barras)│ Evolución mensual (inversión + costo/u)    │
│                      │ Materia prima ████████ 38 %  │   ╱╲      ╱                                │
│                      │ Mano de obra  █████ 22 %     │  ╱  ╲____╱                                 │
│                      │ Flete         ███ 11 %       │ ene feb mar abr may jun jul ago sep oct    │
│                      ├──────────────────────────────┼────────────────────────────────────────────┤
│                      │ Estimado vs. real por lote   │ ⚠ Productos con margen bajo o pérdida      │
│                      │ L-IMP-01  ██ est ███ real +9%│ 🔴 Short levantacola  −6 %  [Ver]          │
│                      │ L-FC-01   ██ est ██ real  +2%│ 🟡 Chaleco látex      18 %  [Simular]      │
│                      ├──────────────────────────────┴────────────────────────────────────────────┤
│                      │ Productos más costosos (tabla: producto · costo/u · precio · margen · inv.)│
└──────────────────────┴───────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Lista de productos

```
Productos                                   [Buscar…]  [Categoría ▾] [Estado ▾]   [+ Nuevo producto]
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▢ img  Faja colombiana clásica  FAJ-CLA-001  Fajas  · Activo     Costo/u $51.700              │
│        Precio $189.000   Margen neto 🟢 43 %   Invertido $28,4 M   [Ver] [Duplicar]           │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ ▢ img  Body shaper sin costuras  BOD-SEA-002 Fajas  · Activo    Costo/u $78.900  (USD)        │
│        Precio $159.000   Margen neto 🟡 21 %   Invertido $41,2 M   [Ver] [Duplicar]           │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3.3 Asistente «Nuevo producto» (paso a paso + calculadora en vivo)

```
 ① Datos ─── ② Variantes ─── ③ Costos ─── ④ Precio ─── ⑤ Resumen
┌──────────────────────────────────────────────────────────┬──────────────────────────────────┐
│ ③ Costos                                                 │ CALCULADORA EN VIVO              │
│ [+ Plantilla faja nacional] [+ Plantilla importación]    │ Costo directo/u     $ 45.500     │
│                                                          │ Logística e import. $  1.200     │
│ Categoría [Materia prima ▾]  Nombre [Tela powernet    ]  │ Landed cost         $ 46.700     │
│ Tipo [Variable ▾]  Moneda [COP ▾]  Modo (•)Total ( )Unit.│ Fijos asignados/u   $  5.000     │
│ Valor [11.000.000]  Unidades del lote [500]              │ ───────────────────────────────  │
│ Fecha [2026-02-10]  Responsable [Textiles Medellín]      │ Costo total/u       $ 51.700     │
│ Estado [Estimado ▾]                                      │ Inversión total     $ 28,4 M     │
│ ℹ Este costo aumenta tu costo unitario en $ 22.000.      │                                  │
│                                           [Agregar]      │ Precio mínimo (25%) $ 132.846    │
│ ┌ Costos agregados ─────────────────────────────────────┐│ Precio sugerido(40%)$ 175.699    │
│ │ Tela powernet        variable  $11.000.000  $22.000/u ││                                  │
│ │ Confección           variable  $ 7.500.000  $15.000/u ││                                  │
│ └───────────────────────────────────────────────────────┘│                                  │
│                                   [← Atrás] [Siguiente →]│                                  │
└──────────────────────────────────────────────────────────┴──────────────────────────────────┘
```
En móvil la calculadora queda fija abajo como barra colapsable («Costo/u $51.700 ▲»).

## 3.4 Detalle de producto

```
Faja colombiana clásica · FAJ-CLA-001 · v1 · 🟢 Activo        [Duplicar como versión] [PDF] [Excel]
[Resumen] [Costos] [Variantes] [Lotes] [Simulador] [Historial]
┌───────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
│ Costo total/u │ Landed cost   │ Margen bruto  │ Margen neto   │ Invertido     │
│ $ 51.700      │ $ 46.700      │ 72,6 %        │ 🟢 43,3 %     │ $ 28,4 M      │
└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
Desglose por unidad (barra apilada: producto · llegada · indirectos · venta · utilidad)
Fórmulas visibles:
  Margen neto = (189.000 − 51.700 − 55.515) / 189.000 = 43,3 %
Precios: mínimo $… · sugerido 30 % $… · 40 % $… · 50 % $… · equilibrio $…
Costos que más afectan tu rentabilidad: 1. Tela $22.000/u (42 %) 2. Confección …
```

## 3.5 Lotes (estimado vs. real)

```
Lote L-IMP-01 · Importación · Recibido · 300 u. est. / 288 u. reales
┌─────────────────────┬─────────────┬─────────────┬───────────┬──────────────────────┐
│ Costo               │ Estimado    │ Real        │ Diferencia│ Causa                │
│ Prenda FOB (USD)    │ $ 23,4 M    │ $ 23,4 M    │  0 %      │                      │
│ Flete marítimo      │ $  2,6 M    │ $  3,2 M    │ 🔴 +23 %  │ Flete ▾              │
│ Aranceles + IVA     │ $  6,9 M    │ $  7,4 M    │ 🟡 +7 %   │ Impuestos ▾          │
├─────────────────────┼─────────────┼─────────────┼───────────┼──────────────────────┤
│ Costo unitario      │ $ 112.000   │ $ 122.300   │ +9,2 %    │ merma 12 u.          │
└─────────────────────┴─────────────┴─────────────┴───────────┴──────────────────────┘
[Registrar factura real] → abre el costo, captura valor real, estado «ajustado» y causa.
```

## 3.6 Simulador (3 escenarios)

```
Producto [Body shaper sin costuras ▾]                                  Margen mínimo 25 %
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Escenario A (actual) │ Escenario B          │ Escenario C          │
│ Precio      159.000  │ Precio      169.000  │ Precio      159.000  │
│ TRM USD       4.000  │ TRM USD       4.300  │ TRM USD       4.000  │
│ Flete          +0 %  │ Flete         +20 %  │ Flete         −10 %  │
│ Proveedor      +0 %  │ Proveedor      +0 %  │ Proveedor      −8 %  │
│ Volumen       300 u. │ Volumen       300 u. │ Volumen     1.000 u. │
│ Descuento       0 %  │ Descuento      10 %  │ Descuento       0 %  │
│ Comisión       10 %  │ Comisión       10 %  │ Comisión       15 %  │
│ Publicidad   20.000  │ Publicidad   20.000  │ Publicidad   15.000  │
│ ──────────────────── │ ──────────────────── │ ──────────────────── │
│ Costo/u      78.900  │ Costo/u      84.100  │ Costo/u      70.400  │
│ Margen neto  🟡 21 % │ Margen neto  🔴 −2 % │ Margen neto  🟢 29 % │
│ Utilidad/u   33.400  │ Utilidad/u   −3.000  │ Utilidad/u   46.100  │
│ Equilibrio   …u.     │ ⚠ Bajo el mínimo     │ Precio p/ 40 % …     │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

## 3.7 Historial

```
● 2026-01-12  Creación del producto (v1)
● 2026-01-20  Muestra 1 — $ 850.000 (desarrollo)
● 2026-02-10  Compra lote L-FC-01 — 500 u.
● 2026-03-01  Lanzamiento — precio $ 179.000
● 2026-06-15  Cambio de precio $ 179.000 → $ 189.000
● 2026-08-02  Nueva versión v2 (tela mejorada)  [Comparar v1 vs v2]
```

## 3.8 Acceso (sin registro público)

```
┌───────────── Martha ─────────────┐
│ Iniciar sesión                   │
│ Correo      [                  ] │
│ Contraseña  [                  ] │
│ [           Ingresar           ] │
└──────────────────────────────────┘
```
Sin «Olvidé mi contraseña»: si alguien la olvida, un administrador le asigna otra desde Usuarios.
No existe «Crear cuenta»: las cuentas las crea un administrador.

## 3.9 Usuarios (solo administradores)

```
Usuarios                                                        [+ Nuevo usuario]
┌──────────────────────────────┬────────────────┬──────────────────────┬──────────────┬──────────────┐
│ Usuario                      │ Rol            │ Estado               │ Último acceso│              │
│ Martha Gómez (tú)            │ Administrador  │ 🟢 Activo            │ 15 oct 2026  │              │
│ Laura Restrepo               │ [Colaborador ▾]│ 🟢 Activo            │ 10 oct 2026  │ [Desactivar] │
│ Andrés Pérez                 │ [Colaborador ▾]│ 🟢 Activo            │ Nunca        │ [Desactivar] │
│ Camila Ruiz                  │ [Colaborador ▾]│ 🔴 Desactivado       │ 02 jul 2026  │ [Reactivar]  │
└──────────────────────────────┴────────────────┴──────────────────────┴──────────────┴──────────────┘

Modal «Nuevo usuario»: Nombre · Correo · Rol (Administrador/Colaborador)
  Contraseña temporal [__________]  (mín. 8 caracteres)
```
El admin no puede quitarse su propio rol ni desactivarse (se valida también en el servidor).
