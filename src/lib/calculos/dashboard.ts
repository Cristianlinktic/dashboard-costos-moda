import type { BaseDatos, CategoriaCosto, Producto } from "@/tipos";
import {
  calcularProducto,
  compararLote,
  tasasVigentes,
  totalCostoCOP,
  type ComparacionLote,
  type ResultadoCalculo,
  type Tasas,
} from "./motor";

export interface FiltrosDashboard {
  productoId?: string;
  proveedorId?: string;
  loteId?: string;
  categoria?: string;
  desde?: string;
  hasta?: string;
}

export interface ProductoCalculado {
  producto: Producto;
  calculo: ResultadoCalculo;
}

export interface MetricasDashboard {
  productos: ProductoCalculado[];
  inversionTotal: number;
  costoPromedioUnidad: number;
  masCostosos: ProductoCalculado[];
  mejorMargen: ProductoCalculado | null;
  peorMargen: ProductoCalculado | null;
  costosPorCategoria: { categoria: CategoriaCosto; total: number }[];
  estimadoVsReal: ComparacionLote[];
  margenBajo: ProductoCalculado[];
  evolucionMensual: { mes: string; inversion: number; costoUnitario: number | null }[];
}

/** Calcula cada producto con todos sus costos (el costo unitario no depende de los filtros de fecha). */
export function calcularTodos(db: BaseDatos, tasas: Tasas = tasasVigentes(db.tasas)): ProductoCalculado[] {
  return db.productos.map((producto) => ({
    producto,
    calculo: calcularProducto({ producto, costos: db.costos, lotes: db.lotes, tasas }),
  }));
}

export function metricasDashboard(db: BaseDatos, f: FiltrosDashboard = {}): MetricasDashboard {
  const tasas = tasasVigentes(db.tasas);
  const productos = calcularTodos(db, tasas).filter(
    ({ producto: p }) =>
      (!f.productoId || p.id === f.productoId) &&
      (!f.proveedorId || p.proveedorId === f.proveedorId || db.lotes.some((l) => l.productoId === p.id && l.proveedorId === f.proveedorId)) &&
      (!f.categoria || p.categoria === f.categoria) &&
      (!f.loteId || db.lotes.some((l) => l.id === f.loteId && l.productoId === p.id)),
  );
  const ids = new Set(productos.map((p) => p.producto.id));

  // Los filtros de lote y fecha aplican a la inversión registrada.
  const costos = db.costos.filter(
    (c) =>
      ids.has(c.productoId) &&
      (!f.loteId || c.loteId === f.loteId) &&
      (!f.desde || c.fecha >= f.desde) &&
      (!f.hasta || c.fecha <= f.hasta),
  );

  const porCategoria = new Map<CategoriaCosto, number>();
  const porMes = new Map<string, number>();
  let inversionTotal = 0;
  for (const c of costos) {
    const total = totalCostoCOP(c, tasas);
    inversionTotal += total;
    porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + total);
    const mes = c.fecha.slice(0, 7);
    porMes.set(mes, (porMes.get(mes) ?? 0) + total);
  }

  const lotes = db.lotes.filter(
    (l) =>
      ids.has(l.productoId) &&
      (!f.loteId || l.id === f.loteId) &&
      (!f.proveedorId || !l.proveedorId || l.proveedorId === f.proveedorId) &&
      (!f.desde || l.fecha >= f.desde) &&
      (!f.hasta || l.fecha <= f.hasta),
  );
  const estimadoVsReal = lotes.map((l) => compararLote(l, db.costos, tasas)).filter((c) => c.filas.length > 0);

  // Costo unitario real promedio de los lotes por mes.
  const unitarioPorMes = new Map<string, number[]>();
  for (const c of estimadoVsReal) {
    const mes = c.lote.fecha.slice(0, 7);
    unitarioPorMes.set(mes, [...(unitarioPorMes.get(mes) ?? []), c.unitarioReal]);
    if (!porMes.has(mes)) porMes.set(mes, 0);
  }
  const evolucionMensual = [...porMes.keys()].sort().map((mes) => {
    const u = unitarioPorMes.get(mes);
    return { mes, inversion: porMes.get(mes) ?? 0, costoUnitario: u ? u.reduce((a, b) => a + b, 0) / u.length : null };
  });

  const conPrecio = productos.filter((p) => p.calculo.margenNeto !== null);
  const ordenMargen = [...conPrecio].sort((a, b) => b.calculo.margenNeto! - a.calculo.margenNeto!);

  return {
    productos,
    inversionTotal,
    costoPromedioUnidad: productos.length
      ? productos.reduce((s, p) => s + p.calculo.costoTotalUnitario, 0) / productos.length
      : 0,
    masCostosos: [...productos].sort((a, b) => b.calculo.costoTotalUnitario - a.calculo.costoTotalUnitario).slice(0, 5),
    mejorMargen: ordenMargen[0] ?? null,
    peorMargen: ordenMargen.at(-1) ?? null,
    costosPorCategoria: [...porCategoria.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total),
    estimadoVsReal,
    margenBajo: ordenMargen.filter((p) => p.calculo.semaforo === "rojo" || p.calculo.semaforo === "amarillo").reverse(),
    evolucionMensual,
  };
}
