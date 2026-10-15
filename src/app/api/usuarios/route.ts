// Gestión de usuarios del equipo. Solo servidor: usa SUPABASE_SERVICE_ROLE_KEY tras validar
// que quien llama es administrador activo de la organización.
import { APP_ID } from "@/lib/supabase/cliente";
import { correoAuth, correoVisible } from "@/lib/usuarios/correo";
import { ErrorHttp, exigirAdmin, respuestaError } from "@/lib/supabase/servidor";
import { validarNuevoUsuario, type DatosNuevoUsuario, type UsuarioEquipo } from "@/lib/usuarios/tipos";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { llamante, admin } = await exigirAdmin(request);
    const { data: perfiles, error } = await admin
      .from("perfiles")
      .select("id, nombre, correo, rol, activo, creado_en")
      .eq("organizacion_id", llamante.organizacionId)
      .order("creado_en");
    if (error) throw new ErrorHttp(500, error.message);

    const usuarios: UsuarioEquipo[] = await Promise.all(
      (perfiles ?? []).map(async (p) => {
        const { data } = await admin.auth.admin.getUserById(p.id);
        return {
          id: p.id,
          nombre: p.nombre ?? "",
          correo: correoVisible(p.correo ?? data.user?.email),
          rol: p.rol,
          activo: p.activo,
          creadoEn: p.creado_en,
          ultimoAcceso: data.user?.last_sign_in_at ?? null,
          invitacionPendiente: Boolean(data.user?.app_metadata?.alta === "invitacion" && !data.user?.last_sign_in_at),
        };
      }),
    );
    return Response.json({ usuarios });
  } catch (e) {
    return respuestaError(e);
  }
}

export async function POST(request: Request) {
  try {
    const { llamante, admin } = await exigirAdmin(request);
    const datos = (await request.json()) as DatosNuevoUsuario;
    const invalido = validarNuevoUsuario(datos);
    if (invalido) throw new ErrorHttp(400, invalido);

    // Cuenta propia de Martha (alias +martha): separada de la cuenta del mismo correo en otras apps.
    const correo = correoAuth(datos.correo);
    // organizacion_id y rol van en app_metadata: el usuario no puede modificarlos.
    // app = 'martha' identifica al usuario como de esta app en auth.users (compartida con otras apps).
    const appMetadata = { app: APP_ID, organizacion_id: llamante.organizacionId, rol: datos.rol, activo: true };
    const userMetadata = { nombre: datos.nombre.trim() };

    // Siempre createUser con app_metadata completo DESDE EL INSERT: los triggers de auth.users
    // (los de Martha y los de otras apps) filtran por raw_app_meta_data->>'app' al crearse la fila.
    // Por eso no se usa inviteUserByEmail, que no admite app_metadata.
    const invitar = datos.metodo === "invitacion";
    const { data, error } = await admin.auth.admin.createUser({
      email: correo,
      // Invitación: sin contraseña conocida; la persona la define con el enlace que se envía abajo.
      ...(invitar ? {} : { password: datos.clave }),
      email_confirm: true,
      user_metadata: userMetadata,
      app_metadata: invitar ? { ...appMetadata, alta: "invitacion" } : appMetadata,
    });
    if (error) throw new ErrorHttp(400, traducirError(error.message));
    const id = data.user.id;

    if (invitar) {
      const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
      const { error: errCorreo } = await admin.auth.resetPasswordForEmail(correo, {
        redirectTo: `${sitio}/auth/actualizar-clave`,
      });
      if (errCorreo) {
        // Sin el correo la cuenta quedaría inaccesible: se deshace para poder reintentar.
        await admin.auth.admin.deleteUser(id);
        throw new ErrorHttp(502, `No se pudo enviar el correo de invitación: ${errCorreo.message}`);
      }
    }
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return respuestaError(e);
  }
}

function traducirError(mensaje: string): string {
  if (/already been registered|already exists/i.test(mensaje)) return "Esa persona ya tiene cuenta en Martha.";
  if (/password/i.test(mensaje)) return "La contraseña no cumple la política de seguridad de Supabase.";
  return mensaje;
}
