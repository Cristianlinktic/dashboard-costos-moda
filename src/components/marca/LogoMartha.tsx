"use client";

import { useId, useRef } from "react";
import { escalas } from "@/design/tokens";
import { curvas, gsap, movimientoReducido, useGSAP } from "../movimiento/gsap";

/**
 * Isotipo de Martha. Igual que el sistema gráfico LinkTIC nace de la geometría de la «K»,
 * la «M» de Martha se construye con dos astas y dos diagonales que se conectan en un nodo
 * (el punto de equilibrio). Degradado lila → orquídea → malva.
 */
export function IsotipoMartha({ tamano = 32, animado = false, monocromo }: { tamano?: number; animado?: boolean; monocromo?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (!animado || movimientoReducido() || !ref.current) return;
      const trazos = ref.current.querySelectorAll<SVGPathElement>("[data-trazo]");
      gsap.set(trazos, { strokeDasharray: 40, strokeDashoffset: 40 });
      gsap
        .timeline()
        .to(trazos, { strokeDashoffset: 0, duration: 0.9, ease: curvas.enfasis, stagger: 0.08 })
        .from(ref.current.querySelector("[data-nodo]"), { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3)" }, "-=0.45");
    },
    { scope: ref },
  );

  const trazo = monocromo ?? `url(#m-${id})`;
  return (
    <svg ref={ref} width={tamano} height={tamano} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`m-${id}`} x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor={escalas.lila[700]} />
          <stop offset="0.55" stopColor={escalas.lila[500]} />
          <stop offset="1" stopColor={escalas.malva[400]} />
        </linearGradient>
      </defs>
      <path data-trazo d="M6.5 27V5.5L16 18.5" stroke={trazo} strokeWidth="4.2" strokeLinejoin="miter" strokeLinecap="square" />
      <path data-trazo d="M25.5 27V5.5L16 18.5" stroke={trazo} strokeWidth="4.2" strokeLinejoin="miter" strokeLinecap="square" />
      <circle data-nodo cx="16" cy="25.5" r="2.6" fill={monocromo ? escalas.malva[300] : escalas.malva[500]} />
    </svg>
  );
}

export function LogoMartha({ tamano = 30, claro, animado }: { tamano?: number; claro?: boolean; animado?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <IsotipoMartha tamano={tamano} animado={animado} monocromo={claro ? "#FFFFFF" : undefined} />
      <span className="leading-none">
        <span className={`block font-display text-[1.2rem] font-bold tracking-tight ${claro ? "text-white" : "text-tinta"}`}>Martha</span>
        <span className={`acento-serif block text-[0.8rem] ${claro ? "text-malva-200" : "text-tinta-tenue"}`}>costos con claridad</span>
      </span>
    </span>
  );
}
