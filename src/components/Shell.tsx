"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Boxes, Calculator, Factory, LayoutDashboard, LogOut, Menu, Package, Settings, ShieldAlert, Users, X } from "lucide-react";
import { RUTAS_PUBLICAS, useMartha } from "@/lib/datos/MarthaProvider";
import { ROLES } from "@/lib/usuarios/tipos";
import { LogoMartha } from "./marca/LogoMartha";
import { Revelar } from "./movimiento/Revelar";
import { curvas, gsap, movimientoReducido } from "./movimiento/gsap";
import { SelectorTema } from "./SelectorTema";
import { Aviso, cx } from "./ui";

const NAVEGACION = [
  { href: "/", etiqueta: "Dashboard", icono: LayoutDashboard, grupo: "Análisis" },
  { href: "/simulador", etiqueta: "Simulador", icono: Calculator, grupo: "Análisis" },
  { href: "/productos", etiqueta: "Productos", icono: Package, grupo: "Operación" },
  { href: "/lotes", etiqueta: "Lotes", icono: Boxes, grupo: "Operación" },
  { href: "/proveedores", etiqueta: "Proveedores", icono: Factory, grupo: "Operación" },
  { href: "/usuarios", etiqueta: "Usuarios", icono: Users, grupo: "Organización", soloAdmin: true },
  { href: "/configuracion", etiqueta: "Configuración", icono: Settings, grupo: "Organización" },
];

/** Fondo de la app: aurora lila/malva/durazno que deriva y malla tipo powernet. */
function FondoAurora() {
  return (
    <div className="aurora" aria-hidden>
      <span className="aurora__mancha aurora__mancha--1" />
      <span className="aurora__mancha aurora__mancha--2" />
      <span className="aurora__mancha aurora__mancha--3" />
      <span className="aurora__malla" />
    </div>
  );
}

/** Un solo listener: el reflejo de las tarjetas (.tarjeta-luz / .tarjeta-viva) sigue al cursor. */
function useReflejoCursor() {
  useEffect(() => {
    let pendiente = 0;
    const mover = (e: PointerEvent) => {
      if (pendiente) return;
      pendiente = requestAnimationFrame(() => {
        pendiente = 0;
        const el = (e.target as Element | null)?.closest?.<HTMLElement>(".tarjeta-luz, .tarjeta-viva");
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(pendiente);
    };
  }, []);
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { modo, usuario, esAdmin, error, cargando, cerrarSesion } = useMartha();
  const [menuAbierto, setMenuAbierto] = useState(false);
  useReflejoCursor();

  useEffect(() => setMenuAbierto(false), [pathname]);

  if (RUTAS_PUBLICAS.some((r) => pathname.startsWith(r)))
    return (
      <>
        <FondoAurora />
        {children}
      </>
    );

  const items = NAVEGACION.filter((n) => !n.soloAdmin || esAdmin);
  const pie = (
    <div className="space-y-3 border-t border-linea pt-4">
      {modo === "demo" && (
        <div className="flex gap-2 rounded-lg bg-amarillo-suave px-3 py-2 text-xs text-amarillo">
          <ShieldAlert className="size-4 shrink-0" />
          <span>
            <strong>Modo demo.</strong> Datos de ejemplo en este navegador.
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <SelectorTema />
        {modo === "supabase" && (
          <button className="btn-fantasma px-2" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut className="size-4" />
          </button>
        )}
      </div>
      {usuario && (
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[image:var(--mt-gradiente-marca)] text-xs font-bold text-white">
            {usuario.nombre.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{usuario.nombre}</p>
            <p className="truncate text-xs text-tinta-tenue">{ROLES[usuario.rol]}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh lg:flex">
      <FondoAurora />
      {/* Barra lateral flotante de vidrio */}
      <aside className="sticky top-0 hidden h-dvh w-[calc(var(--mt-layout-barra-lateral)+1rem)] shrink-0 p-3 lg:block">
        <div className="relative flex h-full flex-col gap-6 overflow-clip rounded-3xl border border-white/60 bg-superficie/70 p-4 shadow-[var(--mt-sombra-realce),var(--mt-sombra-md)] backdrop-blur-xl dark:border-white/[0.06]">
          <Link href="/" className="relative px-1 pt-1">
            <LogoMartha animado />
          </Link>
          <Navegacion items={items} pathname={pathname} />
          <div className="relative">{pie}</div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-linea bg-superficie/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/">
          <LogoMartha tamano={26} />
        </Link>
        <button className="btn-fantasma px-2" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <Menu className="size-5" />
        </button>
      </header>
      {menuAbierto && <MenuMovil onCerrar={() => setMenuAbierto(false)} items={items} pathname={pathname} pie={pie} />}

      <main className="mx-auto w-full max-w-[var(--mt-layout-contenido-max)] min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-6">
        {error && (
          <div className="mb-4">
            <Aviso tono="rojo">No se pudieron cargar los datos: {error}</Aviso>
          </div>
        )}
        <Revelar clave={`${pathname}:${cargando}`}>{children}</Revelar>
      </main>
    </div>
  );
}

/** Navegación agrupada con una píldora satinada que se desliza hasta la ruta activa. */
function Navegacion({ items, pathname }: { items: typeof NAVEGACION; pathname: string }) {
  const lista = useRef<HTMLElement>(null);
  const indicador = useRef<HTMLSpanElement>(null);
  const primera = useRef(true);
  const activo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const grupos = [...new Set(items.map((i) => i.grupo))];

  useLayoutEffect(() => {
    const el = lista.current?.querySelector<HTMLElement>("[aria-current='page']");
    const ind = indicador.current;
    if (!ind) return;
    if (!el) return void gsap.set(ind, { autoAlpha: 0 });
    const destino = { y: el.offsetTop, height: el.offsetHeight, autoAlpha: 1 };
    if (primera.current || movimientoReducido()) gsap.set(ind, destino);
    else gsap.to(ind, { ...destino, duration: 0.55, ease: curvas.enfasis });
    primera.current = false;
  }, [pathname, items.length]);

  return (
    <nav ref={lista} className="relative -mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1" aria-label="Principal">
      <span
        ref={indicador}
        className="absolute inset-x-0 top-0 rounded-xl bg-[linear-gradient(120deg,var(--mt-lila-700),var(--mt-lila-500)_60%,var(--mt-malva-500))] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),var(--mt-sombra-brillo)]"
        aria-hidden
      />
      {grupos.map((g) => (
        <div key={g} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-[10px] font-bold tracking-[0.14em] text-tinta-tenue uppercase">{g}</p>
          {items
            .filter((i) => i.grupo === g)
            .map(({ href, etiqueta, icono: Icono }) => (
              <Link
                key={href}
                href={href}
                aria-current={activo(href) ? "page" : undefined}
                className={cx(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
                  activo(href) ? "text-white" : "text-tinta-suave hover:bg-marca-suave/70 hover:text-marca",
                )}
              >
                <Icono className="size-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
                {etiqueta}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
}

function MenuMovil({ onCerrar, items, pathname, pie }: { onCerrar: () => void; items: typeof NAVEGACION; pathname: string; pie: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (movimientoReducido()) return;
    const ctx = gsap.context(() => {
      gsap.from(panel.current, { x: -40, autoAlpha: 0, duration: 0.45, ease: curvas.enfasis });
      gsap.from("[data-item]", { x: -12, autoAlpha: 0, stagger: 0.04, duration: 0.4, delay: 0.1, ease: curvas.enfasis });
    }, panel);
    return () => ctx.revert();
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-grafito-950/50 lg:hidden" onClick={onCerrar}>
      <div ref={panel} className="flex h-full w-72 max-w-[85vw] flex-col gap-6 bg-superficie p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <LogoMartha tamano={26} />
          <button className="btn-fantasma px-2" onClick={onCerrar} aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5" aria-label="Principal">
          {items.map(({ href, etiqueta, icono: Icono }) => {
            const activo = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                data-item
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cx("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold", activo ? "bg-marca-suave text-marca" : "text-tinta-suave")}
              >
                <Icono className="size-4" />
                {etiqueta}
              </Link>
            );
          })}
        </nav>
        {pie}
      </div>
    </div>
  );
}

/** Bloquea una página a quien no sea admin (la RLS y las rutas de servidor lo refuerzan). */
export function SoloAdmin({ children }: { children: ReactNode }) {
  const { esAdmin, cargando } = useMartha();
  if (cargando) return null;
  if (!esAdmin)
    return (
      <div className="tarjeta-luz px-6 py-12 text-center">
        <ShieldAlert className="mx-auto mb-3 size-6 text-tinta-tenue" />
        <p className="font-display font-semibold">Sección solo para administradores</p>
        <p className="mt-1 text-sm text-tinta-suave">Pide a un administrador de tu organización que te dé acceso.</p>
      </div>
    );
  return <>{children}</>;
}
