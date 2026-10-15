-- =============================================================================
-- Martha · Esquema inicial (Supabase / PostgreSQL 15+)
--
-- AISLAMIENTO: esta base de datos es compartida con otras aplicaciones.
--   · Todo lo de Martha vive en el schema `martha` (tablas, tipos, funciones, vista).
--   · No crea, altera ni borra nada en `public` ni en objetos de otras apps.
--   · Únicos objetos fuera de `martha`:
--       - 2 triggers en auth.users: martha_on_auth_user_created, martha_on_auth_user_app_metadata
--         (salen sin hacer nada si el usuario no es de Martha: app_metadata.app <> 'martha').
--       - 2 buckets de Storage: martha-imagenes-productos, martha-comprobantes.
--       - 5 políticas en storage.objects con prefijo martha_ que solo aplican a esos buckets.
--   · Idempotente: se puede ejecutar más de una vez. Los DROP ... IF EXISTS solo
--     afectan objetos con nombres de Martha.
--
-- Sin registro público: los usuarios los crea un admin desde la app (ruta de
-- servidor con service role). app, organizacion_id, rol y activo viven en
-- auth.users.raw_app_meta_data (app_metadata), que el usuario NO puede editar.
--
-- Ejecutar en Supabase → SQL Editor. Después: Project Settings → Data API →
-- Exposed schemas → agregar `martha` (sin quitar `public`).
-- =============================================================================

create schema if not exists martha;

-- -----------------------------------------------------------------------------
-- Tipos enumerados (create type no admite IF NOT EXISTS)
-- -----------------------------------------------------------------------------
do $$ begin create type martha.rol_usuario      as enum ('admin', 'colaborador'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.estado_producto  as enum ('borrador', 'desarrollo', 'activo', 'pausado', 'descontinuado'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.tipo_costo       as enum ('fijo', 'variable', 'unico', 'recurrente'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.modo_valor       as enum ('total', 'unitario'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.estado_costo     as enum ('estimado', 'pendiente', 'pagado', 'ajustado'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.tipo_lote        as enum ('produccion', 'compra', 'importacion'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.estado_lote      as enum ('planeado', 'en_produccion', 'en_transito', 'recibido', 'cerrado'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.base_asignacion  as enum ('estimadas', 'producidas'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.causa_diferencia as enum ('flete', 'impuestos', 'cambio_proveedor', 'merma', 'reproceso', 'tasa_cambio', 'otro'); exception when duplicate_object then null; end $$;
do $$ begin create type martha.categoria_costo  as enum (
  'materia_prima', 'mano_obra', 'desarrollo', 'empaque', 'etiquetas', 'creativo',
  'flete', 'seguro', 'aduana', 'agente_aduanas', 'almacenamiento', 'comisiones_venta', 'otro'
); exception when duplicate_object then null; end $$;
do $$ begin create type martha.tipo_evento as enum (
  'creacion', 'muestra', 'ajuste_costo', 'compra', 'importacion', 'lanzamiento',
  'cambio_precio', 'version', 'nota'
); exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Organización y usuarios
-- -----------------------------------------------------------------------------
create table if not exists martha.organizaciones (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  creado_en   timestamptz not null default now()
);

-- Espejo de auth.users.app_metadata para usuarios de Martha (lo mantiene el
-- trigger martha.sincronizar_perfil). rol y activo definen permisos (ver RLS).
create table if not exists martha.perfiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  organizacion_id  uuid not null references martha.organizaciones(id) on delete cascade,
  nombre           text,
  correo           text,
  rol              martha.rol_usuario not null default 'colaborador',
  activo           boolean not null default true,
  creado_en        timestamptz not null default now()
);
create index if not exists perfiles_organizacion_idx on martha.perfiles (organizacion_id);

-- -----------------------------------------------------------------------------
-- Funciones auxiliares para RLS (security definer + search_path vacío)
-- Un usuario desactivado no pertenece a ninguna organización → la RLS le niega todo.
-- -----------------------------------------------------------------------------
create or replace function martha.mi_organizacion()
returns uuid language sql stable security definer set search_path = '' as $$
  select p.organizacion_id from martha.perfiles p where p.id = auth.uid() and p.activo
$$;

create or replace function martha.es_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from martha.perfiles p where p.id = auth.uid() and p.rol = 'admin' and p.activo)
$$;

-- -----------------------------------------------------------------------------
-- Configuración y monedas
-- -----------------------------------------------------------------------------
create table if not exists martha.configuraciones (
  organizacion_id          uuid primary key references martha.organizaciones(id) on delete cascade,
  moneda_base              text not null default 'COP',
  margen_minimo            numeric(6,4) not null default 0.25,
  margen_objetivo          numeric(6,4) not null default 0.40,
  comision_canal_pct       numeric(6,4) not null default 0.10,
  pasarela_pct             numeric(6,4) not null default 0.035,
  publicidad_unidad        numeric(14,2) not null default 0,
  envio_cliente_unidad     numeric(14,2) not null default 0,
  otros_venta_unidad       numeric(14,2) not null default 0,
  actualizado_en           timestamptz not null default now()
);

create table if not exists martha.monedas (
  codigo    text primary key,          -- ISO 4217
  nombre    text not null,
  simbolo   text not null,
  decimales int not null default 2
);

create table if not exists martha.tasas_cambio (
  id               uuid primary key default gen_random_uuid(),
  organizacion_id  uuid not null references martha.organizaciones(id) on delete cascade,
  moneda           text not null references martha.monedas(codigo),
  tasa_cop         numeric(14,4) not null check (tasa_cop > 0),
  fecha            date not null default current_date,
  fuente           text,
  unique (organizacion_id, moneda, fecha)
);

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------
create table if not exists martha.proveedores (
  id               uuid primary key default gen_random_uuid(),
  organizacion_id  uuid not null references martha.organizaciones(id) on delete cascade,
  nombre           text not null,
  pais             text not null default 'Colombia',
  tipo             text not null default 'nacional' check (tipo in ('nacional', 'internacional')),
  moneda           text not null default 'COP' references martha.monedas(codigo),
  contacto         text,
  notas            text,
  creado_en        timestamptz not null default now()
);
create index if not exists proveedores_organizacion_idx on martha.proveedores (organizacion_id);

create table if not exists martha.productos (
  id                   uuid primary key default gen_random_uuid(),
  organizacion_id      uuid not null references martha.organizaciones(id) on delete cascade,
  nombre               text not null,
  sku                  text not null,
  categoria            text not null,
  descripcion          text,
  imagen_url           text,
  proveedor_id         uuid references martha.proveedores(id) on delete set null,
  pais_origen          text not null default 'Colombia',
  moneda_base          text not null default 'COP' references martha.monedas(codigo),
  estado               martha.estado_producto not null default 'borrador',
  producto_origen_id   uuid references martha.productos(id) on delete set null,
  version              int not null default 1,
  unidades_estimadas   int not null default 100 check (unidades_estimadas > 0),
  base_asignacion      martha.base_asignacion not null default 'estimadas',
  precio_venta         numeric(14,2) not null default 0,
  margen_minimo        numeric(6,4) not null default 0.25,
  margen_objetivo      numeric(6,4) not null default 0.40,
  comision_canal_pct   numeric(6,4) not null default 0.10,
  pasarela_pct         numeric(6,4) not null default 0.035,
  publicidad_unidad    numeric(14,2) not null default 0,
  envio_cliente_unidad numeric(14,2) not null default 0,
  otros_venta_unidad   numeric(14,2) not null default 0,
  creado_por           uuid references auth.users(id) on delete set null default auth.uid(),
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now(),
  unique (organizacion_id, sku)
);
create index if not exists productos_organizacion_idx on martha.productos (organizacion_id);
create index if not exists productos_proveedor_idx on martha.productos (proveedor_id);

create table if not exists martha.variantes (
  id                        uuid primary key default gen_random_uuid(),
  organizacion_id           uuid not null references martha.organizaciones(id) on delete cascade,
  producto_id               uuid not null references martha.productos(id) on delete cascade,
  sku                       text not null,
  nombre                    text not null,
  atributos                 jsonb not null default '{}'::jsonb,
  costo_adicional_unitario  numeric(14,2) not null default 0,
  precio_venta              numeric(14,2),
  unidades                  int not null default 0,
  creado_en                 timestamptz not null default now()
);
create index if not exists variantes_producto_idx on martha.variantes (producto_id);

create table if not exists martha.lotes (
  id                  uuid primary key default gen_random_uuid(),
  organizacion_id     uuid not null references martha.organizaciones(id) on delete cascade,
  producto_id         uuid not null references martha.productos(id) on delete cascade,
  proveedor_id        uuid references martha.proveedores(id) on delete set null,
  codigo              text not null,
  tipo                martha.tipo_lote not null default 'produccion',
  estado              martha.estado_lote not null default 'planeado',
  unidades_estimadas  int not null check (unidades_estimadas > 0),
  unidades_reales     int check (unidades_reales >= 0),
  fecha               date not null default current_date,
  notas               text,
  creado_en           timestamptz not null default now(),
  unique (organizacion_id, codigo)
);
create index if not exists lotes_producto_idx on martha.lotes (producto_id);

create table if not exists martha.costos (
  id                  uuid primary key default gen_random_uuid(),
  organizacion_id     uuid not null references martha.organizaciones(id) on delete cascade,
  producto_id         uuid not null references martha.productos(id) on delete cascade,
  variante_id         uuid references martha.variantes(id) on delete cascade,
  lote_id             uuid references martha.lotes(id) on delete set null,
  categoria           martha.categoria_costo not null,
  nombre              text not null,
  tipo                martha.tipo_costo not null,
  moneda              text not null default 'COP' references martha.monedas(codigo),
  modo                martha.modo_valor not null default 'total',
  valor               numeric(16,4) not null check (valor >= 0),
  valor_real          numeric(16,4) check (valor_real >= 0),
  cantidad_unidades   int not null default 1 check (cantidad_unidades > 0),
  tasa_cambio         numeric(14,4),
  fecha               date not null default current_date,
  responsable         text,
  comprobante_url     text,
  nota                text,
  estado              martha.estado_costo not null default 'estimado',
  causa_diferencia    martha.causa_diferencia,
  creado_por          uuid references auth.users(id) on delete set null default auth.uid(),
  creado_en           timestamptz not null default now()
);
create index if not exists costos_producto_idx on martha.costos (producto_id);
create index if not exists costos_lote_idx on martha.costos (lote_id);
create index if not exists costos_organizacion_fecha_idx on martha.costos (organizacion_id, fecha);

create table if not exists martha.precios (
  id               uuid primary key default gen_random_uuid(),
  organizacion_id  uuid not null references martha.organizaciones(id) on delete cascade,
  producto_id      uuid not null references martha.productos(id) on delete cascade,
  variante_id      uuid references martha.variantes(id) on delete cascade,
  precio           numeric(14,2) not null check (precio >= 0),
  fecha            timestamptz not null default now(),
  motivo           text,
  creado_por       uuid references auth.users(id) on delete set null default auth.uid()
);
create index if not exists precios_producto_fecha_idx on martha.precios (producto_id, fecha);

create table if not exists martha.eventos (
  id               uuid primary key default gen_random_uuid(),
  organizacion_id  uuid not null references martha.organizaciones(id) on delete cascade,
  producto_id      uuid not null references martha.productos(id) on delete cascade,
  tipo             martha.tipo_evento not null,
  descripcion      text not null,
  datos            jsonb not null default '{}'::jsonb,
  fecha            timestamptz not null default now(),
  usuario          text,
  creado_por       uuid references auth.users(id) on delete set null default auth.uid()
);
create index if not exists eventos_producto_fecha_idx on martha.eventos (producto_id, fecha);

create table if not exists martha.escenarios (
  id               uuid primary key default gen_random_uuid(),
  organizacion_id  uuid not null references martha.organizaciones(id) on delete cascade,
  producto_id      uuid not null references martha.productos(id) on delete cascade,
  nombre           text not null,
  parametros       jsonb not null,
  creado_en        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Funciones de trigger (todas en martha, search_path vacío y nombres calificados)
-- -----------------------------------------------------------------------------
create or replace function martha.tocar_actualizado()
returns trigger language plpgsql set search_path = '' as $$
begin new.actualizado_en = now(); return new; end $$;

-- Completa organizacion_id con la organización del usuario cuando la app no la envía.
create or replace function martha.fijar_organizacion()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.organizacion_id is null then new.organizacion_id := martha.mi_organizacion(); end if;
  return new;
end $$;

-- Historial de precios automático
create or replace function martha.registrar_cambio_precio()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.precio_venta is distinct from old.precio_venta then
    insert into martha.precios (organizacion_id, producto_id, precio, motivo)
    values (new.organizacion_id, new.id, new.precio_venta,
            case when tg_op = 'INSERT' then 'Precio inicial' else 'Cambio de precio' end);
  end if;
  return new;
end $$;

-- Sincroniza martha.perfiles desde auth.users.app_metadata.
-- auth.users es compartido con otras apps: si el usuario no es de Martha
-- (app_metadata.app <> 'martha' o sin organizacion_id) sale sin hacer nada.
create or replace function martha.sincronizar_perfil()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  org  uuid;
begin
  if meta->>'app' is distinct from 'martha' or nullif(meta->>'organizacion_id', '') is null then
    return new;
  end if;
  org := (meta->>'organizacion_id')::uuid;
  insert into martha.perfiles (id, organizacion_id, nombre, correo, rol, activo)
  values (
    new.id, org,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce(nullif(meta->>'rol', ''), 'colaborador')::martha.rol_usuario,
    coalesce((meta->>'activo')::boolean, true)
  )
  on conflict (id) do update set
    organizacion_id = excluded.organizacion_id,
    correo          = excluded.correo,
    rol             = excluded.rol,
    activo          = excluded.activo;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Triggers en tablas de Martha
-- -----------------------------------------------------------------------------
drop trigger if exists martha_productos_actualizado on martha.productos;
create trigger martha_productos_actualizado before update on martha.productos
  for each row execute function martha.tocar_actualizado();

drop trigger if exists martha_productos_precio on martha.productos;
create trigger martha_productos_precio after insert or update of precio_venta on martha.productos
  for each row execute function martha.registrar_cambio_precio();

do $$
declare t text;
begin
  foreach t in array array['tasas_cambio','proveedores','productos','variantes','lotes','costos','precios','eventos','escenarios'] loop
    execute format('drop trigger if exists martha_fijar_organizacion on martha.%I', t);
    execute format('create trigger martha_fijar_organizacion before insert on martha.%I for each row execute function martha.fijar_organizacion()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Triggers en auth.users (compartida): nombres con prefijo martha_ y la función
-- ignora a los usuarios de otras aplicaciones.
-- -----------------------------------------------------------------------------
drop trigger if exists martha_on_auth_user_created on auth.users;
create trigger martha_on_auth_user_created after insert on auth.users
  for each row execute function martha.sincronizar_perfil();

drop trigger if exists martha_on_auth_user_app_metadata on auth.users;
create trigger martha_on_auth_user_app_metadata after update of raw_app_meta_data, email on auth.users
  for each row execute function martha.sincronizar_perfil();

-- -----------------------------------------------------------------------------
-- Row Level Security (activada en TODAS las tablas de martha)
--   · Miembros activos de la organización: leer, crear y editar datos operativos.
--   · Solo admin: eliminar, proveedores, configuración y tasas de cambio.
--   · Usuarios y roles: solo desde el servidor (service role) vía app_metadata.
-- -----------------------------------------------------------------------------
alter table martha.organizaciones  enable row level security;
alter table martha.perfiles        enable row level security;
alter table martha.configuraciones enable row level security;
alter table martha.monedas         enable row level security;
alter table martha.tasas_cambio    enable row level security;
alter table martha.proveedores     enable row level security;
alter table martha.productos       enable row level security;
alter table martha.variantes       enable row level security;
alter table martha.lotes           enable row level security;
alter table martha.costos          enable row level security;
alter table martha.precios         enable row level security;
alter table martha.eventos         enable row level security;
alter table martha.escenarios      enable row level security;

drop policy if exists org_leer on martha.organizaciones;
create policy org_leer on martha.organizaciones for select using (id = martha.mi_organizacion());
drop policy if exists org_editar on martha.organizaciones;
create policy org_editar on martha.organizaciones for update
  using (id = martha.mi_organizacion() and martha.es_admin());

drop policy if exists perfiles_leer on martha.perfiles;
create policy perfiles_leer on martha.perfiles for select
  using (organizacion_id = martha.mi_organizacion() or id = auth.uid());
drop policy if exists perfiles_propio on martha.perfiles;
create policy perfiles_propio on martha.perfiles for update
  using (id = auth.uid() and activo) with check (id = auth.uid());

drop policy if exists monedas_leer on martha.monedas;
create policy monedas_leer on martha.monedas for select to authenticated using (true);

drop policy if exists config_leer on martha.configuraciones;
create policy config_leer on martha.configuraciones for select using (organizacion_id = martha.mi_organizacion());
drop policy if exists config_admin on martha.configuraciones;
create policy config_admin on martha.configuraciones for all
  using (organizacion_id = martha.mi_organizacion() and martha.es_admin())
  with check (organizacion_id = martha.mi_organizacion() and martha.es_admin());

drop policy if exists tasas_leer on martha.tasas_cambio;
create policy tasas_leer on martha.tasas_cambio for select using (organizacion_id = martha.mi_organizacion());
drop policy if exists tasas_admin on martha.tasas_cambio;
create policy tasas_admin on martha.tasas_cambio for all
  using (organizacion_id = martha.mi_organizacion() and martha.es_admin())
  with check (organizacion_id = martha.mi_organizacion() and martha.es_admin());

drop policy if exists proveedores_leer on martha.proveedores;
create policy proveedores_leer on martha.proveedores for select using (organizacion_id = martha.mi_organizacion());
drop policy if exists proveedores_admin on martha.proveedores;
create policy proveedores_admin on martha.proveedores for all
  using (organizacion_id = martha.mi_organizacion() and martha.es_admin())
  with check (organizacion_id = martha.mi_organizacion() and martha.es_admin());

do $$
declare t text;
begin
  foreach t in array array['productos','variantes','lotes','costos','precios','eventos','escenarios'] loop
    execute format('drop policy if exists %1$s_leer on martha.%1$I', t);
    execute format('create policy %1$s_leer on martha.%1$I for select using (organizacion_id = martha.mi_organizacion())', t);
    execute format('drop policy if exists %1$s_crear on martha.%1$I', t);
    execute format('create policy %1$s_crear on martha.%1$I for insert with check (organizacion_id = martha.mi_organizacion())', t);
    execute format('drop policy if exists %1$s_editar on martha.%1$I', t);
    execute format('create policy %1$s_editar on martha.%1$I for update using (organizacion_id = martha.mi_organizacion()) with check (organizacion_id = martha.mi_organizacion())', t);
    execute format('drop policy if exists %1$s_eliminar on martha.%1$I', t);
    execute format('create policy %1$s_eliminar on martha.%1$I for delete using (organizacion_id = martha.mi_organizacion() and martha.es_admin())', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Vista para integraciones (respeta la RLS de quien consulta)
-- -----------------------------------------------------------------------------
create or replace view martha.v_inversion_producto with (security_invoker = true) as
select p.id as producto_id, p.organizacion_id, p.sku, p.nombre, p.categoria, p.precio_venta,
       coalesce(sum(
         (case when c.modo = 'unitario' then coalesce(c.valor_real, c.valor) * c.cantidad_unidades
               else coalesce(c.valor_real, c.valor) end)
         * coalesce(c.tasa_cambio, 1)
       ), 0) as inversion_total_cop
from martha.productos p
left join martha.costos c on c.producto_id = p.id
group by p.id;

-- -----------------------------------------------------------------------------
-- Permisos del schema martha (no se toca public)
-- -----------------------------------------------------------------------------
grant usage on schema martha to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema martha to authenticated;
grant usage, select on all sequences in schema martha to authenticated;
grant execute on all functions in schema martha to authenticated;
grant all on all tables in schema martha to service_role;
grant all on all sequences in schema martha to service_role;
grant all on all functions in schema martha to service_role;

alter default privileges in schema martha grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema martha grant usage, select on sequences to authenticated;
alter default privileges in schema martha grant execute on functions to authenticated;
alter default privileges in schema martha grant all on tables to service_role;
alter default privileges in schema martha grant all on sequences to service_role;
alter default privileges in schema martha grant all on functions to service_role;

-- Perfiles: desde el cliente solo se puede cambiar el propio nombre.
-- rol / activo / organizacion_id cambian únicamente vía app_metadata (service role).
revoke insert, update, delete on martha.perfiles from authenticated;
grant update (nombre) on martha.perfiles to authenticated;
-- Catálogo global de monedas: solo lectura para usuarios.
revoke insert, update, delete on martha.monedas from authenticated;
-- Las funciones de trigger no deben invocarse directamente.
revoke execute on function martha.sincronizar_perfil() from authenticated, anon, public;
revoke execute on function martha.registrar_cambio_precio() from authenticated, anon, public;

-- -----------------------------------------------------------------------------
-- Storage: buckets con prefijo martha- y políticas martha_* solo para ellos.
-- Las rutas deben empezar por el id de la organización: "<organizacion_id>/archivo.pdf"
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('martha-imagenes-productos', 'martha-imagenes-productos', true),
  ('martha-comprobantes', 'martha-comprobantes', false)
on conflict (id) do nothing;

drop policy if exists martha_imagenes_leer on storage.objects;
create policy martha_imagenes_leer on storage.objects for select
  using (bucket_id = 'martha-imagenes-productos');

drop policy if exists martha_imagenes_subir on storage.objects;
create policy martha_imagenes_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'martha-imagenes-productos'
              and (storage.foldername(name))[1] = martha.mi_organizacion()::text);

drop policy if exists martha_comprobantes_leer on storage.objects;
create policy martha_comprobantes_leer on storage.objects for select to authenticated
  using (bucket_id = 'martha-comprobantes'
         and (storage.foldername(name))[1] = martha.mi_organizacion()::text);

drop policy if exists martha_comprobantes_subir on storage.objects;
create policy martha_comprobantes_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'martha-comprobantes'
              and (storage.foldername(name))[1] = martha.mi_organizacion()::text);

drop policy if exists martha_archivos_eliminar on storage.objects;
create policy martha_archivos_eliminar on storage.objects for delete to authenticated
  using (bucket_id in ('martha-imagenes-productos', 'martha-comprobantes')
         and (storage.foldername(name))[1] = martha.mi_organizacion()::text
         and martha.es_admin());

-- -----------------------------------------------------------------------------
-- Datos de catálogo
-- -----------------------------------------------------------------------------
insert into martha.monedas (codigo, nombre, simbolo, decimales) values
  ('COP', 'Peso colombiano', '$', 0),
  ('USD', 'Dólar estadounidense', 'US$', 2),
  ('EUR', 'Euro', '€', 2),
  ('CNY', 'Yuan chino', '¥', 2),
  ('MXN', 'Peso mexicano', 'MX$', 2)
on conflict (codigo) do nothing;
