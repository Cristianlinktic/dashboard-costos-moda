// Motor de cálculo de Martha: funciones puras, sin I/O. Todas las cifras de salida están en COP.
import type {
  CategoriaCosto,
  CausaDiferencia,
  CodigoMoneda,
  Costo,
  CostosVenta,
  Lote,
  ParametrosEscenario,
  Producto,
  TasaCambio,
} from "@/tipos";
import { CATEGORIAS, type GrupoCosto } from "./catalogo";

export type Tasas = Partial<Record<CodigoMoneda, number>>;
export type Semaforo = "verde" | "amarillo" | "rojo" | "gris";
/** Qué valor usar de cada costo: el real si existe (efectivo), solo el estimado, o solo el real. */
export type ModoValorCalculo = "efectivo" | "estimado";

export const MARGENES_REFERENCIA = [0.3, 0.4, 0.5] as const;

// ---------------------------------------------------------------------------
// Monedas
// ---------------------------------------------------------------------------

/** Tasa vigente (la más reciente) por moneda. COP siempre vale 1. */
export function tasasVigentes(tasas: TasaCambio[]): Tasas {
  const resultado: Tasas = { COP: 1 };
  const fechas: Partial<Record<CodigoMoneda, string>> = {};
  for (const t of tasas) {
    if (!fechas[t.moneda] || t.fecha > fechas[t.moneda]!) {
      fechas[t.moneda] = t.fecha;
      resultado[t.moneda] = t.tasaCop;
    }
  }
  resultado.COP = 1;
  return resultado;
}

/**
 * Tasa a COP para un costo. Prioridad: tasa forzada (simulador) → tasa congelada del costo → tasa vigente.
 */
export function tasaParaCosto(costo: Pick<Costo, "moneda" | "tasaCambio">, tasas: Tasas, forzadas?: Tasas): number {
  if (costo.moneda === "COP") return 1;
  const tasa = forzadas?.[costo.moneda] ?? costo.tasaCambio ?? tasas[costo.moneda];
  if (!tasa || tasa <= 0) throw new Error(`No hay tasa de cambio para ${costo.moneda}`);
  return tasa;
}

export function convertirACOP(valor: number, moneda: CodigoMoneda, tasas: Tasas): number {
  return valor * tasaParaCosto({ moneda, tasaCambio: null }, tasas);
}

// ---------------------------------------------------------------------------
// Costos individuales
// ---------------------------------------------------------------------------

export interface OpcionesCosto {
  modo?: ModoValorCalculo;
  tasasForzadas?: Tasas;
}

/** Valor total del costo en COP. Si el modo es "unitario", se multiplica por las unidades. */
export function totalCostoCOP(costo: Costo, tasas: Tasas, opciones: OpcionesCosto = {}): number {
  const base = opciones.modo === "estimado" ? costo.valor : (costo.valorReal ?? costo.valor);
  const bruto = costo.modo === "unitario" ? base * costo.cantidadUnidades : base;
  return bruto * tasaParaCosto(costo, tasas, opciones.tasasForzadas);
}

export function esVariable(costo: Pick<Costo, "tipo">): boolean {
  return costo.tipo === "variable";
}

/**
 * Unidades entre las que se reparten los costos fijos/únicos/recurrentes:
 * las estimadas del producto o las producidas en sus lotes.
 */
export function unidadesBase(producto: Pick<Producto, "id" | "unidadesEstimadas" | "baseAsignacion">, lotes: Lote[]): number {
  if (producto.baseAsignacion === "producidas") {
    const producidas = lotes
      .filter((l) => l.productoId === producto.id)
      .reduce((s, l) => s + (l.unidadesReales ?? 0), 0);
    if (producidas > 0) return producidas;
  }
  return Math.max(1, producto.unidadesEstimadas);
}

/**
 * Unidades de los lotes del producto que tienen costos variables asociados
 * (reales si ya se recibieron, si no las estimadas). Con varios lotes el costo
 * unitario resultante es el promedio ponderado entre lotes.
 */
export function unidadesEnLotes(productoId: string, costos: Costo[], lotes: Lote[]): number {
  const ids = new Set(costos.filter((c) => c.productoId === productoId && esVariable(c) && c.loteId).map((c) => c.loteId));
  return lotes
    .filter((l) => l.productoId === productoId && ids.has(l.id))
    .reduce((s, l) => s + (l.unidadesReales ?? l.unidadesEstimadas), 0);
}

/**
 * Cuánto aporta un costo al costo por unidad.
 * Costo unitario = suma de costos asignados / unidades del lote (variables) o unidades base (fijos).
 * Un costo variable asociado a un lote se divide entre las unidades de los lotes; si no tiene lote,
 * entre su propia cantidad de unidades.
 */
export function costoPorUnidad(
  costo: Costo,
  unidadesBaseProducto: number,
  tasas: Tasas,
  opciones: OpcionesCosto = {},
  unidadesLotes = 0,
): number {
  const total = totalCostoCOP(costo, tasas, opciones);
  let divisor = unidadesBaseProducto;
  if (esVariable(costo)) divisor = costo.loteId && unidadesLotes > 0 ? unidadesLotes : costo.cantidadUnidades;
  return total / Math.max(1, divisor);
}

// ---------------------------------------------------------------------------
// Precios y márgenes
// ---------------------------------------------------------------------------

export function costoVentaFijoUnitario(cv: CostosVenta, extraUnitario = 0): number {
  return cv.publicidadUnidad + cv.envioClienteUnidad + cv.otrosVentaUnidad + extraUnitario;
}

export function costoVentaPct(cv: CostosVenta): number {
  return cv.comisionCanalPct + cv.pasarelaPct;
}

/** Margen bruto = (precio − costo unitario) / precio. null si no hay precio. */
export function margenBruto(precio: number, costoUnitario: number): number | null {
  if (precio <= 0) return null;
  return (precio - costoUnitario) / precio;
}

/** Margen neto = (precio − costo unitario − costos de venta) / precio. null si no hay precio. */
export function margenNeto(precio: number, costoUnitario: number, costosVentaUnitarios: number): number | null {
  if (precio <= 0) return null;
  return (precio - costoUnitario - costosVentaUnitarios) / precio;
}

/**
 * Precio necesario para lograr un margen neto objetivo m:
 *   p − C − pct·p − F = m·p  →  p = (C + F) / (1 − pct − m)
 * Devuelve null cuando el margen es inalcanzable (comisiones + margen ≥ 100 %).
 */
export function precioParaMargen(costoUnitario: number, margen: number, pctVenta: number, fijoVenta: number): number | null {
  const denominador = 1 - pctVenta - margen;
  if (denominador <= 0) return null;
  return (costoUnitario + fijoVenta) / denominador;
}

export function semaforo(margen: number | null, margenMinimo: number): Semaforo {
  if (margen === null) return "gris";
  if (margen < 0) return "rojo";
  if (margen < margenMinimo) return "amarillo";
  return "verde";
}

/** Unidades a vender para recuperar una inversión, dado lo que deja cada venta después de costos de venta. */
export function unidadesParaRecuperar(inversion: number, precio: number, pctVenta: number, fijoVenta: number): number | null {
  const aporte = precio * (1 - pctVenta) - fijoVenta;
  if (aporte <= 0) return null;
  return Math.ceil(inversion / aporte);
}

// ---------------------------------------------------------------------------
// Cálculo completo de un producto
// ---------------------------------------------------------------------------

export interface LineaDesglose {
  costoId: string;
  nombre: string;
  categoria: CategoriaCosto;
  grupo: GrupoCosto;
  variable: boolean;
  total: number;
  unitario: number;
  /** Participación en el costo total por unidad (0–1). */
  participacion: number;
}

export interface ResultadoCalculo {
  unidadesBase: number;
  precio: number;
  costoDirectoUnitario: number;
  costoLlegadaUnitario: number;
  landedCost: number;
  costoIndirectoUnitario: number;
  fijosAsignadosUnitario: number;
  costoVariableUnitario: number;
  costoTotalUnitario: number;
  costoVentaPct: number;
  costoVentaFijoUnitario: number;
  costoVentaUnitario: number;
  margenBruto: number | null;
  margenNeto: number | null;
  utilidadUnitaria: number;
  precioMinimo: number | null;
  precioSugerido: number | null;
  precioEquilibrio: number | null;
  preciosReferencia: { margen: number; precio: number | null }[];
  /** Unidades a vender para cubrir los costos fijos (contribución marginal). */
  unidadesEquilibrio: number | null;
  inversionTotal: number;
  inversionFija: number;
  porGrupo: Record<GrupoCosto, number>;
  desglose: LineaDesglose[];
  semaforo: Semaforo;
}

export interface EntradaCalculo {
  producto: Producto;
  costos: Costo[];
  lotes: Lote[];
  tasas: Tasas;
  /** Si se indica, incluye los costos específicos de la variante y su costo adicional. */
  varianteId?: string | null;
  costoAdicionalUnitario?: number;
  precio?: number;
  modo?: ModoValorCalculo;
  tasasForzadas?: Tasas;
  unidadesBase?: number;
}

export function calcularProducto(e: EntradaCalculo): ResultadoCalculo {
  const { producto, tasas } = e;
  const opciones: OpcionesCosto = { modo: e.modo, tasasForzadas: e.tasasForzadas };
  const base = e.unidadesBase ?? unidadesBase(producto, e.lotes);
  const costos = e.costos.filter(
    (c) => c.productoId === producto.id && (!c.varianteId || c.varianteId === e.varianteId),
  );

  const unidadesLotes = unidadesEnLotes(producto.id, costos, e.lotes);
  const porGrupo: Record<GrupoCosto, number> = { producto: 0, llegada: 0, indirecto: 0, venta: 0 };
  let fijos = 0;
  let variables = 0;
  let inversionTotal = 0;
  let inversionFija = 0;
  const lineas: Omit<LineaDesglose, "participacion">[] = [];

  for (const c of costos) {
    const total = totalCostoCOP(c, tasas, opciones);
    const unitario = costoPorUnidad(c, base, tasas, opciones, unidadesLotes);
    const grupo = CATEGORIAS[c.categoria].grupo;
    porGrupo[grupo] += unitario;
    if (esVariable(c)) variables += unitario;
    else {
      fijos += unitario;
      inversionFija += total;
    }
    inversionTotal += total;
    lineas.push({ costoId: c.id, nombre: c.nombre, categoria: c.categoria, grupo, variable: esVariable(c), total, unitario });
  }

  const adicional = e.costoAdicionalUnitario ?? 0;
  porGrupo.producto += adicional;
  variables += adicional;

  const costoDirectoUnitario = porGrupo.producto;
  const costoLlegadaUnitario = porGrupo.llegada;
  const landedCost = costoDirectoUnitario + costoLlegadaUnitario;
  const costoTotalUnitario = landedCost + porGrupo.indirecto;

  const pct = costoVentaPct(producto);
  const fijoVenta = costoVentaFijoUnitario(producto, porGrupo.venta);
  const precio = e.precio ?? producto.precioVenta;
  const costoVentaUnitario = precio * pct + fijoVenta;
  const mn = margenNeto(precio, costoTotalUnitario, costoVentaUnitario);

  // Los costos del grupo "venta" se tratan como costo de venta, no como costo del producto.
  const variablesProducto = variables - (lineas.filter((l) => l.grupo === "venta" && l.variable).reduce((s, l) => s + l.unitario, 0));
  const fijosProducto = fijos - (lineas.filter((l) => l.grupo === "venta" && !l.variable).reduce((s, l) => s + l.unitario, 0));
  const contribucion = precio - variablesProducto - costoVentaUnitario;
  const unidadesEquilibrio =
    precio > 0 && contribucion > 0 ? Math.ceil((fijosProducto * base) / contribucion) : null;

  const totalParaParticipacion = costoTotalUnitario + porGrupo.venta || 1;
  const desglose = lineas
    .map((l) => ({ ...l, participacion: l.unitario / totalParaParticipacion }))
    .sort((a, b) => b.unitario - a.unitario);

  return {
    unidadesBase: base,
    precio,
    costoDirectoUnitario,
    costoLlegadaUnitario,
    landedCost,
    costoIndirectoUnitario: porGrupo.indirecto,
    fijosAsignadosUnitario: fijosProducto,
    costoVariableUnitario: variablesProducto,
    costoTotalUnitario,
    costoVentaPct: pct,
    costoVentaFijoUnitario: fijoVenta,
    costoVentaUnitario,
    margenBruto: margenBruto(precio, costoTotalUnitario),
    margenNeto: mn,
    utilidadUnitaria: precio - costoTotalUnitario - costoVentaUnitario,
    precioMinimo: precioParaMargen(costoTotalUnitario, producto.margenMinimo, pct, fijoVenta),
    precioSugerido: precioParaMargen(costoTotalUnitario, producto.margenObjetivo, pct, fijoVenta),
    precioEquilibrio: precioParaMargen(costoTotalUnitario, 0, pct, fijoVenta),
    preciosReferencia: MARGENES_REFERENCIA.map((m) => ({ margen: m, precio: precioParaMargen(costoTotalUnitario, m, pct, fijoVenta) })),
    unidadesEquilibrio,
    inversionTotal,
    inversionFija,
    porGrupo,
    desglose,
    semaforo: semaforo(mn, producto.margenMinimo),
  };
}

/** Mensaje explicativo: cuánto sube el costo unitario al agregar este costo. */
export function impactoCosto(costo: Costo, producto: Producto, costos: Costo[], lotes: Lote[], tasas: Tasas): number {
  const unidadesLotes = unidadesEnLotes(producto.id, [...costos, costo], lotes);
  return costoPorUnidad(costo, unidadesBase(producto, lotes), tasas, {}, unidadesLotes);
}

// ---------------------------------------------------------------------------
// Lotes: estimado vs. real
// ---------------------------------------------------------------------------

export interface FilaComparacion {
  costo: Costo;
  estimado: number;
  real: number;
  diferencia: number;
  diferenciaPct: number | null;
  pendiente: boolean;
}

export interface ComparacionLote {
  lote: Lote;
  estimadoTotal: number;
  realTotal: number;
  diferencia: number;
  diferenciaPct: number | null;
  unitarioEstimado: number;
  unitarioReal: number;
  unitarioDiferenciaPct: number | null;
  merma: number;
  pendientes: number;
  filas: FilaComparacion[];
  causas: Partial<Record<CausaDiferencia, number>>;
}

const pctCambio = (antes: number, despues: number) => (antes === 0 ? null : (despues - antes) / antes);

export function compararLote(lote: Lote, costos: Costo[], tasas: Tasas): ComparacionLote {
  const delLote = costos.filter((c) => c.loteId === lote.id);
  const causas: Partial<Record<CausaDiferencia, number>> = {};
  const filas = delLote.map((c) => {
    const estimado = totalCostoCOP(c, tasas, { modo: "estimado" });
    const real = totalCostoCOP(c, tasas, { modo: "efectivo" });
    const diferencia = real - estimado;
    if (diferencia !== 0) {
      const causa = c.causaDiferencia ?? "otro";
      causas[causa] = (causas[causa] ?? 0) + diferencia;
    }
    return { costo: c, estimado, real, diferencia, diferenciaPct: pctCambio(estimado, real), pendiente: c.valorReal == null };
  });
  const estimadoTotal = filas.reduce((s, f) => s + f.estimado, 0);
  const realTotal = filas.reduce((s, f) => s + f.real, 0);
  const unidadesReales = lote.unidadesReales ?? lote.unidadesEstimadas;
  const unitarioEstimado = estimadoTotal / Math.max(1, lote.unidadesEstimadas);
  const unitarioReal = realTotal / Math.max(1, unidadesReales);
  return {
    lote,
    estimadoTotal,
    realTotal,
    diferencia: realTotal - estimadoTotal,
    diferenciaPct: pctCambio(estimadoTotal, realTotal),
    unitarioEstimado,
    unitarioReal,
    unitarioDiferenciaPct: pctCambio(unitarioEstimado, unitarioReal),
    merma: lote.unidadesReales != null ? Math.max(0, lote.unidadesEstimadas - lote.unidadesReales) : 0,
    pendientes: filas.filter((f) => f.pendiente).length,
    filas,
    causas,
  };
}

// ---------------------------------------------------------------------------
// Simulador de escenarios
// ---------------------------------------------------------------------------

const CATEGORIAS_FLETE: CategoriaCosto[] = ["flete", "seguro"];
const CATEGORIAS_PROVEEDOR: CategoriaCosto[] = ["materia_prima", "mano_obra"];

export function escenarioBase(producto: Producto, lotes: Lote[], nombre = "Actual"): ParametrosEscenario {
  return {
    nombre,
    precio: producto.precioVenta,
    tasas: {},
    variacionFletePct: 0,
    variacionProveedorPct: 0,
    volumen: unidadesBase(producto, lotes),
    descuentoPct: 0,
    comisionCanalPct: producto.comisionCanalPct,
    publicidadUnidad: producto.publicidadUnidad,
  };
}

export interface ResultadoEscenario extends ResultadoCalculo {
  parametros: ParametrosEscenario;
  precioEfectivo: number;
  alertas: string[];
}

export function simularEscenario(
  producto: Producto,
  costos: Costo[],
  lotes: Lote[],
  tasas: Tasas,
  p: ParametrosEscenario,
): ResultadoEscenario {
  const ajustarValor = (c: Costo, factor: number): Costo => ({
    ...c,
    valor: c.valor * factor,
    valorReal: c.valorReal != null ? c.valorReal * factor : c.valorReal,
  });
  const costosSimulados = costos.map((c) => {
    if (CATEGORIAS_FLETE.includes(c.categoria)) return ajustarValor(c, 1 + p.variacionFletePct);
    if (CATEGORIAS_PROVEEDOR.includes(c.categoria)) return ajustarValor(c, 1 + p.variacionProveedorPct);
    return c;
  });
  const productoSimulado: Producto = {
    ...producto,
    comisionCanalPct: p.comisionCanalPct,
    publicidadUnidad: p.publicidadUnidad,
  };
  const precioEfectivo = p.precio * (1 - p.descuentoPct);
  const r = calcularProducto({
    producto: productoSimulado,
    costos: costosSimulados,
    lotes,
    tasas,
    precio: precioEfectivo,
    tasasForzadas: p.tasas,
    unidadesBase: Math.max(1, p.volumen),
  });

  const alertas: string[] = [];
  if (r.margenNeto !== null && r.margenNeto < 0) alertas.push("Pérdida: el precio no cubre los costos.");
  else if (r.margenNeto !== null && r.margenNeto < producto.margenMinimo)
    alertas.push(`Margen por debajo del mínimo (${Math.round(producto.margenMinimo * 100)} %).`);
  if (r.precioMinimo === null) alertas.push("Margen mínimo inalcanzable con estas comisiones.");
  return { ...r, parametros: p, precioEfectivo, alertas };
}
