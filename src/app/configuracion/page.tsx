"use client";

import { useEffect, useState } from "react";
import { Coins, FlaskConical, Percent, Plus, RotateCcw } from "lucide-react";
import type { CodigoMoneda, Configuracion, Rol } from "@/tipos";
import { nuevoId, useMartha } from "@/lib/datos/MarthaProvider";
import { MONEDAS } from "@/lib/calculos/catalogo";
import { formatoCOP, formatoFecha, formatoPct, hoyISO } from "@/lib/formato";
import { ROLES } from "@/lib/usuarios/tipos";
import { Aviso, Campo, Cargando, Encabezado, EntradaNumero, EntradaPct, Etiqueta, TituloTarjeta } from "@/components/ui";
import { TablaDatos } from "@/components/TablaDatos";

export default function PaginaConfiguracion() {
  const { db, tasas, cargando, esAdmin, modo, usuario, guardarConfiguracion, guardar, reiniciarDemo, cambiarRolDemo } = useMartha();
  const [cfg, setCfg] = useState<Configuracion>(db.configuracion);
  const [guardado, setGuardado] = useState(false);
  const [moneda, setMoneda] = useState<CodigoMoneda>("USD");
  const [tasa, setTasa] = useState(0);

  useEffect(() => setCfg(db.configuracion), [db.configuracion]);
  if (cargando) return <Cargando />;

  const set = <K extends keyof Configuracion>(k: K, v: Configuracion[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const historial = [...db.tasas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 12);

  return (
    <div>
      <Encabezado
        titulo="Configuración"
        acento="general"
        descripcion="Valores por defecto para productos nuevos y tasas de cambio a COP."
        datos={[
          { etiqueta: "Margen mínimo", valor: db.configuracion.margenMinimo, formato: (n) => formatoPct(n, 0) },
          { etiqueta: "Margen objetivo", valor: db.configuracion.margenObjetivo, formato: (n) => formatoPct(n, 0) },
          { etiqueta: "Dólar hoy", valor: tasas.USD ?? null, formato: formatoCOP },
        ]}
      />
      {!esAdmin && (
        <div className="mb-4">
          <Aviso tono="amarillo">Solo un administrador puede modificar la configuración.</Aviso>
        </div>
      )}

      <fieldset disabled={!esAdmin} className="grid gap-5 xl:grid-cols-2">
        <section className="tarjeta-luz p-5">
          <TituloTarjeta icono={Percent} titulo="Márgenes y costos de venta" descripcion="Se copian a cada producto nuevo; cada producto puede cambiarlos." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Margen neto mínimo">
              <EntradaPct valor={cfg.margenMinimo} onCambio={(v) => set("margenMinimo", v)} />
            </Campo>
            <Campo etiqueta="Margen neto objetivo">
              <EntradaPct valor={cfg.margenObjetivo} onCambio={(v) => set("margenObjetivo", v)} />
            </Campo>
            <Campo etiqueta="Comisión de canal">
              <EntradaPct valor={cfg.comisionCanalPct} onCambio={(v) => set("comisionCanalPct", v)} />
            </Campo>
            <Campo etiqueta="Pasarela de pago">
              <EntradaPct valor={cfg.pasarelaPct} onCambio={(v) => set("pasarelaPct", v)} />
            </Campo>
            <Campo etiqueta="Publicidad por unidad">
              <EntradaNumero prefijo="$" valor={cfg.publicidadUnidad} onCambio={(v) => set("publicidadUnidad", v)} />
            </Campo>
            <Campo etiqueta="Envío al cliente por unidad">
              <EntradaNumero prefijo="$" valor={cfg.envioClienteUnidad} onCambio={(v) => set("envioClienteUnidad", v)} />
            </Campo>
            <Campo etiqueta="Otros costos de venta / u">
              <EntradaNumero prefijo="$" valor={cfg.otrosVentaUnidad} onCambio={(v) => set("otrosVentaUnidad", v)} />
            </Campo>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            {guardado && <span className="text-sm text-verde">Guardado ✓</span>}
            <button
              className="btn-primario"
              onClick={async () => {
                await guardarConfiguracion(cfg);
                setGuardado(true);
                setTimeout(() => setGuardado(false), 2000);
              }}
            >
              Guardar configuración
            </button>
          </div>
        </section>

        <section className="tarjeta-luz p-5">
          <TituloTarjeta icono={Coins} titulo="Tasas de cambio a COP" descripcion="Cada costo en moneda extranjera congela la tasa del día en que se registra. Aquí defines la vigente." />
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {MONEDAS.filter((m) => m !== "COP").map((m) => (
              <div key={m} className="rounded-xl border border-marca/15 bg-[linear-gradient(135deg,var(--mt-color-marca-suave),var(--mt-color-acento-suave))] px-3 py-2.5">
                <p className="text-xs font-semibold text-marca">1 {m}</p>
                <p className="font-display text-lg font-bold tabular-nums">{tasas[m] ? formatoCOP(tasas[m]) : "—"}</p>
              </div>
            ))}
          </div>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (tasa <= 0) return;
              await guardar("tasas", { id: nuevoId(), moneda, tasaCop: tasa, fecha: hoyISO(), fuente: "Manual" });
              setTasa(0);
            }}
          >
            <Campo etiqueta="Moneda">
              <select className="campo" value={moneda} onChange={(e) => setMoneda(e.target.value as CodigoMoneda)}>
                {MONEDAS.filter((m) => m !== "COP").map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Tasa en COP">
              <EntradaNumero valor={tasa || null} onCambio={setTasa} min={0} step="any" />
            </Campo>
            <button className="btn-secundario">
              <Plus className="size-4" /> Registrar tasa de hoy
            </button>
          </form>
          <div className="-mx-5 mt-5 border-t border-linea">
            <TablaDatos
              sinMarco
              filas={historial}
              clave={(t) => t.id}
              ordenInicial={{ clave: "fecha", dir: "desc" }}
              columnas={[
                { clave: "fecha", titulo: "Fecha", principal: true, ordenar: (t) => t.fecha, render: (t) => <span className="font-semibold">{formatoFecha(t.fecha)}</span> },
                { clave: "moneda", titulo: "Moneda", ordenar: (t) => t.moneda, render: (t) => <Etiqueta tono="marca">{t.moneda}</Etiqueta> },
                { clave: "tasa", titulo: "Tasa", alinear: "der", ordenar: (t) => t.tasaCop, render: (t) => <span className="font-semibold">{formatoCOP(t.tasaCop)}</span> },
                { clave: "fuente", titulo: "Fuente", render: (t) => <span className="text-tinta-suave">{t.fuente}</span> },
              ]}
            />
          </div>
        </section>
      </fieldset>

      {modo === "demo" && (
        <section className="tarjeta-luz mt-5 p-5">
          <TituloTarjeta icono={FlaskConical} titulo="Modo demo" />
          <p className="mb-4 text-sm text-tinta-suave">
            Los datos viven en este navegador. Configura Supabase (ver README) para usar la app con tu equipo.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <Campo etiqueta="Ver la app como">
              <select className="campo" value={usuario?.rol} onChange={(e) => cambiarRolDemo(e.target.value as Rol)}>
                {Object.entries(ROLES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Campo>
            <button className="btn-peligro" onClick={() => window.confirm("¿Restablecer los datos de ejemplo? Se perderán tus cambios.") && reiniciarDemo()}>
              <RotateCcw className="size-4" /> Restablecer datos de ejemplo
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
