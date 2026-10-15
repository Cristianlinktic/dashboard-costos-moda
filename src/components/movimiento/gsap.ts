"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { movimiento } from "@/design/tokens";

gsap.registerPlugin(useGSAP);
gsap.defaults({ ease: movimiento.gsap.estandar, duration: 0.24 });

export { gsap, useGSAP };
export const curvas = movimiento.gsap;
export const escalonado = movimiento.escalonado;

/** true si el usuario pidió reducir el movimiento (se respeta en todas las animaciones). */
export function movimientoReducido(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
