"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { useMartha } from "@/lib/datos/MarthaProvider";
import { subirArchivo, type Bucket } from "@/lib/datos/archivos";

export function SubirArchivo({ bucket, aceptar, etiqueta, onSubido }: { bucket: Bucket; aceptar: string; etiqueta: string; onSubido: (url: string) => void }) {
  const { usuario } = useMartha();
  const [estado, setEstado] = useState<string | null>(null);
  return (
    <label className="btn-secundario cursor-pointer">
      <Paperclip className="size-4" />
      {estado ?? etiqueta}
      <input
        type="file"
        accept={aceptar}
        className="sr-only"
        onChange={async (e) => {
          const archivo = e.target.files?.[0];
          if (!archivo) return;
          setEstado("Subiendo…");
          try {
            onSubido(await subirArchivo(bucket, archivo, usuario?.organizacionId));
            setEstado("Archivo listo ✓");
          } catch (err) {
            setEstado(err instanceof Error ? err.message : "Error al subir");
          }
        }}
      />
    </label>
  );
}
