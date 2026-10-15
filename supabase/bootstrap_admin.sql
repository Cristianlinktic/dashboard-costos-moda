-- =============================================================================
-- Alternativa SQL a `npm run crear-admin`: crea una organización de Martha y
-- convierte a un usuario existente de Supabase Auth en su primer administrador.
-- Solo escribe en el schema martha y en el app_metadata/user_metadata de ESE usuario
-- (no toca public ni a usuarios de otras aplicaciones).
--
-- 1. Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"
--    (correo + contraseña, marca "Auto Confirm User").
--    Ojo: si el correo ya existe porque usa otra app del proyecto, este script
--    sobrescribe su app_metadata.app con 'martha'. Si la otra app también usa la
--    clave "app", crea un usuario distinto para Martha.
-- 2. Reemplaza los valores marcados con <<…>> y ejecuta este script en el SQL Editor.
-- =============================================================================

with org as (
  insert into martha.organizaciones (nombre) values ('<<Nombre de la empresa>>')
  returning id
), cfg as (
  insert into martha.configuraciones (organizacion_id) select id from org
)
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('app', 'martha', 'organizacion_id', org.id, 'rol', 'admin', 'activo', true),
    raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('nombre', '<<Nombre del administrador>>')
from org
where u.email = '<<correo@empresa.com>>';

-- El trigger martha_on_auth_user_app_metadata crea el perfil en martha.perfiles. Verifica:
select p.correo, p.rol, p.activo, o.nombre as organizacion
from martha.perfiles p join martha.organizaciones o on o.id = p.organizacion_id;
