// =============================================================================
// Martha · Tokens de diseño (fuente única de verdad)
//
// Derivados del Manual de Marca LinkTIC v3 (agosto 2026):
//   Azul Premium #2709CD · Azul Light #0094FF · Cian #00D9FF · Negro Grafito #1E232F
//   Gris Azul #516276 · Gris Tech #E1E1E1 · Verdes del isologo #1DCE00 / #008800
// A partir de cada color de marca se construye una escala 50–950; los tokens
// semánticos (tema claro y oscuro) solo referencian esas escalas.
//
// Dirección v2 «Satín»: la interfaz y los banners usan lilas y morados (lila, malva)
// sobre neutros con tinte violeta (bruma). Las escalas del manual se conservan como
// referencia (y se verifican en los tests), pero ya no pintan la interfaz.
//
// Este archivo no importa nada y usa solo sintaxis TypeScript "borrable" para que
// `npm run tokens` (Node, sin compilar) pueda leerlo y generar:
//   src/design/tokens.css   → variables CSS consumidas por Tailwind
//   public/design-tokens.json → formato W3C Design Tokens (Figma / Style Dictionary)
// =============================================================================

export const escalas = {
  /** Azul Premium LinkTIC (#2709CD = 600): color de acción y de marca. */
  premium: {
    50: "#F2F0FF", 100: "#E4DFFE", 200: "#CAC1FC", 300: "#A597F8", 400: "#7B64F2",
    500: "#5034E6", 600: "#2709CD", 700: "#2008AA", 800: "#1A0888", 900: "#15096B", 950: "#0B0440",
  },
  /** Azul Light LinkTIC (#0094FF = 500): acento informativo y gradientes. */
  azul: {
    50: "#EEF8FF", 100: "#D8EEFF", 200: "#B3DFFF", 300: "#7DCAFF", 400: "#3DB0FF",
    500: "#0094FF", 600: "#0077D6", 700: "#005EAB", 800: "#004F8C", 900: "#064273", 950: "#042A4C",
  },
  /** Cian LinkTIC (#00D9FF = 400): brillo, nodos y detalles sobre fondos oscuros. */
  cian: {
    50: "#ECFDFF", 100: "#CFF8FF", 200: "#A5F2FF", 300: "#67E8FF", 400: "#00D9FF",
    500: "#00BDE3", 600: "#0096BF", 700: "#04779A", 800: "#0C607D", 900: "#0F506A", 950: "#033449",
  },
  /** Neutros fríos entre Gris Tech (#E1E1E1 ≈ 200) y Negro Grafito (#1E232F = 900). */
  grafito: {
    0: "#FFFFFF", 25: "#FBFBFD", 50: "#F5F6F8", 100: "#ECEEF2", 200: "#E1E3E8", 300: "#C9CDD5",
    400: "#9AA1AE", 500: "#6E7684", 600: "#535B69", 700: "#3C4350", 800: "#2A303C", 850: "#232937",
    900: "#1E232F", 950: "#14171F",
  },
  /** Gris Azul LinkTIC (#516276 = 600): títulos y texto secundario. */
  grisAzul: {
    50: "#F3F6F9", 100: "#E4EAF0", 200: "#C9D3DE", 300: "#A3B2C3", 400: "#7B8DA2",
    500: "#617488", 600: "#516276", 700: "#435163", 800: "#394452", 900: "#323B46", 950: "#20262E",
  },
  /** Verdes del isologo (#1DCE00 = 500, #008800 = 700): semáforo saludable. */
  verde: {
    50: "#F0FDEB", 100: "#DCFAD1", 200: "#B9F4A6", 300: "#85EA6C", 400: "#4FDC33",
    500: "#1DCE00", 600: "#14A800", 700: "#008800", 800: "#0B6A0A", 900: "#0E570E", 950: "#023104",
  },
  /** Ámbar (complementario, no está en el manual): semáforo «margen bajo». */
  ambar: {
    50: "#FFFAEB", 100: "#FEF0C7", 200: "#FEDF89", 300: "#FEC84B", 400: "#FDB022",
    500: "#F79009", 600: "#DC6803", 700: "#B54708", 800: "#93370D", 900: "#7A2E0E", 950: "#4E1D09",
  },
  /** Rojo (complementario): semáforo «pérdida» y acciones destructivas. */
  rojo: {
    50: "#FFF1F2", 100: "#FFE0E2", 200: "#FFC6CB", 300: "#FF9DA5", 400: "#FF6470",
    500: "#F83545", 600: "#E5172A", 700: "#C10F21", 800: "#A01120", 900: "#841522", 950: "#48050C",
  },
  /** Lila: color de acción y de marca de Martha (#7A43E3 = 600). */
  lila: {
    50: "#F7F3FF", 100: "#EFE7FF", 200: "#E0D2FF", 300: "#C9B1FD", 400: "#AE88F9",
    500: "#9161F2", 600: "#7A43E3", 700: "#6631C4", 800: "#53299F", 900: "#44247F", 950: "#2A1258",
  },
  /** Malva / orquídea: brillos del satín, acento y segunda serie de datos. */
  malva: {
    50: "#FDF4FF", 100: "#FAE8FF", 200: "#F5D0FE", 300: "#F0ABFC", 400: "#E879F9",
    500: "#D946EF", 600: "#C026D3", 700: "#A21CAF", 800: "#86198F", 900: "#701A75", 950: "#4A044E",
  },
  /** Ciruela: el morado más profundo, base de los banners. */
  ciruela: { 700: "#3B1773", 800: "#2E0F5E", 900: "#220A47", 950: "#160530" },
  /** Durazno: calidez puntual en la aurora del fondo (nunca en texto). */
  durazno: { 100: "#FFEDE6", 200: "#FFD9CC", 300: "#FFBFA8" },
  /** Bruma: neutros con tinte violeta para superficies, bordes y texto. */
  bruma: {
    0: "#FFFFFF", 25: "#FCFBFE", 50: "#F7F5FB", 100: "#EFECF6", 200: "#E3DEEE", 300: "#CBC4DB",
    400: "#9F96B3", 500: "#776E8C", 600: "#5B536F", 700: "#433C55", 800: "#2E2840", 850: "#241F35",
    900: "#1B1729", 950: "#120F1D",
  },
  /** Noche: neutros casi puros (leve tinte frío) para el tema oscuro; el lila queda como acento. */
  noche: { 600: "#55555F", 700: "#3D3D47", 800: "#2E2E37", 820: "#28282F", 850: "#202027", 900: "#18181D", 950: "#121216" },
} as const;

export type NombreEscala = keyof typeof escalas;
/** Referencia a un color primitivo: "premium.600". */
type Ref = string;

/** Tokens semánticos: qué significa cada color en la interfaz, por tema. */
export const semanticos: Record<string, { claro: Ref; oscuro: Ref; descripcion: string }> = {
  fondo: { claro: "bruma.50", oscuro: "noche.900", descripcion: "Fondo de la página" },
  superficie: { claro: "bruma.0", oscuro: "noche.850", descripcion: "Tarjetas, tablas, formularios" },
  "superficie-alta": { claro: "bruma.0", oscuro: "noche.820", descripcion: "Modales, menús y popovers" },
  hundido: { claro: "bruma.100", oscuro: "noche.950", descripcion: "Zonas rehundidas: campos, pistas, segmentos" },
  linea: { claro: "bruma.200", oscuro: "noche.800", descripcion: "Bordes y divisores" },
  "linea-fuerte": { claro: "bruma.300", oscuro: "noche.700", descripcion: "Bordes de campos y separadores marcados" },
  tinta: { claro: "bruma.900", oscuro: "bruma.50", descripcion: "Texto principal" },
  titulo: { claro: "lila.950", oscuro: "lila.100", descripcion: "Títulos (ciruela)" },
  "tinta-suave": { claro: "bruma.600", oscuro: "bruma.300", descripcion: "Texto secundario" },
  "tinta-tenue": { claro: "bruma.500", oscuro: "bruma.400", descripcion: "Ayudas, metadatos, ejes de gráficos" },
  marca: { claro: "lila.600", oscuro: "lila.300", descripcion: "Acción principal, enlaces, selección" },
  "marca-oscuro": { claro: "lila.700", oscuro: "lila.200", descripcion: "Hover / presionado de la acción principal" },
  "marca-suave": { claro: "lila.50", oscuro: "lila.950", descripcion: "Fondos de selección y resaltado" },
  "marca-contraste": { claro: "bruma.0", oscuro: "lila.950", descripcion: "Texto sobre la acción principal" },
  acento: { claro: "malva.700", oscuro: "malva.300", descripcion: "Malva: acentos y brillos" },
  "acento-suave": { claro: "malva.50", oscuro: "malva.950", descripcion: "Fondo malva suave" },
  foco: { claro: "lila.500", oscuro: "malva.300", descripcion: "Anillo de foco del teclado" },
  verde: { claro: "verde.800", oscuro: "verde.400", descripcion: "Semáforo saludable / éxito" },
  "verde-suave": { claro: "verde.50", oscuro: "verde.950", descripcion: "Fondo de estado saludable" },
  amarillo: { claro: "ambar.700", oscuro: "ambar.300", descripcion: "Semáforo margen bajo / advertencia" },
  "amarillo-suave": { claro: "ambar.50", oscuro: "ambar.950", descripcion: "Fondo de advertencia" },
  rojo: { claro: "rojo.700", oscuro: "rojo.400", descripcion: "Semáforo pérdida / error / destructivo" },
  "rojo-suave": { claro: "rojo.50", oscuro: "rojo.950", descripcion: "Fondo de error" },
  "datos-1": { claro: "lila.600", oscuro: "lila.400", descripcion: "Serie de datos 1" },
  "datos-2": { claro: "malva.500", oscuro: "malva.400", descripcion: "Serie de datos 2" },
  "datos-3": { claro: "lila.300", oscuro: "lila.200", descripcion: "Serie de datos 3" },
  "datos-4": { claro: "bruma.300", oscuro: "bruma.600", descripcion: "Serie de datos 4 / estimado" },
  "datos-5": { claro: "malva.300", oscuro: "malva.200", descripcion: "Serie de datos 5" },
  "datos-6": { claro: "lila.900", oscuro: "lila.100", descripcion: "Serie de datos 6" },
  "datos-rejilla": { claro: "bruma.200", oscuro: "noche.800", descripcion: "Rejilla de gráficos" },
};

/** Pares texto/fondo que deben cumplir WCAG AA (se verifican en los tests). */
export const paresContraste: { texto: string; fondo: string; minimo: number }[] = [
  { texto: "tinta", fondo: "superficie", minimo: 7 },
  { texto: "tinta", fondo: "fondo", minimo: 7 },
  { texto: "titulo", fondo: "superficie", minimo: 4.5 },
  { texto: "tinta-suave", fondo: "superficie", minimo: 4.5 },
  { texto: "tinta-suave", fondo: "fondo", minimo: 4.5 },
  { texto: "tinta-tenue", fondo: "superficie", minimo: 3 },
  { texto: "marca", fondo: "superficie", minimo: 4.5 },
  { texto: "marca-contraste", fondo: "marca", minimo: 4.5 },
  { texto: "marca", fondo: "marca-suave", minimo: 4.5 },
  { texto: "acento", fondo: "acento-suave", minimo: 4.5 },
  { texto: "verde", fondo: "verde-suave", minimo: 4.5 },
  { texto: "amarillo", fondo: "amarillo-suave", minimo: 4.5 },
  { texto: "rojo", fondo: "rojo-suave", minimo: 4.5 },
  { texto: "verde", fondo: "superficie", minimo: 4.5 },
  { texto: "amarillo", fondo: "superficie", minimo: 4.5 },
  { texto: "rojo", fondo: "superficie", minimo: 4.5 },
];

export const tipografia = {
  familias: {
    // Sustitutos libres de las fuentes licenciadas del manual (ver docs/05-sistema-de-diseno.md):
    // v2.2: Bricolage Grotesque (títulos y cifras, con carácter) + Plus Jakarta Sans (interfaz, cifras tabulares).
    display: '"Bricolage Grotesque Variable", "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
    sans: '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    serif: '"Instrument Serif", ui-serif, Georgia, serif', // ← The Foriene serif italic (palabras clave)
    mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
  },
  // [tamaño, interlineado, tracking]
  escala: {
    "2xs": ["0.6875rem", "1rem", "0.01em"],
    xs: ["0.75rem", "1rem", "0.005em"],
    sm: ["0.8125rem", "1.25rem", "0"],
    base: ["0.875rem", "1.375rem", "0"],
    md: ["1rem", "1.5rem", "-0.005em"],
    lg: ["1.125rem", "1.625rem", "-0.01em"],
    xl: ["1.375rem", "1.875rem", "-0.015em"],
    "2xl": ["1.75rem", "2.25rem", "-0.02em"],
    "3xl": ["2.25rem", "2.625rem", "-0.025em"],
    "4xl": ["3rem", "3.25rem", "-0.03em"],
    display: ["4rem", "4rem", "-0.035em"],
  },
  pesos: { regular: 400, medio: 500, semibold: 600, bold: 700, extrabold: 800 },
} as const;

export const espacio = {
  base: "0.25rem", // 4 px: todas las utilidades p-*, m-*, gap-* son múltiplos
  seccion: "2rem",
  pagina: "clamp(1rem, 3vw, 2.5rem)",
} as const;

export const radios = {
  xs: "4px", sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "28px", completo: "9999px",
} as const;

export const sombras = {
  claro: {
    xs: "0 1px 2px rgb(42 18 88 / 0.06)",
    sm: "0 1px 3px rgb(42 18 88 / 0.08), 0 1px 2px rgb(42 18 88 / 0.04)",
    md: "0 12px 28px -10px rgb(68 36 127 / 0.18), 0 3px 8px -3px rgb(42 18 88 / 0.08)",
    lg: "0 28px 56px -16px rgb(68 36 127 / 0.28), 0 8px 16px -8px rgb(42 18 88 / 0.10)",
    brillo: "0 14px 34px -10px rgb(122 67 227 / 0.55)",
    /** Brillo superior interno: da volumen a tarjetas y botones. */
    realce: "inset 0 1px 0 rgb(255 255 255 / 0.85)",
  },
  oscuro: {
    xs: "0 1px 2px rgb(0 0 0 / 0.45)",
    sm: "0 1px 3px rgb(0 0 0 / 0.5)",
    md: "0 12px 28px -10px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(174 136 249 / 0.04)",
    lg: "0 28px 56px -16px rgb(0 0 0 / 0.7)",
    brillo: "0 14px 34px -12px rgb(122 67 227 / 0.35)",
    realce: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
  },
} as const;

export const movimiento = {
  duracion: { instantanea: "80ms", rapida: "150ms", base: "240ms", lenta: "420ms", escena: "800ms" },
  curva: {
    estandar: "cubic-bezier(0.2, 0, 0, 1)",
    entrada: "cubic-bezier(0, 0, 0.2, 1)",
    salida: "cubic-bezier(0.4, 0, 1, 1)",
    enfasis: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  /** Equivalentes para GSAP (mismo carácter que las curvas CSS). */
  gsap: { estandar: "power2.out", entrada: "power3.out", salida: "power2.in", enfasis: "expo.out" },
  /** Escalonado entre elementos hermanos al revelarse. */
  escalonado: 0.05,
} as const;

export const capas = { base: 0, elevada: 10, pegajosa: 30, encabezado: 40, superposicion: 50, modal: 60, aviso: 70 } as const;

export const gradientes = {
  /** Degradado de marca: lila → orquídea → malva. */
  marca: "linear-gradient(135deg, {lila.700} 0%, {lila.500} 55%, {malva.400} 100%)",
  /** Satín de los banners: malla de brillos malva y lila sobre ciruela profundo. */
  profundo:
    "radial-gradient(55% 75% at 88% 8%, {malva.400/32} 0%, transparent 62%), radial-gradient(60% 90% at 8% 105%, {lila.400/30} 0%, transparent 60%), linear-gradient(128deg, {ciruela.950} 0%, {ciruela.800} 32%, {lila.800} 62%, {lila.600} 100%)",
  /** Satín para el tema oscuro: base más profunda y brillos más suaves (el morado como acento, no como pared). */
  profundoOscuro:
    "radial-gradient(55% 75% at 88% 8%, {malva.500/16} 0%, transparent 62%), radial-gradient(60% 90% at 8% 105%, {lila.500/14} 0%, transparent 60%), linear-gradient(128deg, #0E0618 0%, {ciruela.950} 32%, {ciruela.800} 68%, {lila.800} 100%)",
  /** Banda suave de encabezados de página. */
  bandaClaro:
    "radial-gradient(60% 140% at 100% 0%, {malva.100} 0%, transparent 60%), radial-gradient(50% 120% at 0% 100%, {lila.100} 0%, transparent 65%), linear-gradient(120deg, {bruma.0} 0%, {lila.50} 100%)",
  bandaOscuro:
    "radial-gradient(60% 140% at 100% 0%, {lila.800/18} 0%, transparent 60%), linear-gradient(120deg, {noche.850} 0%, {noche.820} 100%)",
  /** Superficie de tarjetas: degradado casi imperceptible de arriba abajo. */
  superficieClaro: "linear-gradient(180deg, {bruma.0/92} 0%, {bruma.25/84} 100%)",
  superficieOscuro: "linear-gradient(180deg, {noche.820/94} 0%, {noche.850/92} 100%)",
  /** Planos de luz diagonales (del manual), ahora con tinte lila. */
  planosClaro:
    "radial-gradient(40% 50% at 100% 0%, {lila.100/70} 0%, transparent 70%), linear-gradient(115deg, transparent 0 38%, rgb(255 255 255 / 0.65) 38% 52%, transparent 52%), linear-gradient(160deg, {bruma.25} 0%, {bruma.50} 55%, {bruma.100} 100%)",
  planosOscuro: "linear-gradient(160deg, {noche.900} 0%, {noche.950} 100%)",
} as const;

/**
 * Atmósfera del fondo de la app: tres manchas de aurora que derivan lentamente y una
 * malla de puntos que evoca el tejido powernet de las fajas. Por tema.
 */
export const atmosfera = {
  claro: { aurora1: "{lila.200/45}", aurora2: "{malva.200/32}", aurora3: "{durazno.100/70}", malla: "{lila.600/6}" },
  oscuro: { aurora1: "{lila.700/12}", aurora2: "{malva.800/8}", aurora3: "{noche.700/35}", malla: "{bruma.300/4}" },
} as const;

export const layout = { barraLateral: "15.5rem", contenidoMax: "80rem" } as const;

/** Resuelve "premium.600" → "#2709CD". */
export function color(ref: Ref): string {
  const [escala, tono] = ref.split(".");
  const valor = (escalas as Record<string, Record<string, string>>)[escala]?.[tono];
  if (!valor) throw new Error(`Token de color desconocido: ${ref}`);
  return valor;
}

/** Sustituye referencias {escala.tono} o {escala.tono/alfa%} dentro de un valor compuesto. */
export function resolverRefs(valor: string): string {
  return valor.replace(/\{([a-zA-Z]+\.\d+)(?:\/(\d+))?\}/g, (_, ref: string, alfa?: string) => {
    const hex = color(ref);
    if (!alfa) return hex;
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${Number(alfa) / 100})`;
  });
}
