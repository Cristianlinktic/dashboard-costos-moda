"use client";

import { useState } from "react";
import { Coins, Factory, Globe, Pencil, Plus, Trash2 } from "lucide-react";
import type { CodigoMoneda, Proveedor } from "@/tipos";
import { nuevoId, useMartha } from "@/lib/datos/MarthaProvider";
import { MONEDAS } from "@/lib/calculos/catalogo";
import { compararLote, totalCostoCOP } from "@/lib/calculos/motor";
import { formatoCOP, formatoCompacto, formatoPct } from "@/lib/formato";
import { Campo, Cargando, Encabezado, Etiqueta, Modal, cx } from "@/components/ui";
import { BarraFiltros, ChipBusqueda, ChipSelect } from "@/components/Filtros";
import { TablaDatos, type Columna } from "@/components/TablaDatos";

type FilaProveedor = Proveedor & { lotes: number; productos: number; comprado: number; desviacion: number | null };

export default function Proveedores() {
  const { db, tasas, cargando, esAdmin, guardar, eliminar } = useMartha();
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState<string>();
  const [moneda, setMoneda] = useState<string>();
  if (cargando) return <Cargando />;

  const filas: FilaProveedor[] = db.proveedores.map((prov) => {
    const lotes = db.lotes.filter((l) => l.proveedorId === prov.id);
    const comps = lotes.map((l) => compararLote(l, db.costos, tasas));
    const estimado = comps.reduce((s, c) => s + c.estimadoTotal, 0);
    const real = comps.reduce((s, c) => s + c.realTotal, 0);
    const productos = new Set([...db.productos.filter((p) => p.proveedorId === prov.id).map((p) => p.id), ...lotes.map((l) => l.productoId)]);
    const comprado = db.costos.filter((c) => c.loteId && lotes.some((l) => l.id === c.loteId)).reduce((s, c) => s + totalCostoCOP(c, tasas), 0);
    return { ...prov, lotes: lotes.length, productos: productos.size, comprado, desviacion: estimado ? (real - estimado) / estimado : null };
  });
  const q = busqueda.trim().toLowerCase();
  const visibles = filas.filter((f) => (!q || `${f.nombre} ${f.pais} ${f.contacto ?? ""}`.toLowerCase().includes(q)) && (!tipo || f.tipo === tipo) && (!moneda || f.moneda === moneda));
  const totalComprado = filas.reduce((s, f) => s + f.comprado, 0);
  const internacionales = filas.filter((f) => f.tipo === "internacional").length;

  const columnas: Columna<FilaProveedor>[] = [
    {
      clave: "nombre",
      titulo: "Proveedor",
      principal: true,
      ordenar: (f) => f.nombre,
      render: (f) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--mt-gradiente-marca)] text-xs font-bold text-white">{f.nombre.slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{f.nombre}</p>
            <p className="truncate text-xs text-tinta-tenue">
              {f.pais}
              {f.contacto && ` · ${f.contacto}`}
            </p>
          </div>
        </div>
      ),
    },
    { clave: "tipo", titulo: "Tipo", ordenar: (f) => f.tipo, render: (f) => <Etiqueta tono={f.tipo === "internacional" ? "marca" : "neutro"}>{f.tipo === "internacional" ? "Internacional" : "Nacional"}</Etiqueta> },
    { clave: "moneda", titulo: "Moneda", ordenar: (f) => f.moneda, render: (f) => <span className="font-semibold">{f.moneda}</span> },
    { clave: "productos", titulo: "Productos", alinear: "der", ordenar: (f) => f.productos, render: (f) => f.productos },
    { clave: "lotes", titulo: "Lotes", alinear: "der", ordenar: (f) => f.lotes, render: (f) => f.lotes },
    { clave: "comprado", titulo: "Comprado", alinear: "der", ordenar: (f) => f.comprado, render: (f) => <span className="font-semibold">{formatoCOP(f.comprado)}</span> },
    {
      clave: "desviacion",
      titulo: "Real vs. estimado",
      alinear: "der",
      ordenar: (f) => f.desviacion ?? -Infinity,
      render: (f) =>
        f.desviacion === null ? (
          <span className="text-tinta-tenue">—</span>
        ) : (
          <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold", f.desviacion > 0.05 ? "bg-rojo-suave text-rojo" : f.desviacion > 0 ? "bg-amarillo-suave text-amarillo" : "bg-verde-suave text-verde")}>
            {f.desviacion > 0 ? "+" : ""}
            {formatoPct(f.desviacion)}
          </span>
        ),
    },
    ...(esAdmin
      ? [
          {
            clave: "acciones",
            titulo: "",
            acciones: true,
            alinear: "der" as const,
            render: (f: FilaProveedor) => (
              <span className="inline-flex gap-1">
                <button className="btn-fantasma px-2" onClick={() => setEditando(f)} aria-label={`Editar ${f.nombre}`}>
                  <Pencil className="size-4" />
                </button>
                <button className="btn-fantasma px-2 hover:bg-rojo-suave hover:text-rojo" onClick={() => window.confirm(`¿Eliminar ${f.nombre}?`) && eliminar("proveedores", f.id)} aria-label={`Eliminar ${f.nombre}`}>
                  <Trash2 className="size-4" />
                </button>
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Encabezado
        titulo="Proveedores"
        acento="y desviaciones"
        descripcion="Nacionales e internacionales, con su desviación entre lo cotizado y lo facturado."
        datos={[
          { etiqueta: "Proveedores", valor: filas.length, formato: (n) => String(Math.round(n)), detalle: `${internacionales} internacionales` },
          { etiqueta: "Comprado en lotes", valor: totalComprado, formato: formatoCompacto },
        ]}
        acciones={
          esAdmin && (
            <button className="btn-primario" onClick={() => setEditando({ id: nuevoId(), nombre: "", pais: "Colombia", tipo: "nacional", moneda: "COP" })}>
              <Plus className="size-4" /> Nuevo proveedor
            </button>
          )
        }
      />

      <BarraFiltros
        activos={[busqueda.trim(), tipo, moneda].filter(Boolean).length}
        onLimpiar={() => {
          setBusqueda("");
          setTipo(undefined);
          setMoneda(undefined);
        }}
      >
        <ChipBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Nombre, país o contacto…" />
        <ChipSelect etiqueta="Tipo" icono={Globe} valor={tipo} onCambio={setTipo} opciones={[{ valor: "nacional", etiqueta: "Nacional" }, { valor: "internacional", etiqueta: "Internacional" }]} />
        <ChipSelect etiqueta="Moneda" icono={Coins} valor={moneda} onCambio={setMoneda} opciones={[...new Set(db.proveedores.map((p) => p.moneda))].map((m) => ({ valor: m, etiqueta: m }))} />
      </BarraFiltros>

      <TablaDatos
        icono={Factory}
        titulo="Proveedores"
        descripcion={esAdmin ? "Haz clic en un encabezado para ordenar." : "Solo un administrador puede crear o editar proveedores."}
        columnas={columnas}
        filas={visibles}
        clave={(f) => f.id}
        ordenInicial={{ clave: "comprado", dir: "desc" }}
        vacio={db.proveedores.length ? "Ningún proveedor coincide con los filtros." : "Aún no tienes proveedores."}
      />

      <Modal abierto={!!editando} titulo="Proveedor" onCerrar={() => setEditando(null)} ancho="max-w-lg">
        {editando && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await guardar("proveedores", editando);
              setEditando(null);
            }}
          >
            <Campo etiqueta="Nombre">
              <input className="campo" required value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
            </Campo>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo etiqueta="País">
                <input className="campo" value={editando.pais} onChange={(e) => setEditando({ ...editando, pais: e.target.value, tipo: e.target.value.trim().toLowerCase() === "colombia" ? "nacional" : "internacional" })} />
              </Campo>
              <Campo etiqueta="Tipo">
                <select className="campo" value={editando.tipo} onChange={(e) => setEditando({ ...editando, tipo: e.target.value as Proveedor["tipo"] })}>
                  <option value="nacional">Nacional</option>
                  <option value="internacional">Internacional</option>
                </select>
              </Campo>
              <Campo etiqueta="Moneda">
                <select className="campo" value={editando.moneda} onChange={(e) => setEditando({ ...editando, moneda: e.target.value as CodigoMoneda })}>
                  {MONEDAS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Campo>
            </div>
            <Campo etiqueta="Contacto">
              <input className="campo" value={editando.contacto ?? ""} onChange={(e) => setEditando({ ...editando, contacto: e.target.value })} />
            </Campo>
            <Campo etiqueta="Notas">
              <textarea className="campo" value={editando.notas ?? ""} onChange={(e) => setEditando({ ...editando, notas: e.target.value })} />
            </Campo>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secundario" onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button className="btn-primario">Guardar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
