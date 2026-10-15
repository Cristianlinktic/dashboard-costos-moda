"use client";

import { useState } from "react";
import { Pencil, Scissors, Ship, ShoppingBag } from "lucide-react";
import type { Costo, Producto } from "@/tipos";
import { CAUSAS, ESTADOS_LOTE, TIPOS_LOTE } from "@/lib/calculos/catalogo";
import { compararLote } from "@/lib/calculos/motor";
import { useMartha } from "@/lib/datos/MarthaProvider";
import { formatoCOP, formatoFecha, formatoNumero, formatoPct } from "@/lib/formato";
import { FormularioCosto } from "./FormularioCosto";
import { TablaDatos } from "./TablaDatos";
import { Etiqueta, Modal, cx } from "./ui";

function tonoDiferencia(pct: number | null) {
  if (pct === null || Math.abs(pct) < 0.005) return "text-tinta-suave";
  if (pct < 0) return "text-verde";
  return pct > 0.1 ? "text-rojo" : "text-amarillo";
}

/** Tabla estimado vs. real de un lote, con registro de factura real por costo. */
export function ComparacionLote({ loteId, producto }: { loteId: string; producto: Producto }) {
  const { db, tasas, guardar, registrarEvento } = useMartha();
  const lote = db.lotes.find((l) => l.id === loteId)!;
  const c = compararLote(lote, db.costos, tasas);
  const [editando, setEditando] = useState<Costo | null>(null);
  const proveedor = db.proveedores.find((p) => p.id === lote.proveedorId);

  async function guardarReal(costo: Costo) {
    const antes = db.costos.find((x) => x.id === costo.id);
    const ajustado = { ...costo, estado: costo.valorReal != null && costo.estado === "estimado" ? ("ajustado" as const) : costo.estado };
    await guardar("costos", ajustado);
    if (antes && antes.valorReal !== costo.valorReal && costo.valorReal != null)
      await registrarEvento(producto.id, "ajuste_costo", `Factura real de «${costo.nombre}» en ${lote.codigo}: ${formatoNumero(costo.valorReal)} ${costo.moneda}`, {
        antes: antes.valorReal ?? antes.valor,
        despues: costo.valorReal,
        causa: costo.causaDiferencia,
      });
    setEditando(null);
  }

  return (
    <div className="tarjeta-luz overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[image:var(--mt-gradiente-marca)] text-white shadow-[0_8px_18px_-8px_var(--mt-lila-600)]">
            {lote.tipo === "importacion" ? <Ship className="size-4.5" /> : lote.tipo === "compra" ? <ShoppingBag className="size-4.5" /> : <Scissors className="size-4.5" />}
          </span>
          <div className="min-w-0">
          <h3 className="font-display text-lg font-bold">
            {lote.codigo} <span className="text-sm font-normal text-tinta-suave">· {TIPOS_LOTE[lote.tipo]}</span>
          </h3>
          <p className="text-xs text-tinta-tenue">
            {formatoFecha(lote.fecha)}
            {proveedor && ` · ${proveedor.nombre}`} · {formatoNumero(lote.unidadesEstimadas)} u. estimadas / {lote.unidadesReales != null ? `${formatoNumero(lote.unidadesReales)} reales` : "sin recibir"}
            {c.merma > 0 && <span className="text-rojo"> · merma {c.merma} u.</span>}
          </p>
          {lote.notas && <p className="mt-1 text-xs text-tinta-suave">{lote.notas}</p>}
          </div>
        </div>
        <Etiqueta tono={lote.estado === "cerrado" || lote.estado === "recibido" ? "verde" : "marca"}>{ESTADOS_LOTE[lote.estado]}</Etiqueta>
      </div>

      <div className="grid grid-cols-2 gap-px border-y border-linea bg-linea lg:grid-cols-4">
        <Dato e="Total estimado" v={formatoCOP(c.estimadoTotal)} />
        <Dato e="Total real" v={formatoCOP(c.realTotal)} d={c.pendientes ? `${c.pendientes} costo(s) sin factura` : undefined} />
        <Dato e="Costo/u estimado → real" v={`${formatoCOP(c.unitarioEstimado)} → ${formatoCOP(c.unitarioReal)}`} />
        <Dato e="Diferencia por unidad" v={formatoPct(c.unitarioDiferenciaPct)} tono={tonoDiferencia(c.unitarioDiferenciaPct)} />
      </div>

      <TablaDatos
        sinMarco
        filas={c.filas}
        clave={(f) => f.costo.id}
        vacio="Este lote aún no tiene costos asociados. Asócialos desde la pestaña Costos del producto."
        columnas={[
          {
            clave: "costo",
            titulo: "Costo",
            principal: true,
            ordenar: (f) => f.costo.nombre,
            render: (f) => (
              <div className="min-w-0">
                <p className="font-semibold">{f.costo.nombre}</p>
                {f.costo.nota && <p className="text-xs text-tinta-tenue">{f.costo.nota}</p>}
              </div>
            ),
          },
          { clave: "estimado", titulo: "Estimado", alinear: "der", ordenar: (f) => f.estimado, render: (f) => formatoCOP(f.estimado) },
          { clave: "real", titulo: "Real", alinear: "der", ordenar: (f) => f.real, render: (f) => (f.pendiente ? <span className="text-tinta-tenue">Pendiente</span> : <span className="font-semibold">{formatoCOP(f.real)}</span>) },
          {
            clave: "diferencia",
            titulo: "Diferencia",
            alinear: "der",
            ordenar: (f) => f.diferenciaPct ?? 0,
            render: (f) => <span className={cx("font-semibold", tonoDiferencia(f.diferenciaPct))}>{f.diferencia === 0 ? "—" : `${f.diferencia > 0 ? "+" : ""}${formatoPct(f.diferenciaPct)}`}</span>,
          },
          { clave: "causa", titulo: "Causa", render: (f) => (f.costo.causaDiferencia ? <Etiqueta tono="marca">{CAUSAS[f.costo.causaDiferencia]}</Etiqueta> : <span className="text-tinta-tenue">—</span>) },
          {
            clave: "acciones",
            titulo: "",
            acciones: true,
            alinear: "der",
            render: (f) => (
              <button className="btn-secundario px-2.5 py-1 text-xs" onClick={() => setEditando(f.costo)}>
                <Pencil className="size-3.5" /> Factura real
              </button>
            ),
          },
        ]}
      />

      {Object.keys(c.causas).length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-linea p-3 text-xs">
          <span className="text-tinta-tenue">Diferencias por causa:</span>
          {Object.entries(c.causas).map(([causa, monto]) => (
            <span key={causa} className={monto > 0 ? "text-rojo" : "text-verde"}>
              {CAUSAS[causa as keyof typeof CAUSAS]} {monto > 0 ? "+" : ""}
              {formatoCOP(monto)}
            </span>
          ))}
        </div>
      )}

      <Modal abierto={!!editando} titulo={`Registrar factura real · ${editando?.nombre ?? ""}`} onCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioCosto
            producto={producto}
            costos={db.costos}
            lotes={db.lotes}
            tasas={tasas}
            inicial={editando}
            conReal
            textoGuardar="Guardar ajuste"
            onGuardar={guardarReal}
            onCancelar={() => setEditando(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function Dato({ e, v, d, tono }: { e: string; v: string; d?: string; tono?: string }) {
  return (
    <div className="bg-superficie/95 px-4 py-3">
      <p className="text-xs text-tinta-tenue">{e}</p>
      <p className={cx("mt-0.5 text-sm font-semibold tabular-nums", tono)}>{v}</p>
      {d && <p className="text-xs text-amarillo">{d}</p>}
    </div>
  );
}
