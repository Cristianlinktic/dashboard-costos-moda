"use client";

import { useState } from "react";
import type { Lote } from "@/tipos";
import { ESTADOS_LOTE, TIPOS_LOTE } from "@/lib/calculos/catalogo";
import { useMartha } from "@/lib/datos/MarthaProvider";
import { Campo, EntradaNumero } from "./ui";

export function FormularioLote({ inicial, onGuardar, onCancelar }: { inicial: Lote; onGuardar: (l: Lote) => void; onCancelar: () => void }) {
  const { db } = useMartha();
  const [l, setL] = useState<Lote>(inicial);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar(l);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Código del lote">
          <input className="campo uppercase" required value={l.codigo} onChange={(e) => setL({ ...l, codigo: e.target.value.toUpperCase() })} />
        </Campo>
        <Campo etiqueta="Fecha">
          <input className="campo" type="date" value={l.fecha} onChange={(e) => setL({ ...l, fecha: e.target.value })} />
        </Campo>
        <Campo etiqueta="Tipo">
          <select className="campo" value={l.tipo} onChange={(e) => setL({ ...l, tipo: e.target.value as Lote["tipo"] })}>
            {Object.entries(TIPOS_LOTE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Estado">
          <select className="campo" value={l.estado} onChange={(e) => setL({ ...l, estado: e.target.value as Lote["estado"] })}>
            {Object.entries(ESTADOS_LOTE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Proveedor">
          <select className="campo" value={l.proveedorId ?? ""} onChange={(e) => setL({ ...l, proveedorId: e.target.value || null })}>
            <option value="">—</option>
            {db.proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Unid. estimadas">
            <EntradaNumero valor={l.unidadesEstimadas} onCambio={(v) => setL({ ...l, unidadesEstimadas: Math.max(1, Math.round(v)) })} min={1} />
          </Campo>
          <Campo etiqueta="Unid. reales">
            <input className="campo" type="number" min={0} value={l.unidadesReales ?? ""} onChange={(e) => setL({ ...l, unidadesReales: e.target.value === "" ? null : Math.round(parseFloat(e.target.value)) })} />
          </Campo>
        </div>
      </div>
      <Campo etiqueta="Notas">
        <textarea className="campo" value={l.notas ?? ""} onChange={(e) => setL({ ...l, notas: e.target.value })} />
      </Campo>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button className="btn-primario">Guardar lote</button>
      </div>
    </form>
  );
}
