import { describe, expect, it } from "vitest";
import { crearSemilla } from "@/lib/datos/semilla";
import { construirExcel, construirPdfDashboard, construirPdfProducto } from "./index";

describe("exportación", () => {
  const db = crearSemilla();

  it("genera un Excel con hojas de productos, costos, lotes y precios", async () => {
    const { libro, nombre } = await construirExcel(db);
    expect(libro.worksheets.map((h) => h.name)).toEqual(["Productos", "Costos", "Lotes", "Historial de precios"]);
    expect(libro.getWorksheet("Productos")!.rowCount).toBe(db.productos.length + 1);
    expect(libro.getWorksheet("Costos")!.rowCount).toBe(db.costos.length + 1);
    const buffer = await libro.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(5000);
    expect(nombre).toMatch(/^martha-general-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it("filtra el Excel por producto", async () => {
    const { libro } = await construirExcel(db, "p-faja-clasica");
    expect(libro.getWorksheet("Productos")!.rowCount).toBe(2);
  });

  it("genera el PDF de un producto y del dashboard", async () => {
    const producto = await construirPdfProducto(db, "p-body-shaper");
    expect(producto!.nombre).toContain("BOD-SEA-002");
    expect(producto!.doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(producto!.doc.output("arraybuffer").byteLength).toBeGreaterThan(3000);
    const dashboard = await construirPdfDashboard(db);
    expect(dashboard.doc.output("arraybuffer").byteLength).toBeGreaterThan(3000);
    expect(await construirPdfProducto(db, "no-existe")).toBeNull();
  });
});
