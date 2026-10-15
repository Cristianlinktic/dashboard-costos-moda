"use client";

import { useRef, useState } from "react";
import { Download, Play } from "lucide-react";
import * as tokens from "@/design/tokens";
import { contraste } from "@/design/generar";
import { BadgeMargen, Aviso, Campo, Etiqueta, Kpi, Pestanas, cx } from "@/components/ui";
import { IsotipoMartha, LogoMartha } from "@/components/marca/LogoMartha";
import { LineaNodo } from "@/components/marca/LineaNodo";
import { Glifo, MosaicoGlifos, NOMBRES_GLIFOS } from "@/components/marca/Glifos";
import { TelaSatin } from "@/components/marca/TelaSatin";
import { Banner } from "@/components/marca/Banner";
import { gsap, movimientoReducido } from "@/components/movimiento/gsap";
import { formatoCOP } from "@/lib/formato";

/** Colores tomados literalmente del Manual de Marca LinkTIC v3. */
const DEL_MANUAL: Record<string, string> = {
  "lila.600": "Lila Martha (acción)",
  "ciruela.950": "Ciruela (base del satín)",
  "malva.500": "Malva (acento)",
  "premium.600": "Azul Premium",
  "azul.500": "Azul Light / Azul LinkTIC",
  "cian.400": "Cian LinkTIC",
  "grafito.900": "Negro Grafito",
  "grafito.200": "≈ Gris Tech",
  "grisAzul.600": "Gris Azul",
  "verde.500": "Verde Brillante",
  "verde.700": "Verde Oscuro",
};

const SECCIONES = [
  ["principios", "Principios"],
  ["color", "Color"],
  ["tipografia", "Tipografía"],
  ["forma", "Espacio y forma"],
  ["movimiento", "Movimiento"],
  ["componentes", "Componentes"],
  ["grafico", "Sistema gráfico"],
] as const;

export default function SistemaDiseno() {
  return (
    <div className="space-y-14">
      <Banner>
        <div className="max-w-2xl px-7 py-11 sm:px-12 sm:py-14">
          <p className="acento-serif text-lg text-malva-200">versión 2 · satín</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Sistema de diseño <span className="acento-serif font-normal text-malva-200">Martha</span>
          </h1>
          <LineaNodo tono="claro" className="mt-5 max-w-[14rem]" />
          <p className="mt-5 text-sm leading-relaxed text-white/80">
            Lilas y morados como acento sobre neutros, el banner satinado como firma y el lenguaje de líneas y nodos del Manual de Marca LinkTIC.
            Todo sale de <code className="rounded bg-white/10 px-1">src/design/tokens.ts</code>: variables CSS (claro y oscuro) y JSON en formato W3C.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="/design-tokens.json" download className="btn bg-white text-lila-800 hover:bg-malva-100">
              <Download className="size-4" /> design-tokens.json
            </a>
          </div>
        </div>
      </Banner>

      <nav className="sticky top-14 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-linea bg-fondo/85 px-4 py-2 backdrop-blur lg:top-0" aria-label="Secciones">
        {SECCIONES.map(([id, nombre]) => (
          <a key={id} href={`#${id}`} className="rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-tinta-suave hover:bg-hundido hover:text-tinta">
            {nombre}
          </a>
        ))}
      </nav>

      <Principios />
      <Color />
      <Tipografia />
      <Forma />
      <Movimiento />
      <Componentes />
      <SistemaGrafico />
    </div>
  );
}

function Titulo({ id, titulo, acento, children }: { id: string; titulo: string; acento: string; children?: React.ReactNode }) {
  return (
    <div id={id} className="mb-6 scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight">
        {titulo} <span className="acento-serif font-normal text-marca">{acento}</span>
      </h2>
      <LineaNodo className="mt-3 max-w-[12rem]" />
      {children && <p className="mt-3 max-w-3xl text-sm text-tinta-suave">{children}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Principios() {
  const items = [
    { glifo: "aspa", titulo: "Conexión", texto: "Líneas finas que terminan en nodos unen títulos con contenido, datos con decisiones. La tela de satín (Three.js) es la marca en movimiento: pliegues lila que ondulan y responden al cursor." },
    { glifo: "chevron", titulo: "Evolución", texto: "Todo aparece subiendo y en secuencia (GSAP, curva de énfasis). Los números cuentan hasta su valor: la cifra «crece» frente al usuario." },
    { glifo: "cuartos", titulo: "Transformación", texto: "Glifos geométricos que rotan en cuartos de vuelta y temas claro/oscuro que se revelan en círculo: el sistema es vivo pero sobrio." },
  ];
  return (
    <section>
      <Titulo id="principios" titulo="Principios" acento="del sistema">
        El manual define tres principios: conexión + evolución + transformación. Así se traducen a una herramienta de costos que debe leerse en segundos.
      </Titulo>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.titulo} className="tarjeta-luz p-5">
            <Glifo nombre={i.glifo} className="size-10 text-marca" />
            <h3 className="mt-4 text-lg font-bold">{i.titulo}</h3>
            <p className="mt-1 text-sm text-tinta-suave">{i.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Color() {
  const semanticosUI = Object.entries(tokens.semanticos).filter(([k]) => !k.startsWith("datos"));
  return (
    <section>
      <Titulo id="color" titulo="Color" acento="con propósito">
        Cada color del manual genera una escala 50–950. La interfaz nunca usa la escala directamente: usa tokens semánticos que cambian con el tema y pasan pruebas de contraste WCAG.
      </Titulo>

      <div className="space-y-4">
        {Object.entries(tokens.escalas).map(([escala, tonos]) => (
          <div key={escala}>
            <p className="mb-1.5 text-sm font-bold capitalize">{escala.replace(/([A-Z])/g, " $1")}</p>
            <div className="grid grid-cols-6 gap-1 sm:grid-cols-11 xl:grid-cols-14">
              {Object.entries(tonos).map(([tono, hex]) => {
                const manual = DEL_MANUAL[`${escala}.${tono}`];
                const textoClaro = contraste(hex, "#FFFFFF") > contraste(hex, tokens.escalas.grafito[900]);
                return (
                  <div
                    key={tono}
                    title={manual ? `${manual} · ${hex}` : hex}
                    className={cx("relative flex h-16 flex-col justify-end rounded-md p-1.5 text-[10px] leading-tight", manual && "ring-2 ring-offset-2 ring-offset-fondo ring-marca")}
                    style={{ background: hex, color: textoClaro ? "#fff" : tokens.escalas.grafito[900] }}
                  >
                    <span className="font-bold">{tono}</span>
                    <span className="opacity-80">{hex.slice(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-xs text-tinta-tenue">
          Con anillo: colores ancla. Lila, malva, ciruela y bruma pintan la interfaz; las escalas del manual LinkTIC (Premium, Azul, Cian, Grafito, Gris Azul) se conservan como referencia. Ámbar y rojo son para el semáforo.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Gradiente de marca", "var(--mt-gradiente-marca)", "Lila → orquídea → malva. Íconos de KPI, avatares, progreso, botón primario."],
          ["Satín", "var(--mt-gradiente-profundo)", "Malla de brillos malva y lila sobre ciruela: banners. Siempre con texto blanco."],
          ["Banda", "var(--mt-gradiente-banda)", "Encabezados de página: lila muy suave con un brillo malva en la esquina."],
          ["Planos de luz", "var(--mt-fondo-planos)", "Fondo de página: planos diagonales sutiles como en las páginas claras del manual."],
        ].map(([n, v, d]) => (
          <div key={n} className="tarjeta-luz overflow-hidden">
            <div className="h-24 border-b border-linea" style={{ background: v }} />
            <div className="p-4">
              <p className="font-bold">{n}</p>
              <p className="mt-1 text-xs text-tinta-suave">{d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="tarjeta-luz mt-8 overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th>Token</th>
              <th>Uso</th>
              <th>Claro</th>
              <th>Oscuro</th>
              <th className="num">Contraste (claro / oscuro)</th>
            </tr>
          </thead>
          <tbody>
            {semanticosUI.map(([k, v]) => {
              const sup = tokens.semanticos.superficie;
              const c1 = contraste(tokens.color(v.claro), tokens.color(sup.claro));
              const c2 = contraste(tokens.color(v.oscuro), tokens.color(sup.oscuro));
              return (
                <tr key={k}>
                  <td className="font-mono text-xs">--mt-color-{k}</td>
                  <td className="text-xs text-tinta-suave">{v.descripcion}</td>
                  <td>
                    <Muestra hex={tokens.color(v.claro)} etiqueta={v.claro} />
                  </td>
                  <td>
                    <Muestra hex={tokens.color(v.oscuro)} etiqueta={v.oscuro} />
                  </td>
                  <td className="num text-xs text-tinta-suave">{ES_FONDO.test(k) ? "—" : `${c1.toFixed(1)} / ${c2.toFixed(1)}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-tinta-tenue">Contraste contra la superficie de cada tema. Los pares texto/fondo críticos se verifican en <code>src/design/tokens.test.ts</code>.</p>
    </section>
  );
}

/** Tokens de fondo/borde: el contraste contra la superficie no aplica. */
const ES_FONDO = /^(fondo|superficie|hundido|linea|.*-suave)/;

function Muestra({ hex, etiqueta }: { hex: string; etiqueta: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
      <span className="size-5 rounded border border-linea" style={{ background: hex }} />
      <span className="font-mono text-tinta-suave">{etiqueta}</span>
    </span>
  );
}

function Tipografia() {
  const familias = [
    { css: "font-display", nombre: "Bricolage Grotesque", reemplaza: "Biko (tipografía del logotipo)", uso: "Títulos, cifras, KPIs", muestra: "Costo total por unidad" },
    { css: "font-sans", nombre: "Plus Jakarta Sans", reemplaza: "Blauer Nue Semibold (primaria)", uso: "Texto de interfaz, tablas, formularios", muestra: "Este costo aumenta tu costo unitario en $ 22.000." },
    { css: "acento-serif", nombre: "Instrument Serif itálica", reemplaza: "The Foriene serif italic (palabras clave)", uso: "Una palabra clave por título", muestra: "rentables" },
  ];
  return (
    <section>
      <Titulo id="tipografia" titulo="Tipografía" acento="legible">
        Las fuentes del manual son licenciadas; estas alternativas libres (autoalojadas con @fontsource, sin servicios externos) conservan el carácter geométrico y la itálica serif para palabras clave.
        Si tienes las licencias, cambia las familias en <code>tokens.tipografia.familias</code>.
      </Titulo>
      <div className="grid gap-4 lg:grid-cols-3">
        {familias.map((f) => (
          <div key={f.nombre} className="tarjeta-luz p-5">
            <p className={cx("text-3xl text-tinta", f.css, f.css === "font-display" && "font-bold")}>{f.muestra}</p>
            <LineaNodo className="my-4" />
            <p className="font-bold">{f.nombre}</p>
            <p className="text-xs text-tinta-suave">Sustituye a: {f.reemplaza}</p>
            <p className="mt-1 text-xs text-tinta-tenue">{f.uso}</p>
          </div>
        ))}
      </div>
      <div className="tarjeta-luz mt-4 divide-y divide-linea">
        {Object.entries(tokens.tipografia.escala)
          .reverse()
          .map(([k, [tam, alto]]) => (
            <div key={k} className="flex items-baseline gap-4 px-5 py-3">
              <span className="w-32 shrink-0 font-mono text-xs whitespace-nowrap text-tinta-tenue">
                {k} · {tam}
              </span>
              <span className="truncate font-display font-bold text-tinta" style={{ fontSize: tam, lineHeight: alto }}>
                Margen neto 43,3 %
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}

function Forma() {
  return (
    <section>
      <Titulo id="forma" titulo="Espacio" acento="y forma">
        Base de 4 px para todo el espaciado. Radios suaves que crecen con el tamaño del elemento; sombras tintadas de ciruela, un brillo interno («realce») que da volumen y un «brillo» lila para la acción principal.
      </Titulo>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="tarjeta-luz p-5">
          <p className="mb-3 font-bold">Espaciado (×4 px)</p>
          {[1, 2, 3, 4, 6, 8, 12, 16].map((n) => (
            <div key={n} className="flex items-center gap-3 py-1 text-xs">
              <span className="w-20 font-mono whitespace-nowrap text-tinta-tenue">
                {n} · {n * 4}px
              </span>
              <span className="h-2.5 rounded-sm bg-[image:var(--mt-gradiente-marca)]" style={{ width: n * 4 * 2 }} />
            </div>
          ))}
        </div>
        <div className="tarjeta-luz p-5">
          <p className="mb-3 font-bold">Radios</p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(tokens.radios).map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="mx-auto size-12 border-2 border-marca bg-marca-suave" style={{ borderRadius: v }} />
                <p className="mt-1 font-mono text-[10px] text-tinta-tenue">{k}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="tarjeta-luz p-5">
          <p className="mb-3 font-bold">Sombras</p>
          <div className="grid grid-cols-3 gap-4 p-2">
            {Object.keys(tokens.sombras.claro).map((k) => (
              <div key={k} className="text-center">
                <div className="mx-auto h-12 w-full rounded-lg bg-superficie" style={{ boxShadow: `var(--mt-sombra-${k})` }} />
                <p className="mt-2 font-mono text-[10px] text-tinta-tenue">{k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Movimiento() {
  const pista = useRef<HTMLDivElement>(null);
  const reproducir = () => {
    if (!pista.current) return;
    const bolas = pista.current.querySelectorAll<HTMLElement>("[data-bola]");
    bolas.forEach((b) => {
      const destino = (b.parentElement?.clientWidth ?? 200) - 16;
      gsap.fromTo(b, { x: 0 }, { x: destino, duration: movimientoReducido() ? 0 : 1.1, ease: b.dataset.curva });
    });
  };
  return (
    <section>
      <Titulo id="movimiento" titulo="Movimiento" acento="que explica">
        GSAP para coreografías (entradas escalonadas, contadores, indicadores, dibujo de líneas) y Three.js para la tela de satín de los banners. Todo respeta «reducir movimiento» del sistema operativo: las duraciones pasan a 0 y la tela queda quieta.
      </Titulo>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="tarjeta-luz overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Duración</th>
                <th className="num">Valor</th>
                <th>Uso</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tokens.movimiento.duracion).map(([k, v]) => (
                <tr key={k}>
                  <td className="font-mono text-xs">{k}</td>
                  <td className="num">{v}</td>
                  <td className="text-xs text-tinta-suave">
                    {{ instantanea: "Presionar", rapida: "Hover, color", base: "Tema, foco", lenta: "Indicadores", escena: "Entradas de página" }[k]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tarjeta-luz p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold">Curvas</p>
            <button className="btn-secundario px-3 py-1.5 text-xs" onClick={reproducir}>
              <Play className="size-3.5" /> Reproducir
            </button>
          </div>
          <div ref={pista} className="space-y-3">
            {Object.entries(tokens.movimiento.curva).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-semibold">{k}</span>
                  <span className="font-mono text-tinta-tenue">
                    {v} · gsap: {tokens.movimiento.gsap[k as keyof typeof tokens.movimiento.gsap]}
                  </span>
                </div>
                <div className="relative h-4 rounded-full bg-hundido">
                  <span data-bola data-curva={tokens.movimiento.gsap[k as keyof typeof tokens.movimiento.gsap]} className="absolute top-0 left-0 size-4 rounded-full bg-[image:var(--mt-gradiente-marca)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Componentes() {
  const [pestana, setPestana] = useState<"a" | "b" | "c">("a");
  const [contador, setContador] = useState(51_700);
  return (
    <section>
      <Titulo id="componentes" titulo="Componentes" acento="base">
        Construidos solo con tokens: cambian de tema sin estilos adicionales.
      </Titulo>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="tarjeta-luz space-y-4 p-5">
          <p className="font-bold">Botones</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primario">Guardar producto</button>
            <button className="btn-secundario">Exportar</button>
            <button className="btn-fantasma">Cancelar</button>
            <button className="btn-peligro">Eliminar</button>
            <button className="btn-primario" disabled>
              Deshabilitado
            </button>
          </div>
          <p className="font-bold">Campos</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Nombre del costo" ayuda="Ayuda contextual en tinta tenue.">
              <input className="campo" placeholder="Tela powernet" />
            </Campo>
            <Campo etiqueta="Moneda">
              <select className="campo">
                <option>COP</option>
                <option>USD</option>
              </select>
            </Campo>
          </div>
        </div>
        <div className="tarjeta-luz space-y-4 p-5">
          <p className="font-bold">Semáforo y etiquetas</p>
          <div className="flex flex-wrap gap-2">
            <BadgeMargen margen={0.433} estado="verde" />
            <BadgeMargen margen={0.18} estado="amarillo" />
            <BadgeMargen margen={-0.23} estado="rojo" />
            <BadgeMargen margen={null} estado="gris" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Etiqueta>Neutra</Etiqueta>
            <Etiqueta tono="marca">v2</Etiqueta>
            <Etiqueta tono="verde">Pagado</Etiqueta>
            <Etiqueta tono="amarillo">Pendiente</Etiqueta>
            <Etiqueta tono="rojo">Desactivado</Etiqueta>
          </div>
          <Aviso tono="marca">Este costo aumenta tu costo unitario en $ 22.000.</Aviso>
          <Aviso tono="amarillo">Margen por debajo del mínimo (25 %).</Aviso>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Kpi etiqueta="Costo total / unidad" numero={contador} formato={formatoCOP} detalle="Pasa el cursor: línea de marca" />
            <Kpi etiqueta="Margen neto" numero={0.433} formato={(n) => `${(n * 100).toFixed(1).replace(".", ",")} %`} tono="verde" />
          </div>
          <button className="btn-secundario" onClick={() => setContador((c) => Math.round(c * (0.8 + Math.random() * 0.5)))}>
            <Play className="size-4" /> Animar contador
          </button>
        </div>
        <div className="tarjeta-luz p-5">
          <p className="mb-2 font-bold">Pestañas</p>
          <Pestanas
            valor={pestana}
            onCambio={setPestana}
            opciones={[
              { id: "a", etiqueta: "Resumen" },
              { id: "b", etiqueta: "Costos" },
              { id: "c", etiqueta: "Simulador" },
            ]}
          />
          <p className="text-sm text-tinta-suave">El indicador se desliza y termina en un nodo, como las líneas del manual.</p>
        </div>
      </div>
    </section>
  );
}

function SistemaGrafico() {
  const [clave, setClave] = useState(0);
  return (
    <section>
      <Titulo id="grafico" titulo="Sistema" acento="gráfico">
        Igual que LinkTIC construye su lenguaje desde la «K», Martha construye su isotipo desde una «M»: dos astas y dos diagonales que se encuentran en un nodo, el punto de equilibrio.
      </Titulo>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="tarjeta-luz flex flex-col items-center justify-center gap-6 p-8">
          <IsotipoMartha key={clave} tamano={96} animado />
          <LogoMartha />
          <button className="btn-fantasma text-xs" onClick={() => setClave((k) => k + 1)}>
            <Play className="size-3.5" /> Repetir trazo
          </button>
        </div>
        <Banner tela={false}>
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-6 p-8">
            <LogoMartha claro tamano={44} />
            <p className="text-center text-xs text-white/75">Sobre satín: textos en blanco, detalles en malva.</p>
          </div>
        </Banner>
        <div className="tarjeta-luz p-6">
          <p className="mb-4 font-bold">Glifos</p>
          <div className="grid grid-cols-4 gap-3 text-tinta">
            {NOMBRES_GLIFOS.map((n) => (
              <Glifo key={n} nombre={n} className="aspect-square w-full" />
            ))}
            {NOMBRES_GLIFOS.map((n) => (
              <Glifo key={`${n}-c`} nombre={n} contorno className="aspect-square w-full text-marca" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="relative h-72 overflow-hidden rounded-2xl bg-ciruela-950">
          <TelaSatin />
          <p className="absolute bottom-3 left-4 text-xs text-white/60">Tela de satín · Three.js (shader) · mueve el cursor encima</p>
        </div>
        <div className="tarjeta-luz flex items-center justify-center p-6">
          <MosaicoGlifos className="w-full max-w-[14rem] text-marca" columnas={4} />
        </div>
      </div>
    </section>
  );
}
