"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Plus, ShieldCheck, UserCheck, Users, UserX } from "lucide-react";
import type { Rol } from "@/tipos";
import { nuevoId, useMartha } from "@/lib/datos/MarthaProvider";
import { ROLES, validarNuevoUsuario, type DatosNuevoUsuario, type UsuarioEquipo } from "@/lib/usuarios/tipos";
import { formatoFecha } from "@/lib/formato";
import { SoloAdmin } from "@/components/Shell";
import { Aviso, Campo, Cargando, Encabezado, Etiqueta, Modal, cx } from "@/components/ui";
import { BarraFiltros, ChipBusqueda, ChipSelect } from "@/components/Filtros";
import { TablaDatos } from "@/components/TablaDatos";

const CLAVE_DEMO = "martha-demo-usuarios";
const USUARIOS_DEMO: UsuarioEquipo[] = [
  { id: "demo", nombre: "Usuario demo", correo: "demo@martha.app", rol: "admin", activo: true, ultimoAcceso: new Date().toISOString() },
  { id: "demo-2", nombre: "Laura Restrepo", correo: "laura@fajas.co", rol: "colaborador", activo: true, ultimoAcceso: "2026-10-10T15:00:00Z" },
  { id: "demo-3", nombre: "Andrés Pérez", correo: "andres@fajas.co", rol: "colaborador", activo: false, ultimoAcceso: "2026-07-02T15:00:00Z" },
];

function leerDemo(): UsuarioEquipo[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_DEMO) ?? "null") ?? USUARIOS_DEMO;
  } catch {
    return USUARIOS_DEMO;
  }
}
function escribirDemo(u: UsuarioEquipo[]) {
  try {
    localStorage.setItem(CLAVE_DEMO, JSON.stringify(u));
  } catch {}
}

export default function PaginaUsuarios() {
  return (
    <SoloAdmin>
      <GestionUsuarios />
    </SoloAdmin>
  );
}

function GestionUsuarios() {
  const { modo, usuario, token } = useMartha();
  const [usuarios, setUsuarios] = useState<UsuarioEquipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>();
  const [filtroEstado, setFiltroEstado] = useState<string>();

  // En modo Supabase todo pasa por /api/usuarios (servidor con service role).
  const api = useCallback(
    async (ruta: string, init?: RequestInit) => {
      const t = await token();
      const res = await fetch(ruta, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}`, ...init?.headers } });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(cuerpo.error ?? `Error ${res.status}`);
      return cuerpo;
    },
    [token],
  );

  const cargar = useCallback(async () => {
    setError(null);
    try {
      if (modo === "demo") setUsuarios(leerDemo());
      else setUsuarios((await api("/api/usuarios")).usuarios);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUsuarios([]);
    }
  }, [modo, api]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function actualizar(u: UsuarioEquipo, cambios: { rol?: Rol; activo?: boolean }) {
    setError(null);
    try {
      if (u.id === usuario?.id && (cambios.rol === "colaborador" || cambios.activo === false)) throw new Error("No puedes quitarte el rol de administrador ni desactivarte a ti mismo.");
      if (modo === "demo") {
        const lista = leerDemo().map((x) => (x.id === u.id ? { ...x, ...cambios } : x));
        escribirDemo(lista);
        setUsuarios(lista);
      } else {
        await api(`/api/usuarios/${u.id}`, { method: "PATCH", body: JSON.stringify(cambios) });
        await cargar();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function crear(datos: DatosNuevoUsuario) {
    if (modo === "demo") {
      const lista = [...leerDemo(), { id: nuevoId(), nombre: datos.nombre, correo: datos.correo, rol: datos.rol, activo: true, invitacionPendiente: datos.metodo === "invitacion" }];
      escribirDemo(lista);
      setUsuarios(lista);
    } else {
      await api("/api/usuarios", { method: "POST", body: JSON.stringify(datos) });
      await cargar();
    }
    setCreando(false);
  }

  const q = busqueda.trim().toLowerCase();
  const visibles = (usuarios ?? []).filter(
    (u) =>
      (!q || `${u.nombre} ${u.correo}`.toLowerCase().includes(q)) &&
      (!filtroRol || u.rol === filtroRol) &&
      (!filtroEstado || (filtroEstado === "inactivo" ? !u.activo : filtroEstado === "pendiente" ? u.activo && u.invitacionPendiente : u.activo && !u.invitacionPendiente)),
  );

  return (
    <div>
      <Encabezado
        datos={[
          { etiqueta: "Usuarios", valor: usuarios?.length ?? null, formato: (n) => String(Math.round(n)) },
          { etiqueta: "Activos", valor: usuarios ? usuarios.filter((u) => u.activo).length : null, formato: (n) => String(Math.round(n)) },
          { etiqueta: "Administradores", valor: usuarios ? usuarios.filter((u) => u.rol === "admin").length : null, formato: (n) => String(Math.round(n)) },
        ]}
        titulo="Usuarios"
        acento="del equipo"
        descripcion="Crea las cuentas de tu equipo. No hay registro público: solo un administrador puede dar acceso."
        acciones={
          <button className="btn-primario" onClick={() => setCreando(true)}>
            <Plus className="size-4" /> Nuevo usuario
          </button>
        }
      />
      {modo === "demo" && (
        <div className="mb-4">
          <Aviso tono="amarillo">Modo demo: los usuarios se simulan en este navegador. Con Supabase se crean de verdad desde el servidor.</Aviso>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Aviso tono="rojo">{error}</Aviso>
        </div>
      )}

      <BarraFiltros
        activos={[busqueda.trim(), filtroRol, filtroEstado].filter(Boolean).length}
        onLimpiar={() => {
          setBusqueda("");
          setFiltroRol(undefined);
          setFiltroEstado(undefined);
        }}
      >
        <ChipBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Nombre o correo…" />
        <ChipSelect etiqueta="Rol" icono={ShieldCheck} valor={filtroRol} onCambio={setFiltroRol} opciones={Object.entries(ROLES).map(([k, v]) => ({ valor: k, etiqueta: v }))} />
        <ChipSelect
          etiqueta="Estado"
          icono={Activity}
          valor={filtroEstado}
          onCambio={setFiltroEstado}
          opciones={[
            { valor: "activo", etiqueta: "Activos" },
            { valor: "pendiente", etiqueta: "Invitación pendiente" },
            { valor: "inactivo", etiqueta: "Desactivados" },
          ]}
        />
      </BarraFiltros>

      {usuarios === null ? (
        <Cargando />
      ) : (
        <TablaDatos
          icono={Users}
          titulo="Equipo"
          descripcion="Cambia el rol con un clic. Desactivar impide iniciar sesión."
          filas={visibles}
          clave={(u) => u.id}
          ordenInicial={{ clave: "nombre", dir: "asc" }}
          vacio="Ningún usuario coincide con los filtros."
          columnas={[
            {
              clave: "nombre",
              titulo: "Usuario",
              principal: true,
              ordenar: (u) => u.nombre,
              render: (u) => (
                <div className={cx("flex items-center gap-3", !u.activo && "opacity-60")}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[image:var(--mt-gradiente-marca)] text-sm font-bold text-white">{u.nombre.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {u.nombre}
                      {u.id === usuario?.id && <span className="ml-1 text-xs font-normal text-tinta-tenue">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-tinta-tenue">{u.correo}</p>
                  </div>
                </div>
              ),
            },
            {
              clave: "rol",
              titulo: "Rol",
              ordenar: (u) => u.rol,
              render: (u) => (
                <div role="radiogroup" aria-label={`Rol de ${u.nombre}`} className="inline-flex rounded-full border border-linea bg-hundido p-0.5">
                  {(Object.entries(ROLES) as [Rol, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      role="radio"
                      aria-checked={u.rol === k}
                      disabled={u.id === usuario?.id || u.rol === k}
                      onClick={() => actualizar(u, { rol: k })}
                      className={cx(
                        "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-default",
                        u.rol === k ? "bg-[image:var(--mt-gradiente-marca)] text-white shadow-sm" : "text-tinta-suave hover:text-marca",
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              ),
            },
            {
              clave: "estado",
              titulo: "Estado",
              ordenar: (u) => (u.activo ? (u.invitacionPendiente ? 1 : 0) : 2),
              render: (u) =>
                !u.activo ? <Etiqueta tono="rojo">Desactivado</Etiqueta> : u.invitacionPendiente ? <Etiqueta tono="amarillo">Invitación pendiente</Etiqueta> : <Etiqueta tono="verde">Activo</Etiqueta>,
            },
            { clave: "acceso", titulo: "Último acceso", ordenar: (u) => u.ultimoAcceso ?? "", render: (u) => <span className="text-xs text-tinta-suave">{u.ultimoAcceso ? formatoFecha(u.ultimoAcceso) : "Nunca"}</span> },
            {
              clave: "acciones",
              titulo: "",
              acciones: true,
              alinear: "der",
              render: (u) =>
                u.id === usuario?.id ? null : u.activo ? (
                  <button className="btn-fantasma px-2.5 py-1 text-xs hover:bg-rojo-suave hover:text-rojo" onClick={() => window.confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión.`) && actualizar(u, { activo: false })}>
                    <UserX className="size-3.5" /> Desactivar
                  </button>
                ) : (
                  <button className="btn-secundario px-2.5 py-1 text-xs" onClick={() => actualizar(u, { activo: true })}>
                    <UserCheck className="size-3.5" /> Reactivar
                  </button>
                ),
            },
          ]}
        />
      )}

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="tarjeta-viva p-5">
          <p className="flex items-center gap-2 font-display font-bold text-titulo"><ShieldCheck className="size-4 text-marca" /> Administrador</p>
          <p className="mt-1 text-tinta-suave">Todo lo del colaborador, más: eliminar registros, proveedores, configuración, tasas de cambio y usuarios.</p>
        </div>
        <div className="tarjeta-viva p-5">
          <p className="flex items-center gap-2 font-display font-bold text-titulo"><UserCheck className="size-4 text-marca" /> Colaborador</p>
          <p className="mt-1 text-tinta-suave">Ve todo y puede crear y editar productos, variantes, costos, lotes y escenarios. No puede eliminar.</p>
        </div>
      </div>

      <Modal abierto={creando} titulo="Nuevo usuario" onCerrar={() => setCreando(false)} ancho="max-w-lg">
        <FormularioUsuario onCrear={crear} onCancelar={() => setCreando(false)} />
      </Modal>
    </div>
  );
}

function FormularioUsuario({ onCrear, onCancelar }: { onCrear: (d: DatosNuevoUsuario) => Promise<void>; onCancelar: () => void }) {
  const [d, setD] = useState<DatosNuevoUsuario>({ nombre: "", correo: "", rol: "colaborador", metodo: "invitacion", clave: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const invalido = validarNuevoUsuario(d);
        if (invalido) return setError(invalido);
        setEnviando(true);
        setError(null);
        try {
          await onCrear({ ...d, clave: d.metodo === "clave" ? d.clave : undefined });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      {error && <Aviso tono="rojo">{error}</Aviso>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input className="campo" required value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
        </Campo>
        <Campo etiqueta="Correo">
          <input className="campo" type="email" required value={d.correo} onChange={(e) => setD({ ...d, correo: e.target.value })} />
        </Campo>
      </div>
      <Campo etiqueta="Rol">
        <select className="campo" value={d.rol} onChange={(e) => setD({ ...d, rol: e.target.value as Rol })}>
          {Object.entries(ROLES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Campo>
      <fieldset className="space-y-2">
        <legend className="etiqueta">Acceso</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="metodo" checked={d.metodo === "invitacion"} onChange={() => setD({ ...d, metodo: "invitacion" })} className="mt-1 accent-marca" />
          <span>
            Enviar invitación por correo
            <span className="block text-xs text-tinta-tenue">La persona define su contraseña desde el enlace.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="metodo" checked={d.metodo === "clave"} onChange={() => setD({ ...d, metodo: "clave" })} className="mt-1 accent-marca" />
          <span>
            Asignar contraseña temporal
            <span className="block text-xs text-tinta-tenue">Compártela por un canal seguro; puede cambiarla con «Olvidé mi contraseña».</span>
          </span>
        </label>
      </fieldset>
      {d.metodo === "clave" && (
        <Campo etiqueta="Contraseña temporal" ayuda="Mínimo 8 caracteres.">
          <input className="campo" type="text" autoComplete="new-password" value={d.clave} onChange={(e) => setD({ ...d, clave: e.target.value })} />
        </Campo>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button className="btn-primario" disabled={enviando}>
          {enviando ? "Creando…" : d.metodo === "invitacion" ? "Enviar invitación" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
