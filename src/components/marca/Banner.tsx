"use client";

import type { ReactNode } from "react";
import { cx } from "../ui";
import { TelaSatin } from "./TelaSatin";

/**
 * Banner satinado de Martha: tela de satín lila en movimiento (TelaSatin) sobre el degradado
 * ciruela → lila → malva (que queda como respaldo sin WebGL), con un velo a la izquierda que
 * asegura el contraste del texto blanco. Es el elemento firma: máximo uno por pantalla.
 */
export function Banner({ children, className, tela = true }: { children: ReactNode; className?: string; tela?: boolean }) {
  return (
    <section data-revelar className={cx("banner", className)}>
      {tela && <TelaSatin className="-z-10" />}
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-r from-ciruela-950/45 via-ciruela-950/10 to-transparent" />
      <div className="relative z-[2] h-full">{children}</div>
    </section>
  );
}
