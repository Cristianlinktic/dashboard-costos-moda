// Cambiar rol, activar/desactivar o asignar contraseña a un usuario de la organización (solo administradores).
import { APP_ID } from "@/lib/supabase/cliente";
import { ErrorHttp, exigirAdmin, respuestaError } from "@/lib/supabase/servidor";
import type { Rol } from "@/tipos";

export const dynamic = "force-dynamic";

const BANEO_INDEFINIDO = "876000h"; // ~100 años

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { llamante, admin } = await exigirAdmin(request);
    const cambios = (await request.json()) as { rol?: Rol; activo?: boolean; clave?: string };
    if (cambios.clave !== undefined && (typeof cambios.clave !== "string" || cambios.clave.length < 8))
      throw new ErrorHttp(400, "La contraseña debe tener al menos 8 caracteres.");

    if (cambios.rol !== undefined && cambios.rol !== "admin" && cambios.rol !== "colaborador")
      throw new ErrorHttp(400, "Rol inválido.");
    if (cambios.activo !== undefined && typeof cambios.activo !== "boolean")
      throw new ErrorHttp(400, "Valor de «activo» inválido.");
    if (id === llamante.id && (cambios.rol === "colaborador" || cambios.activo === false))
      throw new ErrorHttp(400, "No puedes quitarte el rol de administrador ni desactivarte a ti mismo.");

    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error || !data.user) throw new ErrorHttp(404, "Usuario no encontrado.");
    const meta = data.user.app_metadata ?? {};
    if (meta.app !== APP_ID || meta.organizacion_id !== llamante.organizacionId)
      throw new ErrorHttp(404, "Usuario no encontrado.");

    const nuevaMeta = {
      ...meta,
      ...(cambios.rol !== undefined && { rol: cambios.rol }),
      ...(cambios.activo !== undefined && { activo: cambios.activo }),
    };
    const { error: errUpd } = await admin.auth.admin.updateUserById(id, {
      app_metadata: nuevaMeta,
      // Un usuario desactivado no puede iniciar sesión ni refrescar su token.
      ...(cambios.activo !== undefined && { ban_duration: cambios.activo ? "none" : BANEO_INDEFINIDO }),
      // Sin recuperación por cuenta propia: el administrador asigna una contraseña nueva.
      ...(cambios.clave !== undefined && { password: cambios.clave }),
    });
    if (errUpd) throw new ErrorHttp(500, errUpd.message);
    // El trigger on_auth_user_app_metadata sincroniza la tabla perfiles.
    return Response.json({ ok: true });
  } catch (e) {
    return respuestaError(e);
  }
}
