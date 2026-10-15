"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cx } from "./ui";

/**
 * Campo de los formularios de acceso: etiqueta visible, ícono a la izquierda, 44 px de alto
 * y, si es contraseña, botón para mostrarla u ocultarla.
 */
export function CampoAcceso({
  etiqueta,
  icono: Icono,
  tipo = "text",
  valor,
  onCambio,
  autoComplete,
  ayuda,
  autoFocus,
}: {
  etiqueta: string;
  icono: LucideIcon;
  tipo?: "text" | "email" | "password";
  valor: string;
  onCambio: (v: string) => void;
  autoComplete?: string;
  ayuda?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const esClave = tipo === "password";
  return (
    <div>
      <label htmlFor={id} className="etiqueta">
        {etiqueta}
      </label>
      <div className="group relative">
        <Icono className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-tinta-tenue transition-colors group-focus-within:text-marca" />
        <input
          id={id}
          type={esClave && visible ? "text" : tipo}
          required
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          className={cx("campo h-11 pl-10 text-[0.9375rem]", esClave && "pr-11")}
        />
        {esClave && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-tinta-tenue hover:bg-marca-suave hover:text-marca"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {ayuda && <p className="mt-1 text-xs text-tinta-tenue">{ayuda}</p>}
    </div>
  );
}

/** Botón principal de acceso con estado de carga. */
export function BotonAcceso({ cargando, texto, textoCargando, icono: Icono }: { cargando: boolean; texto: string; textoCargando: string; icono?: LucideIcon }) {
  return (
    <button className="btn-primario group h-11 w-full text-[0.9375rem]" disabled={cargando} aria-busy={cargando}>
      {cargando ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          {textoCargando}
        </>
      ) : (
        <>
          {texto}
          {Icono && <Icono className="size-4 transition-transform group-hover:translate-x-0.5" />}
        </>
      )}
    </button>
  );
}
