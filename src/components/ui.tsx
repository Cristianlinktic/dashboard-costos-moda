"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import type { Semaforo } from "@/lib/calculos/motor";
import { formatoPct } from "@/lib/formato";
import { ContadorAnimado } from "./movimiento/ContadorAnimado";
import { curvas, gsap, movimientoReducido } from "./movimiento/gsap";
import { LineaNodo } from "./marca/LineaNodo";
import { MosaicoGlifos } from "./marca/Glifos";
import { Banner } from "./marca/Banner";

export function cx(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(" ");
}

export interface DatoEncabezado {
  etiqueta: string;
  valor: number | null | undefined;
  formato: (n: number) => string;
  detalle?: string;
}

/**
 * Encabezado de página: el mismo banner satinado del dashboard (lilas, red de nodos)
 * con título + palabra clave en serif, descripción, cifras clave animadas y acciones.
 */
export function Encabezado({
  titulo,
  acento,
  descripcion,
  acciones,
  datos,
  previo,
}: {
  titulo: ReactNode;
  acento?: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  datos?: DatoEncabezado[];
  /** Contenido sobre el título (p. ej. «← Productos» o etiquetas). */
  previo?: ReactNode;
}) {
  return (
    <Banner className="mb-6">
      <div className="flex flex-col gap-6 p-6 sm:p-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          {previo && <div className="mb-2 text-sm text-white/70">{previo}</div>}
          <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-white sm:text-4xl">
            {titulo}
            {acento && <span className="acento-serif ml-2 font-normal text-malva-200">{acento}</span>}
          </h1>
          <LineaNodo tono="claro" className="mt-3 max-w-[12rem]" />
          {descripcion && <div className="mt-3 max-w-2xl text-sm text-white/75">{descripcion}</div>}
        </div>
        {(datos?.length || acciones) && (
          <div className="flex flex-col gap-5 xl:items-end">
            {datos && datos.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-10">
                {datos.map((d) => (
                  <div key={d.etiqueta} className="min-w-0">
                    <dt className="text-xs text-white/60">{d.etiqueta}</dt>
                    <dd className="font-display text-2xl font-bold text-white">
                      {d.valor == null || !Number.isFinite(d.valor) ? "—" : <ContadorAnimado valor={d.valor} formato={d.formato} />}
                    </dd>
                    {d.detalle && <dd className="truncate text-[11px] text-white/55">{d.detalle}</dd>}
                  </div>
                ))}
              </dl>
            )}
            {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
          </div>
        )}
      </div>
    </Banner>
  );
}

/** Tarjeta de indicador. Con `numero` + `formato` la cifra se anima (cuenta) al aparecer o cambiar. */
export function Kpi({
  etiqueta,
  valor,
  numero,
  formato,
  detalle,
  tono,
  icono: Icono,
  extra,
}: {
  etiqueta: string;
  valor?: ReactNode;
  numero?: number | null;
  formato?: (n: number) => string;
  detalle?: ReactNode;
  tono?: Semaforo;
  icono?: LucideIcon;
  /** Contenido adicional al pie (p. ej. una minigráfica). */
  extra?: ReactNode;
}) {
  const animable = numero != null && Number.isFinite(numero) && formato;
  const halo = { verde: "bg-verde/15", amarillo: "bg-amarillo/15", rojo: "bg-rojo/15", gris: "bg-marca/10" }[tono ?? "gris"];
  return (
    <div className="tarjeta-viva group relative overflow-hidden p-4 sm:p-5">
      <span aria-hidden className={cx("pointer-events-none absolute -top-10 -right-10 size-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125", halo)} />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-tinta-suave">{etiqueta}</p>
        {Icono && (
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[image:var(--mt-gradiente-marca)] text-white shadow-[0_6px_14px_-6px_var(--mt-lila-600)] transition-transform duration-300 group-hover:-rotate-6">
            <Icono className="size-4" />
          </span>
        )}
      </div>
      <p className={cx("relative mt-2 font-display text-xl font-bold tracking-tight sm:text-[1.65rem]", tono ? COLOR_TEXTO[tono] : "text-tinta")}>
        {animable ? <ContadorAnimado valor={numero} formato={formato} /> : (valor ?? "—")}
      </p>
      {detalle && <p className="relative mt-1 truncate text-xs text-tinta-tenue">{detalle}</p>}
      {extra && <div className="relative mt-3">{extra}</div>}
    </div>
  );
}

/** Cabecera de tarjeta: pastilla con ícono, título, descripción y acción opcional. */
export function TituloTarjeta({ icono: Icono, titulo, descripcion, accion }: { icono: LucideIcon; titulo: ReactNode; descripcion?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-marca-suave text-marca ring-1 ring-marca/15">
          <Icono className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base leading-tight font-bold">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-xs text-tinta-tenue">{descripcion}</p>}
        </div>
      </div>
      {accion}
    </div>
  );
}

const COLOR_TEXTO: Record<Semaforo, string> = {
  verde: "text-verde",
  amarillo: "text-amarillo",
  rojo: "text-rojo",
  gris: "text-tinta-tenue",
};

const ESTILO_SEMAFORO: Record<Semaforo, { clase: string; texto: string }> = {
  verde: { clase: "bg-verde-suave text-verde ring-1 ring-verde/20", texto: "Saludable" },
  amarillo: { clase: "bg-amarillo-suave text-amarillo ring-1 ring-amarillo/25", texto: "Bajo" },
  rojo: { clase: "bg-rojo-suave text-rojo ring-1 ring-rojo/20", texto: "Pérdida" },
  gris: { clase: "bg-hundido text-tinta-tenue", texto: "Sin precio" },
};

/** Margen con color semafórico: verde saludable, amarillo bajo el mínimo, rojo pérdida. */
export function BadgeMargen({ margen, estado, compacto, soloEstado }: { margen: number | null; estado: Semaforo; compacto?: boolean; soloEstado?: boolean }) {
  const e = ESTILO_SEMAFORO[estado];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums whitespace-nowrap", e.clase)}>
      <span className="relative flex size-1.5" aria-hidden>
        {estado === "rojo" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {soloEstado || margen === null ? e.texto : formatoPct(margen)}
      {!compacto && !soloEstado && margen !== null && <span className="font-normal opacity-80">· {e.texto}</span>}
    </span>
  );
}

export function Etiqueta({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "marca" | Semaforo }) {
  const clases = {
    neutro: "bg-hundido text-tinta-suave border-linea",
    marca: "bg-[linear-gradient(135deg,var(--mt-color-marca-suave),var(--mt-color-acento-suave))] text-marca border-marca/25",
    verde: "bg-verde-suave text-verde border-verde/20",
    amarillo: "bg-amarillo-suave text-amarillo border-amarillo/20",
    rojo: "bg-rojo-suave text-rojo border-rojo/20",
    gris: "bg-hundido text-tinta-tenue border-linea",
  }[tono];
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap", clases)}>{children}</span>;
}

export function Campo({ etiqueta, ayuda, children, className }: { etiqueta: string; ayuda?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-tinta-tenue">{ayuda}</span>}
    </label>
  );
}

export function Aviso({ tono = "neutro", children }: { tono?: "neutro" | Semaforo | "marca"; children: ReactNode }) {
  const clases = {
    neutro: "bg-hundido text-tinta-suave border-linea",
    marca: "bg-[linear-gradient(120deg,var(--mt-color-marca-suave),var(--mt-color-acento-suave))] text-marca-oscuro border-marca/20",
    verde: "bg-verde-suave text-verde border-verde/20",
    amarillo: "bg-amarillo-suave text-amarillo border-amarillo/25",
    rojo: "bg-rojo-suave text-rojo border-rojo/20",
    gris: "bg-hundido text-tinta-suave border-linea",
  }[tono];
  return <div className={cx("rounded-xl border px-3.5 py-2.5 text-sm shadow-[var(--mt-sombra-realce)]", clases)}>{children}</div>;
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="tarjeta flex flex-col items-center gap-2 px-6 py-12 text-center">
      <MosaicoGlifos className="mb-3 w-28 text-marca/70" columnas={3} nombres={["cuartos", "marco", "chevron", "anillo", "aspa", "arco"]} />
      <p className="font-display font-semibold text-titulo">{titulo}</p>
      {children && <div className="text-sm text-tinta-suave">{children}</div>}
    </div>
  );
}

export function Cargando() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-1/3 animate-pulse rounded bg-linea" />
      <div className="h-px w-48 bg-linea" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-linea/70" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-linea/50" />
    </div>
  );
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = "max-w-2xl" }: { abierto: boolean; titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  const fondo = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);
  useLayoutEffect(() => {
    if (!abierto || movimientoReducido()) return;
    const ctx = gsap.context(() => {
      gsap.from(fondo.current, { autoAlpha: 0, duration: 0.2 });
      gsap.from(panel.current, { y: 24, scale: 0.98, autoAlpha: 0, duration: 0.45, ease: curvas.enfasis });
    });
    return () => ctx.revert();
  }, [abierto]);
  if (!abierto) return null;
  return (
    <div ref={fondo} className="fixed inset-0 z-50 flex items-end justify-center bg-grafito-950/50 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onCerrar}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cx("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-linea bg-superficie-alta p-5 shadow-lg sm:rounded-2xl sm:p-6", ancho)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button className="btn-fantasma px-2" onClick={onCerrar} aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Pestañas tipo segmento: una píldora con volumen se desliza (GSAP) hasta la pestaña activa. */
export function Pestanas<T extends string>({ valor, opciones, onCambio }: { valor: T; opciones: { id: T; etiqueta: string }[]; onCambio: (v: T) => void }) {
  const lista = useRef<HTMLDivElement>(null);
  const indicador = useRef<HTMLSpanElement>(null);
  const primera = useRef(true);
  useLayoutEffect(() => {
    const activo = lista.current?.querySelector<HTMLElement>(`[data-id="${valor}"]`);
    if (!activo || !indicador.current) return;
    const destino = { x: activo.offsetLeft, width: activo.offsetWidth };
    if (primera.current || movimientoReducido()) gsap.set(indicador.current, destino);
    else gsap.to(indicador.current, { ...destino, duration: 0.5, ease: curvas.enfasis });
    primera.current = false;
  }, [valor, opciones.length]);
  return (
    <div className="sin-barra -mx-4 mb-6 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      <div ref={lista} role="tablist" className="relative inline-flex min-w-max gap-0.5 rounded-2xl border border-linea bg-hundido p-1">
        <span
          ref={indicador}
          aria-hidden
          className="absolute top-1 bottom-1 left-0 rounded-xl border border-linea bg-superficie shadow-[var(--mt-sombra-realce),var(--mt-sombra-sm)]"
        >
          <span className="absolute -bottom-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[image:var(--mt-gradiente-marca)]" />
        </span>
        {opciones.map((o) => (
          <button
            key={o.id}
            data-id={o.id}
            role="tab"
            aria-selected={valor === o.id}
            onClick={() => onCambio(o.id)}
            className={cx("relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors", valor === o.id ? "text-marca" : "text-tinta-suave hover:text-tinta")}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Entrada numérica que trabaja con porcentajes (muestra 40 y guarda 0.4). */
export function EntradaPct({ valor, onCambio, ...props }: { valor: number; onCambio: (v: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="relative">
      <input
        type="number"
        step="0.1"
        className="campo pr-8"
        value={Number.isFinite(valor) ? Math.round(valor * 1000) / 10 : ""}
        onChange={(e) => onCambio((parseFloat(e.target.value) || 0) / 100)}
        {...props}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-tinta-tenue">%</span>
    </div>
  );
}

export function EntradaNumero({ valor, onCambio, prefijo, ...props }: { valor: number | null | undefined; onCambio: (v: number) => void; prefijo?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="relative">
      {prefijo && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-tinta-tenue">{prefijo}</span>}
      <input
        type="number"
        inputMode="decimal"
        className={cx("campo", prefijo && "pl-7")}
        value={valor ?? ""}
        onChange={(e) => onCambio(parseFloat(e.target.value) || 0)}
        {...props}
      />
    </div>
  );
}
