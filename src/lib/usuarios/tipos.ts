import type { Rol } from "@/tipos";

export interface UsuarioEquipo {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  ultimoAcceso?: string | null;
  creadoEn?: string | null;
}

export interface DatosNuevoUsuario {
  nombre: string;
  correo: string;
  rol: Rol;
  /** Contraseña temporal que el admin comparte con la persona. */
  clave: string;
}

export const ROLES: Record<Rol, string> = {
  admin: "Administrador",
  colaborador: "Colaborador",
};

/** Validación compartida cliente/servidor. Devuelve el mensaje de error o null. */
export function validarNuevoUsuario(d: Partial<DatosNuevoUsuario>): string | null {
  if (!d.nombre?.trim()) return "El nombre es obligatorio.";
  if (!d.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) return "Correo inválido.";
  if (d.rol !== "admin" && d.rol !== "colaborador") return "Rol inválido.";
  if (!d.clave || d.clave.length < 8)
    return "La contraseña temporal debe tener al menos 8 caracteres.";
  return null;
}
