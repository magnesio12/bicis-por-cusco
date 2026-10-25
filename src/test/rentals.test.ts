import { describe, expect, it } from "vitest";
import { isBikeFree, priceFor, validate, type Reservation } from "@/lib/rentals";

const r: Reservation = { id: "A", bikeId: "U1", name: "Lucía", phone: "+51 984 112 307", pickup: "2026-10-10", dropoff: "2026-10-13", hour: "09:00", status: "confirmada", createdAt: "2026-10-01" };
const base = { bikeId: "U1", name: "Marco", phone: "+39 347 552 8190", hour: "10:00" };

describe("reglas de reserva", () => {
  it("rechaza devolución igual o anterior al retiro", () => {
    expect(validate({ ...base, pickup: "2026-10-20", dropoff: "2026-10-20" }, [])).toMatch(/después/);
  });
  it("bloquea fechas superpuestas en la misma bici", () => {
    expect(isBikeFree([r], "U1", "2026-10-12", "2026-10-14")).toBe(false);
  });
  it("no bloquea otra bici", () => {
    expect(isBikeFree([r], "U2", "2026-10-12", "2026-10-14")).toBe(true);
  });
  it("cancelar libera las fechas", () => {
    expect(isBikeFree([{ ...r, status: "cancelada" }], "U1", "2026-10-11", "2026-10-12")).toBe(true);
  });
  it("mover revalida ignorando la propia reserva", () => {
    expect(validate({ ...base, pickup: "2026-10-11", dropoff: "2026-10-14" }, [r], "A")).toBeNull();
  });
  it("falta un campo obligatorio", () => {
    expect(validate({ ...base, name: "", pickup: "2026-10-20", dropoff: "2026-10-21" }, [])).not.toBeNull();
  });
  it("precio: urbana S/35 y montaña S/55 por día", () => {
    expect(priceFor("U1", "2026-10-01", "2026-10-03")).toBe(70);
    expect(priceFor("M1", "2026-10-01", "2026-10-02")).toBe(55);
  });
});
