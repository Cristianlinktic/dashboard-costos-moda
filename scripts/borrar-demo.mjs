#!/usr/bin/env node
// Borra de una organización los datos de prueba cargados con `npm run cargar-demo`.
// Solo toca lo que coincide con la semilla:
//   · productos con los SKU de prueba (y su sufijo -DEMO); al borrarlos, la base elimina en
//     cascada sus variantes, lotes, costos, historial de precios, eventos y escenarios;
//   · proveedores de prueba que ya no usa ningún producto ni lote;
//   · tasas de cambio idénticas a las de prueba (misma moneda, fecha, valor y fuente).
// No toca la configuración, los usuarios ni nada creado por ti.
//
// Uso:
//   npm run borrar-demo                       # solo muestra qué se borraría
//   npm run borrar-demo -- --confirmar        # borra de verdad
//   npm run borrar-demo -- --org <uuid> ...   # si hay más de una organización
import { createClient } from "@supabase/supabase-js";
import { crearSemilla } from "../src/lib/datos/semilla.ts";

const args = process.argv.slice(2);
const opcion = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const confirmar = args.includes("--confirmar");

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

const semilla = crearSemilla();
const skus = semilla.productos.flatMap((p) => [p.sku, `${p.sku}-DEMO`]);
const nombresProveedores = semilla.proveedores.map((p) => p.nombre);

const { data: productos, error: e1 } = await db.from("productos").select("id, sku, nombre, producto_origen_id").eq("organizacion_id", orgId).in("sku", skus);
if (e1) falla("No se pudieron leer los productos", e1);
const idsProductos = productos.map((p) => p.id);

const contar = async (tabla) => {
  if (!idsProductos.length) return 0;
  const { count } = await db.from(tabla).select("id", { count: "exact", head: true }).in("producto_id", idsProductos);
  return count ?? 0;
};
const resumen = {
  variantes: await contar("variantes"),
  lotes: await contar("lotes"),
  costos: await contar("costos"),
  precios: await contar("precios"),
  eventos: await contar("eventos"),
  escenarios: await contar("escenarios"),
};

const { data: proveedores } = await db.from("proveedores").select("id, nombre").eq("organizacion_id", orgId).in("nombre", nombresProveedores);
const { data: tasas } = await db.from("tasas_cambio").select("id, moneda, fecha, tasa_cop, fuente").eq("organizacion_id", orgId);
const tasasDemo = (tasas ?? []).filter((t) => semilla.tasas.some((s) => s.moneda === t.moneda && s.fecha === t.fecha && Number(s.tasaCop) === Number(t.tasa_cop) && s.fuente === t.fuente));

console.log("\nDatos de prueba encontrados:");
console.log(`  Productos: ${productos.length}${productos.length ? ` (${productos.map((p) => p.sku).join(", ")})` : ""}`);
for (const [k, v] of Object.entries(resumen)) console.log(`    · ${k}: ${v} (se borran con sus productos)`);
console.log(`  Proveedores de prueba: ${proveedores?.length ?? 0} (solo se borran los que queden sin uso)`);
console.log(`  Tasas de cambio de prueba: ${tasasDemo.length}`);

if (!confirmar) {
  console.log("\nNo se borró nada. Para borrar de verdad: npm run borrar-demo -- --confirmar");
  process.exit(0);
}

// Primero las versiones (apuntan a su producto origen) y luego el resto.
const versiones = productos.filter((p) => p.producto_origen_id).map((p) => p.id);
const resto = idsProductos.filter((id) => !versiones.includes(id));
for (const grupo of [versiones, resto]) {
  if (!grupo.length) continue;
  const { error } = await db.from("productos").delete().in("id", grupo);
  if (error) falla("No se pudieron borrar los productos", error);
}
console.log(`\n✔ Productos borrados: ${productos.length} (con sus variantes, lotes, costos, precios, eventos y escenarios)`);

let proveedoresBorrados = 0;
for (const p of proveedores ?? []) {
  const [{ count: enProductos }, { count: enLotes }] = await Promise.all([
    db.from("productos").select("id", { count: "exact", head: true }).eq("proveedor_id", p.id),
    db.from("lotes").select("id", { count: "exact", head: true }).eq("proveedor_id", p.id),
  ]);
  if ((enProductos ?? 0) + (enLotes ?? 0) > 0) {
    console.log(`  · Se conserva el proveedor «${p.nombre}»: lo usa algún producto o lote tuyo.`);
    continue;
  }
  const { error } = await db.from("proveedores").delete().eq("id", p.id);
  if (error) falla(`No se pudo borrar el proveedor ${p.nombre}`, error);
  proveedoresBorrados++;
}
console.log(`✔ Proveedores borrados: ${proveedoresBorrados}`);

if (tasasDemo.length) {
  const { error } = await db.from("tasas_cambio").delete().in("id", tasasDemo.map((t) => t.id));
  if (error) falla("No se pudieron borrar las tasas de cambio", error);
}
console.log(`✔ Tasas de cambio borradas: ${tasasDemo.length}`);
console.log("\nListo. La configuración de márgenes no se modificó (ajústala en Configuración si quieres).");
