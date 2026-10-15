-- Emulación mínima de lo que Supabase ya trae (roles, auth, storage) + "otra app" en public.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant anon, authenticated, service_role to current_user;
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select current_setting('request.jwt.claim.role', true) $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, delete on storage.objects to authenticated;

-- Otra aplicación que comparte la base
create table public.clientes_otra_app (id serial primary key, nombre text);
insert into public.clientes_otra_app (nombre) values ('ACME');
create function public.otra_app_trigger() returns trigger language plpgsql as $$ begin return new; end $$;
create trigger otra_app_on_user after insert on auth.users for each row execute function public.otra_app_trigger();
insert into storage.buckets values ('otra-app-fotos', 'otra-app-fotos', true);
create policy otra_app_leer on storage.objects for select using (bucket_id = 'otra-app-fotos');
