"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { BaseDatos, Configuracion, Costo, Evento, Producto, Rol, TipoEvento, Variante } from "@/tipos";
import { tasasVigentes, type Tasas } from "@/lib/calculos/motor";
import { obtenerSupabase, perfilMartha, supabaseConfigurado } from "@/lib/supabase/cliente";
import { RepositorioDemo, RepositorioSupabase, type Coleccion, type Repositorio } from "./repositorio";

export interface UsuarioActual {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  organizacionId?: string;
}

interface ContextoMartha {
  modo: "demo" | "supabase";
  cargando: boolean;
  error: string | null;
  db: BaseDatos;
  tasas: Tasas;
  usuario: UsuarioActual | null;
  esAdmin: boolean;
  guardar: <T extends { id: string }>(coleccion: Coleccion, registro: T) => Promise<T>;
  eliminar: (coleccion: Coleccion, id: string) => Promise<void>;
  guardarConfiguracion: (cfg: Configuracion) => Promise<void>;
  registrarEvento: (productoId: string, tipo: TipoEvento, descripcion: string, datos?: Record<string, unknown>) => Promise<void>;
  crearProducto: (producto: Producto, variantes: Variante[], costos: Costo[]) => Promise<void>;
  duplicarProducto: (id: string) => Promise<string>;
  /** Cambia el precio y deja rastro en el historial. `base` permite guardar otros cambios del producto a la vez. */
  cambiarPrecio: (productoId: string, precio: number, motivo: string, base?: Producto) => Promise<void>;
  reiniciarDemo: () => void;
  cambiarRolDemo: (rol: Rol) => void;
  /** Token de acceso actual (para llamar a /api/* en modo Supabase). */
  token: () => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
}

const VACIA: BaseDatos = {
  configuracion: {
    monedaBase: "COP",
    margenMinimo: 0.25,
    margenObjetivo: 0.4,
    comisionCanalPct: 0.1,
    pasarelaPct: 0.035,
    publicidadUnidad: 0,
    envioClienteUnidad: 0,
    otrosVentaUnidad: 0,
  },
  tasas: [],
  proveedores: [],
  productos: [],
  variantes: [],
  lotes: [],
  costos: [],
  precios: [],
  eventos: [],
  escenarios: [],
};

const Contexto = createContext<ContextoMartha | null>(null);
const CLAVE_ROL_DEMO = "martha-demo-rol";
export const RUTAS_PUBLICAS = ["/acceso", "/auth"];

export const nuevoId = () => crypto.randomUUID();
const ahora = () => new Date().toISOString();

export function MarthaProvider({ children }: { children: ReactNode }) {
  const modo = supabaseConfigurado ? "supabase" : "demo";
  const repo = useRef<Repositorio | null>(null);
  const [db, setDb] = useState<BaseDatos>(VACIA);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  useEffect(() => {
    let cancelado = false;
    async function iniciar() {
      setCargando(true);
      setError(null);
      try {
        if (!supabaseConfigurado) {
          let rol: Rol = "admin";
          try {
            rol = (localStorage.getItem(CLAVE_ROL_DEMO) as Rol) || "admin";
          } catch {}
          repo.current ??= new RepositorioDemo();
          setUsuario({ id: "demo", nombre: "Usuario demo", correo: "demo@martha.app", rol });
        } else {
          if (esPublica) return;
          const supabase = obtenerSupabase();
          const { data } = await supabase.auth.getUser();
          if (!data.user) {
            router.replace("/acceso");
            return;
          }
          // Usuarios de otras apps del mismo proyecto no tienen perfil en martha.perfiles.
          const perfil = await perfilMartha(supabase, data.user.id);
          if (!perfil) {
            await supabase.auth.signOut();
            router.replace("/acceso?error=sin-acceso");
            return;
          }
          repo.current = new RepositorioSupabase(supabase, perfil.organizacion_id);
          setUsuario({
            id: data.user.id,
            nombre: perfil.nombre ?? data.user.email ?? "",
            correo: data.user.email ?? "",
            rol: perfil.rol,
            organizacionId: perfil.organizacion_id,
          });
        }
        const datos = await repo.current!.cargar();
        if (!cancelado) setDb(datos);
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    iniciar();
    return () => {
      cancelado = true;
    };
    // Se recarga al entrar a la app desde una ruta pública (p. ej. después del login).
  }, [esPublica, router]);

  const guardar = useCallback(async <T extends { id: string }>(coleccion: Coleccion, registro: T) => {
    await repo.current!.guardar(coleccion, registro);
    setDb((prev) => {
      const lista = prev[coleccion] as unknown as T[];
      const existe = lista.some((r) => r.id === registro.id);
      return { ...prev, [coleccion]: existe ? lista.map((r) => (r.id === registro.id ? registro : r)) : [...lista, registro] };
    });
    return registro;
  }, []);

  const eliminar = useCallback(async (coleccion: Coleccion, id: string) => {
    await repo.current!.eliminar(coleccion, id);
    setDb((prev) => {
      const sig = { ...prev, [coleccion]: (prev[coleccion] as unknown as { id: string }[]).filter((r) => r.id !== id) } as BaseDatos;
      if (coleccion === "productos") {
        for (const c of ["variantes", "lotes", "costos", "precios", "eventos", "escenarios"] as const)
          (sig[c] as unknown as { productoId: string }[]) = (sig[c] as unknown as { productoId: string }[]).filter((r) => r.productoId !== id);
      }
      if (coleccion === "lotes") sig.costos = sig.costos.map((c) => (c.loteId === id ? { ...c, loteId: null } : c));
      return sig;
    });
  }, []);

  const guardarConfiguracion = useCallback(async (cfg: Configuracion) => {
    await repo.current!.guardarConfiguracion(cfg);
    setDb((prev) => ({ ...prev, configuracion: cfg }));
  }, []);

  const registrarEvento = useCallback(
    async (productoId: string, tipo: TipoEvento, descripcion: string, datos?: Record<string, unknown>) => {
      const evento: Evento = { id: nuevoId(), productoId, tipo, descripcion, datos: datos ?? {}, fecha: ahora(), usuario: usuario?.nombre ?? null };
      await guardar("eventos", evento);
    },
    [guardar, usuario],
  );

  const crearProducto = useCallback(
    async (producto: Producto, variantes: Variante[], costos: Costo[]) => {
      await guardar("productos", producto);
      for (const v of variantes) await guardar("variantes", v);
      for (const c of costos) await guardar("costos", c);
      await registrarEvento(producto.id, "creacion", `Creación del producto${producto.version > 1 ? ` (v${producto.version})` : ""}`);
      if (modo === "demo" && producto.precioVenta > 0)
        await guardar("precios", { id: nuevoId(), productoId: producto.id, precio: producto.precioVenta, fecha: ahora(), motivo: "Precio inicial" });
    },
    [guardar, registrarEvento, modo],
  );

  const duplicarProducto = useCallback(
    async (id: string) => {
      const original = db.productos.find((p) => p.id === id);
      if (!original) throw new Error("Producto no encontrado");
      const raiz = original.productoOrigenId ?? original.id;
      const version = Math.max(...db.productos.filter((p) => p.id === raiz || p.productoOrigenId === raiz).map((p) => p.version)) + 1;
      const copia: Producto = {
        ...original,
        id: nuevoId(),
        nombre: `${original.nombre.replace(/ v\d+$/, "")} v${version}`,
        sku: `${original.sku.replace(/-V\d+$/, "")}-V${version}`,
        estado: "desarrollo",
        productoOrigenId: raiz,
        version,
        creadoEn: ahora(),
      };
      const mapaVariantes = new Map<string, string>();
      const variantes = db.variantes
        .filter((v) => v.productoId === id)
        .map((v) => {
          const nueva = { ...v, id: nuevoId(), productoId: copia.id, sku: `${copia.sku}-${v.sku.split("-").slice(-2).join("-")}` };
          mapaVariantes.set(v.id, nueva.id);
          return nueva;
        });
      // Se copian los costos como estimados, sin lote ni valores reales: es una nueva versión por costear.
      const costos = db.costos
        .filter((c) => c.productoId === id)
        .map((c) => ({
          ...c,
          id: nuevoId(),
          productoId: copia.id,
          loteId: null,
          varianteId: c.varianteId ? (mapaVariantes.get(c.varianteId) ?? null) : null,
          valorReal: null,
          causaDiferencia: null,
          estado: "estimado" as const,
          cantidadUnidades: c.tipo === "variable" && c.loteId ? (db.lotes.find((l) => l.id === c.loteId)?.unidadesEstimadas ?? c.cantidadUnidades) : c.cantidadUnidades,
        }));
      await crearProducto(copia, variantes, costos);
      await registrarEvento(original.id, "version", `Se creó la versión v${version}`, { nuevoId: copia.id });
      return copia.id;
    },
    [db, crearProducto, registrarEvento],
  );

  const cambiarPrecio = useCallback(
    async (productoId: string, precio: number, motivo: string, base?: Producto) => {
      const p = base ?? db.productos.find((x) => x.id === productoId);
      if (!p || p.precioVenta === precio) return;
      await guardar("productos", { ...p, precioVenta: precio });
      // En Supabase el historial de precios lo registra un trigger.
      if (modo === "demo") await guardar("precios", { id: nuevoId(), productoId, precio, fecha: ahora(), motivo });
      await registrarEvento(productoId, "cambio_precio", `Precio ${p.precioVenta.toLocaleString("es-CO")} → ${precio.toLocaleString("es-CO")}${motivo ? ` (${motivo})` : ""}`, {
        antes: p.precioVenta,
        despues: precio,
      });
    },
    [db.productos, guardar, registrarEvento, modo],
  );

  const reiniciarDemo = useCallback(() => {
    if (repo.current instanceof RepositorioDemo) setDb(repo.current.reiniciar());
  }, []);

  const cambiarRolDemo = useCallback((rol: Rol) => {
    try {
      localStorage.setItem(CLAVE_ROL_DEMO, rol);
    } catch {}
    setUsuario((u) => (u ? { ...u, rol } : u));
  }, []);

  const token = useCallback(async () => {
    if (!supabaseConfigurado) return null;
    const { data } = await obtenerSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const cerrarSesion = useCallback(async () => {
    if (supabaseConfigurado) await obtenerSupabase().auth.signOut();
    setUsuario(null);
    setDb(VACIA);
    router.replace("/acceso");
  }, [router]);

  const valor = useMemo<ContextoMartha>(
    () => ({
      modo,
      cargando,
      error,
      db,
      tasas: tasasVigentes(db.tasas),
      usuario,
      esAdmin: usuario?.rol === "admin",
      guardar,
      eliminar,
      guardarConfiguracion,
      registrarEvento,
      crearProducto,
      duplicarProducto,
      cambiarPrecio,
      reiniciarDemo,
      cambiarRolDemo,
      token,
      cerrarSesion,
    }),
    [modo, cargando, error, db, usuario, guardar, eliminar, guardarConfiguracion, registrarEvento, crearProducto, duplicarProducto, cambiarPrecio, reiniciarDemo, cambiarRolDemo, token, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMartha(): ContextoMartha {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useMartha debe usarse dentro de <MarthaProvider>");
  return ctx;
}
