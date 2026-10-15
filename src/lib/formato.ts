import type { CodigoMoneda } from "@/tipos";

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** $ 1.234.567 */
export function formatoCOP(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return cop.format(Math.round(valor)).replace(/ /g, " ");
}

/** Formatea en cualquier moneda (COP sin decimales, el resto con 2). */
export function formatoMoneda(valor: number | null | undefined, moneda: CodigoMoneda = "COP"): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  if (moneda === "COP") return formatoCOP(valor);
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda, maximumFractionDigits: 2 })
    .format(valor)
    .replace(/ /g, " ");
}

/** $ 28,4 M · $ 950 mil — cifras grandes para tarjetas. */
export function formatoCompacto(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  const abs = Math.abs(valor);
  const signo = valor < 0 ? "−" : "";
  const num = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 1 });
  if (abs >= 1e9) return `${signo}$ ${num(abs / 1e9)} mil M`;
  if (abs >= 1e6) return `${signo}$ ${num(abs / 1e6)} M`;
  if (abs >= 1e4) return `${signo}$ ${num(abs / 1e3)} mil`;
  return formatoCOP(valor);
}

/** 43,3 % */
export function formatoPct(valor: number | null | undefined, decimales = 1): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return `${(valor * 100).toLocaleString("es-CO", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}

export function formatoNumero(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return valor.toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

export function formatoFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatoMes(yyyyMm: string): string {
  const d = new Date(`${yyyyMm}-15T12:00:00`);
  return d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}
