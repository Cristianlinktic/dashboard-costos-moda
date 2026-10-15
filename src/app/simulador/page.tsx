"use client";

import { useState } from "react";
import { useMartha } from "@/lib/datos/MarthaProvider";
import { Simulador } from "@/components/Simulador";
import { ChipSelect } from "@/components/Filtros";
import { Package } from "lucide-react";
import { Cargando, Encabezado, Vacio } from "@/components/ui";
import { formatoCOP } from "@/lib/formato";

export default function PaginaSimulador() {
  const { db, cargando } = useMartha();
  const [productoId, setProductoId] = useState("");
  if (cargando) return <Cargando />;
  const producto = db.productos.find((p) => p.id === productoId) ?? db.productos[0];

  return (
    <div>
      <Encabezado
        titulo="Simulador"
        acento="de precios"
        descripcion="Cambia precio, tasa de cambio, flete, proveedor, volumen, descuentos, comisiones o publicidad y compara hasta 3 escenarios."
        datos={producto ? [{ etiqueta: "Simulando", valor: producto.precioVenta, formato: formatoCOP, detalle: producto.nombre }] : undefined}
      />
      {producto ? (
        <Simulador
          key={producto.id}
          producto={producto}
          selector={
            <ChipSelect
              etiqueta="Producto"
              icono={Package}
              valor={producto.id}
              onCambio={(v) => v && setProductoId(v)}
              opciones={db.productos.map((p) => ({ valor: p.id, etiqueta: p.nombre, detalle: p.sku }))}
            />
          }
        />
      ) : (
        <Vacio titulo="Registra un producto para simular" />
      )}
    </div>
  );
}
