"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cx } from "./ui";

type Tema = "claro" | "oscuro";
const CLAVE = "martha-tema";

function aplicar(tema: Tema) {
  document.documentElement.dataset.tema = tema;
}

/** Cambio de tema con «revelado» circular desde el botón (View Transitions API si existe). */
function aplicarConTransicion(tema: Tema, origen?: HTMLElement | null) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reducido || !origen) return aplicar(tema);
  const r = origen.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  doc.startViewTransition(() => aplicar(tema)).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
      { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

/** Selector de tema: día (claro, por defecto) o noche (oscuro). */
export function SelectorTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    try {
      setTema(localStorage.getItem(CLAVE) === "oscuro" ? "oscuro" : "claro");
    } catch {}
  }, []);

  const elegir = (t: Tema, el: HTMLElement) => {
    setTema(t);
    try {
      localStorage.setItem(CLAVE, t);
    } catch {}
    aplicarConTransicion(t, el);
  };

  const opciones: { id: Tema; etiqueta: string; icono: typeof Sun }[] = [
    { id: "claro", etiqueta: "Modo día", icono: Sun },
    { id: "oscuro", etiqueta: "Modo noche", icono: Moon },
  ];
  return (
    <div role="radiogroup" aria-label="Tema" className={cx("inline-flex rounded-lg border border-linea bg-hundido p-0.5", className)}>
      {opciones.map(({ id, etiqueta, icono: Icono }) => (
        <button
          key={id}
          role="radio"
          aria-checked={tema === id}
          title={etiqueta}
          aria-label={etiqueta}
          onClick={(e) => elegir(id, e.currentTarget)}
          className={cx("grid size-7 cursor-pointer place-items-center rounded-md transition-colors", tema === id ? "bg-superficie text-marca shadow-xs" : "text-tinta-tenue hover:text-tinta")}
        >
          <Icono className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
