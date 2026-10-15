"use client";

import { useEffect, useState } from "react";

const NOMBRES = ["datos-1", "datos-2", "datos-3", "datos-4", "datos-5", "datos-6", "datos-rejilla", "tinta-tenue", "tinta", "superficie-alta", "linea", "verde", "rojo", "hundido"] as const;
export type ColoresTema = Record<(typeof NOMBRES)[number], string>;

function leer(): ColoresTema {
  const css = getComputedStyle(document.documentElement);
  return Object.fromEntries(NOMBRES.map((n) => [n, css.getPropertyValue(`--mt-color-${n}`).trim()])) as ColoresTema;
}

/**
 * Colores semánticos resueltos para librerías que no entienden var() (Recharts, Three.js).
 * Se actualiza al cambiar de tema.
 */
export function useColoresTema(): ColoresTema | null {
  const [colores, setColores] = useState<ColoresTema | null>(null);
  useEffect(() => {
    setColores(leer());
    const obs = new MutationObserver(() => setColores(leer()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
    return () => obs.disconnect();
  }, []);
  return colores;
}
