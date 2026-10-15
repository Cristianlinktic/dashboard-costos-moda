"use client";

import { useRef } from "react";
import { curvas, gsap, movimientoReducido, useGSAP } from "./gsap";

/** Número que «cuenta» hasta su valor cuando aparece o cambia. */
export function ContadorAnimado({ valor, formato, duracion = 1.1 }: { valor: number; formato: (n: number) => string; duracion?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const actual = useRef({ v: 0 });

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !Number.isFinite(valor)) return;
      if (movimientoReducido()) {
        actual.current.v = valor;
        el.textContent = formato(valor);
        return;
      }
      gsap.to(actual.current, {
        v: valor,
        duration: duracion,
        ease: curvas.enfasis,
        onUpdate: () => {
          el.textContent = formato(actual.current.v);
        },
      });
    },
    { dependencies: [valor] },
  );

  return (
    <span ref={ref} className="tabular-nums">
      {formato(valor)}
    </span>
  );
}
