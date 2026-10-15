"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Boxes, Copy, FileDown, FileSpreadsheet, Layers, Pencil, Plus, Receipt, Tag, Trash2, Workflow } from "lucide-react";
import type { Costo, Lote, Producto, Variante } from "@/tipos";
import { nuevoId, useMartha } from "@/lib/datos/MarthaProvider";
import { CATEGORIAS, ESTADOS_COSTO, ESTADOS_PRODUCTO, TIPOS_COSTO, TIPOS_EVENTO } from "@/lib/calculos/catalogo";
import { calcularProducto, costoPorUnidad, totalCostoCOP, unidadesBase, unidadesEnLotes } from "@/lib/calculos/motor";
import { exportarExcel, exportarPdfProducto } from "@/lib/exportar";
import { formatoCOP, formatoCompacto, formatoFecha, formatoMoneda, formatoNumero, formatoPct, hoyISO } from "@/lib/formato";
import { CamposDatosBasicos, CamposPrecio } from "@/components/CamposProducto";
import { ComparacionLote } from "@/components/ComparacionLote";
import { FormularioCosto, costoVacio } from "@/components/FormularioCosto";
import { FormularioLote } from "@/components/FormularioLote";
import { PanelCalculo } from "@/components/PanelCalculo";
import { BarraFiltros, ChipBusqueda, ChipSelect } from "@/components/Filtros";
import { TablaDatos } from "@/components/TablaDatos";
import { Simulador } from "@/components/Simulador";
import { Aviso, BadgeMargen, Campo, Cargando, Encabezado, EntradaNumero, Etiqueta, Modal, Pestanas, TituloTarjeta, Vacio } from "@/components/ui";

type Pestana = "resumen" | "costos" | "variantes" | "lotes" | "simulador" | "historial";
const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "costos", etiqueta: "Costos" },
  { id: "variantes", etiqueta: "Variantes" },
  { id: "lotes", etiqueta: "Lotes" },
  { id: "simulador", etiqueta: "Simulador" },
  { id: "historial", etiqueta: "Historial" },
];

export default function DetalleProducto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, tasas, cargando, esAdmin, eliminar, duplicarProducto, guardar, cambiarPrecio } = useMartha();
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [editando, setEditando] = useState<Producto | null>(null);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") as Pestana | null;
    if (tab && PESTANAS.some((p) => p.id === tab)) setPestana(tab);
  }, []);

  const producto = db.productos.find((p) => p.id === id);
  const r = useMemo(() => (producto ? calcularProducto({ producto, costos: db.costos, lotes: db.lotes, tasas }) : null), [producto, db.costos, db.lotes, tasas]);

  if (cargando) return <Cargando />;
  if (!producto || !r)
    return (
      <Vacio titulo="Producto no encontrado">
        <Link href="/productos" className="btn-secundario mt-3">
          Volver a productos
        </Link>
      </Vacio>
    );

  const proveedor = db.proveedores.find((p) => p.id === producto.proveedorId);
  const origen = db.productos.find((p) => p.id === producto.productoOrigenId);

  async function guardarEdicion() {
    if (!editando || !producto) return;
    if (editando.precioVenta !== producto.precioVenta) await cambiarPrecio(producto.id, editando.precioVenta, motivo || "Edición del producto", { ...editando, precioVenta: producto.precioVenta });
    else await guardar("productos", editando);
    setEditando(null);
    setMotivo("");
  }

  return (
    <div>
      <Encabezado
        previo={
          <Link href="/productos" className="inline-flex items-center gap-1 font-semibold text-white/80 hover:text-white">
            <ArrowLeft className="size-4" /> Productos
          </Link>
        }
        titulo={
          <span className="inline-flex flex-wrap items-center gap-3">
            {producto.imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={producto.imagenUrl} alt="" className="size-12 rounded-2xl object-cover ring-2 ring-white/30" />
            ) : (
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-base font-bold text-white ring-1 ring-white/25">
                {producto.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
            {producto.nombre}
          </span>
        }
        descripcion={
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">{producto.sku}</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-white">{producto.categoria}</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-white">v{producto.version}</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-white">{ESTADOS_PRODUCTO[producto.estado]}</span>
              <BadgeMargen margen={r.margenNeto} estado={r.semaforo} />
            </div>
            <p className="text-xs text-white/65">
              {proveedor ? `${proveedor.nombre} · ` : ""}
              {producto.paisOrigen} · moneda base {producto.monedaBase}
              {origen && (
                <>
                  {" "}
                  · versión de{" "}
                  <Link href={`/productos/${origen.id}`} className="font-semibold text-malva-200 underline-offset-2 hover:underline">
                    {origen.nombre}
                  </Link>
                </>
              )}
            </p>
          </div>
        }
        datos={[
          { etiqueta: "Costo total / u", valor: r.costoTotalUnitario, formato: formatoCOP },
          { etiqueta: "Precio", valor: r.precio, formato: formatoCOP },
          { etiqueta: "Invertido", valor: r.inversionTotal, formato: formatoCompacto },
        ]}
        acciones={
          <>
            <button className="btn-primario" onClick={() => setEditando(producto)}>
              <Pencil className="size-4" /> Editar
            </button>
            <button className="btn-secundario" onClick={async () => router.push(`/productos/${await duplicarProducto(producto.id)}`)}>
              <Copy className="size-4" /> Nueva versión
            </button>
            <button className="btn-secundario" onClick={() => exportarPdfProducto(db, producto.id)}>
              <FileDown className="size-4" /> PDF
            </button>
            <button className="btn-secundario" onClick={() => exportarExcel(db, producto.id)}>
              <FileSpreadsheet className="size-4" /> Excel
            </button>
            {esAdmin && (
              <button
                className="btn-peligro"
                aria-label="Eliminar producto"
                onClick={async () => {
                  if (window.confirm(`¿Eliminar «${producto.nombre}» con todos sus costos, lotes e historial?`)) {
                    await eliminar("productos", producto.id);
                    router.push("/productos");
                  }
                }}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </>
        }
      />

      <Pestanas valor={pestana} opciones={PESTANAS} onCambio={setPestana} />

      {pestana === "resumen" && <PanelCalculo r={r} producto={producto} />}
      {pestana === "costos" && <PestanaCostos producto={producto} />}
      {pestana === "variantes" && <PestanaVariantes producto={producto} />}
      {pestana === "lotes" && <PestanaLotes producto={producto} />}
      {pestana === "simulador" && <Simulador key={producto.id} producto={producto} />}
      {pestana === "historial" && <PestanaHistorial producto={producto} />}

      <Modal abierto={!!editando} titulo="Editar producto" onCerrar={() => setEditando(null)} ancho="max-w-3xl">
        {editando && (
          <div className="space-y-6">
            <CamposDatosBasicos
              p={editando}
              set={(k, v) => setEditando((e) => (e ? { ...e, [k]: v } : e))}
              proveedores={db.proveedores}
              categorias={[...new Set(db.productos.map((p) => p.categoria))]}
              skuDuplicado={db.productos.some((p) => p.id !== editando.id && p.sku.toLowerCase() === editando.sku.toLowerCase())}
            />
            <div className="border-t border-linea pt-5">
              <CamposPrecio p={editando} set={(k, v) => setEditando((e) => (e ? { ...e, [k]: v } : e))} />
            </div>
            {editando.precioVenta !== producto.precioVenta && (
              <Campo etiqueta="Motivo del cambio de precio" ayuda="Queda en el historial de precios.">
                <input className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. sube el flete" />
              </Campo>
            )}
            <div className="flex justify-end gap-2">
              <button className="btn-secundario" onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button className="btn-primario" onClick={guardarEdicion} disabled={!editando.nombre.trim() || !editando.sku.trim()}>
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PestanaCostos({ producto }: { producto: Producto }) {
  const { db, tasas, guardar, eliminar, esAdmin, registrarEvento } = useMartha();
  const [editando, setEditando] = useState<Costo | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [fCategoria, setFCategoria] = useState<string>();
  const [fEstado, setFEstado] = useState<string>();
  const [fLote, setFLote] = useState<string>();
  const costos = db.costos.filter((c) => c.productoId === producto.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const variantes = db.variantes.filter((v) => v.productoId === producto.id);
  const base = unidadesBase(producto, db.lotes);
  const ul = unidadesEnLotes(producto.id, db.costos, db.lotes);
  const lote = (id?: string | null) => db.lotes.find((l) => l.id === id)?.codigo;
  const esNuevo = editando && !db.costos.some((c) => c.id === editando.id);

  async function guardarCosto(c: Costo) {
    await guardar("costos", c);
    if (esNuevo) await registrarEvento(producto.id, c.categoria === "desarrollo" ? "muestra" : "ajuste_costo", `Nuevo costo: ${c.nombre} (${formatoMoneda(c.modo === "unitario" ? c.valor * c.cantidadUnidades : c.valor, c.moneda)})`);
    setEditando(null);
  }

  const q = busqueda.trim().toLowerCase();
  const visibles = costos.filter(
    (c) =>
      (!q || `${c.nombre} ${c.responsable ?? ""} ${c.nota ?? ""}`.toLowerCase().includes(q)) &&
      (!fCategoria || c.categoria === fCategoria) &&
      (!fEstado || c.estado === fEstado) &&
      (!fLote || (fLote === "sin" ? !c.loteId : c.loteId === fLote)),
  );
  const lotesProducto = db.lotes.filter((l) => l.productoId === producto.id);

  return (
    <div className="space-y-4">
      <BarraFiltros
        activos={[q, fCategoria, fEstado, fLote].filter(Boolean).length}
        onLimpiar={() => {
          setBusqueda("");
          setFCategoria(undefined);
          setFEstado(undefined);
          setFLote(undefined);
        }}
      >
        <ChipBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Costo o responsable…" />
        <ChipSelect etiqueta="Categoría" icono={Tag} valor={fCategoria} onCambio={setFCategoria} opciones={[...new Set(costos.map((c) => c.categoria))].map((k) => ({ valor: k, etiqueta: CATEGORIAS[k].etiqueta }))} />
        <ChipSelect etiqueta="Estado" icono={Workflow} valor={fEstado} onCambio={setFEstado} opciones={Object.entries(ESTADOS_COSTO).map(([k, v]) => ({ valor: k, etiqueta: v }))} />
        <ChipSelect etiqueta="Lote" icono={Boxes} valor={fLote} onCambio={setFLote} opciones={[{ valor: "sin", etiqueta: "Sin lote" }, ...lotesProducto.map((l) => ({ valor: l.id, etiqueta: l.codigo }))]} />
      </BarraFiltros>

      <TablaDatos
        icono={Receipt}
        titulo="Costos"
        descripcion={`Los fijos se reparten entre ${formatoNumero(base)} unidades.`}
        accion={
          <button className="btn-primario" onClick={() => setEditando(costoVacio(producto, tasas))}>
            <Plus className="size-4" /> Agregar costo
          </button>
        }
        filas={visibles}
        clave={(c) => c.id}
        ordenInicial={{ clave: "unidad", dir: "desc" }}
        vacio={costos.length ? "Ningún costo coincide con los filtros." : "Sin costos registrados. Agrega materia prima, mano de obra, fletes, aduanas…"}
        columnas={[
          {
            clave: "nombre",
            titulo: "Costo",
            principal: true,
            ordenar: (c) => c.nombre,
            render: (c) => (
              <div className="min-w-0">
                <p className="font-semibold">{c.nombre}</p>
                <p className="text-xs text-tinta-tenue">
                  {CATEGORIAS[c.categoria].etiqueta}
                  {lote(c.loteId) && ` · ${lote(c.loteId)}`}
                  {c.varianteId && ` · ${variantes.find((v) => v.id === c.varianteId)?.nombre ?? "variante"}`}
                  {c.responsable && ` · ${c.responsable}`}
                </p>
              </div>
            ),
          },
          { clave: "fecha", titulo: "Fecha", ordenar: (c) => c.fecha, render: (c) => <span className="text-xs whitespace-nowrap text-tinta-suave">{formatoFecha(c.fecha)}</span> },
          { clave: "tipo", titulo: "Tipo", ordenar: (c) => c.tipo, render: (c) => <span className="text-xs whitespace-nowrap">{TIPOS_COSTO[c.tipo]}</span> },
          {
            clave: "valor",
            titulo: "Valor",
            alinear: "der",
            render: (c) => (
              <span className="text-xs">
                {formatoMoneda(c.valorReal ?? c.valor, c.moneda)}
                {c.modo === "unitario" && " /u"}
              </span>
            ),
          },
          { clave: "total", titulo: "Total COP", alinear: "der", ordenar: (c) => totalCostoCOP(c, tasas), render: (c) => formatoCOP(totalCostoCOP(c, tasas)) },
          { clave: "unidad", titulo: "Por unidad", alinear: "der", ordenar: (c) => costoPorUnidad(c, base, tasas, {}, ul), render: (c) => <span className="font-bold text-marca">{formatoCOP(costoPorUnidad(c, base, tasas, {}, ul))}</span> },
          {
            clave: "estado",
            titulo: "Estado",
            ordenar: (c) => c.estado,
            render: (c) => <Etiqueta tono={c.estado === "pagado" ? "verde" : c.estado === "pendiente" ? "amarillo" : c.estado === "ajustado" ? "marca" : "neutro"}>{ESTADOS_COSTO[c.estado]}</Etiqueta>,
          },
          {
            clave: "acciones",
            titulo: "",
            acciones: true,
            alinear: "der",
            render: (c) => (
              <span className="inline-flex gap-1">
                <button className="btn-fantasma px-2" onClick={() => setEditando(c)} aria-label={`Editar ${c.nombre}`}>
                  <Pencil className="size-4" />
                </button>
                {esAdmin && (
                  <button className="btn-fantasma px-2 hover:bg-rojo-suave hover:text-rojo" onClick={() => window.confirm(`¿Eliminar «${c.nombre}»?`) && eliminar("costos", c.id)} aria-label={`Eliminar ${c.nombre}`}>
                    <Trash2 className="size-4" />
                  </button>
                )}
              </span>
            ),
          },
        ]}
      />
      <Modal abierto={!!editando} titulo={esNuevo ? "Agregar costo" : "Editar costo"} onCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioCosto
            producto={producto}
            costos={db.costos}
            lotes={db.lotes}
            variantes={variantes}
            tasas={tasas}
            inicial={editando}
            conReal={!esNuevo}
            textoGuardar={esNuevo ? "Agregar costo" : "Guardar"}
            onGuardar={guardarCosto}
            onCancelar={() => setEditando(null)}
          />
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PestanaVariantes({ producto }: { producto: Producto }) {
  const { db, tasas, guardar, eliminar, esAdmin } = useMartha();
  const [editando, setEditando] = useState<Variante | null>(null);
  const variantes = db.variantes.filter((v) => v.productoId === producto.id);

  const nueva = (): Variante => ({ id: nuevoId(), productoId: producto.id, sku: `${producto.sku}-`, nombre: "", atributos: {}, costoAdicionalUnitario: 0, precioVenta: null, unidades: 0 });

  const filas = variantes.map((v) => ({
    v,
    rv: calcularProducto({ producto, costos: db.costos, lotes: db.lotes, tasas, varianteId: v.id, costoAdicionalUnitario: v.costoAdicionalUnitario, precio: v.precioVenta ?? producto.precioVenta }),
    propios: db.costos.filter((c) => c.varianteId === v.id).reduce((s, c) => s + totalCostoCOP(c, tasas), 0),
  }));

  return (
    <div className="space-y-4">
      <TablaDatos
        icono={Layers}
        titulo="Variantes"
        descripcion="«Invertido» muestra solo los costos propios de la variante; el costo/u incluye la parte proporcional del producto."
        accion={
          <button className="btn-primario" onClick={() => setEditando(nueva())}>
            <Plus className="size-4" /> Agregar variante
          </button>
        }
        filas={filas}
        clave={(f) => f.v.id}
        vacio="Sin variantes: este producto se vende en una sola presentación."
        columnas={[
          {
            clave: "nombre",
            titulo: "Variante",
            principal: true,
            ordenar: (f) => f.v.nombre,
            render: ({ v }) => (
              <div className="min-w-0">
                <p className="font-semibold">{v.nombre}</p>
                <p className="text-xs text-tinta-tenue">{v.sku}</p>
              </div>
            ),
          },
          {
            clave: "atributos",
            titulo: "Atributos",
            render: ({ v }) => (
              <span className="flex flex-wrap gap-1">
                {Object.entries(v.atributos).map(([k, x]) => (
                  <span key={k} className="rounded-full bg-hundido px-2 py-0.5 text-xs text-tinta-suave">
                    {x}
                  </span>
                ))}
              </span>
            ),
          },
          {
            clave: "costo",
            titulo: "Costo/u",
            alinear: "der",
            ordenar: (f) => f.rv.costoTotalUnitario,
            render: ({ v, rv }) => (
              <span>
                <span className="font-semibold">{formatoCOP(rv.costoTotalUnitario)}</span>
                {v.costoAdicionalUnitario > 0 && <span className="block text-xs text-tinta-tenue">+{formatoCOP(v.costoAdicionalUnitario)}</span>}
              </span>
            ),
          },
          { clave: "precio", titulo: "Precio", alinear: "der", ordenar: (f) => f.rv.precio, render: ({ rv }) => formatoCOP(rv.precio) },
          { clave: "margen", titulo: "Margen neto", ordenar: (f) => f.rv.margenNeto ?? -Infinity, render: ({ rv }) => <BadgeMargen margen={rv.margenNeto} estado={rv.semaforo} compacto /> },
          { clave: "utilidad", titulo: "Utilidad/u", alinear: "der", ordenar: (f) => f.rv.utilidadUnitaria, render: ({ rv }) => formatoCOP(rv.utilidadUnitaria) },
          { clave: "invertido", titulo: "Invertido", alinear: "der", ordenar: (f) => f.propios, render: ({ propios }) => <span className="text-xs">{propios ? formatoCOP(propios) : "—"}</span> },
          {
            clave: "acciones",
            titulo: "",
            acciones: true,
            alinear: "der",
            render: ({ v }) => (
              <span className="inline-flex gap-1">
                <button className="btn-fantasma px-2" onClick={() => setEditando(v)} aria-label={`Editar ${v.nombre}`}>
                  <Pencil className="size-4" />
                </button>
                {esAdmin && (
                  <button className="btn-fantasma px-2 hover:bg-rojo-suave hover:text-rojo" onClick={() => window.confirm(`¿Eliminar la variante ${v.nombre}?`) && eliminar("variantes", v.id)} aria-label={`Eliminar ${v.nombre}`}>
                    <Trash2 className="size-4" />
                  </button>
                )}
              </span>
            ),
          },
        ]}
      />

      <Modal abierto={!!editando} titulo="Variante" onCerrar={() => setEditando(null)} ancho="max-w-lg">
        {editando && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await guardar("variantes", editando);
              setEditando(null);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etiqueta="Nombre">
                <input className="campo" required value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} placeholder="Negro · M" />
              </Campo>
              <Campo etiqueta="SKU">
                <input className="campo uppercase" required value={editando.sku} onChange={(e) => setEditando({ ...editando, sku: e.target.value.toUpperCase() })} />
              </Campo>
              {(["talla", "color", "material", "presentacion"] as const).map((k) => (
                <Campo key={k} etiqueta={k === "presentacion" ? "Presentación" : k[0].toUpperCase() + k.slice(1)}>
                  <input
                    className="campo"
                    value={editando.atributos[k] ?? ""}
                    onChange={(e) => {
                      const atributos = { ...editando.atributos, [k]: e.target.value };
                      if (!e.target.value) delete atributos[k];
                      setEditando({ ...editando, atributos });
                    }}
                  />
                </Campo>
              ))}
              <Campo etiqueta="Costo adicional / u">
                <EntradaNumero prefijo="$" valor={editando.costoAdicionalUnitario} onCambio={(v) => setEditando({ ...editando, costoAdicionalUnitario: v })} />
              </Campo>
              <Campo etiqueta="Precio propio" ayuda="Vacío = precio del producto">
                <input className="campo" type="number" value={editando.precioVenta ?? ""} onChange={(e) => setEditando({ ...editando, precioVenta: e.target.value ? parseFloat(e.target.value) : null })} />
              </Campo>
            </div>
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

// ---------------------------------------------------------------------------

function PestanaLotes({ producto }: { producto: Producto }) {
  const { db, guardar, eliminar, esAdmin, registrarEvento } = useMartha();
  const [editando, setEditando] = useState<Lote | null>(null);
  const lotes = db.lotes.filter((l) => l.productoId === producto.id).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const nuevo = (): Lote => ({
    id: nuevoId(),
    productoId: producto.id,
    proveedorId: producto.proveedorId,
    codigo: `L-${producto.sku.split("-").slice(0, 2).join("")}-${String(lotes.length + 1).padStart(2, "0")}`,
    tipo: producto.paisOrigen === "Colombia" ? "produccion" : "importacion",
    estado: "planeado",
    unidadesEstimadas: producto.unidadesEstimadas,
    unidadesReales: null,
    fecha: hoyISO(),
  });

  return (
    <div className="space-y-4">
      <div className="tarjeta-luz px-5 pt-5 pb-1">
        <TituloTarjeta
          icono={Boxes}
          titulo="Lotes del producto"
          descripcion="Compara lo presupuestado con las facturas reales de cada lote."
          accion={
            <button className="btn-primario" onClick={() => setEditando(nuevo())}>
              <Plus className="size-4" /> Nuevo lote
            </button>
          }
        />
      </div>
      {lotes.length === 0 && <Vacio titulo="Sin lotes">Crea un lote de producción, compra o importación y asócialo a sus costos.</Vacio>}
      {lotes.map((l) => (
        <div key={l.id} className="space-y-2">
          <ComparacionLote loteId={l.id} producto={producto} />
          <div className="flex justify-end gap-2">
            <button className="btn-fantasma text-xs" onClick={() => setEditando(l)}>
              <Pencil className="size-3.5" /> Editar lote
            </button>
            {esAdmin && (
              <button className="btn-fantasma text-xs hover:text-rojo" onClick={() => window.confirm(`¿Eliminar el lote ${l.codigo}? Sus costos quedan sin lote.`) && eliminar("lotes", l.id)}>
                <Trash2 className="size-3.5" /> Eliminar
              </button>
            )}
          </div>
        </div>
      ))}
      <Modal abierto={!!editando} titulo="Lote" onCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioLote
            inicial={editando}
            onCancelar={() => setEditando(null)}
            onGuardar={async (l) => {
              const existe = db.lotes.some((x) => x.id === l.id);
              await guardar("lotes", l);
              if (!existe) await registrarEvento(producto.id, l.tipo === "importacion" ? "importacion" : "compra", `Lote ${l.codigo} de ${formatoNumero(l.unidadesEstimadas)} unidades`);
              setEditando(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PestanaHistorial({ producto }: { producto: Producto }) {
  const { db, tasas, registrarEvento } = useMartha();
  const [nota, setNota] = useState("");
  const eventos = db.eventos.filter((e) => e.productoId === producto.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const precios = db.precios.filter((p) => p.productoId === producto.id && !p.varianteId).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const raiz = producto.productoOrigenId ?? producto.id;
  const familia = db.productos.filter((p) => p.id === raiz || p.productoOrigenId === raiz).sort((a, b) => a.version - b.version);
  const [comparar, setComparar] = useState<string>(() => familia.find((p) => p.id !== producto.id && p.version === producto.version - 1)?.id ?? familia.find((p) => p.id !== producto.id)?.id ?? "");
  const otro = db.productos.find((p) => p.id === comparar);

  const inversiones = db.costos
    .filter((c) => c.productoId === producto.id)
    .reduce<Record<string, number>>((acc, c) => {
      const grupo = c.categoria === "desarrollo" ? "Crear (diseño, muestras)" : c.categoria === "creativo" ? "Poner a la venta (fotos, contenido)" : c.loteId ? "Producir / comprar (lotes)" : "Otros";
      acc[grupo] = (acc[grupo] ?? 0) + totalCostoCOP(c, tasas);
      return acc;
    }, {});

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="tarjeta-luz p-4">
          <h3 className="mb-3 text-sm font-semibold">Línea de tiempo</h3>
          <form
            className="mb-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!nota.trim()) return;
              await registrarEvento(producto.id, "nota", nota.trim());
              setNota("");
            }}
          >
            <input className="campo" placeholder="Agregar una nota (ej. «cliente pidió talla XXL»)" value={nota} onChange={(e) => setNota(e.target.value)} />
            <button className="btn-secundario">Agregar</button>
          </form>
          <ol className="relative space-y-4 border-l border-linea pl-5">
            {eventos.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-superficie bg-marca" />
                <p className="text-xs text-tinta-tenue">
                  {formatoFecha(e.fecha)} · {TIPOS_EVENTO[e.tipo]}
                  {e.usuario && ` · ${e.usuario}`}
                </p>
                <p className="text-sm">{e.descripcion}</p>
              </li>
            ))}
            {!eventos.length && <li className="text-sm text-tinta-tenue">Sin eventos.</li>}
          </ol>
        </section>

        {familia.length > 1 && otro && (
          <section className="tarjeta-luz overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <h3 className="text-sm font-semibold">Comparar versiones</h3>
              <select className="campo w-auto" value={comparar} onChange={(e) => setComparar(e.target.value)}>
                {familia
                  .filter((p) => p.id !== producto.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      v{p.version} · {p.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <ComparacionVersiones a={otro} b={producto} />
          </section>
        )}
      </div>

      <div className="space-y-5">
        <section className="tarjeta-luz p-4">
          <h3 className="mb-3 text-sm font-semibold">¿En qué se ha invertido?</h3>
          <dl className="space-y-1.5 text-sm">
            {Object.entries(inversiones).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-tinta-suave">{k}</dt>
                <dd className="tabular-nums">{formatoCOP(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-2 border-t border-linea pt-1.5 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatoCOP(Object.values(inversiones).reduce((a, b) => a + b, 0))}</dd>
            </div>
          </dl>
        </section>
        <section className="tarjeta-luz p-4">
          <h3 className="mb-3 text-sm font-semibold">Historial de precios</h3>
          {precios.length ? (
            <ul className="space-y-2 text-sm">
              {precios.map((p, i) => {
                const anterior = precios[i + 1];
                return (
                  <li key={p.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium tabular-nums">{formatoCOP(p.precio)}</p>
                      <p className="text-xs text-tinta-tenue">
                        {formatoFecha(p.fecha)}
                        {p.motivo && ` · ${p.motivo}`}
                      </p>
                    </div>
                    {anterior && (
                      <span className={p.precio >= anterior.precio ? "text-xs text-verde" : "text-xs text-rojo"}>
                        {p.precio >= anterior.precio ? "+" : ""}
                        {formatoPct((p.precio - anterior.precio) / anterior.precio)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-tinta-tenue">Sin cambios de precio.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function ComparacionVersiones({ a, b }: { a: Producto; b: Producto }) {
  const { db, tasas } = useMartha();
  const ra = calcularProducto({ producto: a, costos: db.costos, lotes: db.lotes, tasas });
  const rb = calcularProducto({ producto: b, costos: db.costos, lotes: db.lotes, tasas });
  const filas: [string, number | null, number | null, "cop" | "pct", boolean][] = [
    ["Costo directo / u", ra.costoDirectoUnitario, rb.costoDirectoUnitario, "cop", false],
    ["Landed cost", ra.landedCost, rb.landedCost, "cop", false],
    ["Costo total / u", ra.costoTotalUnitario, rb.costoTotalUnitario, "cop", false],
    ["Precio", ra.precio, rb.precio, "cop", true],
    ["Margen bruto", ra.margenBruto, rb.margenBruto, "pct", true],
    ["Margen neto", ra.margenNeto, rb.margenNeto, "pct", true],
    ["Utilidad / u", ra.utilidadUnitaria, rb.utilidadUnitaria, "cop", true],
    ["Inversión total", ra.inversionTotal, rb.inversionTotal, "cop", false],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="tabla">
        <thead>
          <tr>
            <th>Indicador</th>
            <th className="num">v{a.version}</th>
            <th className="num">v{b.version} (esta)</th>
            <th className="num">Cambio</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([e, va, vb, f, masEsMejor]) => {
            const dif = va !== null && vb !== null ? vb - va : null;
            const mejor = dif === null || dif === 0 ? null : masEsMejor ? dif > 0 : dif < 0;
            const fmt = (v: number | null) => (f === "pct" ? formatoPct(v) : formatoCOP(v));
            return (
              <tr key={e}>
                <td className="text-tinta-suave">{e}</td>
                <td className="num">{fmt(va)}</td>
                <td className="num font-medium">{fmt(vb)}</td>
                <td className={`num text-xs ${mejor === null ? "text-tinta-tenue" : mejor ? "text-verde" : "text-rojo"}`}>
                  {dif === null || dif === 0 ? "—" : `${dif > 0 ? "+" : ""}${f === "pct" ? `${(dif * 100).toFixed(1)} pts` : formatoCOP(dif)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ra.costoTotalUnitario > 0 && <Aviso tono="neutro">La v{b.version} cuesta {formatoPct((rb.costoTotalUnitario - ra.costoTotalUnitario) / ra.costoTotalUnitario)} {rb.costoTotalUnitario >= ra.costoTotalUnitario ? "más" : "menos"} por unidad que la v{a.version}.</Aviso>}
    </div>
  );
}
