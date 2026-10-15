# Verifica la migración de Martha en un Postgres embebido (no toca tu Supabase):
#   python3 -m venv .venv && .venv/bin/pip install pgserver
#   .venv/bin/python supabase/pruebas/verificar.py
# 1) emula lo que Supabase ya trae (auth, storage, roles) y una "otra app" en public;
# 2) ejecuta la migración DOS veces (idempotencia);
# 3) lista los objetos creados fuera del schema martha y los que hubieran desaparecido;
# 4) corre pruebas funcionales de triggers y RLS; 5) ejecuta bootstrap_admin.sql.
import sys, pathlib, tempfile, re
import pgserver
aqui = pathlib.Path(__file__).parent
raiz = aqui.parent
mig = raiz / "migrations" / "0001_esquema_inicial.sql"
boot = raiz / "bootstrap_admin.sql"
srv = pgserver.get_server(tempfile.mkdtemp(), cleanup_mode="stop")
def run(sql, nombre):
    out = srv.psql(sql)
    if "ERROR" in out or "FATAL" in out:
        print(f"--- FALLÓ {nombre}:\n{out}"); sys.exit(1)
    return out
run((aqui/"shim.sql").read_text(), "shim")
antes = set(run((aqui/"inventario.sql").read_text(), "inv").splitlines())
run(mig.read_text(), "migración (1ª vez)")
run(mig.read_text(), "migración (2ª vez, idempotencia)")
despues = set(run((aqui/"inventario.sql").read_text(), "inv").splitlines())
filas = lambda xs: {l.strip() for l in xs if "|" in l and not l.strip().startswith("tipo")}
nuevos = sorted(filas(despues) - filas(antes))
def ubicacion(l):
    obj = l.split("|", 1)[1].strip()
    return obj.split(" ON ", 1)[1] if " ON " in obj else obj
fuera = [l for l in nuevos if not (ubicacion(l).startswith("martha.") or ubicacion(l) == "martha")]
dentro = [l for l in nuevos if l not in fuera]
print(f"Objetos nuevos en schema martha: {len(dentro)}")
print("Objetos nuevos FUERA de martha:"); [print("  ", l) for l in fuera]
print("Objetos previos eliminados:", sorted(filas(antes) - filas(despues)) or "ninguno")
print(run((aqui/"funcional.sql").read_text(), "pruebas funcionales").strip().splitlines()[-3:])
b = boot.read_text().replace("<<Nombre de la empresa>>", "Empresa Boot").replace("<<Nombre del administrador>>", "Boot Admin").replace("<<correo@empresa.com>>", "otro@otraapp.com")
print(run(b, "bootstrap").strip().splitlines()[-4:])
