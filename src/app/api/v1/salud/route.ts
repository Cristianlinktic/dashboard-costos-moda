import { supabaseConfigurado } from "@/lib/supabase/cliente";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, servicio: "martha", version: "v1", modo: supabaseConfigurado ? "supabase" : "demo" });
}
