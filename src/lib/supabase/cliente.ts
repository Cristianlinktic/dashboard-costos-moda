import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Martha vive en su propio schema de Postgres; la base es compartida con otras apps. */
export const ESQUEMA = "martha" as const;
/** Valor de app_metadata.app que identifica a los usuarios de Martha en auth.users (compartida). */
export const APP_ID = "martha" as const;
/** Cliente de supabase-js apuntando al schema martha. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClienteMartha = SupabaseClient<any, typeof ESQUEMA, any>;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sin estas variables la app funciona en modo demo. */
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let cliente: ClienteMartha | null = null;

export function obtenerSupabase(): ClienteMartha {
  if (!supabaseConfigurado) throw new Error("Supabase no está configurado (modo demo).");
  cliente ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: ESQUEMA } });
  return cliente;
}

/**
 * Comprueba que el usuario autenticado tenga perfil activo en martha.perfiles.
 * Los usuarios de otras apps del mismo proyecto de Supabase no lo tienen.
 */
export async function perfilMartha(supabase: ClienteMartha, userId: string) {
  const { data } = await supabase.from("perfiles").select("*").eq("id", userId).maybeSingle();
  return data && data.activo ? data : null;
}

export function urlSitio(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
