-- 1) Usuario de OTRA app: no debe crear perfil ni fallar
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000000aa', 'otro@otraapp.com', '{"app":"otra","rol":"admin","organizacion_id":"11111111-1111-1111-1111-111111111111"}');
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"x"}' where email = 'otro@otraapp.com';
do $$ begin assert (select count(*) from martha.perfiles) = 0, 'usuario de otra app generó perfil'; end $$;

-- 2) Organizaciones y usuarios de Martha
insert into martha.organizaciones (id, nombre) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Fajas Martha'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Otra tienda');
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'admin@fajas.co', '{"app":"martha","organizacion_id":"aaaaaaaa-0000-0000-0000-000000000001","rol":"admin","activo":true}', '{"nombre":"Admin"}'),
  ('00000000-0000-0000-0000-000000000002', 'colab@fajas.co', '{"app":"martha","organizacion_id":"aaaaaaaa-0000-0000-0000-000000000001","rol":"colaborador"}', '{}'),
  ('00000000-0000-0000-0000-000000000003', 'admin@otra.co',  '{"app":"martha","organizacion_id":"bbbbbbbb-0000-0000-0000-000000000002","rol":"admin"}', '{}');
do $$ begin assert (select count(*) from martha.perfiles) = 3, 'faltan perfiles'; end $$;
do $$ begin assert (select nombre from martha.perfiles where correo = 'admin@fajas.co') = 'Admin', 'nombre'; end $$;

-- 3) Cambio de rol vía app_metadata sincroniza el perfil
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"admin"}' where email = 'colab@fajas.co';
do $$ begin assert (select rol from martha.perfiles where correo = 'colab@fajas.co') = 'admin', 'rol no sincronizado'; end $$;
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"colaborador"}' where email = 'colab@fajas.co';

-- 4) RLS como admin de Fajas Martha
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into martha.productos (id, nombre, sku, categoria, precio_venta) values ('cccccccc-0000-0000-0000-000000000001', 'Faja', 'FAJ-1', 'Fajas', 189000);
update martha.productos set precio_venta = 199000 where sku = 'FAJ-1';
do $$ begin assert (select organizacion_id from martha.productos where sku = 'FAJ-1') = 'aaaaaaaa-0000-0000-0000-000000000001', 'org no fijada'; end $$;
do $$ begin assert (select count(*) from martha.precios) = 2, 'historial de precios'; end $$;
insert into martha.costos (producto_id, categoria, nombre, tipo, valor, cantidad_unidades) values ('cccccccc-0000-0000-0000-000000000001', 'materia_prima', 'Tela', 'variable', 11000000, 500);
do $$ begin assert (select inversion_total_cop from martha.v_inversion_producto) = 11000000, 'vista'; end $$;
commit;

-- 5) Admin de OTRA organización no ve nada de Fajas Martha
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
do $$ begin assert (select count(*) from martha.productos) = 0, 'fuga entre organizaciones'; end $$;
do $$ begin assert (select count(*) from martha.perfiles) = 1, 'perfiles de otra org visibles'; end $$;
commit;

-- 6) Colaborador: lee y edita, pero no elimina ni cambia su rol ni la configuración
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$ begin assert (select count(*) from martha.productos) = 1, 'colaborador no ve'; end $$;
delete from martha.productos;
do $$ begin assert (select count(*) from martha.productos) = 1, 'colaborador pudo eliminar'; end $$;
do $$ begin
  update martha.perfiles set rol = 'admin' where id = auth.uid();
  raise exception 'colaborador pudo cambiar su rol';
exception when insufficient_privilege then null; end $$;
update martha.perfiles set nombre = 'Colab' where id = auth.uid();
do $$ begin
  insert into martha.proveedores (nombre) values ('X');
  raise exception 'colaborador creó proveedor';
exception when insufficient_privilege then null; end $$;
commit;

-- 7) Desactivar: sin acceso a datos
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"activo":false}' where email = 'colab@fajas.co';
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$ begin assert (select count(*) from martha.productos) = 0, 'desactivado ve datos'; end $$;
do $$ begin assert (select count(*) from martha.perfiles) = 1, 'debe ver su propio perfil (para mostrar sin acceso)'; end $$;
commit;

-- 8) Storage: solo la carpeta de su organización en buckets de Martha
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id, name) values ('martha-comprobantes', 'aaaaaaaa-0000-0000-0000-000000000001/f.pdf');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('martha-comprobantes', 'bbbbbbbb-0000-0000-0000-000000000002/f.pdf');
  raise exception 'subió a carpeta de otra org';
exception when insufficient_privilege then null; end $$;
commit;

-- 9) La otra app sigue intacta
do $$ begin assert (select count(*) from public.clientes_otra_app) = 1, 'public modificado'; end $$;
select 'FUNCIONAL_OK';
