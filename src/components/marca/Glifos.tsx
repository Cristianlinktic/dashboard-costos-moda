"use client";

import { useRef } from "react";
import { gsap, movimientoReducido, useGSAP } from "../movimiento/gsap";

/**
 * Glifos geométricos derivados de la estructura del logotipo (manual, «Elementos de diagramación»):
 * cuartos de círculo, aspa, cuadrado dentro de cuadrado, chevrón doble, anillo, arco.
 */
const GLIFOS: Record<string, string> = {
  cuartos: "M0 0h12A12 12 0 0 1 0 12Zm24 24H12a12 12 0 0 1 12-12Z",
  aspa: "M0 0h7l5 6 5-6h7L15 12l9 12h-7l-5-6-5 6H0l9-12Z",
  marco: "M0 0h24v24H0Zm8 8v8h8V8Z",
  chevron: "M0 0h7l12 12L7 24H0l12-12Zm10 0h6l8 12-8 12h-6l8-12Z",
  anillo: "M12 0a12 12 0 1 1 0 24 12 12 0 0 1 0-24Zm0 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
  arco: "M0 24V12A12 12 0 0 1 24 12v12h-6V12a6 6 0 0 0-12 0v12Z",
  hoja: "M0 0h12v12H0Zm12 12h12v12H12ZM12 0a12 12 0 0 1 12 12H12ZM0 12h12v12A12 12 0 0 1 0 12Z",
  medias: "M0 4h24a12 12 0 0 1-24 0Zm0 10h24v6H0Z",
};
export const NOMBRES_GLIFOS = Object.keys(GLIFOS);

export function Glifo({ nombre, className, contorno }: { nombre: keyof typeof GLIFOS | string; className?: string; contorno?: boolean }) {
  return (
    <svg viewBox="-1 -1 26 26" className={className} aria-hidden>
      <path d={GLIFOS[nombre]} fill={contorno ? "none" : "currentColor"} stroke={contorno ? "currentColor" : "none"} strokeWidth={contorno ? 0.8 : 0} fillRule="evenodd" />
    </svg>
  );
}

/** Mosaico de glifos que rotan en cuartos de vuelta, como un sistema «vivo». */
export function MosaicoGlifos({ className, columnas = 4, nombres = NOMBRES_GLIFOS }: { className?: string; columnas?: number; nombres?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (movimientoReducido() || !ref.current) return;
      const celdas = gsap.utils.toArray<HTMLElement>("[data-glifo]", ref.current);
      gsap.from(celdas, { scale: 0.4, autoAlpha: 0, stagger: { each: 0.05, grid: "auto", from: "center" }, duration: 0.6, ease: "back.out(2)" });
      const girar = () => {
        const celda = celdas[Math.floor(Math.random() * celdas.length)];
        if (celda) gsap.to(celda, { rotation: "+=90", duration: 0.8, ease: "expo.inOut" });
      };
      const intervalo = window.setInterval(girar, 1400);
      return () => window.clearInterval(intervalo);
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className} style={{ display: "grid", gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`, gap: "0.5rem" }} aria-hidden>
      {nombres.map((n, i) => (
        <div key={n + i} data-glifo>
          <Glifo nombre={n} contorno={i % 3 === 1} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
