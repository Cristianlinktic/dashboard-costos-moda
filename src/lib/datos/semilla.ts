// Datos semilla del modo demo: tienda de fajas en Colombia con compras nacionales e importadas.
import type { BaseDatos, Costo, Evento, Precio, Variante } from "@/tipos";

const TRM_USD = 4000;
const TRM_EUR = 4500;

type CostoSemilla = Omit<Costo, "id" | "productoId" | "estado" | "moneda" | "modo" | "tipo"> &
  Partial<Pick<Costo, "estado" | "moneda" | "modo" | "tipo">>;

function costos(productoId: string, prefijo: string, lista: CostoSemilla[]): Costo[] {
  return lista.map((c, i) => ({
    id: `${prefijo}-c${i + 1}`,
    productoId,
    moneda: "COP",
    modo: "total",
    tipo: "variable",
    estado: "pagado",
    ...c,
  }));
}

function variantes(productoId: string, sku: string, colores: string[], tallas: string[], extraXL = 0): Variante[] {
  const out: Variante[] = [];
  for (const color of colores) {
    for (const talla of tallas) {
      out.push({
        id: `${productoId}-${color.slice(0, 3).toLowerCase()}-${talla.toLowerCase()}`,
        productoId,
        sku: `${sku}-${color.slice(0, 3).toUpperCase()}-${talla}`,
        nombre: `${color} · ${talla}`,
        atributos: { color, talla },
        costoAdicionalUnitario: talla === "XL" ? extraXL : 0,
        precioVenta: null,
        unidades: 0,
      });
    }
  }
  return out;
}

export function crearSemilla(): BaseDatos {
  const cv = { comisionCanalPct: 0.1, pasarelaPct: 0.035, envioClienteUnidad: 12_000, otrosVentaUnidad: 0 };

  const productos: BaseDatos["productos"] = [
    {
      id: "p-faja-clasica",
      nombre: "Faja colombiana clásica",
      sku: "FAJ-CLA-001",
      categoria: "Fajas",
      descripcion: "Faja reductora en powernet con broches frontales y varillas. Línea insignia.",
      proveedorId: "prov-confecciones",
      paisOrigen: "Colombia",
      monedaBase: "COP",
      estado: "activo",
      version: 1,
      unidadesEstimadas: 1000,
      baseAsignacion: "estimadas",
      precioVenta: 189_000,
      margenMinimo: 0.25,
      margenObjetivo: 0.4,
      publicidadUnidad: 18_000,
      ...cv,
      creadoEn: "2026-01-12",
    },
    {
      id: "p-body-shaper",
      nombre: "Body shaper sin costuras",
      sku: "BOD-SEA-002",
      categoria: "Fajas",
      descripcion: "Body moldeador seamless importado. Alta rotación en marketplace.",
      proveedorId: "prov-guangzhou",
      paisOrigen: "China",
      monedaBase: "USD",
      estado: "activo",
      version: 1,
      unidadesEstimadas: 300,
      baseAsignacion: "producidas",
      precioVenta: 159_000,
      margenMinimo: 0.25,
      margenObjetivo: 0.4,
      publicidadUnidad: 15_000,
      ...cv,
      creadoEn: "2026-02-20",
    },
    {
      id: "p-chaleco-latex",
      nombre: "Chaleco reductor en látex",
      sku: "CHA-LAT-003",
      categoria: "Chalecos",
      descripcion: "Chaleco deportivo de látex con forro de algodón.",
      proveedorId: "prov-latex",
      paisOrigen: "Colombia",
      monedaBase: "COP",
      estado: "activo",
      version: 1,
      unidadesEstimadas: 400,
      baseAsignacion: "estimadas",
      precioVenta: 142_000,
      margenMinimo: 0.25,
      margenObjetivo: 0.4,
      publicidadUnidad: 22_000,
      ...cv,
      creadoEn: "2026-06-03",
    },
    {
      id: "p-short-encaje",
      nombre: "Short levantacola con encaje",
      sku: "SHO-ENC-004",
      categoria: "Shorts",
      descripcion: "Short moldeador con encaje italiano. Lote piloto con reproceso.",
      proveedorId: "prov-confecciones",
      paisOrigen: "Colombia",
      monedaBase: "COP",
      estado: "pausado",
      version: 1,
      unidadesEstimadas: 200,
      baseAsignacion: "estimadas",
      precioVenta: 89_000,
      margenMinimo: 0.25,
      margenObjetivo: 0.4,
      publicidadUnidad: 15_000,
      ...cv,
      creadoEn: "2026-04-18",
    },
    {
      id: "p-faja-clasica-v2",
      nombre: "Faja colombiana clásica v2",
      sku: "FAJ-CLA-001-V2",
      categoria: "Fajas",
      descripcion: "Mejora de la v1: powernet premium con mayor compresión y forro antibacterial.",
      proveedorId: "prov-confecciones",
      paisOrigen: "Colombia",
      monedaBase: "COP",
      estado: "desarrollo",
      productoOrigenId: "p-faja-clasica",
      version: 2,
      unidadesEstimadas: 1000,
      baseAsignacion: "estimadas",
      precioVenta: 199_000,
      margenMinimo: 0.25,
      margenObjetivo: 0.4,
      publicidadUnidad: 18_000,
      ...cv,
      creadoEn: "2026-08-02",
    },
  ];

  const lotes: BaseDatos["lotes"] = [
    { id: "l-fc-01", productoId: "p-faja-clasica", proveedorId: "prov-confecciones", codigo: "L-FC-01", tipo: "produccion", estado: "cerrado", unidadesEstimadas: 500, unidadesReales: 500, fecha: "2026-02-10", notas: "Primer lote de producción con taller satélite en Medellín." },
    { id: "l-imp-01", productoId: "p-body-shaper", proveedorId: "prov-guangzhou", codigo: "L-IMP-01", tipo: "importacion", estado: "recibido", unidadesEstimadas: 300, unidadesReales: 288, fecha: "2026-04-05", notas: "Importación marítima Shenzhen → Buenaventura. 12 unidades defectuosas." },
    { id: "l-sh-01", productoId: "p-short-encaje", proveedorId: "prov-confecciones", codigo: "L-SH-01", tipo: "produccion", estado: "recibido", unidadesEstimadas: 200, unidadesReales: 190, fecha: "2026-05-12", notas: "Reproceso de costuras en 30 unidades." },
    { id: "l-ch-01", productoId: "p-chaleco-latex", proveedorId: "prov-latex", codigo: "L-CH-01", tipo: "compra", estado: "en_produccion", unidadesEstimadas: 400, unidadesReales: null, fecha: "2026-08-20" },
    { id: "l-fc2-01", productoId: "p-faja-clasica-v2", proveedorId: "prov-confecciones", codigo: "L-FC2-01", tipo: "produccion", estado: "planeado", unidadesEstimadas: 500, unidadesReales: null, fecha: "2026-09-25" },
  ];

  const todosCostos: Costo[] = [
    ...costos("p-faja-clasica", "fc", [
      { nombre: "Diseño y moldería", categoria: "desarrollo", tipo: "unico", valor: 1_600_000, cantidadUnidades: 1, fecha: "2026-01-15", responsable: "Estudio Moldes Paisa" },
      { nombre: "Muestras y prototipos (3 rondas)", categoria: "desarrollo", tipo: "unico", valor: 1_600_000, cantidadUnidades: 1, fecha: "2026-01-28", responsable: "Confecciones Antioquia" },
      { nombre: "Sesión de fotos y video", categoria: "creativo", tipo: "unico", valor: 1_800_000, cantidadUnidades: 1, fecha: "2026-02-25", responsable: "Estudio Luz Natural" },
      { nombre: "Tela powernet y forro", categoria: "materia_prima", loteId: "l-fc-01", valor: 11_000_000, cantidadUnidades: 500, fecha: "2026-02-10", responsable: "Textiles Medellín" },
      { nombre: "Confección taller satélite", categoria: "mano_obra", loteId: "l-fc-01", valor: 7_500_000, cantidadUnidades: 500, fecha: "2026-02-18", responsable: "Confecciones Antioquia" },
      { nombre: "Broches, varillas y cremallera", categoria: "materia_prima", loteId: "l-fc-01", valor: 2_250_000, cantidadUnidades: 500, fecha: "2026-02-10" },
      { nombre: "Empaque, etiquetas y hangtag", categoria: "empaque", loteId: "l-fc-01", modo: "unitario", valor: 4_000, cantidadUnidades: 500, fecha: "2026-02-20" },
      { nombre: "Flete nacional Medellín → Bogotá", categoria: "flete", loteId: "l-fc-01", valor: 600_000, cantidadUnidades: 500, fecha: "2026-02-27", responsable: "Envía" },
    ]),
    ...costos("p-body-shaper", "bs", [
      { nombre: "Muestras del proveedor + courier", categoria: "desarrollo", tipo: "unico", moneda: "USD", valor: 250, tasaCambio: 3_950, cantidadUnidades: 1, fecha: "2026-02-22", responsable: "Guangzhou Shapewear Co." },
      { nombre: "Prenda FOB", categoria: "materia_prima", loteId: "l-imp-01", moneda: "USD", modo: "unitario", valor: 12.5, tasaCambio: TRM_USD, cantidadUnidades: 300, fecha: "2026-03-01", responsable: "Guangzhou Shapewear Co." },
      { nombre: "Flete marítimo", categoria: "flete", loteId: "l-imp-01", moneda: "USD", valor: 650, valorReal: 800, tasaCambio: TRM_USD, cantidadUnidades: 300, fecha: "2026-03-20", estado: "ajustado", causaDiferencia: "flete", nota: "Recargo por temporada alta en naviera." },
      { nombre: "Seguro de carga", categoria: "seguro", loteId: "l-imp-01", moneda: "USD", valor: 90, tasaCambio: TRM_USD, cantidadUnidades: 300, fecha: "2026-03-20" },
      { nombre: "Arancel + IVA de importación", categoria: "aduana", loteId: "l-imp-01", valor: 5_400_000, valorReal: 5_800_000, cantidadUnidades: 300, fecha: "2026-04-02", estado: "ajustado", causaDiferencia: "impuestos", nota: "Base gravable ajustada por la DIAN." },
      { nombre: "Agencia de aduanas", categoria: "agente_aduanas", loteId: "l-imp-01", valor: 850_000, cantidadUnidades: 300, fecha: "2026-04-03", responsable: "SIA Pacífico" },
      { nombre: "Empaque local y etiquetas en español", categoria: "etiquetas", loteId: "l-imp-01", valor: 1_200_000, cantidadUnidades: 300, fecha: "2026-04-05" },
      { nombre: "Fotografía de catálogo", categoria: "creativo", tipo: "unico", valor: 1_500_000, cantidadUnidades: 1, fecha: "2026-04-10" },
    ]),
    ...costos("p-chaleco-latex", "ch", [
      { nombre: "Desarrollo y muestras", categoria: "desarrollo", tipo: "unico", valor: 2_400_000, cantidadUnidades: 1, fecha: "2026-06-10" },
      { nombre: "Fotos y reels", categoria: "creativo", tipo: "unico", valor: 1_200_000, cantidadUnidades: 1, fecha: "2026-08-28", estado: "pendiente" },
      { nombre: "Látex y forro de algodón", categoria: "materia_prima", loteId: "l-ch-01", valor: 12_000_000, cantidadUnidades: 400, fecha: "2026-08-20", estado: "pagado", responsable: "Látex Andino SAS" },
      { nombre: "Confección", categoria: "mano_obra", loteId: "l-ch-01", valor: 4_800_000, cantidadUnidades: 400, fecha: "2026-08-22", estado: "pendiente" },
      { nombre: "Empaque", categoria: "empaque", loteId: "l-ch-01", valor: 1_400_000, cantidadUnidades: 400, fecha: "2026-08-22", estado: "estimado" },
      { nombre: "Flete Cali → Bogotá", categoria: "flete", loteId: "l-ch-01", valor: 600_000, cantidadUnidades: 400, fecha: "2026-09-05", estado: "estimado" },
    ]),
    ...costos("p-short-encaje", "sh", [
      { nombre: "Desarrollo y muestras", categoria: "desarrollo", tipo: "unico", valor: 1_600_000, cantidadUnidades: 1, fecha: "2026-04-20" },
      { nombre: "Fotografía", categoria: "creativo", tipo: "unico", valor: 1_000_000, cantidadUnidades: 1, fecha: "2026-05-20" },
      { nombre: "Encaje italiano", categoria: "materia_prima", loteId: "l-sh-01", moneda: "EUR", modo: "unitario", valor: 4.2, tasaCambio: TRM_EUR, cantidadUnidades: 200, fecha: "2026-05-02", responsable: "Pizzi Merletti" },
      { nombre: "Tela base", categoria: "materia_prima", loteId: "l-sh-01", valor: 2_800_000, cantidadUnidades: 200, fecha: "2026-05-04" },
      { nombre: "Confección", categoria: "mano_obra", loteId: "l-sh-01", valor: 3_000_000, valorReal: 3_400_000, cantidadUnidades: 200, fecha: "2026-05-12", estado: "ajustado", causaDiferencia: "reproceso", nota: "Reproceso de costuras laterales." },
      { nombre: "Empaque", categoria: "empaque", loteId: "l-sh-01", valor: 700_000, cantidadUnidades: 200, fecha: "2026-05-12" },
      { nombre: "Flete nacional", categoria: "flete", loteId: "l-sh-01", valor: 300_000, cantidadUnidades: 200, fecha: "2026-05-15" },
    ]),
    ...costos("p-faja-clasica-v2", "fc2", [
      { nombre: "Nuevas muestras powernet premium", categoria: "desarrollo", tipo: "unico", valor: 2_000_000, cantidadUnidades: 1, fecha: "2026-08-05" },
      { nombre: "Actualización de fotos", categoria: "creativo", tipo: "unico", valor: 1_200_000, cantidadUnidades: 1, fecha: "2026-09-10", estado: "estimado" },
      { nombre: "Tela powernet premium", categoria: "materia_prima", loteId: "l-fc2-01", valor: 13_000_000, cantidadUnidades: 500, fecha: "2026-09-25", estado: "estimado" },
      { nombre: "Confección taller satélite", categoria: "mano_obra", loteId: "l-fc2-01", valor: 7_500_000, cantidadUnidades: 500, fecha: "2026-09-25", estado: "estimado" },
      { nombre: "Broches, varillas y cremallera", categoria: "materia_prima", loteId: "l-fc2-01", valor: 2_250_000, cantidadUnidades: 500, fecha: "2026-09-25", estado: "estimado" },
      { nombre: "Empaque, etiquetas y hangtag", categoria: "empaque", loteId: "l-fc2-01", modo: "unitario", valor: 4_000, cantidadUnidades: 500, fecha: "2026-09-25", estado: "estimado" },
      { nombre: "Flete nacional", categoria: "flete", loteId: "l-fc2-01", valor: 600_000, cantidadUnidades: 500, fecha: "2026-09-25", estado: "estimado" },
    ]),
  ];

  const precios: Precio[] = [
    { id: "pr1", productoId: "p-faja-clasica", precio: 179_000, fecha: "2026-03-01", motivo: "Precio de lanzamiento" },
    { id: "pr2", productoId: "p-faja-clasica", precio: 189_000, fecha: "2026-06-15", motivo: "Ajuste por inflación y nueva campaña" },
    { id: "pr3", productoId: "p-body-shaper", precio: 149_000, fecha: "2026-04-12", motivo: "Precio de lanzamiento" },
    { id: "pr4", productoId: "p-body-shaper", precio: 159_000, fecha: "2026-07-01", motivo: "Sube flete y TRM" },
    { id: "pr5", productoId: "p-chaleco-latex", precio: 142_000, fecha: "2026-09-01", motivo: "Precio inicial" },
    { id: "pr6", productoId: "p-short-encaje", precio: 89_000, fecha: "2026-05-25", motivo: "Precio de prueba" },
    { id: "pr7", productoId: "p-faja-clasica-v2", precio: 199_000, fecha: "2026-08-02", motivo: "Precio propuesto" },
  ];

  const eventos: Evento[] = [
    { id: "e1", productoId: "p-faja-clasica", tipo: "creacion", descripcion: "Creación del producto (v1)", fecha: "2026-01-12" },
    { id: "e2", productoId: "p-faja-clasica", tipo: "muestra", descripcion: "Tres rondas de muestras aprobadas", fecha: "2026-01-28", datos: { monto: 1_600_000 } },
    { id: "e3", productoId: "p-faja-clasica", tipo: "compra", descripcion: "Lote L-FC-01 de 500 unidades", fecha: "2026-02-10" },
    { id: "e4", productoId: "p-faja-clasica", tipo: "lanzamiento", descripcion: "Lanzamiento en tienda online y marketplace", fecha: "2026-03-01", datos: { precio: 179_000 } },
    { id: "e5", productoId: "p-faja-clasica", tipo: "cambio_precio", descripcion: "Precio $179.000 → $189.000", fecha: "2026-06-15", datos: { antes: 179_000, despues: 189_000 } },
    { id: "e6", productoId: "p-faja-clasica", tipo: "version", descripcion: "Se creó la versión v2 (tela premium)", fecha: "2026-08-02" },
    { id: "e7", productoId: "p-body-shaper", tipo: "creacion", descripcion: "Creación del producto", fecha: "2026-02-20" },
    { id: "e8", productoId: "p-body-shaper", tipo: "importacion", descripcion: "Importación L-IMP-01: flete +23 % y 12 u. de merma", fecha: "2026-04-05" },
    { id: "e9", productoId: "p-body-shaper", tipo: "cambio_precio", descripcion: "Precio $149.000 → $159.000", fecha: "2026-07-01", datos: { antes: 149_000, despues: 159_000 } },
    { id: "e10", productoId: "p-short-encaje", tipo: "ajuste_costo", descripcion: "Reproceso de confección (+$400.000)", fecha: "2026-05-12" },
    { id: "e11", productoId: "p-short-encaje", tipo: "nota", descripcion: "Producto pausado: margen negativo, revisar precio o proveedor", fecha: "2026-06-30" },
    { id: "e12", productoId: "p-chaleco-latex", tipo: "creacion", descripcion: "Creación del producto", fecha: "2026-06-03" },
    { id: "e13", productoId: "p-faja-clasica-v2", tipo: "version", descripcion: "Versión 2 creada a partir de FAJ-CLA-001", fecha: "2026-08-02" },
  ];

  return {
    configuracion: {
      monedaBase: "COP",
      margenMinimo: 0.25,
      margenObjetivo: 0.4,
      comisionCanalPct: 0.1,
      pasarelaPct: 0.035,
      publicidadUnidad: 15_000,
      envioClienteUnidad: 12_000,
      otrosVentaUnidad: 0,
    },
    tasas: [
      { id: "t1", moneda: "USD", tasaCop: 3_950, fecha: "2026-02-01", fuente: "TRM" },
      { id: "t2", moneda: "USD", tasaCop: 4_000, fecha: "2026-10-01", fuente: "TRM" },
      { id: "t3", moneda: "EUR", tasaCop: 4_500, fecha: "2026-10-01", fuente: "TRM" },
      { id: "t4", moneda: "CNY", tasaCop: 560, fecha: "2026-10-01", fuente: "Referencia" },
      { id: "t5", moneda: "MXN", tasaCop: 215, fecha: "2026-10-01", fuente: "Referencia" },
    ],
    proveedores: [
      { id: "prov-confecciones", nombre: "Confecciones Antioquia", pais: "Colombia", tipo: "nacional", moneda: "COP", contacto: "ventas@confeccionesantioquia.co" },
      { id: "prov-latex", nombre: "Látex Andino SAS", pais: "Colombia", tipo: "nacional", moneda: "COP", contacto: "Cali" },
      { id: "prov-guangzhou", nombre: "Guangzhou Shapewear Co.", pais: "China", tipo: "internacional", moneda: "USD", contacto: "Alibaba" },
      { id: "prov-pizzi", nombre: "Pizzi Merletti", pais: "Italia", tipo: "internacional", moneda: "EUR" },
    ],
    productos,
    variantes: [
      ...variantes("p-faja-clasica", "FAJ-CLA-001", ["Negro", "Beige"], ["S", "M", "L", "XL"], 2_000),
      ...variantes("p-body-shaper", "BOD-SEA-002", ["Negro", "Nude"], ["S/M", "L/XL"]),
      ...variantes("p-chaleco-latex", "CHA-LAT-003", ["Negro"], ["S", "M", "L"]),
      ...variantes("p-short-encaje", "SHO-ENC-004", ["Negro", "Beige"], ["S", "M", "L"]),
      ...variantes("p-faja-clasica-v2", "FAJ-CLA-001-V2", ["Negro"], ["S", "M", "L", "XL"], 2_000),
    ],
    lotes,
    costos: todosCostos,
    precios,
    eventos,
    escenarios: [],
  };
}
