# 1. Arquitectura de Martha

Martha es una aplicación web responsive para que un emprendedor de ecommerce (moda y fajas, Colombia) sepa **cuánto le cuesta realmente cada unidad**, cuánto ha invertido en cada producto y a qué precio debe vender.

## 1.1 Vista general

```
┌──────────────────────────── Navegador (móvil · tablet · escritorio) ────────────────────────────┐
│  Next.js App Router (React 19, TypeScript, Tailwind 4)                                          │
│                                                                                                 │
│   Páginas ─────────── Dashboard · Productos · Asistente “Nuevo producto” · Detalle de producto  │
│                       (Resumen, Costos, Variantes, Lotes, Simulador, Historial) · Lotes ·       │
│                       Simulador · Proveedores · Configuración · Acceso                          │
│        │                                                                                        │
│        ▼                                                                                        │
│   MarthaProvider (estado global + acciones)                                                     │
│        │                                                                                        │
│        ├── lib/calculos/  ← MOTOR DE CÁLCULO (funciones puras, sin I/O, con tests unitarios)   │
│        ├── lib/exportar/  ← PDF (jsPDF + autotable) y Excel (ExcelJS), generados en el cliente  │
│        │                                                                                        │
│        ▼                                                                                        │
│   Repositorio (interfaz)                                                                        │
│        ├── RepositorioDemo      → localStorage + datos semilla (sin credenciales)               │
│        └── RepositorioSupabase  → supabase-js (RLS aplica permisos por rol)                     │
└────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                             │ HTTPS (anon key + JWT del usuario)
┌────────────────────────────────────────────▼────────────────────────────────────────────────────┐
│ Supabase (proyecto compartido con otras apps)                                                   │
│   Auth (correo + contraseña)  ·  Postgres: schema `martha` + RLS  ·  Storage: buckets martha-*  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                             ▲
┌────────────────────────────────────────────┴────────────────────────────────────────────────────┐
│ Route Handlers de Next.js: /api/v1/*  (API REST para integraciones: Shopify, WooCommerce,       │
│ hojas de cálculo, software contable). Autenticación por Bearer JWT de Supabase; en modo demo    │
│ responden con los datos semilla.                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Decisiones clave

| Decisión | Motivo |
|---|---|
| **Motor de cálculo puro** (`src/lib/calculos`) | Todas las fórmulas viven en un solo lugar, sin dependencias de UI ni de base de datos. Se prueban con Vitest y se reutilizan en pantallas, simulador, exportaciones y API. |
| **Patrón Repositorio** con dos implementaciones | El modo demo funciona sin Supabase (localStorage + semilla). Al configurar las variables de entorno se usa Supabase sin cambiar las pantallas. |
| **Cálculos en el cliente** | Respuesta instantánea: la calculadora se actualiza mientras el usuario escribe un costo. |
| **RLS en Postgres** | La seguridad no depende del frontend: aunque alguien llame a la API directamente, solo ve los datos de su organización y solo un admin puede eliminar o cambiar configuración. |
| **TRM congelada por costo** (`tasa_cambio`) | Un costo en USD queda valorizado con la tasa del día en que se registró; el historial no cambia cuando la TRM se mueve. El simulador permite probar otra tasa. |
| **Valor estimado + valor real en cada costo** | Permite comparar presupuesto vs. factura por costo, lote, producto o proveedor y explicar la causa de la diferencia. |
| **Exportación en el cliente** | PDF y Excel se generan en el navegador: no requiere servidor adicional ni costos de cómputo. |

## 1.3 Aislamiento en un Supabase compartido

- Todo vive en el schema **`martha`** (tablas, enums, funciones `security definer` con `search_path` vacío, vista). Nada en `public`.
- Fuera de `martha` solo hay: 2 triggers en `auth.users` (`martha_on_auth_user_created`, `martha_on_auth_user_app_metadata`), 2 buckets (`martha-imagenes-productos`, `martha-comprobantes`) y 5 políticas `martha_*` en `storage.objects` limitadas a esos buckets.
- Los usuarios de Martha se reconocen por `app_metadata.app = 'martha'`; los demás usuarios de `auth.users` son ignorados por los triggers y rechazados por login, provider y API (no tienen perfil en `martha.perfiles`).
- Todos los clientes de supabase-js usan `{ db: { schema: 'martha' } }`; el schema debe estar en *Exposed schemas* de la Data API.
- `supabase/pruebas/verificar.py` comprueba este aislamiento en un Postgres embebido.

## 1.4 Autenticación, usuarios y roles

- **Supabase Auth solo con correo y contraseña.** Solo inicio de sesión: no hay recuperación de contraseña por cuenta propia; un administrador invita de nuevo o asigna una contraseña temporal. `/auth/actualizar-clave` se usa al aceptar una invitación.
- **No hay registro público.** En Supabase se desactiva *Allow new users to sign up*; la app no tiene página ni enlace de registro.
- **El primer admin y su organización** se crean con `npm run crear-admin` (o con `supabase/bootstrap_admin.sql`).
- **Los demás usuarios los crea un admin** desde la sección **Usuarios** (solo visible para admin): nombre, correo, rol y contraseña temporal *o* invitación por correo. También puede cambiar roles y desactivar/reactivar cuentas.
- Esas operaciones pasan por **rutas de servidor** (`/api/usuarios`, `/api/usuarios/[id]`) que usan `SUPABASE_SERVICE_ROLE_KEY` —variable solo de servidor, nunca expuesta al navegador— y **validan en el servidor** que quien llama es admin activo de esa organización (token Bearer → `auth.getUser` → tabla `perfiles`).
- `app: 'martha'`, `organizacion_id`, `rol` y `activo` se guardan en **`app_metadata`** (el usuario no puede editarlo, a diferencia de `user_metadata`). Un trigger (`sincronizar_perfil`) refleja esos valores en la tabla `perfiles`, que es la que usa la RLS.
- Desactivar un usuario: `activo = false` en `app_metadata` + `ban_duration` en Supabase Auth (no puede iniciar sesión ni refrescar su token) + la RLS le niega todo porque `mi_organizacion()` solo devuelve organizaciones de perfiles activos.

```
 Admin (navegador)                     Servidor Next.js                          Supabase
 ─────────────────                     ────────────────                          ────────
 POST /api/usuarios  ──Bearer JWT──▶  exigirAdmin():                             
   {nombre, correo,                     auth.getUser(token) ───────────────────▶ Auth
    rol, metodo}                        perfiles (service role) → ¿admin activo?  Postgres
                                        createUser / inviteUserByEmail
                                          app_metadata = {organizacion_id, rol} ─▶ Auth
                                                                                   └─ trigger → perfiles
```

Permisos (aplicados por RLS y por las rutas de servidor):

| Acción | Admin | Colaborador |
|---|:-:|:-:|
| Ver productos, costos, lotes, dashboard | ✅ | ✅ |
| Crear / editar productos, variantes, costos, lotes, escenarios | ✅ | ✅ |
| Eliminar registros | ✅ | ❌ |
| Proveedores, tasas de cambio, configuración de márgenes | ✅ | ❌ (solo lectura) |
| Sección Usuarios: crear, cambiar rol, desactivar | ✅ | ❌ (no la ve) |

## 1.5 Estructura del código

```
martha/
├── docs/                         ← este diseño
├── supabase/migrations/          ← SQL: tablas, relaciones, RLS, Storage
├── supabase/bootstrap_admin.sql  ← alternativa SQL para crear el primer admin
├── scripts/crear-admin.mjs       ← npm run crear-admin
├── src/
│   ├── app/                      ← rutas (App Router)
│   │   ├── page.tsx              ← Dashboard
│   │   ├── productos/            ← lista, nuevo (asistente), [id] (detalle)
│   │   ├── lotes/ simulador/ proveedores/ configuracion/
│   │   ├── usuarios/             ← gestión de usuarios (solo admin)
│   │   ├── acceso/               ← login (sin registro ni recuperación)
│   │   ├── auth/                 ← callback/confirm de correo y actualizar contraseña
│   │   └── api/                  ← usuarios (service role) y v1 (REST para integraciones)
│   ├── components/               ← UI reutilizable (tarjetas, semáforo, gráficos, formularios)
│   ├── lib/
│   │   ├── calculos/             ← motor de cálculo + tests
│   │   ├── datos/                ← repositorios (demo, supabase), semilla, provider
│   │   ├── exportar/             ← PDF y Excel
│   │   └── formato.ts            ← formato COP/multimoneda, porcentajes, fechas
│   └── tipos.ts                  ← modelo de dominio (TypeScript)
└── README.md                     ← instalación y despliegue
```

## 1.6 Integraciones (API v1)

| Endpoint | Descripción |
|---|---|
| `GET /api/v1/productos` | Lista de productos con costo unitario, landed cost, margen y precio sugerido. |
| `GET /api/v1/productos/{id}` | Detalle con desglose de costos, variantes y lotes. |
| `GET /api/v1/salud` | Estado del servicio y modo (demo / supabase). |

Con Supabase configurado, las llamadas requieren `Authorization: Bearer <access_token>` y respetan la RLS del usuario. Las respuestas en JSON sirven para sincronizar precios con Shopify/WooCommerce o alimentar hojas de cálculo y software contable.

## 1.7 Despliegue

- **Frontend + API**: Vercel (o cualquier hosting con Node 20+).
- **Datos**: proyecto de Supabase (región `sa-east-1` recomendada por latencia desde Colombia).
- Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (solo servidor). Sin las dos primeras, la app arranca en **modo demo**.

Ver `README.md` para el paso a paso.
