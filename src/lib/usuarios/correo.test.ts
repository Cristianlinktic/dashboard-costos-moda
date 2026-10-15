import { describe, expect, it } from "vitest";
import { correoAuth, correoVisible } from "./correo";

describe("correo de la cuenta de Martha (alias +martha)", () => {
  it("convierte el correo normal en el alias de Martha", () => {
    expect(correoAuth("Cristian.Sabogal@LinkTIC.com ")).toBe("cristian.sabogal+martha@linktic.com");
    expect(correoAuth("laura+ventas@fajas.co")).toBe("laura+ventas+martha@fajas.co");
  });
  it("no duplica el alias", () => {
    expect(correoAuth("ana+martha@fajas.co")).toBe("ana+martha@fajas.co");
  });
  it("muestra siempre el correo normal", () => {
    expect(correoVisible("cristian.sabogal+martha@linktic.com")).toBe("cristian.sabogal@linktic.com");
    expect(correoVisible("otro@app.com")).toBe("otro@app.com");
    expect(correoVisible(null)).toBe("");
  });
  it("ida y vuelta", () => {
    const c = "maria.lopez@empresa.com";
    expect(correoVisible(correoAuth(c))).toBe(c);
  });
});
