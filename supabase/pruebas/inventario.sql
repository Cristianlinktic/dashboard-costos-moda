select 'relacion' as tipo, n.nspname || '.' || c.relname || ' (' || c.relkind::text || ')' as objeto from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname not in ('pg_catalog','information_schema','pg_toast')
union all select 'funcion', n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname not in ('pg_catalog','information_schema')
union all select 'tipo', n.nspname || '.' || t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname not in ('pg_catalog','information_schema','pg_toast') and t.typtype = 'e'
union all select 'trigger', tg.tgname || ' ON ' || c.relnamespace::regnamespace || '.' || c.relname from pg_trigger tg join pg_class c on c.oid = tg.tgrelid where not tg.tgisinternal
union all select 'politica', pol.polname || ' ON ' || c.relnamespace::regnamespace || '.' || c.relname from pg_policy pol join pg_class c on c.oid = pol.polrelid
union all select 'bucket', 'storage.buckets: ' || id from storage.buckets
union all select 'schema', nspname from pg_namespace where nspname not like 'pg_%' and nspname <> 'information_schema'
order by 1, 2;
