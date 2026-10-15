import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as tokens from "./tokens";
import { contraste, generarCSS, generarJSON } from "./generar";

describe("tokens de diseño", () => {
  it("tokens.css y design-tokens.json están sincronizados con tokens.ts (ejecuta `npm run tokens`)", () => {
    const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
    expect(css).toBe(generarCSS(tokens));
    const json = JSON.parse(readFileSync(new URL("../../public/design-tokens.json", import.meta.url), "utf8"));
    expect(json).toEqual(generarJSON(tokens));
  });

  it("respeta los colores exactos del manual de marca LinkTIC", () => {
    expect(tokens.escalas.premium[600]).toBe("#2709CD");
    expect(tokens.escalas.azul[500]).toBe("#0094FF");
    expect(tokens.escalas.cian[400]).toBe("#00D9FF");
    expect(tokens.escalas.grafito[900]).toBe("#1E232F");
    expect(tokens.escalas.grisAzul[600]).toBe("#516276");
    expect(tokens.escalas.verde[500]).toBe("#1DCE00");
    expect(tokens.escalas.verde[700]).toBe("#008800");
  });

  it("todas las referencias semánticas existen en ambos temas", () => {
    for (const v of Object.values(tokens.semanticos)) {
      expect(() => tokens.color(v.claro)).not.toThrow();
      expect(() => tokens.color(v.oscuro)).not.toThrow();
    }
  });

  for (const tema of ["claro", "oscuro"] as const) {
    it(`cumple contraste WCAG en tema ${tema}`, () => {
      const fallas = tokens.paresContraste
        .map((p) => ({ ...p, ratio: contraste(tokens.color(tokens.semanticos[p.texto][tema]), tokens.color(tokens.semanticos[p.fondo][tema])) }))
        .filter((p) => p.ratio < p.minimo)
        .map((p) => `${p.texto} sobre ${p.fondo}: ${p.ratio.toFixed(2)} < ${p.minimo}`);
      expect(fallas).toEqual([]);
    });
  }

  it("calcula contraste conocido (negro sobre blanco = 21)", () => {
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21);
  });
});
