// Gestión de usuarios del equipo. Solo servidor: usa SUPABASE_SERVICE_ROLE_KEY tras validar
// que quien llama es administrador activo de la organización.
import { APP_ID } from "@/lib/supabase/cliente";
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
          correo: p.correo ?? data.user?.email ?? "",
          rol: p.rol,
          activo: p.activo,
          creadoEn: p.creado_en,
          ultimoAcceso: data.user?.last_sign_in_at ?? null,
          invitacionPendiente: Boolean(data.user?.invited_at && !data.user?.last_sign_in_at),
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

    const correo = datos.correo.trim().toLowerCase();
    // organizacion_id y rol van en app_metadata: el usuario no puede modificarlos.
    // app = 'martha' identifica al usuario como de esta app en auth.users (compartida con otras apps).
    const appMetadata = { app: APP_ID, organizacion_id: llamante.organizacionId, rol: datos.rol, activo: true };
    const userMetadata = { nombre: datos.nombre.trim() };

    let id: string;
    if (datos.metodo === "clave") {
      const { data, error } = await admin.auth.admin.createUser({
        email: correo,
        password: datos.clave,
        email_confirm: true,
        user_metadata: userMetadata,
        app_metadata: appMetadata,
      });
      if (error) throw new ErrorHttp(400, traducirError(error.message));
      id = data.user.id;
    } else {
      const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
      const { data, error } = await admin.auth.admin.inviteUserByEmail(correo, {
        data: userMetadata,
        redirectTo: `${sitio}/auth/actualizar-clave`,
      });
      if (error) throw new ErrorHttp(400, traducirError(error.message));
      id = data.user.id;
      // La invitación no admite app_metadata: se asigna enseguida (el trigger crea el perfil).
      const { error: errMeta } = await admin.auth.admin.updateUserById(id, { app_metadata: appMetadata });
      if (errMeta) {
        await admin.auth.admin.deleteUser(id);
        throw new ErrorHttp(500, errMeta.message);
      }
    }
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return respuestaError(e);
  }
}

function traducirError(mensaje: string): string {
  if (/already been registered|already exists/i.test(mensaje)) return "Ya existe un usuario con ese correo.";
  if (/password/i.test(mensaje)) return "La contraseña no cumple la política de seguridad de Supabase.";
  return mensaje;
}
