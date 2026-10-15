import { describe, expect, it } from "vitest";
import type { Costo, Lote, Producto } from "@/tipos";
import {
  calcularProducto,
  compararLote,
  convertirACOP,
  costoPorUnidad,
  escenarioBase,
  margenBruto,
  margenNeto,
  precioParaMargen,
  semaforo,
  simularEscenario,
  tasaParaCosto,
  tasasVigentes,
  totalCostoCOP,
  unidadesBase,
  unidadesParaRecuperar,
} from "./motor";
import { metricasDashboard } from "./dashboard";
import { crearSemilla } from "@/lib/datos/semilla";
import { formatoCOP, formatoPct } from "@/lib/formato";

const producto: Producto = {
  id: "p1",
  nombre: "Faja colombiana clásica",
  sku: "FAJ-CLA-001",
  categoria: "Fajas",
  paisOrigen: "Colombia",
  monedaBase: "COP",
  estado: "activo",
  version: 1,
  unidadesEstimadas: 1000,
  baseAsignacion: "estimadas",
  precioVenta: 189_000,
  margenMinimo: 0.25,
  margenObjetivo: 0.4,
  comisionCanalPct: 0.1,
  pasarelaPct: 0.035,
  publicidadUnidad: 18_000,
  envioClienteUnidad: 12_000,
  otrosVentaUnidad: 0,
  creadoEn: "2026-01-12",
};

let n = 0;
const costo = (c: Partial<Costo>): Costo => ({
  id: `c${++n}`,
  productoId: "p1",
  categoria: "materia_prima",
  nombre: "costo",
  tipo: "variable",
  moneda: "COP",
  modo: "total",
  valor: 0,
  cantidadUnidades: 500,
  fecha: "2026-02-10",
  estado: "pagado",
  ...c,
});

// Ejemplo trabajado de docs/02-modelo-de-datos.md
const costosEjemplo: Costo[] = [
  costo({ nombre: "Tela", valor: 11_000_000 }),
  costo({ nombre: "Confección", categoria: "mano_obra", valor: 7_500_000 }),
  costo({ nombre: "Insumos", valor: 2_250_000 }),
  costo({ nombre: "Empaque y etiquetas", categoria: "empaque", valor: 2_000_000 }),
  costo({ nombre: "Flete nacional", categoria: "flete", valor: 600_000 }),
  costo({ nombre: "Diseño y muestras", categoria: "desarrollo", tipo: "unico", valor: 3_200_000, cantidadUnidades: 1 }),
  costo({ nombre: "Fotografía", categoria: "creativo", tipo: "unico", valor: 1_800_000, cantidadUnidades: 1 }),
];

describe("monedas", () => {
  it("toma la tasa más reciente por moneda y COP = 1", () => {
    const t = tasasVigentes([
      { id: "1", moneda: "USD", tasaCop: 3900, fecha: "2026-01-01" },
      { id: "2", moneda: "USD", tasaCop: 4100, fecha: "2026-09-01" },
      { id: "3", moneda: "EUR", tasaCop: 4500, fecha: "2026-05-01" },
    ]);
    expect(t).toEqual({ COP: 1, USD: 4100, EUR: 4500 });
  });

  it("prioriza tasa forzada > congelada > vigente", () => {
    const vig = { COP: 1, USD: 4000 };
    expect(tasaParaCosto({ moneda: "USD", tasaCambio: null }, vig)).toBe(4000);
    expect(tasaParaCosto({ moneda: "USD", tasaCambio: 3800 }, vig)).toBe(3800);
    expect(tasaParaCosto({ moneda: "USD", tasaCambio: 3800 }, vig, { USD: 4300 })).toBe(4300);
    expect(convertirACOP(10, "USD", vig)).toBe(40_000);
  });

  it("falla si no hay tasa para la moneda", () => {
    expect(() => tasaParaCosto({ moneda: "EUR", tasaCambio: null }, { COP: 1 })).toThrow(/EUR/);
  });
});

describe("costos individuales", () => {
  it("total en modo unitario multiplica por unidades y convierte", () => {
    const c = costo({ moneda: "USD", modo: "unitario", valor: 12.5, cantidadUnidades: 300, tasaCambio: 4000 });
    expect(totalCostoCOP(c, { COP: 1 })).toBe(15_000_000);
  });

  it("usa el valor real si existe, salvo en modo estimado", () => {
    const c = costo({ valor: 1_000_000, valorReal: 1_200_000 });
    expect(totalCostoCOP(c, { COP: 1 })).toBe(1_200_000);
    expect(totalCostoCOP(c, { COP: 1 }, { modo: "estimado" })).toBe(1_000_000);
  });

  it("variable se divide entre unidades del lote; fijo entre unidades base", () => {
    expect(costoPorUnidad(costo({ valor: 11_000_000 }), 1000, { COP: 1 })).toBe(22_000);
    expect(costoPorUnidad(costo({ valor: 3_200_000, tipo: "unico" }), 1000, { COP: 1 })).toBe(3_200);
  });

  it("unidades base: estimadas o producidas en lotes", () => {
    const lotes: Lote[] = [
      { id: "l1", productoId: "p1", codigo: "L1", tipo: "produccion", estado: "recibido", unidadesEstimadas: 500, unidadesReales: 480, fecha: "2026-02-01" },
      { id: "l2", productoId: "p1", codigo: "L2", tipo: "produccion", estado: "recibido", unidadesEstimadas: 500, unidadesReales: 510, fecha: "2026-05-01" },
    ];
    expect(unidadesBase(producto, lotes)).toBe(1000);
    expect(unidadesBase({ ...producto, baseAsignacion: "producidas" }, lotes)).toBe(990);
    expect(unidadesBase({ ...producto, baseAsignacion: "producidas" }, [])).toBe(1000);
  });
});

describe("márgenes y precios", () => {
  it("margen bruto y neto según las fórmulas del brief", () => {
    expect(margenBruto(100, 60)).toBeCloseTo(0.4);
    expect(margenNeto(100, 60, 15)).toBeCloseTo(0.25);
    expect(margenBruto(0, 60)).toBeNull();
  });

  it("precio para margen despeja comisiones porcentuales", () => {
    // p = (C + F) / (1 − pct − m) = (60 + 5) / (1 − 0.1 − 0.25) = 100
    expect(precioParaMargen(60, 0.25, 0.1, 5)).toBeCloseTo(100);
    const p = precioParaMargen(60, 0.25, 0.1, 5)!;
    expect(margenNeto(p, 60, p * 0.1 + 5)).toBeCloseTo(0.25);
  });

  it("margen inalcanzable devuelve null", () => {
    expect(precioParaMargen(60, 0.9, 0.15, 0)).toBeNull();
  });

  it("semáforo verde / amarillo / rojo / gris", () => {
    expect(semaforo(0.4, 0.25)).toBe("verde");
    expect(semaforo(0.25, 0.25)).toBe("verde");
    expect(semaforo(0.1, 0.25)).toBe("amarillo");
    expect(semaforo(-0.01, 0.25)).toBe("rojo");
    expect(semaforo(null, 0.25)).toBe("gris");
  });

  it("unidades para recuperar una inversión", () => {
    // aporte = 100 × 0.9 − 10 = 80 → 1000 / 80 = 12,5 → 13
    expect(unidadesParaRecuperar(1000, 100, 0.1, 10)).toBe(13);
    expect(unidadesParaRecuperar(1000, 10, 0.1, 10)).toBeNull();
  });
});

describe("calcularProducto (ejemplo faja colombiana)", () => {
  const r = calcularProducto({ producto, costos: costosEjemplo, lotes: [], tasas: { COP: 1 } });

  it("costo directo, logística, landed cost y costo total por unidad", () => {
    expect(r.costoDirectoUnitario).toBeCloseTo(45_500);
    expect(r.costoLlegadaUnitario).toBeCloseTo(1_200);
    expect(r.landedCost).toBeCloseTo(46_700);
    expect(r.fijosAsignadosUnitario).toBeCloseTo(5_000);
    expect(r.costoTotalUnitario).toBeCloseTo(51_700);
  });

  it("costos de venta, márgenes y utilidad", () => {
    expect(r.costoVentaUnitario).toBeCloseTo(55_515);
    expect(r.margenBruto).toBeCloseTo(137_300 / 189_000);
    expect(r.margenNeto).toBeCloseTo(81_785 / 189_000);
    expect(r.utilidadUnitaria).toBeCloseTo(81_785);
    expect(r.semaforo).toBe("verde");
  });

  it("precio mínimo, sugerido y equilibrio cumplen su margen", () => {
    for (const [precio, m] of [
      [r.precioMinimo, 0.25],
      [r.precioSugerido, 0.4],
      [r.precioEquilibrio, 0],
    ] as const) {
      const vta = precio! * 0.135 + 30_000;
      expect(margenNeto(precio!, r.costoTotalUnitario, vta)).toBeCloseTo(m);
    }
    expect(r.preciosReferencia.map((x) => x.margen)).toEqual([0.3, 0.4, 0.5]);
  });

  it("inversión total y punto de equilibrio en unidades", () => {
    expect(r.inversionTotal).toBe(28_350_000);
    expect(r.inversionFija).toBe(5_000_000);
    // contribución = 189.000 − 46.700 − 55.515 = 86.785 → 5.000.000 / 86.785 = 57,6 → 58
    expect(r.unidadesEquilibrio).toBe(58);
  });

  it("desglose ordenado de mayor a menor impacto", () => {
    expect(r.desglose[0].nombre).toBe("Tela");
    expect(r.desglose[0].unitario).toBe(22_000);
  });

  it("variante suma su costo adicional y sus costos propios", () => {
    const conVariante = [...costosEjemplo, costo({ nombre: "Varilla extra XL", varianteId: "v-xl", valor: 250_000, cantidadUnidades: 100 })];
    const base = calcularProducto({ producto, costos: conVariante, lotes: [], tasas: { COP: 1 } });
    const xl = calcularProducto({ producto, costos: conVariante, lotes: [], tasas: { COP: 1 }, varianteId: "v-xl", costoAdicionalUnitario: 2_000 });
    expect(base.costoTotalUnitario).toBeCloseTo(51_700);
    expect(xl.costoTotalUnitario).toBeCloseTo(51_700 + 2_500 + 2_000);
  });

  it("varios lotes: el costo variable es el promedio ponderado por unidades", () => {
    const lotes: Lote[] = [
      { id: "a", productoId: "p1", codigo: "A", tipo: "produccion", estado: "recibido", unidadesEstimadas: 500, unidadesReales: 500, fecha: "2026-02-01" },
      { id: "b", productoId: "p1", codigo: "B", tipo: "produccion", estado: "recibido", unidadesEstimadas: 500, unidadesReales: 300, fecha: "2026-07-01" },
    ];
    const costos = [
      costo({ loteId: "a", valor: 10_000_000 }),
      costo({ loteId: "b", valor: 10_000_000 }),
    ];
    const r2 = calcularProducto({ producto, costos, lotes, tasas: { COP: 1 } });
    expect(r2.costoDirectoUnitario).toBeCloseTo(20_000_000 / 800);
  });

  it("producto sin precio: margen nulo y semáforo gris", () => {
    const sin = calcularProducto({ producto: { ...producto, precioVenta: 0 }, costos: costosEjemplo, lotes: [], tasas: { COP: 1 } });
    expect(sin.margenNeto).toBeNull();
    expect(sin.semaforo).toBe("gris");
  });
});

describe("lotes: estimado vs. real", () => {
  const lote: Lote = { id: "l1", productoId: "p1", codigo: "L-IMP-01", tipo: "importacion", estado: "recibido", unidadesEstimadas: 300, unidadesReales: 288, fecha: "2026-04-01" };
  const costos = [
    costo({ loteId: "l1", moneda: "USD", modo: "unitario", valor: 19.5, cantidadUnidades: 300, tasaCambio: 4000 }),
    costo({ loteId: "l1", categoria: "flete", valor: 2_600_000, valorReal: 3_200_000, causaDiferencia: "flete", cantidadUnidades: 300 }),
    costo({ loteId: "l1", categoria: "aduana", valor: 6_900_000, valorReal: 7_400_000, causaDiferencia: "impuestos", cantidadUnidades: 300 }),
    costo({ loteId: "otro", valor: 999 }),
  ];
  const c = compararLote(lote, costos, { COP: 1 });

  it("suma estimado y real y calcula la diferencia", () => {
    expect(c.estimadoTotal).toBe(23_400_000 + 2_600_000 + 6_900_000);
    expect(c.realTotal).toBe(23_400_000 + 3_200_000 + 7_400_000);
    expect(c.diferencia).toBe(1_100_000);
    expect(c.filas).toHaveLength(3);
  });

  it("costo unitario estimado vs real incluye la merma", () => {
    expect(c.unitarioEstimado).toBeCloseTo(32_900_000 / 300);
    expect(c.unitarioReal).toBeCloseTo(34_000_000 / 288);
    expect(c.merma).toBe(12);
  });

  it("agrupa diferencias por causa y cuenta pendientes", () => {
    expect(c.causas).toEqual({ flete: 600_000, impuestos: 500_000 });
    expect(c.pendientes).toBe(1);
  });
});

describe("simulador", () => {
  const tasas = { COP: 1, USD: 4000 };
  const costosUsd = [
    costo({ moneda: "USD", valor: 10, modo: "unitario", cantidadUnidades: 100, tasaCambio: 4000 }),
    costo({ categoria: "flete", valor: 1_000_000, cantidadUnidades: 100 }),
    costo({ categoria: "creativo", tipo: "unico", valor: 1_000_000 }),
  ];
  const p = { ...producto, unidadesEstimadas: 100 };

  it("escenario base reproduce el cálculo actual", () => {
    const s = simularEscenario(p, costosUsd, [], tasas, escenarioBase(p, []));
    const r = calcularProducto({ producto: p, costos: costosUsd, lotes: [], tasas });
    expect(s.costoTotalUnitario).toBeCloseTo(r.costoTotalUnitario);
    expect(s.margenNeto).toBeCloseTo(r.margenNeto!);
  });

  it("tasa de cambio, flete, proveedor y volumen modifican el costo", () => {
    const base = escenarioBase(p, []);
    // base: 40.000 + 10.000 + 10.000 = 60.000
    expect(simularEscenario(p, costosUsd, [], tasas, base).costoTotalUnitario).toBeCloseTo(60_000);
    expect(simularEscenario(p, costosUsd, [], tasas, { ...base, tasas: { USD: 4400 } }).costoTotalUnitario).toBeCloseTo(64_000);
    expect(simularEscenario(p, costosUsd, [], tasas, { ...base, variacionFletePct: 0.2 }).costoTotalUnitario).toBeCloseTo(62_000);
    expect(simularEscenario(p, costosUsd, [], tasas, { ...base, variacionProveedorPct: -0.1 }).costoTotalUnitario).toBeCloseTo(56_000);
    expect(simularEscenario(p, costosUsd, [], tasas, { ...base, volumen: 200 }).costoTotalUnitario).toBeCloseTo(55_000);
  });

  it("descuento reduce el precio efectivo y genera alertas", () => {
    const s = simularEscenario(p, costosUsd, [], tasas, { ...escenarioBase(p, []), precio: 100_000, descuentoPct: 0.1 });
    expect(s.precioEfectivo).toBe(90_000);
    expect(s.margenNeto!).toBeLessThan(0);
    expect(s.alertas[0]).toMatch(/Pérdida/);
  });
});

describe("datos semilla y dashboard", () => {
  const db = crearSemilla();

  it("todos los productos semilla se calculan sin errores y hay los tres semáforos", () => {
    const m = metricasDashboard(db);
    expect(m.productos.length).toBeGreaterThanOrEqual(5);
    const colores = new Set(m.productos.map((p) => p.calculo.semaforo));
    expect(colores).toContain("verde");
    expect(colores).toContain("amarillo");
    expect(colores).toContain("rojo");
    expect(m.inversionTotal).toBeGreaterThan(0);
    expect(m.estimadoVsReal.length).toBeGreaterThan(0);
    expect(m.mejorMargen!.calculo.margenNeto!).toBeGreaterThan(m.peorMargen!.calculo.margenNeto!);
  });

  it("los filtros reducen el universo", () => {
    const todos = metricasDashboard(db);
    const uno = metricasDashboard(db, { productoId: db.productos[0].id });
    expect(uno.productos).toHaveLength(1);
    expect(uno.inversionTotal).toBeLessThan(todos.inversionTotal);
    const fecha = metricasDashboard(db, { desde: "2099-01-01" });
    expect(fecha.inversionTotal).toBe(0);
  });
});

describe("formato", () => {
  it("formatea COP y porcentajes en español", () => {
    expect(formatoCOP(1234567)).toBe("$ 1.234.567");
    expect(formatoPct(0.4327)).toBe("43,3 %");
  });
});
