"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Boxes, Factory, FileDown, FileSpreadsheet, HeartPulse, LineChart, Package, PieChart, Scale, Scissors, Tag, TrendingDown, TrendingUp, Trophy, Wallet } from "lucide-react";
import { useMartha } from "@/lib/datos/MarthaProvider";
import { metricasDashboard, type FiltrosDashboard } from "@/lib/calculos/dashboard";
import { CATEGORIAS } from "@/lib/calculos/catalogo";
import { exportarExcel, exportarPdfDashboard } from "@/lib/exportar";
import { formatoCOP, formatoCompacto, formatoPct } from "@/lib/formato";
import { BadgeMargen, Cargando, Kpi, TituloTarjeta, Vacio, cx } from "@/components/ui";
import { AnilloSalud, Sparkline } from "@/components/MiniGraficos";
import { GraficoCategorias, GraficoEstimadoReal, GraficoEvolucion } from "@/components/Graficos";
import { ContadorAnimado } from "@/components/movimiento/ContadorAnimado";
import { LineaNodo } from "@/components/marca/LineaNodo";
import { Banner } from "@/components/marca/Banner";
import { BarraFiltros, ChipPeriodo, ChipSelect } from "@/components/Filtros";

export default function Dashboard() {
  const { db, cargando, usuario } = useMartha();
  const [filtros, setFiltros] = useState<FiltrosDashboard>({});
  const m = useMemo(() => metricasDashboard(db, filtros), [db, filtros]);
  const categorias = useMemo(() => [...new Set(db.productos.map((p) => p.categoria))].sort(), [db.productos]);

  if (cargando) return <Cargando />;
  if (!db.productos.length)
    return (
      <Vacio titulo="Aún no tienes productos">
        <Link href="/productos/nuevo" className="btn-primario mt-3">
          Registrar mi primer producto
        </Link>
      </Vacio>
    );

  const set = (k: keyof FiltrosDashboard, v: string | undefined) => setFiltros((prev) => ({ ...prev, [k]: v }));

  const saludables = m.productos.filter((p) => p.calculo.semaforo === "verde").length;
  const conMargen = m.productos.filter((p) => p.calculo.margenNeto !== null);
  const margenPromedio = conMargen.length ? conMargen.reduce((s, p) => s + p.calculo.margenNeto!, 0) / conMargen.length : null;
  const cuenta = (e: string) => m.productos.filter((p) => p.calculo.semaforo === e).length;
  const salud = [
    { etiqueta: "Saludables", valor: cuenta("verde"), color: "var(--mt-verde-600)" },
    { etiqueta: "Margen bajo", valor: cuenta("amarillo"), color: "var(--mt-ambar-400)" },
    { etiqueta: "Con pérdida", valor: cuenta("rojo"), color: "var(--mt-rojo-500)" },
    { etiqueta: "Sin precio", valor: cuenta("gris"), color: "var(--mt-bruma-300)" },
  ];

  return (
    <div>
      <Banner className="mb-6 p-7 sm:p-9">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-white/70">Hola{usuario ? `, ${usuario.nombre.split(" ")[0]}` : ""}</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tu rentabilidad <span className="acento-serif font-normal text-malva-200">hoy</span>
            </h1>
            <LineaNodo tono="claro" className="mt-3 max-w-[12rem]" />
            <p className="mt-3 max-w-xl text-sm text-white/75">Cuánto has invertido, cuánto cuesta cada unidad y dónde se está yendo el margen.</p>
          </div>
          <div className="flex flex-wrap items-end gap-6 lg:gap-10">
            <DatoHero etiqueta="Invertido" valor={m.inversionTotal} formato={formatoCompacto} />
            <DatoHero etiqueta="Margen neto promedio" valor={margenPromedio} formato={(n) => formatoPct(n)} />
            <div>
              <p className="text-xs text-white/60">Productos saludables</p>
              <p className="font-display text-2xl font-bold text-white">
                {saludables}
                <span className="text-base font-medium text-white/60"> / {m.productos.length}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-vidrio" onClick={() => exportarPdfDashboard(db, filtros)}>
                <FileDown className="size-4" /> PDF
              </button>
              <button className="btn-vidrio" onClick={() => exportarExcel(db)}>
                <FileSpreadsheet className="size-4" /> Excel
              </button>
            </div>
          </div>
        </div>
      </Banner>

      <BarraFiltros activos={Object.values(filtros).filter(Boolean).length} onLimpiar={() => setFiltros({})}>
        <ChipSelect etiqueta="Producto" icono={Package} valor={filtros.productoId} onCambio={(v) => set("productoId", v)} opciones={db.productos.map((p) => ({ valor: p.id, etiqueta: p.nombre, detalle: p.sku }))} />
        <ChipSelect etiqueta="Proveedor" icono={Factory} valor={filtros.proveedorId} onCambio={(v) => set("proveedorId", v)} opciones={db.proveedores.map((p) => ({ valor: p.id, etiqueta: p.nombre, detalle: p.pais }))} />
        <ChipSelect etiqueta="Lote" icono={Boxes} valor={filtros.loteId} onCambio={(v) => set("loteId", v)} opciones={db.lotes.map((l) => ({ valor: l.id, etiqueta: l.codigo, detalle: db.productos.find((p) => p.id === l.productoId)?.nombre }))} />
        <ChipSelect etiqueta="Categoría" icono={Tag} valor={filtros.categoria} onCambio={(v) => set("categoria", v)} opciones={categorias.map((c) => ({ valor: c, etiqueta: c }))} />
        <ChipPeriodo desde={filtros.desde} hasta={filtros.hasta} onCambio={(desde, hasta) => setFiltros((prev) => ({ ...prev, desde, hasta }))} />
      </BarraFiltros>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi
          icono={Wallet}
          etiqueta="Inversión total acumulada"
          numero={m.inversionTotal}
          formato={formatoCompacto}
          detalle={formatoCOP(m.inversionTotal)}
          extra={<Sparkline valores={m.evolucionMensual.map((e) => e.inversion)} className="h-9 w-full" />}
        />
        <Kpi
          icono={Scissors}
          etiqueta="Costo promedio por unidad"
          numero={m.costoPromedioUnidad}
          formato={formatoCOP}
          detalle={`${m.productos.length} productos`}
          extra={<Sparkline valores={m.evolucionMensual.map((e) => e.costoUnitario ?? 0).filter(Boolean)} className="h-9 w-full" />}
        />
        <Kpi
          icono={TrendingUp}
          etiqueta="Mejor margen neto"
          numero={m.mejorMargen?.calculo.margenNeto}
          formato={(n) => formatoPct(n)}
          tono={m.mejorMargen?.calculo.semaforo}
          detalle={m.mejorMargen?.producto.nombre}
          extra={<MedidorMargen margen={m.mejorMargen?.calculo.margenNeto ?? null} />}
        />
        <Kpi
          icono={TrendingDown}
          etiqueta="Peor margen neto"
          numero={m.peorMargen?.calculo.margenNeto}
          formato={(n) => formatoPct(n)}
          tono={m.peorMargen?.calculo.semaforo}
          detalle={m.peorMargen?.producto.nombre}
          extra={<MedidorMargen margen={m.peorMargen?.calculo.margenNeto ?? null} />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <section className="tarjeta-luz tono-malva p-5 lg:col-span-8">
          <TituloTarjeta icono={LineChart} titulo="Evolución del costo" descripcion="Inversión de cada mes y costo unitario real de los lotes de ese mes." />
          <GraficoEvolucion datos={m.evolucionMensual} />
        </section>

        <section className="tarjeta-luz flex flex-col p-5 lg:col-span-4">
          <TituloTarjeta icono={HeartPulse} titulo="Salud del catálogo" descripcion="Margen neto de cada producto frente a tu mínimo." />
          <div className="flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative grid place-items-center">
              <AnilloSalud partes={salud} />
              <div className="absolute text-center">
                <p className="font-display text-3xl font-bold text-tinta">{saludables}</p>
                <p className="text-[11px] text-tinta-tenue">de {m.productos.length} sanos</p>
              </div>
            </div>
            <ul className="w-full max-w-48 space-y-2 text-sm">
              {salud.map((p) => (
                <li key={p.etiqueta} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 text-tinta-suave">{p.etiqueta}</span>
                  <span className="font-bold tabular-nums">{p.valor}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="tarjeta-luz p-5 lg:col-span-5">
          <TituloTarjeta
            icono={AlertTriangle}
            titulo="Requieren atención"
            descripcion="Productos bajo el margen mínimo o con pérdida."
            accion={m.margenBajo.length > 0 && <span className="rounded-full bg-amarillo-suave px-2 py-0.5 text-xs font-bold text-amarillo">{m.margenBajo.length}</span>}
          />
          {m.margenBajo.length === 0 ? (
            <div className="grid place-items-center rounded-xl bg-verde-suave px-4 py-10 text-center text-sm text-verde">Todos tus productos están sobre el margen mínimo.</div>
          ) : (
            <ul className="space-y-2.5">
              {m.margenBajo.map(({ producto, calculo }) => (
                <li key={producto.id} className="group rounded-xl border border-linea bg-superficie/60 p-3 transition-colors hover:border-marca/30 hover:bg-marca-suave/40">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/productos/${producto.id}`} className="min-w-0 font-semibold hover:text-marca">
                      <span className="block truncate">{producto.nombre}</span>
                    </Link>
                    <BadgeMargen margen={calculo.margenNeto} estado={calculo.semaforo} compacto />
                  </div>
                  <MedidorMargen margen={calculo.margenNeto} minimo={producto.margenMinimo} />
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-tinta-suave">
                    <span>
                      Para {formatoPct(producto.margenMinimo, 0)}:{" "}
                      <strong className="text-tinta">{calculo.precioMinimo !== null ? formatoCOP(calculo.precioMinimo) : "baja costos"}</strong>
                      <span className="text-tinta-tenue"> (hoy {formatoCOP(calculo.precio)})</span>
                    </span>
                    <Link href={`/productos/${producto.id}?tab=simulador`} className="inline-flex items-center gap-1 font-semibold text-marca opacity-80 group-hover:opacity-100">
                      Simular <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta-luz tono-malva p-5 lg:col-span-7">
          <TituloTarjeta icono={PieChart} titulo="Costos por categoría" descripcion="Inversión registrada en el periodo filtrado." />
          {m.costosPorCategoria.length ? (
            <GraficoCategorias datos={m.costosPorCategoria.map((c) => ({ nombre: CATEGORIAS[c.categoria].etiqueta, total: c.total }))} />
          ) : (
            <p className="py-10 text-center text-sm text-tinta-tenue">Sin costos en el periodo.</p>
          )}
        </section>

        <section className="tarjeta-luz p-5 lg:col-span-6">
          <TituloTarjeta icono={Scale} titulo="Estimado vs. real" descripcion="Presupuesto contra facturas reales, por lote." />
          {m.estimadoVsReal.length ? (
            <>
              <GraficoEstimadoReal datos={m.estimadoVsReal.map((c) => ({ codigo: c.lote.codigo, estimado: c.estimadoTotal, real: c.realTotal }))} />
              <div className="mt-3 flex flex-wrap gap-2">
                {m.estimadoVsReal
                  .filter((c) => Math.abs(c.diferencia) > 0)
                  .map((c) => (
                    <span key={c.lote.id} className={c.diferencia > 0 ? "rounded-full bg-rojo-suave px-2.5 py-1 text-xs font-semibold text-rojo" : "rounded-full bg-verde-suave px-2.5 py-1 text-xs font-semibold text-verde"}>
                      {c.lote.codigo} {c.diferencia > 0 ? "+" : ""}
                      {formatoPct(c.diferenciaPct)}
                    </span>
                  ))}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-tinta-tenue">Sin lotes con costos.</p>
          )}
        </section>

        <section className="tarjeta-luz p-5 lg:col-span-6">
          <TituloTarjeta icono={Trophy} titulo="Ranking de costo por unidad" descripcion="De la unidad más cara de producir a la más barata." />
          <ol className="space-y-1">
            {m.masCostosos.map(({ producto, calculo }, i) => {
              const maximo = m.masCostosos[0]?.calculo.costoTotalUnitario || 1;
              return (
                <li key={producto.id}>
                  <Link href={`/productos/${producto.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-marca-suave/60">
                    <span className={cx("grid size-7 shrink-0 place-items-center rounded-lg font-display text-xs font-bold", i === 0 ? "bg-[image:var(--mt-gradiente-marca)] text-white" : "bg-hundido text-tinta-suave")}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold group-hover:text-marca">{producto.nombre}</span>
                        <span className="shrink-0 text-sm font-bold tabular-nums">{formatoCOP(calculo.costoTotalUnitario)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-hundido">
                          <span className="block h-full rounded-full bg-[image:var(--mt-gradiente-marca)]" style={{ width: `${(calculo.costoTotalUnitario / maximo) * 100}%` }} />
                        </span>
                        <BadgeMargen margen={calculo.margenNeto} estado={calculo.semaforo} compacto />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

/** Medidor de margen: barra hasta el margen actual con una marca en el mínimo. */
function MedidorMargen({ margen, minimo = 0.25 }: { margen: number | null; minimo?: number }) {
  if (margen === null) return null;
  const escala = 0.6;
  const ancho = Math.min(1, Math.abs(margen) / escala);
  const color = margen < 0 ? "from-rojo-300 to-rojo-600" : margen < minimo ? "from-ambar-300 to-ambar-600" : "from-verde-300 to-verde-600";
  return (
    <div className="relative mt-2 h-1.5 rounded-full bg-hundido" aria-hidden>
      <span className={cx("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", color)} style={{ width: `${ancho * 100}%` }} />
      <span className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-tinta/30" style={{ left: `${(minimo / escala) * 100}%` }} />
    </div>
  );
}

function DatoHero({ etiqueta, valor, formato }: { etiqueta: string; valor: number | null; formato: (n: number) => string }) {
  return (
    <div>
      <p className="text-xs text-white/60">{etiqueta}</p>
      <p className="font-display text-2xl font-bold text-white">{valor === null ? "—" : <ContadorAnimado valor={valor} formato={formato} />}</p>
    </div>
  );
}
