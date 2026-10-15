// Intercambia el código PKCE (enlace de recuperación de contraseña) por una sesión en cookies.
import { NextResponse } from "next/server";
import { supabaseConfigurado } from "@/lib/supabase/cliente";
import { clienteConCookies } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const siguiente = rutaSegura(url.searchParams.get("next"));
  if (supabaseConfigurado && codigo) {
    const supabase = await clienteConCookies();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(siguiente, url.origin));
  }
  return NextResponse.redirect(new URL("/acceso?error=enlace", url.origin));
}

function rutaSegura(ruta: string | null): string {
  return ruta && ruta.startsWith("/") && !ruta.startsWith("//") ? ruta : "/";
}
