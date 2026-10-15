import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Rol } from "@/tipos";
import { APP_ID, ESQUEMA, SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado, type ClienteMartha } from "./cliente";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const adminConfigurado = supabaseConfigurado && Boolean(SERVICE_ROLE_KEY);

export class ErrorHttp extends Error {
  constructor(
    public estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** Cliente con service role: SOLO en el servidor. Ignora la RLS; valida permisos antes de usarlo. */
export function clienteAdmin(): ClienteMartha {
  if (!adminConfigurado) throw new ErrorHttp(503, "Gestión de usuarios no disponible: falta SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: ESQUEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente que actúa como el usuario del token (respeta la RLS). */
export function clienteDeUsuario(token: string): ClienteMartha {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: ESQUEMA },
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function tokenDe(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) throw new ErrorHttp(401, "Falta el encabezado Authorization: Bearer <token>.");
  return token;
}

export interface Llamante {
  id: string;
  organizacionId: string;
  rol: Rol;
}

/**
 * Valida en el servidor que quien llama es un usuario activo y administrador de su organización.
 * La fuente de verdad es la tabla perfiles (espejo de app_metadata), leída con service role.
 */
export async function exigirAdmin(request: Request): Promise<{ llamante: Llamante; admin: ClienteMartha }> {
  const admin = clienteAdmin();
  const { data, error } = await admin.auth.getUser(tokenDe(request));
  if (error || !data.user) throw new ErrorHttp(401, "Sesión inválida o vencida.");

  const { data: perfil } = await admin
    .from("perfiles")
    .select("organizacion_id, rol, activo")
    .eq("id", data.user.id)
    .maybeSingle();
  if (data.user.app_metadata?.app !== APP_ID) throw new ErrorHttp(403, "El usuario no pertenece a Martha.");
  if (!perfil || !perfil.activo) throw new ErrorHttp(403, "Usuario sin acceso.");
  if (perfil.rol !== "admin") throw new ErrorHttp(403, "Solo un administrador puede gestionar usuarios.");
  if (data.user.app_metadata?.organizacion_id !== perfil.organizacion_id)
    throw new ErrorHttp(403, "La organización del usuario no coincide.");

  return { llamante: { id: data.user.id, organizacionId: perfil.organizacion_id, rol: perfil.rol }, admin };
}

export function respuestaError(e: unknown): Response {
  if (e instanceof ErrorHttp) return Response.json({ error: e.message }, { status: e.estado });
  console.error(e);
  return Response.json({ error: "Error interno del servidor." }, { status: 500 });
}
