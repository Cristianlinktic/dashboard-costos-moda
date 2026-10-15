// Modelo de dominio de Martha. Los nombres de campo en camelCase se mapean 1:1
// a las columnas snake_case de Supabase (ver supabase/migrations).

export type CodigoMoneda = "COP" | "USD" | "EUR" | "CNY" | "MXN";
export type Rol = "admin" | "colaborador";

export type EstadoProducto = "borrador" | "desarrollo" | "activo" | "pausado" | "descontinuado";
export type TipoCosto = "fijo" | "variable" | "unico" | "recurrente";
export type ModoValor = "total" | "unitario";
export type EstadoCosto = "estimado" | "pendiente" | "pagado" | "ajustado";
export type TipoLote = "produccion" | "compra" | "importacion";
export type EstadoLote = "planeado" | "en_produccion" | "en_transito" | "recibido" | "cerrado";
export type BaseAsignacion = "estimadas" | "producidas";
export type CausaDiferencia =
  | "flete"
  | "impuestos"
  | "cambio_proveedor"
  | "merma"
  | "reproceso"
  | "tasa_cambio"
  | "otro";
export type CategoriaCosto =
  | "materia_prima"
  | "mano_obra"
  | "desarrollo"
  | "empaque"
  | "etiquetas"
  | "creativo"
  | "flete"
  | "seguro"
  | "aduana"
  | "agente_aduanas"
  | "almacenamiento"
  | "comisiones_venta"
  | "otro";
export type TipoEvento =
  | "creacion"
  | "muestra"
  | "ajuste_costo"
  | "compra"
  | "importacion"
  | "lanzamiento"
  | "cambio_precio"
  | "version"
  | "nota";

export interface Configuracion {
  monedaBase: CodigoMoneda;
  margenMinimo: number;
  margenObjetivo: number;
  comisionCanalPct: number;
  pasarelaPct: number;
  publicidadUnidad: number;
  envioClienteUnidad: number;
  otrosVentaUnidad: number;
}

export interface TasaCambio {
  id: string;
  moneda: CodigoMoneda;
  tasaCop: number;
  fecha: string;
  fuente?: string | null;
}

export interface Proveedor {
  id: string;
  nombre: string;
  pais: string;
  tipo: "nacional" | "internacional";
  moneda: CodigoMoneda;
  contacto?: string | null;
  notas?: string | null;
}

/** Parámetros de costos de venta por unidad (comisiones, pasarela, publicidad, envío). */
export interface CostosVenta {
  comisionCanalPct: number;
  pasarelaPct: number;
  publicidadUnidad: number;
  envioClienteUnidad: number;
  otrosVentaUnidad: number;
}

export interface Producto extends CostosVenta {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  proveedorId?: string | null;
  paisOrigen: string;
  monedaBase: CodigoMoneda;
  estado: EstadoProducto;
  productoOrigenId?: string | null;
  version: number;
  unidadesEstimadas: number;
  baseAsignacion: BaseAsignacion;
  precioVenta: number;
  margenMinimo: number;
  margenObjetivo: number;
  creadoEn: string;
}

export interface Variante {
  id: string;
  productoId: string;
  sku: string;
  nombre: string;
  atributos: Record<string, string>;
  costoAdicionalUnitario: number;
  precioVenta?: number | null;
  unidades: number;
}

export interface Lote {
  id: string;
  productoId: string;
  proveedorId?: string | null;
  codigo: string;
  tipo: TipoLote;
  estado: EstadoLote;
  unidadesEstimadas: number;
  unidadesReales?: number | null;
  fecha: string;
  notas?: string | null;
}

export interface Costo {
  id: string;
  productoId: string;
  varianteId?: string | null;
  loteId?: string | null;
  categoria: CategoriaCosto;
  nombre: string;
  tipo: TipoCosto;
  moneda: CodigoMoneda;
  modo: ModoValor;
  /** Valor estimado / presupuestado (en la moneda del costo). */
  valor: number;
  /** Valor real según factura; null mientras no llegue. */
  valorReal?: number | null;
  cantidadUnidades: number;
  /** Tasa a COP congelada al registrar. null = usar la tasa vigente. */
  tasaCambio?: number | null;
  fecha: string;
  responsable?: string | null;
  comprobanteUrl?: string | null;
  nota?: string | null;
  estado: EstadoCosto;
  causaDiferencia?: CausaDiferencia | null;
}

export interface Precio {
  id: string;
  productoId: string;
  varianteId?: string | null;
  precio: number;
  fecha: string;
  motivo?: string | null;
}

export interface Evento {
  id: string;
  productoId: string;
  tipo: TipoEvento;
  descripcion: string;
  datos?: Record<string, unknown>;
  fecha: string;
  usuario?: string | null;
}

export interface ParametrosEscenario {
  nombre: string;
  precio: number;
  /** Tasas a COP que reemplazan las congeladas (p. ej. { USD: 4300 }). */
  tasas: Partial<Record<CodigoMoneda, number>>;
  variacionFletePct: number;
  variacionProveedorPct: number;
  volumen: number;
  descuentoPct: number;
  comisionCanalPct: number;
  publicidadUnidad: number;
}

export interface Escenario {
  id: string;
  productoId: string;
  nombre: string;
  parametros: ParametrosEscenario;
}

export interface BaseDatos {
  configuracion: Configuracion;
  tasas: TasaCambio[];
  proveedores: Proveedor[];
  productos: Producto[];
  variantes: Variante[];
  lotes: Lote[];
  costos: Costo[];
  precios: Precio[];
  eventos: Evento[];
  escenarios: Escenario[];
}
