"use client";

import { BadgeDollarSign, Coins, Flame, Percent, Scissors, Ship, Sigma, TrendingUp, Wallet } from "lucide-react";
import type { Producto } from "@/tipos";
import type { ResultadoCalculo } from "@/lib/calculos/motor";
import { CATEGORIAS } from "@/lib/calculos/catalogo";
import { formatoCOP, formatoCompacto, formatoNumero, formatoPct } from "@/lib/formato";
import { BarraDesglose, COLORES_DESGLOSE } from "./Graficos";
import { BadgeMargen, Kpi, cx, TituloTarjeta } from "./ui";

/** Calculadora compacta que acompaña al asistente mientras se agregan costos. */
export function CalculadoraEnVivo({ r, producto }: { r: ResultadoCalculo; producto: Producto }) {
  const filas: [string, number | null, boolean?][] = [
    ["Costo directo / u", r.costoDirectoUnitario],
    ["Logística e importación / u", r.costoLlegadaUnitario],
    ["Landed cost", r.landedCost, true],
    ["Fijos asignados / u", r.fijosAsignadosUnitario],
    ["Costo total / u", r.costoTotalUnitario, true],
    ["Costos de venta / u", r.costoVentaUnitario],
  ];
  return (
    <div className="tarjeta-luz p-4">
      <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-tinta-suave uppercase">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-verde-400 opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-verde-500" />
        </span>
        Calculadora en vivo
      </h3>
      <dl className="mt-3 space-y-1.5 text-sm">
        {filas.map(([e, v, fuerte]) => (
          <div key={e} className={cx("flex justify-between gap-3", fuerte && "border-t border-linea pt-1.5 font-semibold")}>
            <dt className={fuerte ? "" : "text-tinta-suave"}>{e}</dt>
            <dd className="tabular-nums">{formatoCOP(v)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 space-y-1.5 border-t border-linea pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-tinta-suave">Inversión total</span>
          <span className="tabular-nums">{formatoCOP(r.inversionTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tinta-suave">Precio mínimo ({formatoPct(producto.margenMinimo, 0)})</span>
          <span className="tabular-nums">{r.precioMinimo !== null ? formatoCOP(r.precioMinimo) : "Inalcanzable"}</span>
        </div>
        <div className="flex justify-between font-semibold text-marca">
          <span>Precio sugerido ({formatoPct(producto.margenObjetivo, 0)})</span>
          <span className="tabular-nums">{r.precioSugerido !== null ? formatoCOP(r.precioSugerido) : "Inalcanzable"}</span>
        </div>
        {r.precio > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-tinta-suave">Margen neto a {formatoCOP(r.precio)}</span>
            <BadgeMargen margen={r.margenNeto} estado={r.semaforo} compacto />
          </div>
        )}
      </div>
    </div>
  );
}

/** Resumen completo del cálculo de un producto, con fórmulas visibles. */
const pct = (n: number) => formatoPct(n);

export function PanelCalculo({ r, producto }: { r: ResultadoCalculo; producto: Producto }) {
  const utilidad = r.utilidadUnitaria;
  const top = r.desglose.slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icono={Scissors} etiqueta="Costo total / unidad" numero={r.costoTotalUnitario} formato={formatoCOP} detalle={`${formatoNumero(r.unidadesBase)} u. base`} />
        <Kpi icono={Ship} etiqueta="Landed cost" numero={r.landedCost} formato={formatoCOP} detalle="Puesto en tu bodega" />
        <Kpi icono={Percent} etiqueta="Margen bruto" numero={r.margenBruto} formato={pct} />
        <Kpi icono={TrendingUp} etiqueta="Margen neto" numero={r.margenNeto} formato={pct} tono={r.semaforo} detalle={`Mínimo ${formatoPct(producto.margenMinimo, 0)}`} />
        <Kpi icono={Coins} etiqueta="Utilidad / unidad" numero={utilidad} formato={formatoCOP} tono={utilidad < 0 ? "rojo" : undefined} />
        <Kpi icono={Wallet} etiqueta="Invertido" numero={r.inversionTotal} formato={formatoCompacto} detalle={formatoCOP(r.inversionTotal)} />
      </div>

      {r.precio > 0 && (
        <section className="tarjeta-luz p-4">
          <TituloTarjeta icono={Coins} titulo={<>¿A dónde va cada {formatoCOP(r.precio)} que vendes?</>} descripcion="Desglose de una unidad vendida." />
          <BarraDesglose
            partes={[
              { etiqueta: "Producto", valor: r.costoDirectoUnitario, color: COLORES_DESGLOSE.producto },
              { etiqueta: "Logística e import.", valor: r.costoLlegadaUnitario, color: COLORES_DESGLOSE.llegada },
              { etiqueta: "Indirectos", valor: r.costoIndirectoUnitario, color: COLORES_DESGLOSE.indirecto },
              { etiqueta: "Costos de venta", valor: r.costoVentaUnitario, color: COLORES_DESGLOSE.venta },
              { etiqueta: utilidad >= 0 ? "Utilidad" : "Pérdida", valor: Math.abs(utilidad), color: utilidad >= 0 ? COLORES_DESGLOSE.utilidad : COLORES_DESGLOSE.perdida },
            ]}
          />
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="tarjeta-luz p-4">
          <TituloTarjeta icono={Sigma} titulo="Fórmulas aplicadas" descripcion="Cómo se calcula cada cifra, con tus números." />
          <dl className="space-y-3 text-sm">
            <Formula
              nombre="Costo unitario"
              formula="Σ costos asignados ÷ unidades del lote (fijos ÷ unidades base)"
              calculo={`${formatoCOP(r.costoVariableUnitario)} variables + ${formatoCOP(r.fijosAsignadosUnitario)} fijos`}
              resultado={formatoCOP(r.costoTotalUnitario)}
            />
            <Formula
              nombre="Landed cost"
              formula="Costo del producto + flete + aduana + seguros + manejo"
              calculo={`${formatoCOP(r.costoDirectoUnitario)} + ${formatoCOP(r.costoLlegadaUnitario)}`}
              resultado={formatoCOP(r.landedCost)}
            />
            <Formula
              nombre="Costos de venta"
              formula="Precio × (comisión + pasarela) + publicidad + envío + otros"
              calculo={`${formatoCOP(r.precio)} × ${formatoPct(r.costoVentaPct)} + ${formatoCOP(r.costoVentaFijoUnitario)}`}
              resultado={formatoCOP(r.costoVentaUnitario)}
            />
            <Formula
              nombre="Margen bruto"
              formula="(precio − costo unitario) ÷ precio"
              calculo={`(${formatoCOP(r.precio)} − ${formatoCOP(r.costoTotalUnitario)}) ÷ ${formatoCOP(r.precio)}`}
              resultado={formatoPct(r.margenBruto)}
            />
            <Formula
              nombre="Margen neto"
              formula="(precio − costo unitario − costos de venta) ÷ precio"
              calculo={`(${formatoCOP(r.precio)} − ${formatoCOP(r.costoTotalUnitario)} − ${formatoCOP(r.costoVentaUnitario)}) ÷ ${formatoCOP(r.precio)}`}
              resultado={formatoPct(r.margenNeto)}
            />
          </dl>
        </section>

        <section className="tarjeta-luz p-4">
          <TituloTarjeta icono={BadgeDollarSign} titulo="Precios recomendados" descripcion="Según tu margen mínimo y objetivo." />
          <table className="tabla">
            <tbody>
              <FilaPrecio etiqueta={`Precio mínimo (margen ${formatoPct(producto.margenMinimo, 0)})`} precio={r.precioMinimo} actual={r.precio} />
              <FilaPrecio etiqueta={`Precio sugerido (margen ${formatoPct(producto.margenObjetivo, 0)})`} precio={r.precioSugerido} actual={r.precio} destacado />
              {r.preciosReferencia.map((p) => (
                <FilaPrecio key={p.margen} etiqueta={`Margen neto ${formatoPct(p.margen, 0)}`} precio={p.precio} actual={r.precio} />
              ))}
              <FilaPrecio etiqueta="Punto de equilibrio por unidad (margen 0 %)" precio={r.precioEquilibrio} actual={r.precio} />
            </tbody>
          </table>
          <p className="mt-3 text-xs text-tinta-suave">
            {r.inversionFija === 0 ? (
              "No tienes costos fijos por recuperar: cada venta con utilidad positiva ya deja ganancia."
            ) : r.unidadesEquilibrio !== null ? (
              <>
                Necesitas vender <strong className="text-tinta">{formatoNumero(r.unidadesEquilibrio)} unidades</strong> al precio actual para recuperar los{" "}
                {formatoCOP(r.inversionFija)} de costos fijos (diseño, muestras, fotos…).
              </>
            ) : (
              "Al precio actual cada venta no alcanza a cubrir sus costos variables: no hay punto de equilibrio."
            )}
          </p>
        </section>
      </div>

      {top.length > 0 && (
        <section className="tarjeta-luz p-4">
          <TituloTarjeta icono={Flame} titulo="Costos que más afectan tu rentabilidad" descripcion="Los cinco que más pesan por unidad." />
          <ol className="space-y-2.5">
            {top.map((d, i) => (
              <li key={d.costoId} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">
                    <span className="mr-2 text-tinta-tenue tabular-nums">{i + 1}.</span>
                    {d.nombre} <span className="text-xs text-tinta-tenue">· {CATEGORIAS[d.categoria].etiqueta}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatoCOP(d.unitario)}/u <span className="text-xs font-normal text-tinta-tenue">({formatoPct(d.participacion, 0)})</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-hundido">
                  <div className="h-1.5 rounded-full bg-marca" style={{ width: `${Math.min(100, d.participacion * 100)}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Formula({ nombre, formula, calculo, resultado }: { nombre: string; formula: string; calculo: string; resultado: string }) {
  return (
    <div className="rounded-lg bg-hundido px-3 py-2">
      <dt className="flex justify-between gap-3">
        <span className="font-medium">{nombre}</span>
        <span className="font-semibold tabular-nums">{resultado}</span>
      </dt>
      <dd className="mt-0.5 text-xs text-tinta-suave">{formula}</dd>
      <dd className="mt-0.5 font-mono text-[11px] break-words text-tinta-tenue">{calculo}</dd>
    </div>
  );
}

function FilaPrecio({ etiqueta, precio, actual, destacado }: { etiqueta: string; precio: number | null; actual: number; destacado?: boolean }) {
  const cubre = precio !== null && actual >= precio;
  return (
    <tr className={destacado ? "bg-marca-suave/60" : undefined}>
      <td className={destacado ? "font-medium" : "text-tinta-suave"}>{etiqueta}</td>
      <td className="num font-semibold">{precio === null ? <span className="text-rojo">Inalcanzable</span> : formatoCOP(precio)}</td>
      <td className="w-6 text-center">{precio !== null && actual > 0 && <span className={cubre ? "text-verde" : "text-rojo"}>{cubre ? "✓" : "✗"}</span>}</td>
    </tr>
  );
}
