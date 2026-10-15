// GET /api/v1/productos/{id} — detalle con desglose de costos, variantes y lotes.
import { CATEGORIAS } from "@/lib/calculos/catalogo";
import { calcularProducto, compararLote, tasasVigentes } from "@/lib/calculos/motor";
import { cargarParaApi, resumenProducto } from "@/lib/datos/servidor";
import { respuestaError } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await cargarParaApi(request);
    const p = db.productos.find((x) => x.id === id || x.sku === id);
    if (!p) return Response.json({ error: "Producto no encontrado." }, { status: 404 });
    const tasas = tasasVigentes(db.tasas);
    const r = calcularProducto({ producto: p, costos: db.costos, lotes: db.lotes, tasas });
    return Response.json({
      ...resumenProducto(db, p),
      desglose: r.desglose.map((d) => ({ costo: d.nombre, categoria: CATEGORIAS[d.categoria].etiqueta, total: Math.round(d.total), unitario: Math.round(d.unitario) })),
      variantes: db.variantes
        .filter((v) => v.productoId === p.id)
        .map((v) => {
          const rv = calcularProducto({ producto: p, costos: db.costos, lotes: db.lotes, tasas, varianteId: v.id, costoAdicionalUnitario: v.costoAdicionalUnitario, precio: v.precioVenta ?? p.precioVenta });
          return { sku: v.sku, nombre: v.nombre, atributos: v.atributos, costo_unitario: Math.round(rv.costoTotalUnitario), precio: rv.precio, margen_neto: rv.margenNeto };
        }),
      lotes: db.lotes
        .filter((l) => l.productoId === p.id)
        .map((l) => {
          const c = compararLote(l, db.costos, tasas);
          return { codigo: l.codigo, estado: l.estado, estimado: Math.round(c.estimadoTotal), real: Math.round(c.realTotal), costo_unitario_real: Math.round(c.unitarioReal) };
        }),
    });
  } catch (e) {
    return respuestaError(e);
  }
}
