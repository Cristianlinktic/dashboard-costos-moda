"use client";

import { useId, useRef } from "react";
import { curvas, gsap, movimientoReducido, useGSAP } from "./movimiento/gsap";

/** Minigráfica de tendencia (SVG puro) con relleno degradado; se dibuja al aparecer. */
export function Sparkline({ valores, alto = 36, className }: { valores: number[]; alto?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const ancho = 120;
  const datos = valores.length > 1 ? valores : [0, ...valores, 0];
  const max = Math.max(...datos, 1);
  const min = Math.min(...datos, 0);
  const pts = datos.map((v, i) => [(i / (datos.length - 1)) * ancho, alto - 3 - ((v - min) / (max - min || 1)) * (alto - 6)] as const);
  const linea = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${linea} L${ancho} ${alto} L0 ${alto} Z`;

  useGSAP(
    () => {
      const path = ref.current?.querySelector<SVGPathElement>("[data-linea]");
      if (!path || movimientoReducido()) return;
      const largo = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: largo, strokeDashoffset: largo }, { strokeDashoffset: 0, duration: 1.4, ease: curvas.enfasis });
      gsap.from(ref.current!.querySelector("[data-area]"), { autoAlpha: 0, duration: 1, delay: 0.4 });
    },
    { scope: ref, dependencies: [valores.join()] },
  );

  return (
    <svg ref={ref} viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mt-color-datos-1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--mt-color-datos-1)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`spl-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--mt-color-datos-1)" />
          <stop offset="100%" stopColor="var(--mt-color-datos-2)" />
        </linearGradient>
      </defs>
      <path data-area d={area} fill={`url(#sp-${id})`} />
      <path data-linea d={linea} fill="none" stroke={`url(#spl-${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Anillo de salud del catálogo: segmentos verde / ámbar / rojo / gris que se dibujan en secuencia. */
export function AnilloSalud({ partes, tamano = 168 }: { partes: { valor: number; color: string; etiqueta: string }[]; tamano?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const r = 15.915; // circunferencia = 100
  const total = partes.reduce((s, p) => s + p.valor, 0) || 1;
  let acumulado = 0;
  const segmentos = partes
    .filter((p) => p.valor > 0)
    .map((p) => {
      const largo = (p.valor / total) * 100;
      const seg = { ...p, largo, inicio: acumulado };
      acumulado += largo;
      return seg;
    });

  useGSAP(
    () => {
      if (movimientoReducido() || !ref.current) return;
      gsap.from(ref.current.querySelectorAll("[data-seg]"), { attr: { "stroke-dasharray": "0 100" }, duration: 1.1, ease: curvas.enfasis, stagger: 0.18 });
    },
    { scope: ref, dependencies: [partes.map((p) => p.valor).join()] },
  );

  return (
    <svg ref={ref} width={tamano} height={tamano} viewBox="0 0 42 42" className="-rotate-90" aria-hidden>
      <circle cx="21" cy="21" r={r} fill="none" stroke="var(--mt-color-hundido)" strokeWidth="4.2" />
      {segmentos.map((s) => (
        <circle
          key={s.etiqueta}
          data-seg
          cx="21"
          cy="21"
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0, s.largo - 1.2)} ${100 - Math.max(0, s.largo - 1.2)}`}
          strokeDashoffset={-s.inicio}
        />
      ))}
    </svg>
  );
}
