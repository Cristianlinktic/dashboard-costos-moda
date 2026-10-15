"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMartha } from "@/lib/datos/MarthaProvider";
import { ESTADOS_LOTE } from "@/lib/calculos/catalogo";
import { compararLote } from "@/lib/calculos/motor";
import { formatoCOP, formatoCompacto, formatoPct } from "@/lib/formato";
import { ComparacionLote } from "@/components/ComparacionLote";
import { BarraFiltros, ChipBusqueda, ChipSelect } from "@/components/Filtros";
import { Boxes, Factory, Package, Scale, TrendingUp, Wallet, Workflow } from "lucide-react";
import { Cargando, Encabezado, Kpi, Vacio } from "@/components/ui";

export default function Lotes() {
  const { db, tasas, cargando } = useMartha();
  const [productoId, setProductoId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const lotes = useMemo(
    () =>
      db.lotes
        .filter((l) => (!productoId || l.productoId === productoId) && (!proveedorId || l.proveedorId === proveedorId) && (!estado || l.estado === estado))
        .filter((l) => {
          const q = busqueda.trim().toLowerCase();
          return !q || `${l.codigo} ${db.productos.find((p) => p.id === l.productoId)?.nombre ?? ""}`.toLowerCase().includes(q);
        })
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [db.lotes, db.productos, productoId, proveedorId, estado, busqueda],
  );
  const comparaciones = lotes.map((l) => compararLote(l, db.costos, tasas));
  const estimado = comparaciones.reduce((s, c) => s + c.estimadoTotal, 0);
  const real = comparaciones.reduce((s, c) => s + c.realTotal, 0);

  if (cargando) return <Cargando />;

  return (
    <div>
      <Encabezado titulo="Lotes" acento="estimado vs. real" descripcion="Estimado vs. real por lote, producto o proveedor. Registra las facturas reales para ajustar el costo final." />
      <BarraFiltros
        activos={[productoId, proveedorId, estado, busqueda.trim()].filter(Boolean).length}
        onLimpiar={() => {
          setBusqueda("");
          setProductoId("");
          setProveedorId("");
          setEstado("");
        }}
      >
        <ChipBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Código o producto…" />
        <ChipSelect etiqueta="Producto" icono={Package} valor={productoId || undefined} onCambio={(v) => setProductoId(v ?? "")} opciones={db.productos.map((p) => ({ valor: p.id, etiqueta: p.nombre, detalle: p.sku }))} />
        <ChipSelect etiqueta="Proveedor" icono={Factory} valor={proveedorId || undefined} onCambio={(v) => setProveedorId(v ?? "")} opciones={db.proveedores.map((p) => ({ valor: p.id, etiqueta: p.nombre, detalle: p.pais }))} />
        <ChipSelect etiqueta="Estado" icono={Workflow} valor={estado || undefined} onCambio={(v) => setEstado(v ?? "")} opciones={Object.entries(ESTADOS_LOTE).map(([k, v]) => ({ valor: k, etiqueta: v }))} />
      </BarraFiltros>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi icono={Boxes} etiqueta="Lotes" numero={lotes.length} formato={(n) => String(Math.round(n))} />
        <Kpi icono={Scale} etiqueta="Total estimado" numero={estimado} formato={formatoCompacto} detalle={formatoCOP(estimado)} />
        <Kpi icono={Wallet} etiqueta="Total real" numero={real} formato={formatoCompacto} detalle={formatoCOP(real)} />
        <Kpi icono={TrendingUp} etiqueta="Desviación" numero={estimado ? (real - estimado) / estimado : null} formato={(n) => formatoPct(n)} tono={real > estimado * 1.1 ? "rojo" : real > estimado ? "amarillo" : "verde"} />
      </div>

      {lotes.length === 0 ? (
        <Vacio titulo="No hay lotes">Crea lotes desde la pestaña «Lotes» de cada producto.</Vacio>
      ) : (
        <div className="space-y-5">
          {lotes.map((l) => {
            const producto = db.productos.find((p) => p.id === l.productoId)!;
            return (
              <div key={l.id}>
                <Link href={`/productos/${producto.id}?tab=lotes`} className="mb-1.5 inline-block text-sm font-medium text-tinta-suave hover:text-marca">
                  {producto.nombre}
                </Link>
                <ComparacionLote loteId={l.id} producto={producto} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
