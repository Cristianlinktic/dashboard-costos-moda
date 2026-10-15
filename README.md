# Martha

Plataforma web para que un ecommerce de moda y fajas en Colombia sepa **cuánto le cuesta realmente cada unidad**, cuánto ha invertido en cada producto, cuál es su margen bruto y neto, y a qué precio debe vender.

- **Productos y variantes** (talla, color, material, presentación), versiones y duplicado.
- **Costos** directos e indirectos en COP, USD, EUR, CNY o MXN, con la tasa de cambio congelada al registrar.
- **Motor de cálculo**: costo unitario, landed cost, fijos asignados, costos de venta, margen bruto/neto, punto de equilibrio (por unidad y por lote), precio mínimo y sugerido (30/40/50 % o personalizado). Las fórmulas se ven en pantalla.
- **Lotes**: estimado vs. real, causa de cada diferencia, merma y ajuste con facturas reales.
- **Simulador** con 3 escenarios (precio, tasa, flete, proveedor, volumen, descuento, comisión, publicidad) y alertas.
- **Historial**: línea de tiempo, precios, inversiones, comparación entre versiones.
- **Dashboard** con filtros y **exportación PDF / Excel**.
- **Usuarios**: sin registro público; el admin crea cuentas (rol admin o colaborador), cambia roles y desactiva usuarios.
- **Modo demo** sin credenciales, con datos de ejemplo de fajas.

Diseño y decisiones en [`docs/`](docs):
[arquitectura](docs/01-arquitectura.md) · [modelo de datos](docs/02-modelo-de-datos.md) · [pantallas](docs/03-wireframes.md) · [flujo de registro](docs/04-flujo-registro-producto.md) · [sistema de diseño](docs/05-sistema-de-diseno.md).

Stack: Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Recharts · GSAP · Three.js · jsPDF · ExcelJS · Vitest.

**Sistema de diseño**: lilas y morados sobre neutros, banner satinado y el lenguaje de líneas y nodos del Manual de Marca LinkTIC. Tokens en `src/design/tokens.ts` → `npm run tokens` genera el CSS (temas día y noche) y `public/design-tokens.json` (formato W3C). La guía (tokens, tipografía, componentes y logos) está en el artifact «Martha» de Claude: https://claude.ai/artifact/Wfwzqmxyb8QbUVCecwf7Tp

---

## 1. Correr en local (modo demo)

Requisitos: Node.js 20 o superior (`npm run tokens` necesita Node 22.18+ o 24, que ejecutan TypeScript sin compilar).

```bash
cd martha
npm install
npm run dev          # http://localhost:3000
```

Sin variables de Supabase la app arranca en **modo demo**: no pide inicio de sesión, carga 5 productos de ejemplo (fajas nacionales e importadas, con márgenes verde/amarillo/rojo) y guarda tus cambios en el navegador (localStorage). En **Configuración** puedes restablecer los datos o ver la app como *colaborador*.

```bash
npm test             # motor de cálculo, semilla, dashboard, exportaciones y tokens (sincronía + contraste WCAG)
npm run tokens       # regenera src/design/tokens.css y public/design-tokens.json tras editar tokens.ts
npm run build        # compilación de producción
npm run typecheck
```

## 2. Configurar Supabase

Martha puede vivir en un proyecto de Supabase **compartido con otras aplicaciones**: todo lo suyo está en el schema `martha` y el SQL **no crea, modifica ni borra nada en `public`** ni en objetos de otras apps.

1. Usa tu proyecto existente o crea uno en [supabase.com](https://supabase.com) (región recomendada: `sa-east-1`, São Paulo).
2. **SQL Editor** → pega y ejecuta [`supabase/migrations/0001_esquema_inicial.sql`](supabase/migrations/0001_esquema_inicial.sql). Es idempotente (se puede volver a ejecutar).
   - Dentro del schema `martha`: tablas, enums, funciones, vista, triggers, RLS por rol, permisos y el catálogo de monedas.
   - Fuera de `martha` crea **solo**:

     | Objeto | Dónde | Para qué |
     |---|---|---|
     | `martha_on_auth_user_created` | trigger en `auth.users` | Crea el perfil de Martha al crear un usuario de Martha |
     | `martha_on_auth_user_app_metadata` | trigger en `auth.users` | Sincroniza rol/activo cuando cambia su `app_metadata` |
     | `martha-imagenes-productos` (público) y `martha-comprobantes` (privado) | buckets de Storage | Imágenes y facturas |
     | `martha_imagenes_leer`, `martha_imagenes_subir`, `martha_comprobantes_leer`, `martha_comprobantes_subir`, `martha_archivos_eliminar` | políticas en `storage.objects` | Solo aplican a esos dos buckets |

     Los triggers de `auth.users` ignoran a los usuarios de otras apps: solo actúan si `app_metadata.app = 'martha'`.
3. **Obligatorio — Project Settings → Data API → Exposed schemas**: agrega `martha` **sin quitar `public`** (ni los otros que ya tengas) y guarda. Sin esto la API responde «The schema must be one of the following…».
4. **Authentication → Sign In / Providers → Email**: deja habilitado *Email* (correo y contraseña).
5. **Authentication → Sign In / Providers**: **desactiva «Allow new users to sign up»**. Martha no tiene registro público; las cuentas solo se crean desde la app (admin) o con el script de arranque. *Si otra app del mismo proyecto necesita registro público, déjalo activo:* aun así nadie entra a Martha sin un perfil en `martha.perfiles`, que solo se crea con `app_metadata.app = 'martha'` (escribible únicamente con la service role).
6. **Authentication → URL Configuration**:
   - *Site URL*: la URL pública de la app (p. ej. `https://martha.vercel.app`).
   - *Redirect URLs*: agrega `https://TU-DOMINIO/auth/callback`, `https://TU-DOMINIO/auth/actualizar-clave` y, para desarrollo, `http://localhost:3000/**`.
7. **Authentication → Emails → Templates** (recomendado, funciona aunque el usuario abra el correo en otro navegador):
   ⚠ Las plantillas de correo son globales del proyecto: si otras apps las usan, coordina el cambio o déjalas por defecto (Martha también funciona con ellas).
   - *Invite user*: enlace `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/actualizar-clave`

   Con las plantillas por defecto también funciona: `/auth/actualizar-clave` y `/auth/callback` procesan los tokens del enlace.
8. Configura un SMTP propio en *Authentication → Emails → SMTP Settings* si vas a enviar invitaciones a todo el equipo (el SMTP de prueba de Supabase tiene un límite bajo de correos por hora).
9. Copia las variables en `.env.local`:

```bash
cp .env.example .env    # o .env.local; ambos están en .gitignore
```

```ini
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...            # Project Settings → API → anon public
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=eyJ...                 # Project Settings → API → service_role (SECRETA)
```

Todos los clientes de supabase-js (navegador, servidor, service role y `crear-admin`) se crean con `{ db: { schema: 'martha' } }` (ver `src/lib/supabase/`).

Si quieres tipos generados para el schema: `npx supabase gen types typescript --project-id <ref> --schema martha > src/lib/supabase/tipos-db.ts` (opcional; el dominio ya está tipado en `src/tipos.ts`).

**Verificar el SQL sin tocar tu proyecto** (Postgres embebido, opcional):

```bash
python3 -m venv .venv && .venv/bin/pip install pgserver
.venv/bin/python supabase/pruebas/verificar.py
```

Ejecuta la migración dos veces, lista los objetos creados fuera de `martha`, confirma que no desaparece nada previo y prueba triggers, RLS por rol/organización y Storage.

> `SUPABASE_SERVICE_ROLE_KEY` **solo se usa en el servidor** (`src/lib/supabase/servidor.ts`, marcado con `server-only`, y el script `crear-admin`). Nunca le pongas el prefijo `NEXT_PUBLIC_` ni la subas al repositorio.

## 3. Crear la organización y el primer administrador

```bash
npm run crear-admin -- --correo admin@tuempresa.com --clave 'Una-Clave-Segura-2026' \
                       --nombre "Martha Gómez" --empresa "Fajas Martha"
```

El script crea la organización, su configuración por defecto y el usuario admin (correo confirmado) con `app: 'martha'`, `organizacion_id`, `rol` y `activo` en **app_metadata**; el trigger `martha_on_auth_user_created` crea su perfil en `martha.perfiles`.

**Alternativa sin Node:** crea el usuario en *Authentication → Users → Add user* (marca *Auto Confirm User*) y ejecuta [`supabase/bootstrap_admin.sql`](supabase/bootstrap_admin.sql) reemplazando los valores marcados.

Luego entra a `/acceso` con ese correo y contraseña.

### Datos de prueba (opcional)

Carga en tu organización las mismas fajas del modo demo (proveedores, productos, variantes, lotes con estimado vs. real, costos en COP/USD/EUR, historial de precios y eventos):

```bash
npm run cargar-demo                     # si solo hay una organización
npm run cargar-demo -- --org <uuid>     # una organización específica
npm run cargar-demo -- --forzar         # aunque ya tenga productos
```

Los datos de prueba quedan en tu Supabase (schema `martha`). Para quitarlos sin tocar lo que hayas creado tú:

```bash
npm run borrar-demo                     # muestra qué se borraría (no borra nada)
npm run borrar-demo -- --confirmar      # borra productos de prueba (con sus variantes, lotes, costos e historial),
                                        # proveedores de prueba sin uso y tasas de cambio de prueba
```

También puedes borrar productos uno por uno desde la app (detalle del producto → papelera, solo administradores).

## 4. Gestionar usuarios

En **Usuarios** (solo visible y accesible para administradores):

| Acción | Cómo funciona |
|---|---|
| Crear con contraseña temporal | `POST /api/usuarios` → `auth.admin.createUser` con correo confirmado. Comparte la clave por un canal seguro. |
| Invitar por correo | `POST /api/usuarios` → `auth.admin.inviteUserByEmail`; la persona define su contraseña en `/auth/actualizar-clave`. |
| Cambiar rol | `PATCH /api/usuarios/{id}` → actualiza `app_metadata.rol`. |
| Asignar contraseña | `PATCH /api/usuarios/{id}` con `clave` → no hay recuperación por cuenta propia; el admin asigna una nueva. |
| Desactivar / reactivar | `PATCH /api/usuarios/{id}` → `app_metadata.activo` + `ban_duration` (no puede iniciar sesión; la RLS le niega todo). ⚠ El baneo es de la cuenta de Supabase Auth: si la misma persona usa otra app del proyecto con ese correo, también queda bloqueada allí. |

Cada ruta valida en el servidor que el token pertenece a un usuario con `app_metadata.app = 'martha'` y **perfil de admin activo de la misma organización** antes de usar la service role. Solo opera sobre usuarios de Martha de esa organización. Un admin no puede quitarse su propio rol ni desactivarse.

El login, el provider de la app y la API rechazan a cualquier usuario autenticado que no tenga perfil activo en `martha.perfiles` (por ejemplo, usuarios de otras apps del mismo proyecto).

Permisos por rol (RLS):

- **Administrador**: todo, incluido eliminar registros, proveedores, configuración, tasas de cambio y usuarios.
- **Colaborador**: ve todo y crea/edita productos, variantes, costos, lotes y escenarios; no elimina ni cambia configuración.

## 5. Desplegar en Vercel

1. Sube el proyecto a un repositorio Git (GitHub, GitLab o Bitbucket).
2. En [vercel.com](https://vercel.com) → *Add New → Project* → importa el repositorio. Si el repo contiene más cosas, define **Root Directory = `martha`**. Framework: Next.js (detectado automáticamente). Build: `npm run build`.
3. *Settings → Environment Variables* (Production y Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://tu-dominio`
   - `SUPABASE_SERVICE_ROLE_KEY` (marca *Sensitive*)
4. *Deploy*. Después actualiza en Supabase la *Site URL* y las *Redirect URLs* con el dominio final (paso 2.5).
5. Prueba: inicia sesión con el admin, crea un colaborador, registra un producto y exporta un PDF.

> Si quieres publicar **solo la demo**, despliega sin variables de entorno: la app queda en modo demo para cada visitante.

**Otros hostings:** cualquier servicio con Node 20+ (Render, Railway, Fly.io, un VPS):

```bash
npm ci && npm run build && npm start   # puerto 3000 (usa PORT para cambiarlo)
```

## 6. API para integraciones

| Endpoint | Descripción |
|---|---|
| `GET /api/v1/salud` | Estado y modo (`demo` / `supabase`). |
| `GET /api/v1/productos[?sku=…]` | Costo unitario, landed cost, márgenes, precios mínimo/sugerido/equilibrio e inversión por producto. |
| `GET /api/v1/productos/{id o sku}` | Detalle con desglose de costos, variantes y lotes. |

Con Supabase se autentica con `Authorization: Bearer <access_token>` de un usuario de la organización y respeta su RLS. Sirve para sincronizar precios con Shopify/WooCommerce, alimentar hojas de cálculo o un software contable. La vista SQL `martha.v_inversion_producto` expone la inversión por producto para conexiones directas a Postgres.

```bash
curl http://localhost:3000/api/v1/productos/FAJ-CLA-001
```

## 7. Estructura

```
martha/
├── docs/                       Arquitectura, modelo de datos, wireframes y flujos
├── scripts/crear-admin.mjs     Arranque: organización + primer admin
├── supabase/
│   ├── migrations/0001_esquema_inicial.sql   Todo en el schema martha
│   ├── bootstrap_admin.sql
│   └── pruebas/                              Verificación en Postgres embebido
└── src/
    ├── app/                    Rutas: dashboard, productos, lotes, simulador, proveedores,
    │                           usuarios, configuración, acceso, auth y api
    ├── design/                 Tokens (fuente única), generador CSS/JSON y tests de contraste
    ├── components/             UI (formularios, calculadora en vivo, gráficos, simulador…)
    │   ├── marca/              Logo, LineaNodo, Glifos, Banner, TelaSatin (Three.js)
    │   └── movimiento/         GSAP: Revelar, ContadorAnimado, useColoresTema
    ├── lib/
    │   ├── calculos/           Motor de cálculo puro + tests
    │   ├── datos/              Repositorios demo/Supabase, semilla, provider
    │   ├── exportar/           PDF y Excel + tests
    │   ├── supabase/           Clientes navegador y servidor (service role solo servidor)
    │   └── usuarios/           Tipos y validación de usuarios
    └── tipos.ts                Modelo de dominio
```

## 8. Supuestos y límites conocidos

- Los costos con `tipo = variable` asociados a lotes se dividen entre las unidades de esos lotes (reales si ya llegaron); los `fijo`/`único`/`recurrente` se reparten entre las unidades base del producto (estimadas o producidas, configurable por producto).
- Los porcentajes de comisión y pasarela se aplican sobre el precio efectivo (después de descuentos).
- La tasa de cambio queda congelada en cada costo; el simulador permite probar otra tasa sin modificar los datos.
- En modo demo las imágenes y comprobantes se guardan como data URL (máx. 1,5 MB) en el navegador.
