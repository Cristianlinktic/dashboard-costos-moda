import type {
  CategoriaCosto,
  CausaDiferencia,
  EstadoCosto,
  EstadoLote,
  EstadoProducto,
  TipoCosto,
  TipoEvento,
  TipoLote,
} from "@/tipos";

/** Grupo de cálculo al que pertenece cada categoría de costo. */
export type GrupoCosto = "producto" | "llegada" | "indirecto" | "venta";

export const CATEGORIAS: Record<CategoriaCosto, { etiqueta: string; grupo: GrupoCosto; ayuda: string }> = {
  materia_prima: { etiqueta: "Materia prima / producto", grupo: "producto", ayuda: "Tela, insumos o precio de compra al proveedor." },
  mano_obra: { etiqueta: "Mano de obra", grupo: "producto", ayuda: "Confección, corte, taller satélite." },
  empaque: { etiqueta: "Empaque", grupo: "producto", ayuda: "Empaque primario y secundario." },
  etiquetas: { etiqueta: "Etiquetas y autenticidad", grupo: "producto", ayuda: "Etiquetas, hangtags, certificados, sellos." },
  flete: { etiqueta: "Flete", grupo: "llegada", ayuda: "Flete internacional o nacional hasta tu bodega." },
  seguro: { etiqueta: "Seguro de carga", grupo: "llegada", ayuda: "Póliza de transporte de mercancía." },
  aduana: { etiqueta: "Aranceles e impuestos", grupo: "llegada", ayuda: "Arancel, IVA de importación, gastos aduaneros." },
  agente_aduanas: { etiqueta: "Agente de aduanas", grupo: "llegada", ayuda: "SIA / brokerage / nacionalización." },
  almacenamiento: { etiqueta: "Almacenamiento y logística", grupo: "llegada", ayuda: "Bodegaje, manejo, alistamiento." },
  desarrollo: { etiqueta: "Diseño y desarrollo", grupo: "indirecto", ayuda: "Diseño, moldería, muestras y prototipos." },
  creativo: { etiqueta: "Fotografía y contenido", grupo: "indirecto", ayuda: "Sesiones de fotos, video, producción creativa." },
  otro: { etiqueta: "Otros", grupo: "indirecto", ayuda: "Cualquier otro costo personalizado." },
  comisiones_venta: { etiqueta: "Comisiones de venta", grupo: "venta", ayuda: "Marketplace, pasarela, publicidad, distribución." },
};

export const GRUPOS: Record<GrupoCosto, string> = {
  producto: "Costo del producto",
  llegada: "Logística e importación",
  indirecto: "Indirectos asignados",
  venta: "Costos de venta",
};

export const TIPOS_COSTO: Record<TipoCosto, string> = {
  variable: "Variable (por lote)",
  fijo: "Fijo",
  unico: "Único",
  recurrente: "Recurrente",
};

export const ESTADOS_COSTO: Record<EstadoCosto, string> = {
  estimado: "Estimado",
  pendiente: "Pendiente",
  pagado: "Pagado",
  ajustado: "Ajustado",
};

export const ESTADOS_PRODUCTO: Record<EstadoProducto, string> = {
  borrador: "Borrador",
  desarrollo: "En desarrollo",
  activo: "Activo",
  pausado: "Pausado",
  descontinuado: "Descontinuado",
};

export const TIPOS_LOTE: Record<TipoLote, string> = {
  produccion: "Producción",
  compra: "Compra nacional",
  importacion: "Importación",
};

export const ESTADOS_LOTE: Record<EstadoLote, string> = {
  planeado: "Planeado",
  en_produccion: "En producción",
  en_transito: "En tránsito",
  recibido: "Recibido",
  cerrado: "Cerrado",
};

export const CAUSAS: Record<CausaDiferencia, string> = {
  flete: "Flete",
  impuestos: "Impuestos",
  cambio_proveedor: "Cambio de proveedor",
  merma: "Merma",
  reproceso: "Reproceso",
  tasa_cambio: "Tasa de cambio",
  otro: "Otro",
};

export const TIPOS_EVENTO: Record<TipoEvento, string> = {
  creacion: "Creación",
  muestra: "Muestra",
  ajuste_costo: "Ajuste de costo",
  compra: "Compra",
  importacion: "Importación",
  lanzamiento: "Lanzamiento",
  cambio_precio: "Cambio de precio",
  version: "Nueva versión",
  nota: "Nota",
};

export const MONEDAS = ["COP", "USD", "EUR", "CNY", "MXN"] as const;
