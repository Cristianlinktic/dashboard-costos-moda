#!/usr/bin/env node
// Genera src/design/tokens.css y design-tokens.json a partir de src/design/tokens.ts.
// Node 22.18+ / 24 ejecuta TypeScript "borrable" sin compilar.
import { writeFileSync } from "node:fs";
import * as tokens from "../src/design/tokens.ts";
import { generarCSS, generarJSON } from "../src/design/generar.ts";

const raiz = new URL("..", import.meta.url);
writeFileSync(new URL("src/design/tokens.css", raiz), generarCSS(tokens));
writeFileSync(new URL("public/design-tokens.json", raiz), JSON.stringify(generarJSON(tokens), null, 2) + "\n");
console.log("✔ Tokens generados: src/design/tokens.css · public/design-tokens.json");
