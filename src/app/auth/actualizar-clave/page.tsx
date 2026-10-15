"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { Check, KeyRound, Lock } from "lucide-react";
import { Aviso } from "@/components/ui";
import { BotonAcceso, CampoAcceso } from "@/components/CampoAcceso";
import { obtenerSupabase, supabaseConfigurado } from "@/lib/supabase/cliente";

/** Destino de los enlaces de recuperación e invitación: el usuario define su contraseña. */
export default function PaginaActualizarClave() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sesionLista, setSesionLista] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return setSesionLista(false);
    const supabase = obtenerSupabase();
    (async () => {
      // Plantillas por defecto de Supabase: los tokens llegan en el fragmento (#access_token=…).
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState(null, "", window.location.pathname);
      }
      const { data } = await supabase.auth.getUser();
      setSesionLista(Boolean(data.user));
    })();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (clave.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (clave !== confirmacion) return setError("Las contraseñas no coinciden.");
    setEnviando(true);
    setError(null);
    const { error } = await obtenerSupabase().auth.updateUser({ password: clave });
    setEnviando(false);
    if (error) return setError(error.message);
    router.replace("/");
  }

  if (sesionLista === false)
    return (
      <MarcoAcceso titulo="Enlace no válido" descripcion="El enlace venció o ya fue usado.">
        <Link href="/acceso/recuperar" className="btn-primario w-full">
          Solicitar un enlace nuevo
        </Link>
      </MarcoAcceso>
    );

  return (
    <MarcoAcceso titulo="Define tu contraseña" descripcion="Usa al menos 8 caracteres.">
      <form onSubmit={guardar} className="space-y-4">
        {error && (
          <div role="alert">
            <Aviso tono="rojo">{error}</Aviso>
          </div>
        )}
        <CampoAcceso etiqueta="Contraseña nueva" icono={Lock} tipo="password" autoComplete="new-password" valor={clave} onCambio={setClave} ayuda="Mínimo 8 caracteres." autoFocus />
        <CampoAcceso etiqueta="Confirmar contraseña" icono={KeyRound} tipo="password" autoComplete="new-password" valor={confirmacion} onCambio={setConfirmacion} />
        <BotonAcceso cargando={enviando || sesionLista === null} texto="Guardar contraseña" textoCargando={enviando ? "Guardando…" : "Verificando enlace…"} icono={Check} />
      </form>
    </MarcoAcceso>
  );
}
