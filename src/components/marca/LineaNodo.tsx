"use client";

import { useRef } from "react";
import { cx } from "../ui";
import { curvas, gsap, movimientoReducido, useGSAP } from "../movimiento/gsap";

/** Divisor del manual: línea fina que termina en un nodo. Se «dibuja» al aparecer. */
export function LineaNodo({ className, ancho = "100%", tono = "linea" }: { className?: string; ancho?: string; tono?: "linea" | "marca" | "claro" }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (movimientoReducido() || !ref.current) return;
      gsap.from(ref.current.querySelector("[data-l]"), { scaleX: 0, transformOrigin: "0 50%", duration: 0.9, ease: curvas.enfasis });
      gsap.from(ref.current.querySelector("[data-n]"), { scale: 0, duration: 0.4, delay: 0.6, ease: "back.out(3)" });
    },
    { scope: ref },
  );
  const color = { linea: "bg-linea-fuerte", marca: "bg-marca", claro: "bg-white/50" }[tono];
  return (
    <div ref={ref} className={cx("flex items-center", className)} style={{ width: ancho }} aria-hidden>
      <span data-l className={cx("h-px flex-1", color)} />
      <span data-n className={cx("size-1.5 rounded-full", color)} />
    </div>
  );
}
