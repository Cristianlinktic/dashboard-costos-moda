import { obtenerSupabase, supabaseConfigurado } from "@/lib/supabase/cliente";

/** Buckets de Storage de Martha (prefijados: el proyecto de Supabase es compartido). */
export type Bucket = "martha-imagenes-productos" | "martha-comprobantes";

/**
 * Sube un archivo a Supabase Storage bajo la carpeta de la organización (lo exige la RLS de Storage).
 * Devuelve la URL pública (imágenes) o una URL firmada de 7 días (comprobantes privados).
 * En modo demo devuelve una URL de datos para verla en el navegador.
 */
export async function subirArchivo(bucket: Bucket, archivo: File, organizacionId?: string): Promise<string> {
  if (!supabaseConfigurado) {
    if (archivo.size > 1_500_000) throw new Error("En modo demo el archivo debe pesar menos de 1,5 MB.");
    return await new Promise((ok, falla) => {
      const lector = new FileReader();
      lector.onload = () => ok(String(lector.result));
      lector.onerror = () => falla(lector.error);
      lector.readAsDataURL(archivo);
    });
  }
  if (!organizacionId) throw new Error("Sin organización");
  const supabase = obtenerSupabase();
  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "bin";
  const ruta = `${organizacionId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(ruta, archivo, { contentType: archivo.type });
  if (error) throw new Error(error.message);
  if (bucket === "martha-imagenes-productos") return supabase.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
  const { data, error: errFirma } = await supabase.storage.from(bucket).createSignedUrl(ruta, 60 * 60 * 24 * 7);
  if (errFirma) throw new Error(errFirma.message);
  return data.signedUrl;
}
