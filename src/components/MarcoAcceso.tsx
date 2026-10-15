"use client";

import { useRef, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { IsotipoMartha, LogoMartha } from "./marca/LogoMartha";
import { LineaNodo } from "./marca/LineaNodo";
import { Banner } from "./marca/Banner";
import { curvas, gsap, movimientoReducido, useGSAP } from "./movimiento/gsap";
import { SelectorTema } from "./SelectorTema";

/**
 * Layout de acceso a pantalla completa: la tela de satín cubre todo; el mensaje va a la
 * izquierda y el formulario en una tarjeta flotante a la derecha (debajo en móvil).
 */
export function MarcoAcceso({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (movimientoReducido()) return;
      gsap
        .timeline({ defaults: { ease: curvas.enfasis } })
        .from("[data-titular] > *", { y: 28, autoAlpha: 0, stagger: 0.09, duration: 0.9 })
        .from("[data-formulario]", { y: 28, scale: 0.97, autoAlpha: 0, duration: 0.9 }, "-=0.65");
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="min-h-dvh">
      <Banner className="min-h-dvh rounded-none shadow-none">
        <div className="grid min-h-dvh gap-10 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-16 lg:py-12">
          {/* Mensaje */}
          <div className="flex flex-col justify-between gap-10">
            <div className="flex items-center justify-between gap-4">
              <LogoMartha claro animado tamano={34} />
              <SelectorTema className="lg:hidden" />
            </div>
            <div data-titular className="max-w-xl">
              <p className="acento-serif text-xl text-malva-200">para emprendedores de moda</p>
              <h2 className="mt-2 font-display text-4xl leading-[1.04] font-bold tracking-tight text-white sm:text-6xl">
                Costos claros, <span className="acento-serif font-normal text-malva-200">decisiones</span> rentables.
              </h2>
              <LineaNodo tono="claro" className="mt-7 max-w-[14rem]" />
              <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
                Cuánto cuesta realmente cada unidad, cuánto has invertido y a qué precio vender. Sin ser contador.
              </p>
            </div>
            <p className="hidden text-xs text-white/60 lg:block">Hecho para marcas de moda en Colombia</p>
          </div>

          {/* Formulario */}
          <div className="flex flex-col items-center gap-4 lg:items-end">
            <SelectorTema className="hidden self-end lg:inline-flex" />
            <div data-formulario className="superficie-normal tarjeta-acceso my-auto w-full max-w-[26rem]">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-marca-suave ring-1 ring-marca/15">
                  <IsotipoMartha tamano={28} />
                </span>
                <div>
                  <h1 className="text-2xl leading-tight font-bold tracking-tight text-titulo">{titulo}</h1>
                  <LineaNodo className="mt-2 w-28" tono="marca" />
                </div>
              </div>
              {descripcion && <p className="mt-4 text-sm leading-relaxed text-tinta-suave">{descripcion}</p>}
              <div className="mt-6">{children}</div>
              <p className="mt-7 flex items-center justify-center gap-1.5 border-t border-linea pt-5 text-xs text-tinta-tenue">
                <ShieldCheck className="size-3.5 text-verde" />
                Acceso privado: las cuentas las crea tu administrador.
              </p>
            </div>
          </div>
        </div>
      </Banner>
    </div>
  );
}
