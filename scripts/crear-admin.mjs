#!/usr/bin/env node
// Crea la organización y su primer administrador en Supabase.
// Uso:
//   npm run crear-admin -- --correo admin@empresa.com --clave 'Clave-Segura-123' \
//                          --nombre "Martha Gómez" --empresa "Fajas Martha"
//   npm run crear-admin -- --correo admin@empresa.com --invitar --nombre "…" --empresa "…"
//     (sin contraseña: se le envía un enlace para que la defina en /auth/actualizar-clave)
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (en .env, .env.local o en el entorno).
import { createClient } from "@supabase/supabase-js";

function argumentos() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--")) continue;
    const siguiente = args[i + 1];
    out[args[i].slice(2)] = siguiente === undefined || siguiente.startsWith("--") ? true : siguiente;
  }
  return out;
}

const { correo, clave, nombre, empresa = "Mi empresa", invitar = false } = argumentos();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("✖ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisa .env o .env.local).");
  process.exit(1);
}
if (typeof correo !== "string" || (!invitar && typeof clave !== "string")) {
  console.error("✖ Uso: npm run crear-admin -- --correo admin@empresa.com (--clave 'Clave-Segura-123' | --invitar) [--nombre \"Nombre\"] [--empresa \"Empresa\"]");
  process.exit(1);
}
if (!invitar && clave.length < 8) {
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

// Cuenta propia de Martha con alias +martha (misma regla que src/lib/usuarios/correo.ts):
// separada de la cuenta del mismo correo en otras apps del proyecto.
const limpio = correo.trim().toLowerCase();
const arroba = limpio.lastIndexOf("@");
const local = limpio.slice(0, arroba);
const correoAuth = local.endsWith("+martha") ? limpio : `${local}+martha@${limpio.slice(arroba + 1)}`;

// Siempre createUser con app_metadata completo desde el INSERT: los triggers de auth.users
// (martha_on_auth_user_created y los de otras apps) filtran por raw_app_meta_data->>'app'.
const appMetadata = { app: "martha", organizacion_id: org.id, rol: "admin", activo: true };
const { data: creado, error: errUsuario } = await admin.auth.admin.createUser({
  email: correoAuth,
  ...(invitar ? {} : { password: clave }),
  email_confirm: true,
  user_metadata: { nombre: typeof nombre === "string" ? nombre : correo.split("@")[0] },
  app_metadata: invitar ? { ...appMetadata, alta: "invitacion" } : appMetadata,
});
if (errUsuario) {
  console.error("✖ No se pudo crear el usuario:", errUsuario.message);
  await admin.from("organizaciones").delete().eq("id", org.id);
  process.exit(1);
}

if (invitar) {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error: errCorreo } = await admin.auth.resetPasswordForEmail(correoAuth, { redirectTo: `${sitio}/auth/actualizar-clave` });
  if (errCorreo) {
    console.error("✖ No se pudo enviar el enlace para definir la contraseña:", errCorreo.message);
    await admin.auth.admin.deleteUser(creado.user.id);
    await admin.from("organizaciones").delete().eq("id", org.id);
    process.exit(1);
  }
}

const { data: perfil } = await admin.from("perfiles").select("rol").eq("id", creado.user.id).maybeSingle();
if (!perfil) console.warn("⚠ El usuario se creó pero no tiene perfil en martha.perfiles: revisa que el trigger martha_on_auth_user_created exista.");

console.log("✔ Organización creada:", empresa, `(${org.id})`);
console.log("✔ Administrador creado:", limpio, `(cuenta de Martha: ${correoAuth})`);
console.log(
  invitar
    ? `  Se envió a ${correoAuth} un enlace para definir la contraseña; luego inicia sesión en /acceso con ${limpio}.`
    : "  Inicia sesión en /acceso con ese correo y contraseña.",
);
