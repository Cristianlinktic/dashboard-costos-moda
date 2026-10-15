"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Package, RotateCcw, Save, Target } from "lucide-react";
import type { CodigoMoneda, Escenario, ParametrosEscenario, Producto } from "@/tipos";
import { escenarioBase, precioParaMargen, simularEscenario, unidadesParaRecuperar } from "@/lib/calculos/motor";
import { nuevoId, useMartha } from "@/lib/datos/MarthaProvider";
import { formatoCOP, formatoNumero, formatoPct } from "@/lib/formato";
import { Aviso, BadgeMargen, Campo, EntradaNumero, EntradaPct, TituloTarjeta, cx } from "./ui";

const NOMBRES = ["A · Actual", "B", "C"];

const METAS_RAPIDAS = [0.25, 0.3, 0.4, 0.5];

/** `selector`: control opcional para elegir el producto (la página /simulador lo usa). */
export function Simulador({ producto, selector }: { producto: Producto; selector?: React.ReactNode }) {
  const { db, tasas, guardar } = useMartha();
  const costos = useMemo(() => db.costos.filter((c) => c.productoId === producto.id), [db.costos, producto.id]);
  const lotes = useMemo(() => db.lotes.filter((l) => l.productoId === producto.id), [db.lotes, producto.id]);
  const guardados = db.escenarios.filter((e) => e.productoId === producto.id).slice(0, 3);
  const monedas = [...new Set(costos.map((c) => c.moneda).filter((m) => m !== "COP"))] as CodigoMoneda[];

  const inicial = (): ParametrosEscenario[] =>
    NOMBRES.map((nombre, i) => guardados[i]?.parametros ?? escenarioBase(producto, lotes, nombre));
  const [escenarios, setEscenarios] = useState<ParametrosEscenario[]>(inicial);
  const [margenMeta, setMargenMeta] = useState(producto.margenObjetivo);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const resultados = useMemo(() => escenarios.map((e) => simularEscenario(producto, costos, lotes, tasas, e)), [escenarios, producto, costos, lotes, tasas]);
  const margenes = resultados.map((r) => r.margenNeto ?? -Infinity);
  const maximo = Math.max(...margenes);
  // Solo se destaca un escenario si supera claramente a los demás.
  const mejor = margenes.filter((m) => Math.abs(m - maximo) < 1e-9).length === 1 ? margenes.indexOf(maximo) : -1;

  const cambiar = (i: number, cambios: Partial<ParametrosEscenario>) => setEscenarios((prev) => prev.map((e, j) => (j === i ? { ...e, ...cambios } : e)));

  async function guardarEscenarios() {
    for (let i = 0; i < escenarios.length; i++) {
      const esc: Escenario = { id: guardados[i]?.id ?? nuevoId(), productoId: producto.id, nombre: escenarios[i].nombre, parametros: escenarios[i] };
      await guardar("escenarios", esc);
    }
    setMensaje("Guardados ✓");
    setTimeout(() => setMensaje(null), 2500);
  }

  function restablecer() {
    setEscenarios(NOMBRES.map((nombre) => escenarioBase(producto, lotes, nombre)));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        {selector && (
          <section className="tarjeta-luz flex flex-col p-5 lg:col-span-4">
            <TituloTarjeta icono={Package} titulo="Producto" descripcion="Elige qué producto simular." />
            <div className="flex flex-1 flex-col justify-center gap-3">
              {selector}
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-hundido px-3 py-2">
                  <dt className="text-tinta-tenue">Costo/u</dt>
                  <dd className="font-display text-sm font-bold">{formatoCOP(resultados[0]?.costoTotalUnitario)}</dd>
                </div>
                <div className="rounded-xl bg-hundido px-3 py-2">
                  <dt className="text-tinta-tenue">Precio</dt>
                  <dd className="font-display text-sm font-bold">{formatoCOP(producto.precioVenta)}</dd>
                </div>
                <div className="rounded-xl bg-hundido px-3 py-2">
                  <dt className="text-tinta-tenue">Mínimo</dt>
                  <dd className="font-display text-sm font-bold">{formatoPct(producto.margenMinimo, 0)}</dd>
                </div>
              </dl>
            </div>
          </section>
        )}

        {/* La meta manda: define el «precio para X %» de cada escenario. */}
        <section className={cx("tarjeta-luz p-5", selector ? "lg:col-span-8" : "lg:col-span-12")}>
          <TituloTarjeta
            icono={Target}
            titulo="Tu meta de margen"
            descripcion="Cada escenario te dice a qué precio de lista la alcanzas."
            accion={
              <div className="flex shrink-0 gap-2">
                <button className="btn-fantasma px-2.5" onClick={restablecer} title="Restablecer escenarios">
                  <RotateCcw className="size-4" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
                <button className="btn-secundario" onClick={guardarEscenarios}>
                  <Save className="size-4" />
                  <span className="hidden sm:inline">{mensaje ?? "Guardar escenarios"}</span>
                </button>
              </div>
            }
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-baseline gap-1">
              <span className="texto-gradiente font-display text-5xl leading-none font-bold tabular-nums">{Math.round(margenMeta * 100)}</span>
              <span className="font-display text-2xl font-bold text-marca">%</span>
              <span className="acento-serif ml-1 text-lg text-tinta-suave">neto</span>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <input
                type="range"
                min={0}
                max={70}
                step={1}
                value={Math.round(margenMeta * 100)}
                onChange={(e) => setMargenMeta(Number(e.target.value) / 100)}
                className="rango"
                style={{ "--valor": `${(margenMeta / 0.7) * 100}%` } as React.CSSProperties}
                aria-label="Meta de margen neto"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {METAS_RAPIDAS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMargenMeta(m)}
                    className={cx(
                      "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-colors",
                      Math.abs(margenMeta - m) < 0.001 ? "border-transparent bg-[image:var(--mt-gradiente-marca)] text-white shadow-sm" : "border-linea text-tinta-suave hover:border-marca/40 hover:text-marca",
                    )}
                  >
                    {m * 100} %
                  </button>
                ))}
                <span className="mx-1 h-4 w-px bg-linea" aria-hidden />
                <span className="text-xs text-tinta-tenue">Tu mínimo: {formatoPct(producto.margenMinimo, 0)} · objetivo: {formatoPct(producto.margenObjetivo, 0)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {escenarios.map((e, i) => {
          const r = resultados[i];
          const precioMetaEfectivo = precioParaMargen(r.costoTotalUnitario, margenMeta, r.costoVentaPct, r.costoVentaFijoUnitario);
          const precioMetaLista = precioMetaEfectivo === null ? null : precioMetaEfectivo / Math.max(0.01, 1 - e.descuentoPct);
          const recuperar = unidadesParaRecuperar(r.inversionTotal, r.precioEfectivo, r.costoVentaPct, r.costoVentaFijoUnitario);
          return (
            <section key={i} className={cx("tarjeta-luz flex flex-col overflow-hidden", i === mejor && "ring-2 ring-verde/45 ring-offset-2 ring-offset-fondo")}>
              <div className={cx("relative overflow-hidden px-4 pt-4 pb-5", i === 0 ? "banner rounded-none" : "banda rounded-none border-0 border-b")}>
                <div className="relative z-[2] flex items-center justify-between gap-2">
                  <span className={cx("grid size-8 shrink-0 place-items-center rounded-xl font-display text-sm font-bold", i === 0 ? "bg-white/15 text-white" : "bg-[image:var(--mt-gradiente-marca)] text-white")}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    className={cx("min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 font-display font-bold outline-none focus:ring-2", i === 0 ? "text-white placeholder:text-white/60 focus:ring-white/40" : "text-titulo focus:ring-marca/30")}
                    value={e.nombre}
                    onChange={(ev) => cambiar(i, { nombre: ev.target.value })}
                    aria-label="Nombre del escenario"
                  />
                  {i === mejor && <span className="rounded-full bg-verde-suave px-2 py-0.5 text-[11px] font-bold text-verde">Mejor margen</span>}
                </div>
                <div className="relative z-[2] mt-3 flex items-end justify-between">
                  <span className={cx("text-xs", i === 0 ? "text-white/70" : "text-tinta-tenue")}>Margen neto</span>
                  <span className={cx("font-display text-3xl font-bold tracking-tight", i === 0 ? "text-white" : r.semaforo === "rojo" ? "text-rojo" : r.semaforo === "amarillo" ? "text-amarillo" : "text-verde")}>
                    {formatoPct(r.margenNeto)}
                  </span>
                </div>
                <div className={cx("relative z-[2] mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs", i === 0 ? "bg-white/12 text-white" : "bg-marca-suave text-marca")}>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Target className="size-3.5" /> Precio para {Math.round(margenMeta * 100)} %
                  </span>
                  <span className="font-display text-sm font-bold">{precioMetaLista ? formatoCOP(precioMetaLista) : "Inalcanzable"}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">

              <div className="grid grid-cols-2 gap-2.5">
                <Campo etiqueta="Precio de lista">
                  <EntradaNumero prefijo="$" valor={e.precio} onCambio={(v) => cambiar(i, { precio: v })} min={0} step={1000} />
                </Campo>
                <Campo etiqueta="Descuento">
                  <EntradaPct valor={e.descuentoPct} onCambio={(v) => cambiar(i, { descuentoPct: v })} min={0} max={90} />
                </Campo>
                {monedas.map((m) => (
                  <Campo key={m} etiqueta={`Tasa ${m}`} ayuda={e.tasas[m] ? undefined : "Usa la tasa de cada costo"}>
                    <EntradaNumero valor={e.tasas[m] ?? tasas[m]} onCambio={(v) => cambiar(i, { tasas: { ...e.tasas, [m]: v } })} min={0} />
                  </Campo>
                ))}
                <Campo etiqueta="Variación flete">
                  <EntradaPct valor={e.variacionFletePct} onCambio={(v) => cambiar(i, { variacionFletePct: v })} />
                </Campo>
                <Campo etiqueta="Variación proveedor">
                  <EntradaPct valor={e.variacionProveedorPct} onCambio={(v) => cambiar(i, { variacionProveedorPct: v })} />
                </Campo>
                <Campo etiqueta="Volumen (u. base)">
                  <EntradaNumero valor={e.volumen} onCambio={(v) => cambiar(i, { volumen: Math.max(1, Math.round(v)) })} min={1} />
                </Campo>
                <Campo etiqueta="Comisión canal">
                  <EntradaPct valor={e.comisionCanalPct} onCambio={(v) => cambiar(i, { comisionCanalPct: v })} min={0} />
                </Campo>
                <Campo etiqueta="Publicidad / u" className="col-span-2">
                  <EntradaNumero prefijo="$" valor={e.publicidadUnidad} onCambio={(v) => cambiar(i, { publicidadUnidad: v })} min={0} />
                </Campo>
              </div>

              <dl className="mt-4 space-y-1.5 border-t border-linea pt-3 text-sm">
                <Fila e="Precio efectivo" v={formatoCOP(r.precioEfectivo)} />
                <Fila e="Costo total / u" v={formatoCOP(r.costoTotalUnitario)} />
                <Fila e="Costos de venta / u" v={formatoCOP(r.costoVentaUnitario)} />
                <Fila e="Utilidad / u" v={formatoCOP(r.utilidadUnitaria)} fuerte tono={r.utilidadUnitaria < 0 ? "text-rojo" : undefined} />
                <div className="flex items-center justify-between">
                  <dt className="text-tinta-suave">Margen neto</dt>
                  <dd>
                    <BadgeMargen margen={r.margenNeto} estado={r.semaforo} compacto />
                  </dd>
                </div>
                <Fila e="Margen bruto" v={formatoPct(r.margenBruto)} />
                <Fila e="Precio de equilibrio" v={formatoCOP(r.precioEquilibrio)} />
                <Fila e="Unidades para recuperar inversión" v={recuperar === null ? "—" : formatoNumero(recuperar)} />
              </dl>

              {r.alertas.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {r.alertas.map((a) => (
                    <Aviso key={a} tono={r.semaforo === "rojo" ? "rojo" : "amarillo"}>
                      <span className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="size-3.5 shrink-0" /> {a}
                      </span>
                    </Aviso>
                  ))}
                </div>
              )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Fila({ e, v, fuerte, tono }: { e: string; v: string; fuerte?: boolean; tono?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-tinta-suave">{e}</dt>
      <dd className={cx("tabular-nums", fuerte && "font-semibold", tono)}>{v}</dd>
    </div>
  );
}
