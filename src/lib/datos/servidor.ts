import "server-only";
import type { BaseDatos, Producto } from "@/tipos";
import { perfilMartha, supabaseConfigurado } from "@/lib/supabase/cliente";
import { ErrorHttp, clienteDeUsuario, tokenDe } from "@/lib/supabase/servidor";
import { calcularProducto, tasasVigentes } from "@/lib/calculos/motor";
import { RepositorioSupabase } from "./repositorio";
import { crearSemilla } from "./semilla";

/** Datos para la API: semilla en modo demo; en Supabase, lo que la RLS deja ver al usuario del token. */
export async function cargarParaApi(request: Request): Promise<BaseDatos> {
  if (!supabaseConfigurado) return crearSemilla();
  const cliente = clienteDeUsuario(tokenDe(request));
  const { data, error } = await cliente.auth.getUser();
  if (error || !data.user) throw new ErrorHttp(401, "Sesión inválida o vencida.");
  if (!(await perfilMartha(cliente, data.user.id))) throw new ErrorHttp(403, "El usuario no tiene acceso a Martha.");
  return new RepositorioSupabase(cliente).cargar();
}

export function resumenProducto(db: BaseDatos, p: Producto) {
  const r = calcularProducto({ producto: p, costos: db.costos, lotes: db.lotes, tasas: tasasVigentes(db.tasas) });
  return {
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    categoria: p.categoria,
    estado: p.estado,
    version: p.version,
    moneda: "COP",
    precio_venta: r.precio,
    costo_unitario: Math.round(r.costoTotalUnitario),
    landed_cost: Math.round(r.landedCost),
    costos_venta_unitario: Math.round(r.costoVentaUnitario),
    margen_bruto: r.margenBruto,
    margen_neto: r.margenNeto,
    utilidad_unitaria: Math.round(r.utilidadUnitaria),
    precio_minimo: r.precioMinimo && Math.round(r.precioMinimo),
    precio_sugerido: r.precioSugerido && Math.round(r.precioSugerido),
    precio_equilibrio: r.precioEquilibrio && Math.round(r.precioEquilibrio),
    inversion_total: Math.round(r.inversionTotal),
    semaforo: r.semaforo,
  };
}
