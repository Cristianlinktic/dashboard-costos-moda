"use client";

import { useRef, type ReactNode } from "react";
import { curvas, escalonado, gsap, movimientoReducido, useGSAP } from "./gsap";

const SELECTOR = ".tarjeta, .tarjeta-luz, .tarjeta-viva, .banda, h1, [data-revelar]";

/**
 * Entrada escalonada de la página: títulos, tarjetas y elementos con [data-revelar]
 * suben y aparecen («evolución» del manual). Se repite cuando cambia `clave`.
 */
export function Revelar({ clave, children, className }: { clave: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (movimientoReducido() || !ref.current) return;
      const objetivos = Array.from(ref.current.querySelectorAll<HTMLElement>(SELECTOR))
        .filter((el) => !el.parentElement?.closest(SELECTOR))
        .slice(0, 28);
      gsap.from(objetivos, {
        autoAlpha: 0,
        y: 14,
        duration: 0.7,
        ease: curvas.enfasis,
        stagger: escalonado,
        clearProps: "opacity,visibility,transform",
      });
      // Las filas de las tablas entran en cascada, después de las tarjetas.
      const filas = Array.from(ref.current.querySelectorAll<HTMLElement>(".tabla tbody tr")).slice(0, 14);
      if (filas.length)
        gsap.from(filas, { autoAlpha: 0, x: -8, duration: 0.45, ease: curvas.enfasis, stagger: 0.03, delay: 0.25, clearProps: "opacity,visibility,transform" });
    },
    { scope: ref, dependencies: [clave], revertOnUpdate: true },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
