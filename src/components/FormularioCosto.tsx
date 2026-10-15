"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { CategoriaCosto, CodigoMoneda, Costo, Lote, Producto, Variante } from "@/tipos";
import { CATEGORIAS, CAUSAS, ESTADOS_COSTO, MONEDAS, TIPOS_COSTO } from "@/lib/calculos/catalogo";
import { calcularProducto, impactoCosto, totalCostoCOP, type Tasas } from "@/lib/calculos/motor";
import { formatoCOP, formatoPct, hoyISO } from "@/lib/formato";
import { nuevoId } from "@/lib/datos/MarthaProvider";
import { SubirArchivo } from "./SubirArchivo";
import { Aviso, Campo, EntradaNumero } from "./ui";

/** Tipo sugerido por categoría: los costos de desarrollo y creativos suelen ser únicos. */
const TIPO_SUGERIDO: Partial<Record<CategoriaCosto, Costo["tipo"]>> = { desarrollo: "unico", creativo: "unico", otro: "fijo" };

export function costoVacio(producto: Pick<Producto, "id" | "unidadesEstimadas">, tasas: Tasas, loteId?: string | null, unidadesLote?: number): Costo {
  return {
    id: nuevoId(),
    productoId: producto.id,
    loteId: loteId ?? null,
    varianteId: null,
    categoria: "materia_prima",
    nombre: "",
    tipo: "variable",
    moneda: "COP",
    modo: "total",
    valor: 0,
    valorReal: null,
    cantidadUnidades: unidadesLote ?? producto.unidadesEstimadas,
    tasaCambio: tasas.COP,
    fecha: hoyISO(),
    estado: "estimado",
  };
}

interface Props {
  producto: Producto;
  costos: Costo[];
  lotes: Lote[];
  variantes?: Variante[];
  tasas: Tasas;
  inicial: Costo;
  textoGuardar?: string;
  /** Muestra campos de factura real (valor real y causa). */
  conReal?: boolean;
  onGuardar: (c: Costo) => void | Promise<void>;
  onCancelar?: () => void;
}

export function FormularioCosto({ producto, costos, lotes, variantes = [], tasas, inicial, textoGuardar = "Agregar costo", conReal, onGuardar, onCancelar }: Props) {
  const [c, setC] = useState<Costo>(inicial);
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof Costo>(k: K, v: Costo[K]) => setC((prev) => ({ ...prev, [k]: v }));

  const lotesProducto = lotes.filter((l) => l.productoId === producto.id);
  const valido = c.nombre.trim() && c.valor >= 0 && c.cantidadUnidades > 0 && (c.moneda === "COP" || (c.tasaCambio ?? 0) > 0);

  let impacto = 0;
  let total = 0;
  let margenAntes: number | null = null;
  let margenDespues: number | null = null;
  try {
    const otros = costos.filter((x) => x.id !== c.id);
    impacto = impactoCosto(c, producto, otros, lotes, tasas);
    total = totalCostoCOP(c, tasas);
    margenAntes = calcularProducto({ producto, costos: otros, lotes, tasas }).margenNeto;
    margenDespues = calcularProducto({ producto, costos: [...otros, c], lotes, tasas }).margenNeto;
  } catch {
    // tasa de cambio aún vacía
  }

  function cambiarCategoria(categoria: CategoriaCosto) {
    setC((prev) => ({ ...prev, categoria, tipo: TIPO_SUGERIDO[categoria] ?? (prev.tipo === "unico" || prev.tipo === "fijo" ? "variable" : prev.tipo) }));
  }

  function cambiarMoneda(moneda: CodigoMoneda) {
    setC((prev) => ({ ...prev, moneda, tasaCambio: moneda === "COP" ? 1 : (tasas[moneda] ?? null) }));
  }

  function cambiarLote(loteId: string) {
    const lote = lotesProducto.find((l) => l.id === loteId);
    setC((prev) => ({ ...prev, loteId: loteId || null, cantidadUnidades: lote ? (lote.unidadesReales ?? lote.unidadesEstimadas) : prev.cantidadUnidades }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setGuardando(true);
    try {
      await onGuardar({ ...c, nombre: c.nombre.trim(), tasaCambio: c.moneda === "COP" ? 1 : c.tasaCambio });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Categoría" ayuda={CATEGORIAS[c.categoria].ayuda}>
          <select className="campo" value={c.categoria} onChange={(e) => cambiarCategoria(e.target.value as CategoriaCosto)}>
            {Object.entries(CATEGORIAS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Nombre del costo">
          <input className="campo" required value={c.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej. Tela powernet" />
        </Campo>
        <Campo etiqueta="Tipo" ayuda={c.tipo === "variable" ? "Se divide entre las unidades del lote." : `Se reparte entre ${producto.unidadesEstimadas.toLocaleString("es-CO")} unidades base.`}>
          <select className="campo" value={c.tipo} onChange={(e) => set("tipo", e.target.value as Costo["tipo"])}>
            {Object.entries(TIPOS_COSTO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Estado">
          <select className="campo" value={c.estado} onChange={(e) => set("estado", e.target.value as Costo["estado"])}>
            {Object.entries(ESTADOS_COSTO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Campo etiqueta="Moneda">
          <select className="campo" value={c.moneda} onChange={(e) => cambiarMoneda(e.target.value as CodigoMoneda)}>
            {MONEDAS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="El valor es">
          <select className="campo" value={c.modo} onChange={(e) => set("modo", e.target.value as Costo["modo"])}>
            <option value="total">Total del lote</option>
            <option value="unitario">Por unidad</option>
          </select>
        </Campo>
        <Campo etiqueta={c.modo === "total" ? "Valor total" : "Valor por unidad"}>
          <EntradaNumero valor={c.valor} onCambio={(v) => set("valor", v)} min={0} step="any" required />
        </Campo>
        <Campo etiqueta="Unidades del lote">
          <EntradaNumero valor={c.cantidadUnidades} onCambio={(v) => set("cantidadUnidades", Math.max(1, Math.round(v)))} min={1} step={1} />
        </Campo>
      </div>

      {c.moneda !== "COP" && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Campo etiqueta={`Tasa ${c.moneda} → COP`} ayuda="Queda congelada en este costo." className="sm:col-span-1">
            <EntradaNumero valor={c.tasaCambio ?? 0} onCambio={(v) => set("tasaCambio", v)} min={0} step="any" />
          </Campo>
          <p className="self-end pb-2 text-sm text-tinta-suave sm:col-span-3">
            Equivale a <strong className="text-tinta">{formatoCOP(total)}</strong>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Fecha">
          <input className="campo" type="date" value={c.fecha} onChange={(e) => set("fecha", e.target.value)} />
        </Campo>
        <Campo etiqueta="Proveedor o responsable">
          <input className="campo" value={c.responsable ?? ""} onChange={(e) => set("responsable", e.target.value)} />
        </Campo>
        <Campo etiqueta="Lote">
          <select className="campo" value={c.loteId ?? ""} onChange={(e) => cambiarLote(e.target.value)}>
            <option value="">Sin lote</option>
            {lotesProducto.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {variantes.length > 0 && (
        <Campo etiqueta="Aplica a" ayuda="Un costo de variante solo afecta el costo de esa variante.">
          <select className="campo" value={c.varianteId ?? ""} onChange={(e) => set("varianteId", e.target.value || null)}>
            <option value="">Todo el producto</option>
            {variantes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}

      {conReal && (
        <div className="grid gap-3 rounded-lg bg-hundido p-3 sm:grid-cols-2">
          <Campo etiqueta="Valor real (factura)" ayuda="Déjalo vacío si aún no llega la factura.">
            <input
              className="campo"
              type="number"
              step="any"
              min={0}
              value={c.valorReal ?? ""}
              onChange={(e) => set("valorReal", e.target.value === "" ? null : parseFloat(e.target.value))}
            />
          </Campo>
          <Campo etiqueta="Causa de la diferencia">
            <select className="campo" value={c.causaDiferencia ?? ""} onChange={(e) => set("causaDiferencia", (e.target.value || null) as Costo["causaDiferencia"])}>
              <option value="">—</option>
              {Object.entries(CAUSAS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Campo etiqueta="Factura o nota (opcional)">
          <input className="campo" value={c.nota ?? ""} onChange={(e) => set("nota", e.target.value)} placeholder="N.º de factura o comentario" />
        </Campo>
        <div className="flex items-center gap-2">
          {c.comprobanteUrl && (
            <a href={c.comprobanteUrl} target="_blank" rel="noreferrer" className="text-sm text-marca hover:underline">
              Ver comprobante
            </a>
          )}
          <SubirArchivo bucket="martha-comprobantes" aceptar="image/*,application/pdf" etiqueta="Adjuntar comprobante" onSubido={(url) => set("comprobanteUrl", url)} />
        </div>
      </div>

      {c.valor > 0 && (
        <Aviso tono="marca">
          <span className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Este costo aumenta tu costo unitario en <strong>{formatoCOP(impacto)}</strong>
              {margenAntes !== null && margenDespues !== null && (
                <>
                  {" "}
                  y lleva tu margen neto de {formatoPct(margenAntes)} a <strong>{formatoPct(margenDespues)}</strong>
                </>
              )}
              .
            </span>
          </span>
        </Aviso>
      )}

      <div className="flex justify-end gap-2">
        {onCancelar && (
          <button type="button" className="btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button className="btn-primario" disabled={!valido || guardando}>
          {guardando ? "Guardando…" : textoGuardar}
        </button>
      </div>
    </form>
  );
}
