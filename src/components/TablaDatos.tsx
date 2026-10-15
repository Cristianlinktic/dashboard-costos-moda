"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from "lucide-react";
import { TituloTarjeta, cx } from "./ui";

export interface Columna<T> {
  clave: string;
  titulo: string;
  render: (fila: T) => ReactNode;
  alinear?: "izq" | "der" | "centro";
  /** Si se define, la columna se puede ordenar con un clic. */
  ordenar?: (fila: T) => number | string | null | undefined;
  /** Columna que encabeza la tarjeta en móvil. */
  principal?: boolean;
  /** Acciones de la fila: en móvil van al pie de la tarjeta. */
  acciones?: boolean;
  /** No mostrar en la tarjeta móvil. */
  ocultarEnMovil?: boolean;
  className?: string;
}

/**
 * Tabla de datos de Martha: cabecera con ícono y conteo, orden por columna (aria-sort),
 * filas con acento al pasar el cursor y, en pantallas pequeñas, tarjetas apiladas.
 */
export function TablaDatos<T>({
  columnas,
  filas,
  clave,
  icono,
  titulo,
  descripcion,
  accion,
  vacio = "No hay registros para mostrar.",
  ordenInicial,
  sinMarco,
}: {
  columnas: Columna<T>[];
  filas: T[];
  clave: (fila: T) => string;
  icono?: LucideIcon;
  titulo?: ReactNode;
  descripcion?: ReactNode;
  accion?: ReactNode;
  vacio?: ReactNode;
  ordenInicial?: { clave: string; dir: "asc" | "desc" };
  /** Sin tarjeta contenedora (cuando ya está dentro de una). */
  sinMarco?: boolean;
}) {
  const [orden, setOrden] = useState(ordenInicial);

  const ordenadas = useMemo(() => {
    const col = columnas.find((c) => c.clave === orden?.clave);
    if (!col?.ordenar || !orden) return filas;
    const f = col.ordenar;
    return [...filas].sort((a, b) => {
      const va = f(a) ?? "";
      const vb = f(b) ?? "";
      const r = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
      return orden.dir === "asc" ? r : -r;
    });
  }, [filas, columnas, orden]);

  const alternar = (c: Columna<T>) =>
    setOrden((o) => (o?.clave === c.clave ? { clave: c.clave, dir: o.dir === "asc" ? "desc" : "asc" } : { clave: c.clave, dir: typeof c.ordenar?.(filas[0]) === "number" ? "desc" : "asc" }));

  const alineacion = (c: Columna<T>) => (c.alinear === "der" ? "text-right" : c.alinear === "centro" ? "text-center" : "text-left");
  const principal = columnas.find((c) => c.principal) ?? columnas[0];
  const acciones = columnas.find((c) => c.acciones);
  const resto = columnas.filter((c) => c !== principal && c !== acciones && !c.ocultarEnMovil);

  const contenido = (
    <>
      {(titulo || icono) && (
        <div className="px-5 pt-5">
          <TituloTarjeta
            icono={icono ?? ArrowUpDown}
            titulo={
              <>
                {titulo} <span className="ml-1 rounded-full bg-marca-suave px-2 py-0.5 align-middle text-xs font-bold text-marca">{filas.length}</span>
              </>
            }
            descripcion={descripcion}
            accion={accion}
          />
        </div>
      )}

      {filas.length === 0 ? (
        <div className="px-5 pb-8 pt-4 text-center text-sm text-tinta-tenue">{vacio}</div>
      ) : (
        <>
          {/* Escritorio / tablet */}
          <div className="hidden overflow-x-auto md:block">
            <table className="tabla">
              <thead>
                <tr>
                  {columnas.map((c) => {
                    const activa = orden?.clave === c.clave;
                    return (
                      <th
                        key={c.clave}
                        className={cx(alineacion(c), c.className)}
                        aria-sort={activa ? (orden!.dir === "asc" ? "ascending" : "descending") : c.ordenar ? "none" : undefined}
                      >
                        {c.ordenar ? (
                          <button
                            type="button"
                            onClick={() => alternar(c)}
                            className={cx("group inline-flex cursor-pointer items-center gap-1 uppercase hover:text-marca", activa && "text-marca", c.alinear === "der" && "flex-row-reverse")}
                          >
                            {c.titulo}
                            {activa ? (
                              orden!.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                            ) : (
                              <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                            )}
                          </button>
                        ) : (
                          c.titulo
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((f) => (
                  <tr key={clave(f)}>
                    {columnas.map((c) => (
                      <td key={c.clave} className={cx(alineacion(c), c.alinear === "der" && "tabular-nums whitespace-nowrap", c.className)}>
                        {c.render(f)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas apiladas */}
          <ul className="space-y-2.5 p-3 md:hidden">
            {ordenadas.map((f) => (
              <li key={clave(f)} className="rounded-xl border border-linea bg-superficie/70 p-3.5">
                <div className="min-w-0">{principal.render(f)}</div>
                {resto.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-linea pt-3 text-sm">
                    {resto.map((c) => (
                      <div key={c.clave} className="min-w-0">
                        <dt className="text-[11px] font-semibold tracking-wide text-tinta-tenue uppercase">{c.titulo}</dt>
                        <dd className="mt-0.5 min-w-0 tabular-nums">{c.render(f)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {acciones && <div className="mt-3 flex justify-end gap-1 border-t border-linea pt-2">{acciones.render(f)}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );

  return sinMarco ? contenido : <section className="tarjeta-luz overflow-hidden">{contenido}</section>;
}
