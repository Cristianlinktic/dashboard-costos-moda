// Verifica enlaces de correo con token_hash (invitación y recuperación de contraseña).
// Plantillas de correo recomendadas en README.md:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/actualizar-clave
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/actualizar-clave
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseConfigurado } from "@/lib/supabase/cliente";
import { clienteConCookies } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

const TIPOS: EmailOtpType[] = ["invite", "recovery", "email", "email_change"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const siguiente = url.searchParams.get("next") ?? "/auth/actualizar-clave";
  const destino = siguiente.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/";

  if (supabaseConfigurado && tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await clienteConCookies();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }
  return NextResponse.redirect(new URL("/acceso?error=enlace", url.origin));
}
