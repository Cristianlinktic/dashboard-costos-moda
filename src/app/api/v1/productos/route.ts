// GET /api/v1/productos — costo, margen y precios sugeridos de cada producto (para Shopify, WooCommerce, hojas de cálculo…).
import { cargarParaApi, resumenProducto } from "@/lib/datos/servidor";
import { respuestaError } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = await cargarParaApi(request);
    const sku = new URL(request.url).searchParams.get("sku");
    const productos = db.productos.filter((p) => !sku || p.sku === sku).map((p) => resumenProducto(db, p));
    return Response.json({ productos });
  } catch (e) {
    return respuestaError(e);
  }
}
