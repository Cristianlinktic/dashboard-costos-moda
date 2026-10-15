import type { ClienteMartha } from "@/lib/supabase/cliente";
import type { BaseDatos, Configuracion } from "@/tipos";
import { crearSemilla } from "./semilla";

export type Coleccion = Exclude<keyof BaseDatos, "configuracion">;
type Registro = { id: string };

export interface Repositorio {
  modo: "demo" | "supabase";
  cargar(): Promise<BaseDatos>;
  /** Inserta o actualiza (upsert por id). */
  guardar<T extends Registro>(coleccion: Coleccion, registro: T): Promise<T>;
  eliminar(coleccion: Coleccion, id: string): Promise<void>;
  guardarConfiguracion(cfg: Configuracion): Promise<void>;
}

// ---------------------------------------------------------------------------
// Modo demo: localStorage + datos semilla
// ---------------------------------------------------------------------------

const CLAVE_DEMO = "martha-demo-v1";

export class RepositorioDemo implements Repositorio {
  modo = "demo" as const;
  private db: BaseDatos | null = null;

  private leer(): BaseDatos {
    if (this.db) return this.db;
    try {
      const guardado = typeof window !== "undefined" ? window.localStorage.getItem(CLAVE_DEMO) : null;
      this.db = guardado ? (JSON.parse(guardado) as BaseDatos) : crearSemilla();
    } catch {
      this.db = crearSemilla();
    }
    return this.db;
  }

  private persistir() {
    try {
      window.localStorage.setItem(CLAVE_DEMO, JSON.stringify(this.db));
    } catch {
      // Sin almacenamiento (modo privado): la demo sigue funcionando en memoria.
    }
  }

  async cargar() {
    return structuredClone(this.leer());
  }

  async guardar<T extends Registro>(coleccion: Coleccion, registro: T): Promise<T> {
    const db = this.leer();
    const lista = db[coleccion] as unknown as Registro[];
    const i = lista.findIndex((r) => r.id === registro.id);
    if (i >= 0) lista[i] = registro;
    else lista.push(registro);
    this.persistir();
    return registro;
  }

  async eliminar(coleccion: Coleccion, id: string) {
    const db = this.leer();
    (db[coleccion] as unknown as Registro[]) = (db[coleccion] as unknown as Registro[]).filter((r) => r.id !== id);
    // Borrado en cascada como en Postgres.
    if (coleccion === "productos") {
      for (const c of ["variantes", "lotes", "costos", "precios", "eventos", "escenarios"] as const) {
        (db[c] as unknown as { productoId: string }[]) = (db[c] as unknown as { productoId: string }[]).filter(
          (r) => r.productoId !== id,
        );
      }
    }
    if (coleccion === "lotes") db.costos = db.costos.map((c) => (c.loteId === id ? { ...c, loteId: null } : c));
    this.persistir();
  }

  async guardarConfiguracion(cfg: Configuracion) {
    this.leer().configuracion = cfg;
    this.persistir();
  }

  reiniciar(): BaseDatos {
    this.db = crearSemilla();
    this.persistir();
    return structuredClone(this.db);
  }
}

// ---------------------------------------------------------------------------
// Supabase: las columnas son la versión snake_case de los campos del dominio
// ---------------------------------------------------------------------------

const TABLAS: Record<Coleccion, string> = {
  tasas: "tasas_cambio",
  proveedores: "proveedores",
  productos: "productos",
  variantes: "variantes",
  lotes: "lotes",
  costos: "costos",
  precios: "precios",
  eventos: "eventos",
  escenarios: "escenarios",
};

const aSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const aCamel = (k: string) => k.replace(/_([a-z])/g, (_, m: string) => m.toUpperCase());

/** Convierte solo las claves de primer nivel (los jsonb como `atributos` se conservan). */
export function filaADominio<T>(fila: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fila)) {
    if (k === "organizacion_id" || k === "creado_por" || k === "actualizado_en") continue;
    out[aCamel(k)] = v;
  }
  return out as T;
}

export function dominioAFila(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[aSnake(k)] = v;
  return out;
}

const CONFIG_POR_DEFECTO: Configuracion = crearSemilla().configuracion;

export class RepositorioSupabase implements Repositorio {
  modo = "supabase" as const;
  constructor(
    private cliente: ClienteMartha,
    private organizacionId?: string,
  ) {}

  async cargar(): Promise<BaseDatos> {
    const colecciones = Object.keys(TABLAS) as Coleccion[];
    const [config, ...resultados] = await Promise.all([
      this.cliente.from("configuraciones").select("*").maybeSingle(),
      ...colecciones.map((c) => this.cliente.from(TABLAS[c]).select("*")),
    ]);
    const error = [config, ...resultados].find((r) => r.error)?.error;
    if (error) throw new Error(error.message);
    const db = { configuracion: config.data ? filaADominio<Configuracion>(config.data) : CONFIG_POR_DEFECTO } as BaseDatos;
    colecciones.forEach((c, i) => {
      (db[c] as unknown[]) = (resultados[i].data ?? []).map((f) => filaADominio(f as Record<string, unknown>));
    });
    return db;
  }

  async guardar<T extends Registro>(coleccion: Coleccion, registro: T): Promise<T> {
    const { error } = await this.cliente.from(TABLAS[coleccion]).upsert(dominioAFila(registro));
    if (error) throw new Error(error.message);
    return registro;
  }

  async eliminar(coleccion: Coleccion, id: string) {
    const { error } = await this.cliente.from(TABLAS[coleccion]).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async guardarConfiguracion(cfg: Configuracion) {
    if (!this.organizacionId) throw new Error("Sin organización");
    const { error } = await this.cliente
      .from("configuraciones")
      .upsert({ organizacion_id: this.organizacionId, ...dominioAFila(cfg) });
    if (error) throw new Error(error.message);
  }
}
