"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { Aviso } from "@/components/ui";
import { BotonAcceso, CampoAcceso } from "@/components/CampoAcceso";
import { obtenerSupabase, perfilMartha, supabaseConfigurado } from "@/lib/supabase/cliente";

const ERRORES: Record<string, string> = {
  enlace: "El enlace no es válido o ya venció. Solicita uno nuevo.",
  "sin-acceso": "Tu usuario está desactivado o no pertenece a una organización. Contacta a un administrador.",
};

export default function PaginaAcceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const codigo = new URLSearchParams(window.location.search).get("error");
    if (codigo) setError(ERRORES[codigo] ?? "No se pudo iniciar sesión.");
  }, []);

  if (!supabaseConfigurado)
    return (
      <MarcoAcceso titulo="Modo demo" descripcion="Supabase no está configurado, así que no se requiere iniciar sesión.">
        <Link href="/" className="btn-primario w-full">
          Entrar a la demo
        </Link>
      </MarcoAcceso>
    );

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const supabase = obtenerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
    if (error) {
      setEnviando(false);
      setError(/invalid/i.test(error.message) ? "Correo o contraseña incorrectos." : /banned/i.test(error.message) ? ERRORES["sin-acceso"] : error.message);
      return;
    }
    // La cuenta puede existir en el proyecto por otra app: sin perfil en martha.perfiles no entra.
    if (!(await perfilMartha(supabase, data.user.id))) {
      await supabase.auth.signOut();
      setEnviando(false);
      setError(ERRORES["sin-acceso"]);
      return;
    }
    router.replace("/");
  }

  return (
    <MarcoAcceso titulo="Bienvenida de nuevo" descripcion="Ingresa con el correo y la contraseña que te asignó tu administrador.">
      <form onSubmit={iniciarSesion} className="space-y-4">
        {error && (
          <div role="alert">
            <Aviso tono="rojo">
              <span className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </span>
            </Aviso>
          </div>
        )}
        <CampoAcceso etiqueta="Correo" icono={Mail} tipo="email" autoComplete="email" valor={correo} onCambio={setCorreo} autoFocus />
        <div>
          <CampoAcceso etiqueta="Contraseña" icono={Lock} tipo="password" autoComplete="current-password" valor={clave} onCambio={setClave} />
          <div className="mt-2 text-right">
            <Link href="/acceso/recuperar" className="text-xs font-semibold text-marca hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        <BotonAcceso cargando={enviando} texto="Ingresar" textoCargando="Ingresando…" icono={ArrowRight} />
      </form>
    </MarcoAcceso>
  );
}
