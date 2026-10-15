"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { curvas, gsap, movimientoReducido, useGSAP } from "@/components/movimiento/gsap";
import { Check, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { CategoriaCosto, Costo, Producto, Variante } from "@/tipos";
import { nuevoId, useMartha } from "@/lib/datos/MarthaProvider";
import { CATEGORIAS, TIPOS_COSTO } from "@/lib/calculos/catalogo";
import { calcularProducto, costoPorUnidad, totalCostoCOP, unidadesEnLotes, type Tasas } from "@/lib/calculos/motor";
import { formatoCOP } from "@/lib/formato";
import { CamposDatosBasicos, CamposPrecio } from "@/components/CamposProducto";
import { FormularioCosto, costoVacio } from "@/components/FormularioCosto";
import { CalculadoraEnVivo, PanelCalculo } from "@/components/PanelCalculo";
import { Aviso, Campo, Cargando, Encabezado, EntradaNumero, cx } from "@/components/ui";

const PASOS = ["Datos", "Variantes", "Costos", "Precio", "Resumen"] as const;

const PLANTILLAS: Record<string, { nombre: string; categoria: CategoriaCosto; tipo: Costo["tipo"] }[]> = {
  "Faja nacional": [
    { nombre: "Tela powernet y forro", categoria: "materia_prima", tipo: "variable" },
    { nombre: "Broches, varillas y cremallera", categoria: "materia_prima", tipo: "variable" },
    { nombre: "Confección (taller satélite)", categoria: "mano_obra", tipo: "variable" },
    { nombre: "Empaque y bolsa", categoria: "empaque", tipo: "variable" },
    { nombre: "Etiquetas y hangtag", categoria: "etiquetas", tipo: "variable" },
    { nombre: "Flete nacional", categoria: "flete", tipo: "variable" },
    { nombre: "Diseño, moldería y muestras", categoria: "desarrollo", tipo: "unico" },
    { nombre: "Fotografía y contenido", categoria: "creativo", tipo: "unico" },
  ],
  Importación: [
    { nombre: "Producto FOB", categoria: "materia_prima", tipo: "variable" },
    { nombre: "Flete internacional", categoria: "flete", tipo: "variable" },
    { nombre: "Seguro de carga", categoria: "seguro", tipo: "variable" },
    { nombre: "Arancel + IVA de importación", categoria: "aduana", tipo: "variable" },
    { nombre: "Agencia de aduanas", categoria: "agente_aduanas", tipo: "variable" },
    { nombre: "Bodegaje y manejo", categoria: "almacenamiento", tipo: "variable" },
    { nombre: "Muestras del proveedor", categoria: "desarrollo", tipo: "unico" },
  ],
};

export default function NuevoProducto() {
  const { cargando } = useMartha();
  // El asistente se monta cuando ya cargó la configuración, para tomar sus valores por defecto.
  return cargando ? <Cargando /> : <Asistente />;
}

function Asistente() {
  const { db, tasas, crearProducto } = useMartha();
  const router = useRouter();
  const cfg = db.configuracion;
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const contenido = useRef<HTMLDivElement>(null);
  const progreso = useRef<HTMLSpanElement>(null);
  // Transición entre pasos y barra de progreso que avanza hacia el nodo final.
  useGSAP(
    () => {
      const fin = paso / (PASOS.length - 1);
      if (movimientoReducido()) return void gsap.set(progreso.current, { scaleX: fin });
      gsap.to(progreso.current, { scaleX: fin, duration: 0.7, ease: curvas.enfasis });
      gsap.from(contenido.current, { x: 18, autoAlpha: 0, duration: 0.5, ease: curvas.enfasis, clearProps: "transform,opacity,visibility" });
    },
    { dependencies: [paso] },
  );
  const [error, setError] = useState<string | null>(null);

  const [p, setP] = useState<Producto>(() => ({
    id: nuevoId(),
    nombre: "",
    sku: "",
    categoria: "",
    descripcion: "",
    imagenUrl: null,
    proveedorId: null,
    paisOrigen: "Colombia",
    monedaBase: "COP",
    estado: "borrador",
    productoOrigenId: null,
    version: 1,
    unidadesEstimadas: 500,
    baseAsignacion: "estimadas",
    precioVenta: 0,
    margenMinimo: cfg.margenMinimo,
    margenObjetivo: cfg.margenObjetivo,
    comisionCanalPct: cfg.comisionCanalPct,
    pasarelaPct: cfg.pasarelaPct,
    publicidadUnidad: cfg.publicidadUnidad,
    envioClienteUnidad: cfg.envioClienteUnidad,
    otrosVentaUnidad: cfg.otrosVentaUnidad,
    creadoEn: new Date().toISOString(),
  }));
  const set = <K extends keyof Producto>(k: K, v: Producto[K]) => setP((prev) => ({ ...prev, [k]: v }));

  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [costos, setCostos] = useState<Costo[]>([]);
  const [borrador, setBorrador] = useState<Costo>(() => costoVacio(p, tasas));
  const [claveForm, setClaveForm] = useState(0);

  const r = useMemo(() => calcularProducto({ producto: p, costos, lotes: [], tasas }), [p, costos, tasas]);
  const categorias = [...new Set(db.productos.map((x) => x.categoria))];
  const skuDuplicado = db.productos.some((x) => x.sku.toLowerCase() === p.sku.trim().toLowerCase());

  const validoPaso = [Boolean(p.nombre.trim() && p.sku.trim() && p.categoria.trim() && !skuDuplicado), true, true, p.unidadesEstimadas > 0, true];

  function usarPlantilla(item: (typeof PLANTILLAS)[string][number]) {
    setBorrador({ ...costoVacio(p, tasas), nombre: item.nombre, categoria: item.categoria, tipo: item.tipo, cantidadUnidades: item.tipo === "variable" ? p.unidadesEstimadas : 1, moneda: p.monedaBase, tasaCambio: tasas[p.monedaBase] ?? 1 });
    setClaveForm((k) => k + 1);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      await crearProducto({ ...p, nombre: p.nombre.trim(), sku: p.sku.trim(), categoria: p.categoria.trim() }, variantes, costos);
      router.push(`/productos/${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGuardando(false);
    }
  }

  return (
    <div>
      <Encabezado titulo="Nuevo" acento="producto" descripcion="Registra el producto paso a paso; la calculadora se actualiza mientras agregas costos." />

      <div className="relative mb-3 h-0.5 rounded-full bg-linea" aria-hidden>
        <span ref={progreso} className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[image:var(--mt-gradiente-marca)]" />
        <span className="absolute top-1/2 right-0 size-2 -translate-y-1/2 rounded-full bg-acento" />
      </div>
      <ol className="mb-6 flex items-center gap-1 overflow-x-auto pb-1">
        {PASOS.map((nombre, i) => (
          <li key={nombre} className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => i < paso && setPaso(i)}
              disabled={i > paso}
              className={cx(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                i === paso ? "bg-marca text-white" : i < paso ? "bg-marca-suave text-marca" : "text-tinta-tenue",
              )}
            >
              <span className={cx("grid size-5 place-items-center rounded-full text-xs", i === paso ? "bg-white/20" : i < paso ? "bg-marca/15" : "bg-linea")}>
                {i < paso ? <Check className="size-3" /> : i + 1}
              </span>
              {nombre}
            </button>
            {i < PASOS.length - 1 && <ChevronRight className="size-4 text-linea" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="tarjeta-luz min-w-0 p-4 sm:p-6">
          <div ref={contenido}>
          {paso === 0 && <CamposDatosBasicos p={p} set={set} proveedores={db.proveedores} categorias={categorias} skuDuplicado={skuDuplicado} />}
          {paso === 1 && <PasoVariantes producto={p} variantes={variantes} setVariantes={setVariantes} />}
          {paso === 2 && (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium">Agregar rápido desde plantilla</p>
                {Object.entries(PLANTILLAS).map(([grupo, items]) => (
                  <div key={grupo} className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-tinta-tenue">{grupo}:</span>
                    {items.map((it) => {
                      const usado = costos.some((c) => c.nombre === it.nombre);
                      return (
                        <button key={it.nombre} type="button" onClick={() => usarPlantilla(it)} className={cx("rounded-full border px-2.5 py-1 text-xs", usado ? "border-verde/30 bg-verde-suave text-verde" : "border-linea hover:border-marca hover:text-marca")}>
                          {usado && "✓ "}
                          {it.nombre}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <FormularioCosto
                key={claveForm}
                producto={p}
                costos={costos}
                lotes={[]}
                variantes={variantes}
                tasas={tasas}
                inicial={borrador}
                onGuardar={(c) => {
                  setCostos((prev) => [...prev.filter((x) => x.id !== c.id), c]);
                  setBorrador(costoVacio(p, tasas));
                  setClaveForm((k) => k + 1);
                }}
              />
              <ListaCostosBorrador costos={costos} producto={p} tasas={tasas} onEliminar={(id) => setCostos((prev) => prev.filter((c) => c.id !== id))} />
            </div>
          )}
          {paso === 3 && <CamposPrecio p={p} set={set} />}
          {paso === 4 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span>
                  <span className="text-tinta-tenue">Producto:</span> <strong>{p.nombre}</strong> ({p.sku})
                </span>
                <span>
                  <span className="text-tinta-tenue">Variantes:</span> {variantes.length}
                </span>
                <span>
                  <span className="text-tinta-tenue">Costos:</span> {costos.length}
                </span>
              </div>
              {costos.length === 0 && <Aviso tono="amarillo">Aún no agregaste costos; podrás hacerlo después desde el detalle del producto.</Aviso>}
              <PanelCalculo r={r} producto={p} />
              {error && <Aviso tono="rojo">{error}</Aviso>}
            </div>
          )}

          </div>
          <div className="mt-6 flex justify-between gap-2 border-t border-linea pt-4">
            <button className="btn-secundario" onClick={() => setPaso((x) => Math.max(0, x - 1))} disabled={paso === 0}>
              <ChevronLeft className="size-4" /> Atrás
            </button>
            {paso < PASOS.length - 1 ? (
              <button className="btn-primario" onClick={() => setPaso((x) => x + 1)} disabled={!validoPaso[paso]}>
                Siguiente <ChevronRight className="size-4" />
              </button>
            ) : (
              <button className="btn-primario" onClick={guardar} disabled={guardando || !validoPaso[0]}>
                {guardando ? "Guardando…" : "Guardar producto"}
              </button>
            )}
          </div>
        </div>

        {paso < 4 && (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <CalculadoraEnVivo r={r} producto={p} />
          </aside>
        )}
      </div>
    </div>
  );
}

function PasoVariantes({ producto, variantes, setVariantes }: { producto: Producto; variantes: Variante[]; setVariantes: (v: Variante[]) => void }) {
  const [tallas, setTallas] = useState("S, M, L, XL");
  const [colores, setColores] = useState("Negro, Beige");
  const [material, setMaterial] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const lista = (t: string) => t.split(",").map((x) => x.trim()).filter(Boolean);

  function generar() {
    const ts = lista(tallas).length ? lista(tallas) : [""];
    const cs = lista(colores).length ? lista(colores) : [""];
    const out: Variante[] = [];
    for (const color of cs)
      for (const talla of ts) {
        const atributos: Record<string, string> = {};
        if (color) atributos.color = color;
        if (talla) atributos.talla = talla;
        if (material) atributos.material = material;
        if (presentacion) atributos.presentacion = presentacion;
        const partes = [color, talla].filter(Boolean);
        out.push({
          id: nuevoId(),
          productoId: producto.id,
          sku: [producto.sku, color.slice(0, 3).toUpperCase(), talla.toUpperCase()].filter(Boolean).join("-"),
          nombre: partes.join(" · ") || "Única",
          atributos,
          costoAdicionalUnitario: 0,
          precioVenta: null,
          unidades: 0,
        });
      }
    setVariantes(out);
  }

  const actualizar = (id: string, cambios: Partial<Variante>) => setVariantes(variantes.map((v) => (v.id === id ? { ...v, ...cambios } : v)));

  return (
    <div className="space-y-5">
      <p className="text-sm text-tinta-suave">Opcional. Cada variante hereda el costo del producto y puede tener un costo adicional y un precio propio.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Tallas (separadas por coma)">
          <input className="campo" value={tallas} onChange={(e) => setTallas(e.target.value)} />
        </Campo>
        <Campo etiqueta="Colores (separados por coma)">
          <input className="campo" value={colores} onChange={(e) => setColores(e.target.value)} />
        </Campo>
        <Campo etiqueta="Material">
          <input className="campo" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Powernet" />
        </Campo>
        <Campo etiqueta="Presentación">
          <input className="campo" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} placeholder="Caja individual" />
        </Campo>
      </div>
      <button type="button" className="btn-secundario" onClick={generar}>
        Generar {Math.max(1, lista(tallas).length) * Math.max(1, lista(colores).length)} variantes
      </button>
      {variantes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Variante</th>
                <th>SKU</th>
                <th>Costo adicional / u</th>
                <th>Precio propio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variantes.map((v) => (
                <tr key={v.id}>
                  <td className="font-medium">{v.nombre}</td>
                  <td className="text-xs text-tinta-suave">{v.sku}</td>
                  <td className="w-40">
                    <EntradaNumero prefijo="$" valor={v.costoAdicionalUnitario} onCambio={(x) => actualizar(v.id, { costoAdicionalUnitario: x })} />
                  </td>
                  <td className="w-40">
                    <input
                      className="campo"
                      type="number"
                      placeholder={producto.precioVenta ? String(producto.precioVenta) : "Igual al producto"}
                      value={v.precioVenta ?? ""}
                      onChange={(e) => actualizar(v.id, { precioVenta: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </td>
                  <td>
                    <button type="button" className="btn-fantasma px-2" onClick={() => setVariantes(variantes.filter((x) => x.id !== v.id))} aria-label="Quitar">
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ListaCostosBorrador({ costos, producto, tasas, onEliminar }: { costos: Costo[]; producto: Producto; tasas: Tasas; onEliminar: (id: string) => void }) {
  if (!costos.length) return null;
  const ul = unidadesEnLotes(producto.id, costos, []);
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">Costos agregados ({costos.length})</h4>
      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th>Costo</th>
              <th>Tipo</th>
              <th className="num">Total</th>
              <th className="num">Por unidad</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {costos.map((c) => (
              <tr key={c.id}>
                <td>
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-xs text-tinta-tenue">{CATEGORIAS[c.categoria].etiqueta}</p>
                </td>
                <td className="text-xs">{TIPOS_COSTO[c.tipo]}</td>
                <td className="num">{formatoCOP(totalCostoCOP(c, tasas))}</td>
                <td className="num font-medium">{formatoCOP(costoPorUnidad(c, producto.unidadesEstimadas, tasas, {}, ul))}</td>
                <td className="text-right">
                  <button className="btn-fantasma px-2" onClick={() => onEliminar(c.id)} aria-label={`Quitar ${c.nombre}`}>
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
