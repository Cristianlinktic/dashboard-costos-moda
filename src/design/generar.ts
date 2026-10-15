// Generadores de artefactos a partir de tokens.ts (usados por `npm run tokens` y por los tests).
// Sin imports de valor: recibe el módulo de tokens como parámetro para poder ejecutarse con Node.
import type * as Tokens from "./tokens";

type ModuloTokens = typeof Tokens;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export function generarCSS(t: ModuloTokens): string {
  const l: string[] = [];
  l.push("/* ⚠ Archivo generado por `npm run tokens` desde src/design/tokens.ts. No editar a mano. */", "");

  // Primitivos y escalas comunes (independientes del tema)
  l.push(":root {");
  for (const [escala, tonos] of Object.entries(t.escalas))
    for (const [tono, hex] of Object.entries(tonos)) l.push(`  --mt-${kebab(escala)}-${tono}: ${hex};`);
  for (const [k, v] of Object.entries(t.tipografia.familias)) l.push(`  --mt-fuente-${k}: ${v};`);
  for (const [k, [tam, alto, tracking]] of Object.entries(t.tipografia.escala)) {
    l.push(`  --mt-texto-${k}: ${tam};`, `  --mt-texto-${k}-alto: ${alto};`, `  --mt-texto-${k}-tracking: ${tracking};`);
  }
  for (const [k, v] of Object.entries(t.tipografia.pesos)) l.push(`  --mt-peso-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.espacio)) l.push(`  --mt-espacio-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.radios)) l.push(`  --mt-radio-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.movimiento.duracion)) l.push(`  --mt-duracion-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.movimiento.curva)) l.push(`  --mt-curva-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.capas)) l.push(`  --mt-capa-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(t.layout)) l.push(`  --mt-layout-${kebab(k)}: ${v};`);
  l.push(`  --mt-gradiente-marca: ${t.resolverRefs(t.gradientes.marca)};`);
  l.push("}", "");

  const tema = (nombre: "claro" | "oscuro") => {
    const out: string[] = [];
    for (const [k, v] of Object.entries(t.semanticos)) out.push(`  --mt-color-${k}: ${t.color(v[nombre])};`);
    for (const [k, v] of Object.entries(t.sombras[nombre])) out.push(`  --mt-sombra-${k}: ${v};`);
    const g = (claro: string, oscuro: string) => t.resolverRefs(nombre === "claro" ? claro : oscuro);
    out.push(`  --mt-fondo-planos: ${g(t.gradientes.planosClaro, t.gradientes.planosOscuro)};`);
    out.push(`  --mt-gradiente-banda: ${g(t.gradientes.bandaClaro, t.gradientes.bandaOscuro)};`);
    out.push(`  --mt-gradiente-profundo: ${g(t.gradientes.profundo, t.gradientes.profundoOscuro)};`);
    out.push(`  --mt-gradiente-superficie: ${g(t.gradientes.superficieClaro, t.gradientes.superficieOscuro)};`);
    for (const [k, v] of Object.entries(t.atmosfera[nombre])) out.push(`  --mt-${k}: ${t.resolverRefs(v)};`);
    out.push(`  color-scheme: ${nombre === "claro" ? "light" : "dark"};`);
    return out;
  };

  l.push(":root,", '[data-tema="claro"] {', ...tema("claro"), "}", "");
  l.push('[data-tema="oscuro"] {', ...tema("oscuro"), "}", "");
  l.push("@media (prefers-reduced-motion: reduce) {", "  :root {");
  for (const k of Object.keys(t.movimiento.duracion)) l.push(`    --mt-duracion-${k}: 0ms;`);
  l.push("  }", "}", "");
  return l.join("\n");
}

/** Formato W3C Design Tokens (https://design-tokens.github.io/community-group/format/). */
export function generarJSON(t: ModuloTokens): Record<string, unknown> {
  const primitivos: Record<string, Record<string, unknown>> = {};
  for (const [escala, tonos] of Object.entries(t.escalas)) {
    primitivos[escala] = {};
    for (const [tono, hex] of Object.entries(tonos)) primitivos[escala][tono] = { $type: "color", $value: hex };
  }
  const tema = (nombre: "claro" | "oscuro") =>
    Object.fromEntries(
      Object.entries(t.semanticos).map(([k, v]) => [k, { $type: "color", $value: `{color.${v[nombre]}}`, $description: v.descripcion }]),
    );
  return {
    $description: "Martha · tokens derivados del Manual de Marca LinkTIC v3. Generado por `npm run tokens`.",
    color: primitivos,
    tema: { claro: tema("claro"), oscuro: tema("oscuro") },
    tipografia: {
      familia: Object.fromEntries(Object.entries(t.tipografia.familias).map(([k, v]) => [k, { $type: "fontFamily", $value: v }])),
      tamano: Object.fromEntries(
        Object.entries(t.tipografia.escala).map(([k, [tam, alto, tracking]]) => [
          k,
          { $type: "typography", $value: { fontSize: tam, lineHeight: alto, letterSpacing: tracking } },
        ]),
      ),
      peso: Object.fromEntries(Object.entries(t.tipografia.pesos).map(([k, v]) => [k, { $type: "fontWeight", $value: v }])),
    },
    radio: Object.fromEntries(Object.entries(t.radios).map(([k, v]) => [k, { $type: "dimension", $value: v }])),
    sombra: {
      claro: Object.fromEntries(Object.entries(t.sombras.claro).map(([k, v]) => [k, { $type: "shadow", $value: v }])),
      oscuro: Object.fromEntries(Object.entries(t.sombras.oscuro).map(([k, v]) => [k, { $type: "shadow", $value: v }])),
    },
    movimiento: {
      duracion: Object.fromEntries(Object.entries(t.movimiento.duracion).map(([k, v]) => [k, { $type: "duration", $value: v }])),
      curva: Object.fromEntries(Object.entries(t.movimiento.curva).map(([k, v]) => [k, { $type: "cubicBezier", $value: v }])),
    },
  };
}

// ---------------------------------------------------------------------------
// Contraste WCAG 2.x
// ---------------------------------------------------------------------------

function luminancia(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
