"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { color, semanticos } from "@/design/tokens";
import { formatoCOP, formatoCompacto, formatoMes } from "@/lib/formato";
import { useRef } from "react";
import { useColoresTema, type ColoresTema } from "./movimiento/useColoresTema";
import { curvas, gsap, movimientoReducido, useGSAP } from "./movimiento/gsap";

// Colores de datos desde los tokens (datos-1…6), resueltos para el tema activo.
const RESPALDO = Object.fromEntries(Object.entries(semanticos).map(([k, v]) => [k, color(v.claro)])) as unknown as ColoresTema;

function usePaleta() {
  const c = useColoresTema() ?? RESPALDO;
  return {
    c,
    eje: { fontSize: 11, fill: c["tinta-tenue"], fontFamily: "var(--mt-fuente-sans)" },
    tooltip: {
      contentStyle: { borderRadius: 10, border: `1px solid ${c.linea}`, background: c["superficie-alta"], fontSize: 12, boxShadow: "var(--mt-sombra-md)" },
      labelStyle: { fontWeight: 700, color: c.tinta },
      itemStyle: { color: c.tinta },
      cursor: { fill: c.hundido },
    },
  };
}

const compacto = (v: number) => formatoCompacto(v).replace("$ ", "");
const ANIMACION = { animationDuration: 900, animationEasing: "ease-out" as const };

export function GraficoCategorias({ datos }: { datos: { nombre: string; total: number }[] }) {
  const { c, eje, tooltip } = usePaleta();
  const alto = Math.max(180, datos.length * 30);
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="g-categorias" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c["datos-1"]} />
            <stop offset="100%" stopColor={c["datos-2"]} />
          </linearGradient>
        </defs>
        <CartesianGrid horizontal={false} stroke={c["datos-rejilla"]} />
        <XAxis type="number" tickFormatter={compacto} tick={eje} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="nombre" width={150} tick={eje} axisLine={false} tickLine={false} interval={0} />
        <Tooltip formatter={(v) => [formatoCOP(Number(v)), "Inversión"]} {...tooltip} />
        <Bar dataKey="total" fill="url(#g-categorias)" radius={[0, 6, 6, 0]} barSize={14} {...ANIMACION} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoEvolucion({ datos }: { datos: { mes: string; inversion: number; costoUnitario: number | null }[] }) {
  const { c, eje, tooltip } = usePaleta();
  const filas = datos.map((d) => ({ ...d, etiqueta: formatoMes(d.mes) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={filas} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="g-inversion" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c["datos-2"]} stopOpacity={0.9} />
            <stop offset="100%" stopColor={c["datos-2"]} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={c["datos-rejilla"]} />
        <XAxis dataKey="etiqueta" tick={eje} axisLine={false} tickLine={false} />
        <YAxis yAxisId="inv" tickFormatter={compacto} tick={eje} axisLine={false} tickLine={false} width={56} />
        <YAxis yAxisId="u" orientation="right" tickFormatter={compacto} tick={eje} axisLine={false} tickLine={false} width={56} />
        <Tooltip
          formatter={(v, nombre) => [formatoCOP(Number(v)), nombre === "inversion" ? "Inversión del mes" : "Costo unitario real (lotes)"]}
          {...tooltip}
        />
        <Legend
          formatter={(v) => (v === "inversion" ? "Inversión del mes" : "Costo unitario real")}
          wrapperStyle={{ fontSize: 12, color: c["tinta-tenue"] }}
          iconType="circle"
          iconSize={8}
        />
        <Bar yAxisId="inv" dataKey="inversion" fill="url(#g-inversion)" radius={[6, 6, 0, 0]} barSize={22} {...ANIMACION} />
        <Line
          yAxisId="u"
          dataKey="costoUnitario"
          stroke={c["datos-1"]}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: c["superficie-alta"], strokeWidth: 2 }}
          activeDot={{ r: 5 }}
          connectNulls
          type="monotone"
          {...ANIMACION}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function GraficoEstimadoReal({ datos }: { datos: { codigo: string; estimado: number; real: number }[] }) {
  const { c, eje, tooltip } = usePaleta();
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={datos} margin={{ left: 0, right: 0, top: 8, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={c["datos-rejilla"]} />
        <XAxis dataKey="codigo" tick={eje} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={compacto} tick={eje} axisLine={false} tickLine={false} width={56} />
        <Tooltip formatter={(v, n) => [formatoCOP(Number(v)), n === "estimado" ? "Estimado" : "Real"]} {...tooltip} />
        <Legend formatter={(v) => (v === "estimado" ? "Estimado" : "Real")} wrapperStyle={{ fontSize: 12, color: c["tinta-tenue"] }} iconType="circle" iconSize={8} />
        <Bar dataKey="estimado" fill={c["datos-4"]} radius={[6, 6, 0, 0]} barSize={16} {...ANIMACION} />
        <Bar dataKey="real" fill={c["datos-1"]} radius={[6, 6, 0, 0]} barSize={16} {...ANIMACION} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barra apilada horizontal simple (sin librería) para el desglose de una unidad vendida. */
export function BarraDesglose({ partes }: { partes: { etiqueta: string; valor: number; color: string }[] }) {
  const total = partes.reduce((s, p) => s + Math.max(0, p.valor), 0) || 1;
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (movimientoReducido() || !ref.current) return;
      gsap.from(ref.current.children, { scaleX: 0, transformOrigin: "0 50%", duration: 0.8, stagger: 0.08, ease: curvas.enfasis });
    },
    { scope: ref, dependencies: [partes.map((p) => p.valor).join()] },
  );
  return (
    <div>
      <div ref={ref} className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-hundido">
        {partes.map((p) =>
          p.valor > 0 ? (
            <div key={p.etiqueta} style={{ width: `${(p.valor / total) * 100}%`, background: p.color }} title={`${p.etiqueta}: ${formatoCOP(p.valor)}`} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3 lg:grid-cols-5">
        {partes.map((p) => (
          <li key={p.etiqueta} className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="text-tinta-suave">{p.etiqueta}</span>
            <span className="ml-auto font-medium tabular-nums">{formatoCOP(p.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Colores del desglose por unidad: referencias a tokens (cambian con el tema). */
export const COLORES_DESGLOSE = {
  producto: "var(--mt-color-datos-1)",
  llegada: "var(--mt-color-datos-2)",
  indirecto: "var(--mt-color-datos-3)",
  venta: "var(--mt-color-datos-4)",
  utilidad: "var(--mt-color-verde)",
  perdida: "var(--mt-color-rojo)",
};
