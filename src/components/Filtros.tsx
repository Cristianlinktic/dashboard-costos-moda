"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarRange, Check, ChevronDown, Search, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import { curvas, gsap, movimientoReducido } from "./movimiento/gsap";
import { cx } from "./ui";

// ---------------------------------------------------------------------------
// Barra contenedora
// ---------------------------------------------------------------------------

/**
 * Barra de filtros de vidrio: queda fija arriba al hacer scroll (con sombra cuando «flota»),
 * contador que rebota al cambiar y «Limpiar» cuando hay filtros activos.
 */
export function BarraFiltros({ children, activos = 0, onLimpiar, className }: { children: ReactNode; activos?: number; onLimpiar?: () => void; className?: string }) {
  const contador = useRef<HTMLSpanElement>(null);
  const centinela = useRef<HTMLDivElement>(null);
  const [flotando, setFlotando] = useState(false);

  useEffect(() => {
    if (!centinela.current) return;
    const io = new IntersectionObserver(([e]) => setFlotando(!e.isIntersecting), { rootMargin: "-12px 0px 0px 0px" });
    io.observe(centinela.current);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!contador.current || movimientoReducido()) return;
    gsap.fromTo(contador.current, { scale: 0.4 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  }, [activos]);

  return (
    <>
      <div ref={centinela} aria-hidden className="h-0" />
      <div
        role="group"
        aria-label="Filtros"
        className={cx(
          "sticky top-16 z-30 mb-6 flex flex-wrap items-center gap-2 rounded-2xl border p-2 pl-3 backdrop-blur-xl transition-[box-shadow,background-color,border-color] duration-300 lg:top-3",
          flotando
            ? "border-marca/20 bg-superficie/85 shadow-[var(--mt-sombra-realce),var(--mt-sombra-lg)]"
            : "border-linea bg-superficie/60 shadow-[var(--mt-sombra-realce),var(--mt-sombra-xs)]",
          className,
        )}
      >
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-tinta-tenue uppercase">
          <span className="grid size-6 place-items-center rounded-lg bg-[image:var(--mt-gradiente-marca)] text-white">
            <SlidersHorizontal className="size-3.5" />
          </span>
          Filtros
          {activos > 0 && (
            <span ref={contador} className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-marca px-1 text-[10px] text-marca-contraste">
              {activos}
            </span>
          )}
        </span>
        {children}
        {onLimpiar && activos > 0 && (
          <button onClick={onLimpiar} className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-tinta-suave transition-colors hover:bg-rojo-suave hover:text-rojo">
            <X className="size-3.5" /> Limpiar
          </button>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Popover compartido
// ---------------------------------------------------------------------------

function usePopover() {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    // El panel vive en un portal (fuera de raiz): un clic dentro de él no cuenta como «fuera».
    const fuera = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node) && setAbierto(false);
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        raiz.current?.querySelector<HTMLButtonElement>("[data-disparador]")?.focus();
      }
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  useLayoutEffect(() => {
    if (!abierto || !panel.current) return;
    if (!movimientoReducido())
      gsap.fromTo(panel.current, { autoAlpha: 0, y: -6, scale: 0.97, transformOrigin: "0 0" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: curvas.enfasis });
  }, [abierto]);

  return { abierto, setAbierto, raiz, panel };
}

/**
 * Capa flotante: el panel se monta en <body> con posición fija bajo el chip, así ningún
 * contenedor con overflow (p. ej. el banner satinado) lo recorta. Se reubica al hacer
 * scroll o cambiar el tamaño, y se ajusta si no cabe a la derecha o abajo.
 */
function Flotante({
  ancla,
  refPanel,
  className,
  children,
  ...resto
}: { ancla: React.RefObject<HTMLDivElement | null>; refPanel: React.RefObject<HTMLDivElement | null>; className?: string; children: ReactNode } & Omit<React.HTMLAttributes<HTMLDivElement>, "className">) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    const ubicar = () => {
      const a = ancla.current?.getBoundingClientRect();
      const p = refPanel.current;
      if (!a) return;
      const ancho = p?.offsetWidth ?? 288;
      const alto = p?.offsetHeight ?? 0;
      let left = Math.min(a.left, window.innerWidth - ancho - 8);
      left = Math.max(8, left);
      let top = a.bottom + 8;
      if (alto && top + alto > window.innerHeight - 8 && a.top - alto - 8 > 8) top = a.top - alto - 8;
      setPos({ top, left });
    };
    ubicar();
    const raf = requestAnimationFrame(ubicar);
    window.addEventListener("scroll", ubicar, true);
    window.addEventListener("resize", ubicar);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", ubicar, true);
      window.removeEventListener("resize", ubicar);
    };
  }, [ancla, refPanel]);
  return createPortal(
    <div ref={refPanel} className={className} style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999 }} {...resto}>
      {children}
    </div>,
    document.body,
  );
}

const PANEL = "z-[70] w-max min-w-[18rem] max-w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-linea bg-superficie-alta p-1.5 shadow-lg";

function Disparador({
  icono: Icono,
  etiqueta,
  valor,
  abierto,
  onAbrir,
  onQuitar,
  id,
}: {
  icono: LucideIcon;
  etiqueta: string;
  valor?: string;
  abierto: boolean;
  onAbrir: () => void;
  onQuitar: () => void;
  id: string;
}) {
  const activo = Boolean(valor);
  return (
    <span
      className={cx(
        "inline-flex cursor-pointer items-center rounded-full border text-sm transition-[background,border-color,box-shadow,color,transform] duration-200 hover:-translate-y-px",
        activo
          ? "border-marca/35 bg-[linear-gradient(135deg,var(--mt-color-marca-suave),var(--mt-color-acento-suave))] text-marca shadow-[var(--mt-sombra-realce)]"
          : "border-linea-fuerte/80 bg-superficie text-tinta-suave hover:border-marca/40 hover:text-tinta",
        abierto && "ring-4 ring-marca/15",
      )}
    >
      <button
        data-disparador
        type="button"
        onClick={onAbrir}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={id}
        className="inline-flex max-w-[16rem] items-center gap-1.5 py-1.5 pr-2 pl-3 font-semibold"
      >
        <Icono className={cx("size-3.5 shrink-0", activo ? "text-marca" : "text-tinta-tenue")} />
        <span className={activo ? "font-medium opacity-75" : ""}>{etiqueta}</span>
        {activo && <span className="truncate">{valor}</span>}
        {!activo && <ChevronDown className={cx("size-3.5 transition-transform", abierto && "rotate-180")} />}
      </button>
      {activo && (
        <button type="button" onClick={onQuitar} aria-label={`Quitar filtro ${etiqueta}`} className="mr-1 grid size-6 place-items-center rounded-full hover:bg-marca/15">
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Chip de selección
// ---------------------------------------------------------------------------

export interface OpcionFiltro {
  valor: string;
  etiqueta: string;
  detalle?: string;
}

export function ChipSelect({
  etiqueta,
  icono,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta: string;
  icono: LucideIcon;
  valor?: string;
  opciones: OpcionFiltro[];
  onCambio: (v: string | undefined) => void;
}) {
  const { abierto, setAbierto, raiz, panel } = usePopover();
  const [busqueda, setBusqueda] = useState("");
  const id = useId();
  const buscable = opciones.length > 6;
  const visibles = opciones.filter((o) => !busqueda || o.etiqueta.toLowerCase().includes(busqueda.toLowerCase()));
  const actual = opciones.find((o) => o.valor === valor);

  const elegir = (v: string | undefined) => {
    onCambio(v);
    setAbierto(false);
    setBusqueda("");
  };

  const moverFoco = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return (
    <div ref={raiz} className="relative">
      <Disparador id={id} icono={icono} etiqueta={etiqueta} valor={actual?.etiqueta} abierto={abierto} onAbrir={() => setAbierto(!abierto)} onQuitar={() => elegir(undefined)} />
      {abierto && (
        <Flotante ancla={raiz} refPanel={panel} className={PANEL} onKeyDown={moverFoco}>
          {buscable && (
            <div className="relative mb-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-tinta-tenue" />
              <input autoFocus className="campo py-1.5 pl-8 text-sm" placeholder={`Buscar ${etiqueta.toLowerCase()}…`} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
          )}
          <div id={id} role="listbox" aria-label={etiqueta} className="max-h-72 overflow-y-auto">
            {visibles.map((o, i) => {
              const sel = o.valor === valor;
              return (
                <button
                  key={o.valor}
                  role="option"
                  aria-selected={sel}
                  autoFocus={!buscable && (sel || (!valor && i === 0))}
                  onClick={() => elegir(sel ? undefined : o.valor)}
                  className={cx(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm outline-none",
                    sel ? "bg-marca-suave font-semibold text-marca" : "text-tinta hover:bg-hundido focus-visible:bg-hundido",
                  )}
                >
                  <span className={cx("grid size-4.5 shrink-0 place-items-center rounded-md border", sel ? "border-marca bg-marca text-marca-contraste" : "border-linea-fuerte")}>
                    {sel && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{o.etiqueta}</span>
                  {o.detalle && <span className="shrink-0 text-xs text-tinta-tenue">{o.detalle}</span>}
                </button>
              );
            })}
            {!visibles.length && <p className="px-3 py-4 text-center text-sm text-tinta-tenue">Sin resultados para «{busqueda}».</p>}
          </div>
        </Flotante>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chip de periodo con atajos
// ---------------------------------------------------------------------------

const iso = (d: Date) => d.toISOString().slice(0, 10);
const mesCorto = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "2-digit" });

function atajos() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  return [
    { etiqueta: "Este mes", desde: iso(new Date(y, m, 1)), hasta: iso(hoy) },
    { etiqueta: "Últimos 3 meses", desde: iso(new Date(y, m - 2, 1)), hasta: iso(hoy) },
    { etiqueta: "Últimos 6 meses", desde: iso(new Date(y, m - 5, 1)), hasta: iso(hoy) },
    { etiqueta: "Este año", desde: `${y}-01-01`, hasta: iso(hoy) },
    { etiqueta: "Año pasado", desde: `${y - 1}-01-01`, hasta: `${y - 1}-12-31` },
  ];
}

export function ChipPeriodo({ desde, hasta, onCambio }: { desde?: string; hasta?: string; onCambio: (desde?: string, hasta?: string) => void }) {
  const { abierto, setAbierto, raiz, panel } = usePopover();
  const id = useId();
  const valor = desde || hasta ? `${desde ? mesCorto(desde) : "inicio"} – ${hasta ? mesCorto(hasta) : "hoy"}` : undefined;
  return (
    <div ref={raiz} className="relative">
      <Disparador id={id} icono={CalendarRange} etiqueta="Periodo" valor={valor} abierto={abierto} onAbrir={() => setAbierto(!abierto)} onQuitar={() => onCambio(undefined, undefined)} />
      {abierto && (
        <Flotante ancla={raiz} refPanel={panel} id={id} className={cx(PANEL, "w-80 p-3")}>
          <p className="mb-2 text-xs font-bold tracking-wide text-tinta-tenue uppercase">Atajos</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {atajos().map((a) => {
              const activo = a.desde === desde && a.hasta === hasta;
              return (
                <button
                  key={a.etiqueta}
                  onClick={() => {
                    onCambio(a.desde, a.hasta);
                    setAbierto(false);
                  }}
                  className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", activo ? "border-marca bg-marca text-marca-contraste" : "border-linea text-tinta-suave hover:border-marca/50 hover:text-marca")}
                >
                  {a.etiqueta}
                </button>
              );
            })}
          </div>
          <p className="mb-2 text-xs font-bold tracking-wide text-tinta-tenue uppercase">Rango personalizado</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-tinta-suave">
              Desde
              <input type="date" className="campo mt-1 py-1.5" value={desde ?? ""} max={hasta} onChange={(e) => onCambio(e.target.value || undefined, hasta)} />
            </label>
            <label className="text-xs text-tinta-suave">
              Hasta
              <input type="date" className="campo mt-1 py-1.5" value={hasta ?? ""} min={desde} onChange={(e) => onCambio(desde, e.target.value || undefined)} />
            </label>
          </div>
        </Flotante>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Búsqueda que se expande
// ---------------------------------------------------------------------------

export function ChipBusqueda({ valor, onCambio, placeholder = "Buscar…" }: { valor: string; onCambio: (v: string) => void; placeholder?: string }) {
  return (
    <label
      className={cx(
        "group relative inline-flex items-center rounded-full border transition-[width,border-color,box-shadow] duration-300 ease-enfasis focus-within:ring-4 focus-within:ring-marca/15",
        valor ? "w-64 border-marca/35 bg-marca-suave" : "w-44 border-linea-fuerte bg-superficie focus-within:w-64 focus-within:border-marca/50",
      )}
    >
      <Search className={cx("pointer-events-none absolute left-3 size-3.5", valor ? "text-marca" : "text-tinta-tenue")} />
      <input
        className="w-full rounded-full bg-transparent py-1.5 pr-8 pl-8 text-sm font-medium text-tinta outline-none placeholder:text-tinta-tenue"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        aria-label={placeholder}
      />
      {valor && (
        <button type="button" onClick={() => onCambio("")} aria-label="Borrar búsqueda" className="absolute right-1.5 grid size-6 place-items-center rounded-full text-marca hover:bg-marca/15">
          <X className="size-3.5" />
        </button>
      )}
    </label>
  );
}
