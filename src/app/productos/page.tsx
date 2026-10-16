"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Activity, Copy, LayoutGrid, Package, Plus, Rows3, Tag, Workflow } from "lucide-react";
import { TablaDatos } from "@/components/TablaDatos";
import type { Producto } from "@/tipos";
import type { ResultadoCalculo } from "@/lib/calculos/motor";
import { BarraFiltros, ChipBusqueda, ChipSelect } from "@/components/Filtros";
import { useMartha } from "@/lib/datos/MarthaProvider";
import { calcularTodos } from "@/lib/calculos/dashboard";
import { ESTADOS_PRODUCTO } from "@/lib/calculos/catalogo";
import { formatoCOP, formatoCompacto, formatoPct } from "@/lib/formato";
import { BadgeMargen, Cargando, Encabezado, Etiqueta, Vacio, cx } from "@/components/ui";

const SALUD = [
  { valor: "verde", etiqueta: "Saludable" },
  { valor: "amarillo", etiqueta: "Margen bajo" },
  { valor: "rojo", etiqueta: "Con pérdida" },
  { valor: "gris", etiqueta: "Sin precio" },
];

export default function Productos() {
  const { db, tasas, cargando, duplicarProducto } = useMartha();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [salud, setSalud] = useState("");
  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas");

  const todos = useMemo(() => calcularTodos(db, tasas), [db, tasas]);
  const categorias = [...new Set(db.productos.map((p) => p.categoria))].sort();
  const filtrados = todos.filter(({ producto: p }) => {
    const q = busqueda.trim().toLowerCase();
    return (!q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) && (!categoria || p.categoria === categoria) && (!estado || p.estado === estado);
  }).filter(({ calculo }) => !salud || calculo.semaforo === salud);
  const activos = [busqueda.trim(), categoria, estado, salud].filter(Boolean).length;
  const conMargen = todos.filter((t) => t.calculo.margenNeto !== null);
  const promedio = conMargen.length ? conMargen.reduce((s, t) => s + t.calculo.margenNeto!, 0) / conMargen.length : null;
  const proveedor = (id?: string | null) => db.proveedores.find((p) => p.id === id)?.nombre;

  if (cargando) return <Cargando />;

  return (
    <div>
      <Encabezado
        titulo="Productos"
        acento="y márgenes"
        datos={[
          { etiqueta: "Productos", valor: todos.length, formato: (n) => String(Math.round(n)), detalle: `${todos.filter((t) => t.calculo.semaforo === "verde").length} saludables` },
          { etiqueta: "Margen neto promedio", valor: promedio, formato: (n) => formatoPct(n) },
          { etiqueta: "Invertido", valor: todos.reduce((s, t) => s + t.calculo.inversionTotal, 0), formato: formatoCompacto },
        ]}
        descripcion="Costo real por unidad, margen y dinero invertido en cada producto."
        acciones={
          <Link href="/productos/nuevo" className="btn-primario">
            <Plus className="size-4" /> Nuevo producto
          </Link>
        }
      />

      <BarraFiltros
        activos={activos}
        onLimpiar={() => {
          setBusqueda("");
          setCategoria("");
          setEstado("");
          setSalud("");
        }}
      >
        <ChipBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Nombre o SKU…" />
        <ChipSelect etiqueta="Categoría" icono={Tag} valor={categoria || undefined} onCambio={(v) => setCategoria(v ?? "")} opciones={categorias.map((c) => ({ valor: c, etiqueta: c }))} />
        <ChipSelect etiqueta="Estado" icono={Workflow} valor={estado || undefined} onCambio={(v) => setEstado(v ?? "")} opciones={Object.entries(ESTADOS_PRODUCTO).map(([k, v]) => ({ valor: k, etiqueta: v }))} />
        <ChipSelect etiqueta="Salud" icono={Activity} valor={salud || undefined} onCambio={(v) => setSalud(v ?? "")} opciones={SALUD} />
        <div className="ml-auto inline-flex rounded-full border border-linea bg-hundido p-0.5" role="radiogroup" aria-label="Vista">
          {([
            ["tarjetas", LayoutGrid, "Tarjetas"],
            ["tabla", Rows3, "Tabla"],
          ] as const).map(([id, Icono, nombre]) => (
            <button
              key={id}
              role="radio"
              aria-checked={vista === id}
              aria-label={nombre}
              title={nombre}
              onClick={() => setVista(id)}
              className={cx("grid size-7 place-items-center rounded-full transition-colors", vista === id ? "bg-superficie text-marca shadow-xs" : "text-tinta-tenue hover:text-tinta")}
            >
              <Icono className="size-3.5" />
            </button>
          ))}
        </div>
      </BarraFiltros>

      {filtrados.length === 0 ? (
        <Vacio titulo={db.productos.length ? "Ningún producto coincide con los filtros" : "Aún no tienes productos"}>
          {!db.productos.length && (
            <Link href="/productos/nuevo" className="btn-primario mt-3">
              Registrar el primero
            </Link>
          )}
        </Vacio>
      ) : (
        <>
          {/* Tarjetas (siempre en móvil; en escritorio según la vista elegida) */}
          <ul className={cx("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", vista === "tabla" && "md:hidden")}>
            {filtrados.map(({ producto: p, calculo: r }) => (
              <TarjetaProducto
                key={p.id}
                p={p}
                r={r}
                proveedor={proveedor(p.proveedorId)}
                onDuplicar={async () => router.push(`/productos/${await duplicarProducto(p.id)}`)}
              />
            ))}
          </ul>

          {/* Vista de tabla (escritorio) */}
          {vista === "tabla" && (
            <div className="hidden md:block">
              <TablaDatos
                icono={Package}
                titulo="Catálogo"
                descripcion="Ordena por cualquier columna."
                filas={filtrados}
                clave={(f) => f.producto.id}
                ordenInicial={{ clave: "margen", dir: "desc" }}
                columnas={[
                  {
                    clave: "nombre",
                    titulo: "Producto",
                    principal: true,
                    ordenar: (f) => f.producto.nombre,
                    render: ({ producto: p }) => (
                      <Link href={`/productos/${p.id}`} className="group flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--mt-gradiente-marca)] text-xs font-bold text-white">{p.nombre.slice(0, 2).toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold group-hover:text-marca">{p.nombre}</span>
                          <span className="block truncate text-xs text-tinta-tenue">
                            {p.sku} · {p.categoria}
                            {proveedor(p.proveedorId) && ` · ${proveedor(p.proveedorId)}`}
                          </span>
                        </span>
                      </Link>
                    ),
                  },
                  { clave: "estado", titulo: "Estado", ordenar: (f) => f.producto.estado, render: ({ producto: p }) => <Etiqueta tono={p.estado === "activo" ? "verde" : p.estado === "desarrollo" ? "marca" : "neutro"}>{ESTADOS_PRODUCTO[p.estado]}</Etiqueta> },
                  { clave: "costo", titulo: "Costo/u", alinear: "der", ordenar: (f) => f.calculo.costoTotalUnitario, render: (f) => <span className="font-semibold">{formatoCOP(f.calculo.costoTotalUnitario)}</span> },
                  { clave: "landed", titulo: "Landed cost", alinear: "der", ordenar: (f) => f.calculo.landedCost, render: (f) => <span className="text-tinta-suave">{formatoCOP(f.calculo.landedCost)}</span> },
                  { clave: "precio", titulo: "Precio", alinear: "der", ordenar: (f) => f.calculo.precio, render: (f) => formatoCOP(f.calculo.precio) },
                  { clave: "margen", titulo: "Margen neto", ordenar: (f) => f.calculo.margenNeto ?? -Infinity, render: (f) => <BadgeMargen margen={f.calculo.margenNeto} estado={f.calculo.semaforo} compacto /> },
                  { clave: "invertido", titulo: "Invertido", alinear: "der", ordenar: (f) => f.calculo.inversionTotal, render: (f) => formatoCompacto(f.calculo.inversionTotal) },
                  {
                    clave: "acciones",
                    titulo: "",
                    acciones: true,
                    alinear: "der",
                    render: ({ producto: p }) => (
                      <button className="btn-fantasma px-2 py-1 text-xs" title="Duplicar como nueva versión" onClick={async () => router.push(`/productos/${await duplicarProducto(p.id)}`)}>
                        <Copy className="size-3.5" /> Duplicar
                      </button>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Tarjeta de producto: avatar satinado, semáforo y una barra de margen contra el objetivo. */
function TarjetaProducto({ p, r, proveedor, onDuplicar }: { p: Producto; r: ResultadoCalculo; proveedor?: string; onDuplicar: () => void }) {
  const margen = r.margenNeto ?? 0;
  const escala = Math.max(p.margenObjetivo * 1.4, 0.6);
  // Con pérdida la barra muestra el tamaño del déficit (en rojo).
  const ancho = Math.min(1, Math.abs(margen) / escala);
  const color = {
    verde: "bg-[linear-gradient(90deg,var(--mt-verde-300),var(--mt-verde-600))]",
    amarillo: "bg-[linear-gradient(90deg,var(--mt-ambar-300),var(--mt-ambar-600))]",
    rojo: "bg-[linear-gradient(90deg,var(--mt-rojo-300),var(--mt-rojo-600))]",
    gris: "bg-linea-fuerte",
  }[r.semaforo];
  // La tarjeta se tiñe con el estado del margen (velo, línea superior y borde).
  const tono = { verde: "tono-verde", amarillo: "tono-ambar", rojo: "tono-rojo", gris: "" }[r.semaforo];
  return (
    <li className={cx("tarjeta-viva group relative flex flex-col overflow-hidden", tono)}>
      <Link href={`/productos/${p.id}`} className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          {p.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imagenUrl} alt="" className="size-12 rounded-2xl object-cover" />
          ) : (
            <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[image:var(--mt-gradiente-marca)] font-display text-sm font-bold text-white shadow-[0_8px_18px_-8px_var(--mt-lila-600)]">
              {p.nombre.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-bold text-titulo group-hover:text-marca">{p.nombre}</p>
            <p className="truncate text-xs text-tinta-tenue">
              {p.sku} · {p.categoria}
              {proveedor && ` · ${proveedor}`}
            </p>
          </div>
          <Etiqueta tono={p.estado === "activo" ? "verde" : p.estado === "desarrollo" ? "marca" : "neutro"}>{ESTADOS_PRODUCTO[p.estado]}</Etiqueta>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-tinta-tenue">Margen neto</p>
            <p className="font-display text-2xl font-bold tracking-tight text-tinta">{formatoPct(r.margenNeto)}</p>
          </div>
          <BadgeMargen margen={r.margenNeto} estado={r.semaforo} soloEstado />
        </div>
        <div className="relative mt-2 h-2 rounded-full bg-hundido" title={`Objetivo ${formatoPct(p.margenObjetivo, 0)}`}>
          <span className={cx("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-enfasis", color)} style={{ width: `${ancho * 100}%` }} />
          <span className="absolute -top-1 bottom-[-4px] w-0.5 rounded-full bg-tinta/40" style={{ left: `${(p.margenObjetivo / escala) * 100}%` }} aria-hidden />
        </div>
        <p className="mt-1 text-right text-[11px] text-tinta-tenue">objetivo {formatoPct(p.margenObjetivo, 0)}</p>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-linea pt-4 text-xs">
          <div>
            <dt className="text-tinta-tenue">Costo/u</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatoCOP(r.costoTotalUnitario)}</dd>
          </div>
          <div>
            <dt className="text-tinta-tenue">Precio</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatoCOP(r.precio)}</dd>
          </div>
          <div>
            <dt className="text-tinta-tenue">Invertido</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatoCompacto(r.inversionTotal)}</dd>
          </div>
        </dl>
      </Link>
      <div className="flex items-center justify-between border-t border-linea bg-hundido/50 px-5 py-2.5">
        <Link href={`/productos/${p.id}?tab=simulador`} className="text-xs font-semibold text-tinta-suave hover:text-marca">
          Simular precio
        </Link>
        <button onClick={onDuplicar} className="inline-flex items-center gap-1 text-xs font-semibold text-tinta-suave hover:text-marca" title="Duplicar como nueva versión">
          <Copy className="size-3" /> Nueva versión
        </button>
      </div>
    </li>
  );
}
