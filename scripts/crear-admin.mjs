#!/usr/bin/env node
// Crea la organización y su primer administrador en Supabase.
// Uso:
//   npm run crear-admin -- --correo admin@empresa.com --clave 'Clave-Segura-123' \
//                          --nombre "Martha Gómez" --empresa "Fajas Martha"
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (en .env, .env.local o en el entorno).
import { createClient } from "@supabase/supabase-js";

function argumentos() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) out[args[i].slice(2)] = args[i + 1];
  }
  return out;
}

const { correo, clave, nombre, empresa = "Mi empresa" } = argumentos();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("✖ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisa .env o .env.local).");
  process.exit(1);
}
if (!correo || !clave) {
  console.error("✖ Uso: npm run crear-admin -- --correo admin@empresa.com --clave 'Clave-Segura-123' [--nombre \"Nombre\"] [--empresa \"Empresa\"]");
  process.exit(1);
}
if (clave.length < 8) {
  console.error("✖ La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

// Todo lo de Martha vive en el schema "martha" (la base es compartida con otras apps).
const admin = createClient(url, serviceKey, {
  db: { schema: "martha" },
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: org, error: errOrg } = await admin.from("organizaciones").insert({ nombre: empresa }).select("id").single();
if (errOrg) {
  console.error("✖ No se pudo crear la organización:", errOrg.message);
  if (/schema/i.test(errOrg.message))
    console.error("  ¿Ejecutaste la migración y agregaste «martha» en Project Settings → Data API → Exposed schemas?");
  process.exit(1);
}

const { error: errCfg } = await admin.from("configuraciones").insert({ organizacion_id: org.id });
if (errCfg) console.warn("⚠ No se pudo crear la configuración por defecto:", errCfg.message);

const { data: creado, error: errUsuario } = await admin.auth.admin.createUser({
  email: correo,
  password: clave,
  email_confirm: true,
  user_metadata: { nombre: nombre ?? correo.split("@")[0] },
  // app = "martha" hace que el trigger martha_on_auth_user_created cree el perfil.
  app_metadata: { app: "martha", organizacion_id: org.id, rol: "admin", activo: true },
});
if (errUsuario) {
  console.error("✖ No se pudo crear el usuario:", errUsuario.message);
  await admin.from("organizaciones").delete().eq("id", org.id);
  process.exit(1);
}

const { data: perfil } = await admin.from("perfiles").select("rol").eq("id", creado.user.id).maybeSingle();
if (!perfil) console.warn("⚠ El usuario se creó pero no tiene perfil en martha.perfiles: revisa que el trigger martha_on_auth_user_created exista.");

console.log("✔ Organización creada:", empresa, `(${org.id})`);
console.log("✔ Administrador creado:", creado.user.email);
console.log("  Inicia sesión en /acceso con ese correo y contraseña.");
