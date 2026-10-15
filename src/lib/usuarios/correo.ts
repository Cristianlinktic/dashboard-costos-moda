/**
 * Cuentas de Martha separadas de las otras apps del mismo proyecto de Supabase.
 *
 * Supabase Auth permite una sola cuenta por correo en todo el proyecto (auth.users es
 * compartida). Para que una persona tenga en Martha una contraseña distinta a la de otra app,
 * Martha guarda su cuenta con un alias del correo: «nombre+martha@dominio». La persona escribe
 * siempre su correo normal; la app lo traduce al iniciar sesión, crear o listar usuarios.
 * Los proveedores con «plus addressing» (Gmail, Google Workspace, Outlook) entregan los correos
 * del alias en el mismo buzón.
 */
const SUFIJO = "+martha";

export function correoAuth(correo: string): string {
  const limpio = correo.trim().toLowerCase();
  const arroba = limpio.lastIndexOf("@");
  if (arroba <= 0) return limpio;
  const local = limpio.slice(0, arroba);
  const dominio = limpio.slice(arroba + 1);
  return local.endsWith(SUFIJO) ? limpio : `${local}${SUFIJO}@${dominio}`;
}

export function correoVisible(correo: string | null | undefined): string {
  if (!correo) return "";
  const arroba = correo.lastIndexOf("@");
  if (arroba <= 0) return correo;
  const local = correo.slice(0, arroba);
  return local.endsWith(SUFIJO) ? `${local.slice(0, -SUFIJO.length)}${correo.slice(arroba)}` : correo;
}
