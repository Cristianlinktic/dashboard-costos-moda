"use client";

import type { CodigoMoneda, Producto, Proveedor } from "@/tipos";
import { ESTADOS_PRODUCTO, MONEDAS } from "@/lib/calculos/catalogo";
import { SubirArchivo } from "./SubirArchivo";
import { Campo, EntradaNumero, EntradaPct } from "./ui";

type Cambio = <K extends keyof Producto>(k: K, v: Producto[K]) => void;

export function CamposDatosBasicos({ p, set, proveedores, categorias, skuDuplicado }: { p: Producto; set: Cambio; proveedores: Proveedor[]; categorias: string[]; skuDuplicado?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Nombre *">
        <input className="campo" required value={p.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Faja colombiana clásica" />
      </Campo>
      <Campo etiqueta="SKU *" ayuda={skuDuplicado ? <span className="text-rojo">Ya existe un producto con este SKU.</span> : undefined}>
        <input className="campo uppercase" required value={p.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="FAJ-CLA-001" />
      </Campo>
      <Campo etiqueta="Categoría *">
        <input className="campo" required list="categorias" value={p.categoria} onChange={(e) => set("categoria", e.target.value)} placeholder="Fajas" />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>
      <Campo etiqueta="Estado">
        <select className="campo" value={p.estado} onChange={(e) => set("estado", e.target.value as Producto["estado"])}>
          {Object.entries(ESTADOS_PRODUCTO).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Proveedor principal">
        <select
          className="campo"
          value={p.proveedorId ?? ""}
          onChange={(e) => {
            const prov = proveedores.find((x) => x.id === e.target.value);
            set("proveedorId", e.target.value || null);
            if (prov) {
              set("paisOrigen", prov.pais);
              set("monedaBase", prov.moneda);
            }
          }}
        >
          <option value="">Sin proveedor</option>
          {proveedores.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nombre} ({x.pais})
            </option>
          ))}
        </select>
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="País de origen">
          <input className="campo" value={p.paisOrigen} onChange={(e) => set("paisOrigen", e.target.value)} />
        </Campo>
        <Campo etiqueta="Moneda base">
          <select className="campo" value={p.monedaBase} onChange={(e) => set("monedaBase", e.target.value as CodigoMoneda)}>
            {MONEDAS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Descripción" className="sm:col-span-2">
        <textarea className="campo min-h-20" value={p.descripcion ?? ""} onChange={(e) => set("descripcion", e.target.value)} />
      </Campo>
      <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
        <Campo etiqueta="Imagen (URL)" className="min-w-0 flex-1">
          <input className="campo" value={p.imagenUrl?.startsWith("data:") ? "(imagen cargada)" : (p.imagenUrl ?? "")} onChange={(e) => set("imagenUrl", e.target.value)} placeholder="https://…" />
        </Campo>
        <SubirArchivo bucket="martha-imagenes-productos" aceptar="image/*" etiqueta="Subir imagen" onSubido={(url) => set("imagenUrl", url)} />
        {p.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imagenUrl} alt="Vista previa" className="size-10 rounded-md object-cover" />
        )}
      </div>
    </div>
  );
}

export function CamposPrecio({ p, set }: { p: Producto; set: Cambio }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Precio de venta" ayuda="Precio al cliente final, IVA incluido si aplica.">
          <EntradaNumero prefijo="$" valor={p.precioVenta} onCambio={(v) => set("precioVenta", v)} min={0} step={100} />
        </Campo>
        <Campo etiqueta="Margen neto mínimo" ayuda="Por debajo se marca en amarillo.">
          <EntradaPct valor={p.margenMinimo} onCambio={(v) => set("margenMinimo", v)} min={0} max={95} />
        </Campo>
        <Campo etiqueta="Margen neto objetivo">
          <div className="flex gap-1.5">
            {[0.3, 0.4, 0.5].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => set("margenObjetivo", m)}
                className={p.margenObjetivo === m ? "btn-primario px-2.5" : "btn-secundario px-2.5"}
              >
                {m * 100}%
              </button>
            ))}
            <EntradaPct valor={p.margenObjetivo} onCambio={(v) => set("margenObjetivo", v)} min={0} max={95} aria-label="Margen personalizado" />
          </div>
        </Campo>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Costos de venta por unidad</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Campo etiqueta="Comisión canal">
            <EntradaPct valor={p.comisionCanalPct} onCambio={(v) => set("comisionCanalPct", v)} min={0} />
          </Campo>
          <Campo etiqueta="Pasarela de pago">
            <EntradaPct valor={p.pasarelaPct} onCambio={(v) => set("pasarelaPct", v)} min={0} />
          </Campo>
          <Campo etiqueta="Publicidad / u">
            <EntradaNumero prefijo="$" valor={p.publicidadUnidad} onCambio={(v) => set("publicidadUnidad", v)} min={0} />
          </Campo>
          <Campo etiqueta="Envío al cliente / u">
            <EntradaNumero prefijo="$" valor={p.envioClienteUnidad} onCambio={(v) => set("envioClienteUnidad", v)} min={0} />
          </Campo>
          <Campo etiqueta="Otros / u">
            <EntradaNumero prefijo="$" valor={p.otrosVentaUnidad} onCambio={(v) => set("otrosVentaUnidad", v)} min={0} />
          </Campo>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Unidades estimadas" ayuda="Entre cuántas unidades se reparten los costos fijos (diseño, muestras, fotos).">
          <EntradaNumero valor={p.unidadesEstimadas} onCambio={(v) => set("unidadesEstimadas", Math.max(1, Math.round(v)))} min={1} />
        </Campo>
        <Campo etiqueta="Repartir costos fijos según">
          <select className="campo" value={p.baseAsignacion} onChange={(e) => set("baseAsignacion", e.target.value as Producto["baseAsignacion"])}>
            <option value="estimadas">Unidades estimadas</option>
            <option value="producidas">Unidades producidas en lotes</option>
          </select>
        </Campo>
      </div>
    </div>
  );
}
