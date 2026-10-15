// Exportación de reportes a Excel (ExcelJS) y PDF (jsPDF). Se ejecuta en el navegador y las
// librerías se cargan bajo demanda para no inflar el bundle inicial.
import type { BaseDatos } from "@/tipos";
import { CATEGORIAS, CAUSAS, ESTADOS_COSTO, ESTADOS_LOTE, ESTADOS_PRODUCTO, TIPOS_COSTO, TIPOS_LOTE } from "@/lib/calculos/catalogo";
import { calcularProducto, compararLote, tasasVigentes, totalCostoCOP } from "@/lib/calculos/motor";
import { metricasDashboard, type FiltrosDashboard } from "@/lib/calculos/dashboard";
import { formatoCOP, formatoFecha, formatoPct } from "@/lib/formato";
import { escalas } from "@/design/tokens";

// Colores de marca para documentos (los PDF/Excel no entienden variables CSS).
const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const argb = (hex: string) => `FF${hex.slice(1).toUpperCase()}`;
const MARCA = escalas.lila[600];
const TINTA = escalas.bruma[900];
const TITULO = escalas.lila[950];
const SUAVE = escalas.bruma[600];
const FILA_ALTERNA = escalas.lila[50];

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fechaArchivo = () => new Date().toISOString().slice(0, 10);
const pctONulo = (v: number | null) => (v === null ? null : Math.round(v * 10000) / 10000);

// ---------------------------------------------------------------------------
// Excel
// ---------------------------------------------------------------------------

export async function exportarExcel(db: BaseDatos, productoId?: string) {
  const { libro, nombre } = await construirExcel(db, productoId);
  const buffer = await libro.xlsx.writeBuffer();
  descargar(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nombre);
}

/** Construye el libro de Excel (separado de la descarga para poder probarlo). */
export async function construirExcel(db: BaseDatos, productoId?: string) {
  const { default: ExcelJS } = await import("exceljs");
  const tasas = tasasVigentes(db.tasas);
  const productos = db.productos.filter((p) => !productoId || p.id === productoId);
  const ids = new Set(productos.map((p) => p.id));
  const libro = new ExcelJS.Workbook();
  libro.creator = "Martha";
  libro.created = new Date();

  const formatoMoneda = '"$" #,##0';
  const formatoPorcentaje = "0.0%";

  const hoja = (nombre: string, columnas: { header: string; key: string; width: number; fmt?: string }[]) => {
    const h = libro.addWorksheet(nombre, { views: [{ state: "frozen", ySplit: 1 }] });
    h.columns = columnas.map((c) => ({ header: c.header, key: c.key, width: c.width, style: c.fmt ? { numFmt: c.fmt } : {} }));
    h.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    h.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(MARCA) } };
    return h;
  };

  const resumen = hoja("Productos", [
    { header: "SKU", key: "sku", width: 18 },
    { header: "Producto", key: "nombre", width: 32 },
    { header: "Categoría", key: "categoria", width: 14 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Versión", key: "version", width: 9 },
    { header: "Unidades base", key: "unidades", width: 13 },
    { header: "Costo directo/u", key: "directo", width: 16, fmt: formatoMoneda },
    { header: "Logística e import./u", key: "llegada", width: 18, fmt: formatoMoneda },
    { header: "Landed cost", key: "landed", width: 14, fmt: formatoMoneda },
    { header: "Fijos asignados/u", key: "fijos", width: 16, fmt: formatoMoneda },
    { header: "Costo total/u", key: "total", width: 14, fmt: formatoMoneda },
    { header: "Costos de venta/u", key: "venta", width: 16, fmt: formatoMoneda },
    { header: "Precio", key: "precio", width: 12, fmt: formatoMoneda },
    { header: "Margen bruto", key: "mb", width: 13, fmt: formatoPorcentaje },
    { header: "Margen neto", key: "mn", width: 13, fmt: formatoPorcentaje },
    { header: "Utilidad/u", key: "utilidad", width: 13, fmt: formatoMoneda },
    { header: "Precio mínimo", key: "pmin", width: 14, fmt: formatoMoneda },
    { header: "Precio sugerido", key: "psug", width: 15, fmt: formatoMoneda },
    { header: "Precio equilibrio", key: "peq", width: 16, fmt: formatoMoneda },
    { header: "Inversión total", key: "inversion", width: 16, fmt: formatoMoneda },
  ]);
  for (const p of productos) {
    const r = calcularProducto({ producto: p, costos: db.costos, lotes: db.lotes, tasas });
    resumen.addRow({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      estado: ESTADOS_PRODUCTO[p.estado],
      version: p.version,
      unidades: r.unidadesBase,
      directo: r.costoDirectoUnitario,
      llegada: r.costoLlegadaUnitario,
      landed: r.landedCost,
      fijos: r.fijosAsignadosUnitario,
      total: r.costoTotalUnitario,
      venta: r.costoVentaUnitario,
      precio: r.precio,
      mb: pctONulo(r.margenBruto),
      mn: pctONulo(r.margenNeto),
      utilidad: r.utilidadUnitaria,
      pmin: r.precioMinimo,
      psug: r.precioSugerido,
      peq: r.precioEquilibrio,
      inversion: r.inversionTotal,
    });
  }

  const nombreProducto = new Map(db.productos.map((p) => [p.id, p.nombre]));
  const codigoLote = new Map(db.lotes.map((l) => [l.id, l.codigo]));

  const costos = hoja("Costos", [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Producto", key: "producto", width: 28 },
    { header: "Lote", key: "lote", width: 11 },
    { header: "Categoría", key: "categoria", width: 24 },
    { header: "Concepto", key: "nombre", width: 32 },
    { header: "Tipo", key: "tipo", width: 18 },
    { header: "Moneda", key: "moneda", width: 8 },
    { header: "Modo", key: "modo", width: 9 },
    { header: "Valor estimado", key: "valor", width: 14 },
    { header: "Valor real", key: "real", width: 12 },
    { header: "Unidades", key: "unidades", width: 9 },
    { header: "Tasa a COP", key: "tasa", width: 11 },
    { header: "Total COP", key: "total", width: 14, fmt: formatoMoneda },
    { header: "Estado", key: "estado", width: 11 },
    { header: "Causa diferencia", key: "causa", width: 18 },
    { header: "Responsable", key: "responsable", width: 22 },
    { header: "Nota", key: "nota", width: 30 },
  ]);
  for (const c of db.costos.filter((x) => ids.has(x.productoId)).sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    costos.addRow({
      fecha: c.fecha,
      producto: nombreProducto.get(c.productoId),
      lote: c.loteId ? codigoLote.get(c.loteId) : "",
      categoria: CATEGORIAS[c.categoria].etiqueta,
      nombre: c.nombre,
      tipo: TIPOS_COSTO[c.tipo],
      moneda: c.moneda,
      modo: c.modo === "unitario" ? "Unitario" : "Total",
      valor: c.valor,
      real: c.valorReal ?? "",
      unidades: c.cantidadUnidades,
      tasa: c.moneda === "COP" ? 1 : (c.tasaCambio ?? tasas[c.moneda]),
      total: totalCostoCOP(c, tasas),
      estado: ESTADOS_COSTO[c.estado],
      causa: c.causaDiferencia ? CAUSAS[c.causaDiferencia] : "",
      responsable: c.responsable ?? "",
      nota: c.nota ?? "",
    });
  }

  const lotes = hoja("Lotes", [
    { header: "Lote", key: "codigo", width: 12 },
    { header: "Producto", key: "producto", width: 28 },
    { header: "Tipo", key: "tipo", width: 16 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Unid. estimadas", key: "ue", width: 14 },
    { header: "Unid. reales", key: "ur", width: 12 },
    { header: "Total estimado", key: "est", width: 15, fmt: formatoMoneda },
    { header: "Total real", key: "real", width: 15, fmt: formatoMoneda },
    { header: "Diferencia", key: "dif", width: 14, fmt: formatoMoneda },
    { header: "Dif. %", key: "difPct", width: 9, fmt: formatoPorcentaje },
    { header: "Costo/u estimado", key: "uest", width: 16, fmt: formatoMoneda },
    { header: "Costo/u real", key: "ureal", width: 14, fmt: formatoMoneda },
  ]);
  for (const l of db.lotes.filter((x) => ids.has(x.productoId))) {
    const c = compararLote(l, db.costos, tasas);
    lotes.addRow({
      codigo: l.codigo,
      producto: nombreProducto.get(l.productoId),
      tipo: TIPOS_LOTE[l.tipo],
      estado: ESTADOS_LOTE[l.estado],
      fecha: l.fecha,
      ue: l.unidadesEstimadas,
      ur: l.unidadesReales ?? "",
      est: c.estimadoTotal,
      real: c.realTotal,
      dif: c.diferencia,
      difPct: pctONulo(c.diferenciaPct),
      uest: c.unitarioEstimado,
      ureal: c.unitarioReal,
    });
  }

  const precios = hoja("Historial de precios", [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Producto", key: "producto", width: 30 },
    { header: "Precio", key: "precio", width: 14, fmt: formatoMoneda },
    { header: "Motivo", key: "motivo", width: 40 },
  ]);
  for (const p of db.precios.filter((x) => ids.has(x.productoId)).sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    precios.addRow({ fecha: p.fecha.slice(0, 10), producto: nombreProducto.get(p.productoId), precio: p.precio, motivo: p.motivo ?? "" });
  }

  const sufijo = productoId ? (productos[0]?.sku ?? "producto") : "general";
  return { libro, nombre: `martha-${sufijo}-${fechaArchivo()}.xlsx` };
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

async function nuevoPdf(titulo: string, subtitulo: string) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const anchoPagina = doc.internal.pageSize.getWidth();
  doc.setFillColor(...rgb(MARCA));
  doc.rect(0, 0, anchoPagina, 6, "F");
  doc.setFillColor(...rgb(escalas.malva[400]));
  doc.rect(anchoPagina * 0.72, 6, anchoPagina * 0.28, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...rgb(TITULO));
  doc.text(titulo, 40, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...rgb(SUAVE));
  doc.text(subtitulo, 40, 66);
  const tabla = (y: number, cabecera: string[], filas: (string | number)[][], tituloTabla?: string) => {
    let inicio = y;
    if (tituloTabla) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...rgb(TITULO));
      doc.text(tituloTabla, 40, y);
      inicio = y + 8;
    }
    autoTable(doc, {
      startY: inicio,
      head: [cabecera],
      body: filas.map((f) => f.map(String)),
      styles: { fontSize: 8.5, cellPadding: 4, textColor: rgb(TINTA) },
      headStyles: { fillColor: rgb(MARCA), textColor: 255 },
      alternateRowStyles: { fillColor: rgb(FILA_ALTERNA) },
      margin: { left: 40, right: 40 },
    });
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  };
  return { doc, tabla };
}

const subtituloFecha = () => `Generado por Martha el ${formatoFecha(new Date().toISOString())}`;

export async function exportarPdfProducto(db: BaseDatos, productoId: string) {
  const resultado = await construirPdfProducto(db, productoId);
  resultado?.doc.save(resultado.nombre);
}

export async function construirPdfProducto(db: BaseDatos, productoId: string) {
  const p = db.productos.find((x) => x.id === productoId);
  if (!p) return null;
  const tasas = tasasVigentes(db.tasas);
  const r = calcularProducto({ producto: p, costos: db.costos, lotes: db.lotes, tasas });
  const { doc, tabla } = await nuevoPdf(p.nombre, `${p.sku} - v${p.version} - ${ESTADOS_PRODUCTO[p.estado]} - ${subtituloFecha()}`);

  let y = tabla(
    92,
    ["Indicador", "Valor", "Fórmula"],
    [
      ["Costo directo por unidad", formatoCOP(r.costoDirectoUnitario), "Materia prima + mano de obra + empaque + etiquetas"],
      ["Logística e importación por unidad", formatoCOP(r.costoLlegadaUnitario), "Flete + seguro + aduana + agente + manejo"],
      ["Landed cost", formatoCOP(r.landedCost), "Costo del producto + costos de llegada"],
      ["Fijos asignados por unidad", formatoCOP(r.fijosAsignadosUnitario), `Costos fijos / ${r.unidadesBase} unidades base`],
      ["Costo total por unidad", formatoCOP(r.costoTotalUnitario), "Landed cost + indirectos"],
      ["Costos de venta por unidad", formatoCOP(r.costoVentaUnitario), "Comisiones + pasarela + publicidad + envío"],
      ["Precio de venta", formatoCOP(r.precio), ""],
      ["Margen bruto", formatoPct(r.margenBruto), "(precio - costo unitario) / precio"],
      ["Margen neto", formatoPct(r.margenNeto), "(precio - costo unitario - costos de venta) / precio"],
      ["Utilidad por unidad", formatoCOP(r.utilidadUnitaria), ""],
      [`Precio mínimo (${formatoPct(p.margenMinimo, 0)})`, formatoCOP(r.precioMinimo), "Margen neto mínimo"],
      [`Precio sugerido (${formatoPct(p.margenObjetivo, 0)})`, formatoCOP(r.precioSugerido), "Margen neto objetivo"],
      ["Precio de equilibrio", formatoCOP(r.precioEquilibrio), "Margen neto 0 %"],
      ["Unidades para cubrir fijos", r.unidadesEquilibrio ?? "-", "Fijos / contribución por unidad"],
      ["Inversión total acumulada", formatoCOP(r.inversionTotal), ""],
    ],
    "Resumen de costos y márgenes",
  );

  y = tabla(
    y,
    ["Costo", "Categoría", "Tipo", "Total COP", "Por unidad", "% del costo"],
    r.desglose.map((d) => [d.nombre, CATEGORIAS[d.categoria].etiqueta, d.variable ? "Variable" : "Fijo", formatoCOP(d.total), formatoCOP(d.unitario), formatoPct(d.participacion)]),
    "Desglose de costos (mayor a menor impacto)",
  );

  const lotes = db.lotes.filter((l) => l.productoId === p.id).map((l) => compararLote(l, db.costos, tasas));
  if (lotes.length)
    y = tabla(
      y,
      ["Lote", "Estado", "Unidades est./reales", "Estimado", "Real", "Diferencia", "Costo/u real"],
      lotes.map((c) => [
        c.lote.codigo,
        ESTADOS_LOTE[c.lote.estado],
        `${c.lote.unidadesEstimadas} / ${c.lote.unidadesReales ?? "-"}`,
        formatoCOP(c.estimadoTotal),
        formatoCOP(c.realTotal),
        formatoPct(c.diferenciaPct),
        formatoCOP(c.unitarioReal),
      ]),
      "Lotes: estimado vs. real",
    );

  const eventos = db.eventos.filter((e) => e.productoId === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (eventos.length) tabla(y, ["Fecha", "Evento"], eventos.map((e) => [formatoFecha(e.fecha), e.descripcion]), "Historial");

  return { doc, nombre: `martha-${p.sku}-${fechaArchivo()}.pdf` };
}

export async function exportarPdfDashboard(db: BaseDatos, filtros: FiltrosDashboard = {}) {
  const { doc, nombre } = await construirPdfDashboard(db, filtros);
  doc.save(nombre);
}

export async function construirPdfDashboard(db: BaseDatos, filtros: FiltrosDashboard = {}) {
  const m = metricasDashboard(db, filtros);
  const { doc, tabla } = await nuevoPdf("Reporte de rentabilidad", subtituloFecha());
  let y = tabla(
    92,
    ["Indicador", "Valor"],
    [
      ["Inversión total acumulada", formatoCOP(m.inversionTotal)],
      ["Costo promedio por unidad", formatoCOP(m.costoPromedioUnidad)],
      ["Mejor margen", m.mejorMargen ? `${m.mejorMargen.producto.nombre} (${formatoPct(m.mejorMargen.calculo.margenNeto)})` : "-"],
      ["Peor margen", m.peorMargen ? `${m.peorMargen.producto.nombre} (${formatoPct(m.peorMargen.calculo.margenNeto)})` : "-"],
      ["Productos con margen bajo o pérdida", String(m.margenBajo.length)],
    ],
    "Resumen",
  );
  y = tabla(
    y,
    ["Producto", "Costo/u", "Precio", "Margen neto", "Inversión"],
    m.productos.map(({ producto, calculo }) => [producto.nombre, formatoCOP(calculo.costoTotalUnitario), formatoCOP(calculo.precio), formatoPct(calculo.margenNeto), formatoCOP(calculo.inversionTotal)]),
    "Productos",
  );
  y = tabla(y, ["Categoría de costo", "Inversión"], m.costosPorCategoria.map((c) => [CATEGORIAS[c.categoria].etiqueta, formatoCOP(c.total)]), "Costos por categoría");
  if (m.estimadoVsReal.length)
    tabla(
      y,
      ["Lote", "Estimado", "Real", "Diferencia"],
      m.estimadoVsReal.map((c) => [c.lote.codigo, formatoCOP(c.estimadoTotal), formatoCOP(c.realTotal), formatoPct(c.diferenciaPct)]),
      "Estimado vs. real por lote",
    );
  return { doc, nombre: `martha-dashboard-${fechaArchivo()}.pdf` };
}
