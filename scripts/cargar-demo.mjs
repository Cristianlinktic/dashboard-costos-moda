#!/usr/bin/env node
// Carga los datos de prueba del modo demo (fajas, proveedores, lotes, costos, precios e historial)
// en una organización de Martha en Supabase.
//
// Uso:
//   npm run cargar-demo                      # si solo existe una organización
//   npm run cargar-demo -- --org <uuid>      # una organización específica
//   npm run cargar-demo -- --forzar          # aunque la organización ya tenga productos
//
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (.env / .env.local).
// Node 22.18+ / 24 (lee la semilla en TypeScript sin compilar).
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { crearSemilla } from "../src/lib/datos/semilla.ts";

const args = process.argv.slice(2);
const opcion = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const forzar = args.includes("--forzar");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("✖ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisa .env).");
  process.exit(1);
}
const db = createClient(url, serviceKey, { db: { schema: "martha" }, auth: { persistSession: false, autoRefreshToken: false } });

const falla = (msg, error) => {
  console.error(`✖ ${msg}:`, error?.message ?? error);
  process.exit(1);
};

// 1) Organización destino
let orgId = opcion("org");
if (!orgId) {
  const { data, error } = await db.from("organizaciones").select("id, nombre");
  if (error) falla("No se pudieron leer las organizaciones", error);
  if (data.length !== 1) {
    console.error(`✖ Hay ${data.length} organizaciones; indica cuál con --org <id>:`);
    for (const o of data) console.error(`   ${o.id}  ${o.nombre}`);
    process.exit(1);
  }
  orgId = data[0].id;
  console.log(`→ Organización: ${data[0].nombre} (${orgId})`);
}

const { count } = await db.from("productos").select("id", { count: "exact", head: true }).eq("organizacion_id", orgId);
if (count && !forzar) {
  console.error(`✖ La organización ya tiene ${count} productos. Usa --forzar para agregar los datos de prueba de todas formas.`);
  process.exit(1);
}

// 2) Semilla con ids nuevos (UUID) y referencias reescritas
const semilla = crearSemilla();
const ids = new Map();
const nuevo = (viejo) => {
  if (viejo == null) return viejo;
  if (!ids.has(viejo)) ids.set(viejo, randomUUID());
  return ids.get(viejo);
};
const aSnake = (k) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const REFERENCIAS = ["id", "productoId", "proveedorId", "loteId", "varianteId", "productoOrigenId"];
const fila = (obj) => {
  const out = { organizacion_id: orgId };
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[aSnake(k)] = REFERENCIAS.includes(k) ? nuevo(v) : v;
  }
  return out;
};

// Si un SKU de prueba ya existe en la organización, se le agrega un sufijo para no chocar.
const { data: skus } = await db.from("productos").select("sku").eq("organizacion_id", orgId);
const usados = new Set((skus ?? []).map((s) => s.sku));
for (const p of semilla.productos) if (usados.has(p.sku)) p.sku = `${p.sku}-DEMO`;
const { data: codigos } = await db.from("lotes").select("codigo").eq("organizacion_id", orgId);
const lotesUsados = new Set((codigos ?? []).map((c) => c.codigo));
for (const l of semilla.lotes) if (lotesUsados.has(l.codigo)) l.codigo = `${l.codigo}-DEMO`;

async function insertar(tabla, registros, etiqueta) {
  if (!registros.length) return;
  const { error } = await db.from(tabla).insert(registros.map(fila));
  if (error) falla(`No se pudo cargar ${etiqueta}`, error);
  console.log(`✔ ${etiqueta}: ${registros.length}`);
}

// 3) Configuración y tasas
const { error: errCfg } = await db.from("configuraciones").upsert({ organizacion_id: orgId, ...Object.fromEntries(Object.entries(semilla.configuracion).map(([k, v]) => [aSnake(k), v])) });
if (errCfg) falla("No se pudo guardar la configuración", errCfg);
console.log("✔ Configuración de márgenes y costos de venta");

const { data: tasasExistentes } = await db.from("tasas_cambio").select("moneda, fecha").eq("organizacion_id", orgId);
const claveTasa = (t) => `${t.moneda}|${t.fecha}`;
const yaTasas = new Set((tasasExistentes ?? []).map(claveTasa));
await insertar("tasas_cambio", semilla.tasas.filter((t) => !yaTasas.has(claveTasa(t))), "Tasas de cambio");

// 4) Catálogo y operación (en orden de dependencias)
await insertar("proveedores", semilla.proveedores, "Proveedores");
const base = semilla.productos.filter((p) => !p.productoOrigenId);
const versiones = semilla.productos.filter((p) => p.productoOrigenId);
await insertar("productos", base, "Productos");
await insertar("productos", versiones, "Versiones de producto");
await insertar("variantes", semilla.variantes, "Variantes");
await insertar("lotes", semilla.lotes, "Lotes");
await insertar("costos", semilla.costos, "Costos");

// El trigger ya registró el precio vigente de cada producto; se agrega el historial anterior.
const vigentes = new Set(semilla.productos.map((p) => `${p.id}|${p.precioVenta}`));
await insertar("precios", semilla.precios.filter((p) => !vigentes.has(`${p.productoId}|${p.precio}`)), "Historial de precios");
await insertar("eventos", semilla.eventos.map((e) => ({ ...e, datos: e.datos ?? {} })), "Eventos del historial");

console.log("\n✔ Datos de prueba cargados. Recarga la app para verlos.");
