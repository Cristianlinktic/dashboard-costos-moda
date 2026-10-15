"use client";

import Link from "next/link";
import { useState } from "react";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { Mail, Send } from "lucide-react";
import { Aviso } from "@/components/ui";
import { BotonAcceso, CampoAcceso } from "@/components/CampoAcceso";
import { obtenerSupabase, supabaseConfigurado, urlSitio } from "@/lib/supabase/cliente";

export default function PaginaRecuperar() {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigurado) return setError("En modo demo no hay cuentas que recuperar.");
    setEnviando(true);
    setError(null);
    const { error } = await obtenerSupabase().auth.resetPasswordForEmail(correo.trim(), {
      redirectTo: `${urlSitio()}/auth/callback?next=/auth/actualizar-clave`,
    });
    setEnviando(false);
    if (error) return setError(error.message);
    setEnviado(true);
  }

  return (
    <MarcoAcceso titulo="Recuperar contraseña" descripcion="Te enviaremos un enlace para crear una contraseña nueva.">
      {enviado ? (
        <Aviso tono="verde">Si el correo está registrado, recibirás un enlace en unos minutos. Revisa también la carpeta de spam.</Aviso>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          {error && (
            <div role="alert">
              <Aviso tono="rojo">{error}</Aviso>
            </div>
          )}
          <CampoAcceso etiqueta="Correo" icono={Mail} tipo="email" autoComplete="email" valor={correo} onCambio={setCorreo} autoFocus />
          <BotonAcceso cargando={enviando} texto="Enviar enlace" textoCargando="Enviando…" icono={Send} />
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link href="/acceso" className="text-marca hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </MarcoAcceso>
  );
}
