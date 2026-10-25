import { useCallback, useEffect, useState } from "react";

export type BikeType = "urbana" | "montana";
export interface Bike { id: string; type: BikeType; name: string; nickname: string }
export interface Reservation {
  id: string;
  bikeId: string;
  name: string;
  phone: string;
  pickup: string; // YYYY-MM-DD
  dropoff: string; // YYYY-MM-DD, exclusive day (bike free that day)
  hour: string; // HH:MM pickup time
  status: "confirmada" | "cancelada";
  createdAt: string;
  payment?: { method: "tarjeta" | "yape"; ref: string } | undefined;
}

export const BIKE_TYPES: Record<BikeType, { label: string; price: number; blurb: string; emoji: string }> = {
  urbana: { label: "Bici urbana", price: 35, blurb: "Cómoda, con canasta y cambios. Ideal para San Blas, el centro y el Mercado San Pedro.", emoji: "🚲" },
  montana: { label: "Bici de montaña", price: 55, blurb: "Suspensión delantera y frenos de disco. Para subir a Sacsayhuamán o bajar al Valle.", emoji: "🚵" },
};

export const BIKES: Bike[] = [
  { id: "U1", type: "urbana", name: "Urbana #1", nickname: "Qori" },
  { id: "U2", type: "urbana", name: "Urbana #2", nickname: "Inti" },
  { id: "U3", type: "urbana", name: "Urbana #3", nickname: "Killa" },
  { id: "U4", type: "urbana", name: "Urbana #4", nickname: "Wayra" },
  { id: "M1", type: "montana", name: "Montaña #1", nickname: "Apu" },
  { id: "M2", type: "montana", name: "Montaña #2", nickname: "Kuntur" },
  { id: "M3", type: "montana", name: "Montaña #3", nickname: "Puma" },
];

export const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
export const ADMIN_KEY = "cusco2024";
const STORAGE_KEY = "bicis-cusco-v1";

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromISO = (s: string) => { const [y = 0, m = 1, d = 1] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = fromISO(s); d.setDate(d.getDate() + n); return toISO(d); };
export const daysBetween = (a: string, b: string) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);
export const bikeById = (id: string) => BIKES.find((b) => b.id === id)!;
export const priceFor = (bikeId: string, pickup: string, dropoff: string) =>
  BIKE_TYPES[bikeById(bikeId).type].price * Math.max(0, daysBetween(pickup, dropoff));
export const fmtDate = (s: string) =>
  fromISO(s).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" });

/** Ranges are [pickup, dropoff): the return day is free for the next rider. */
export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

export function isBikeFree(list: Reservation[], bikeId: string, pickup: string, dropoff: string, ignoreId?: string) {
  return !list.some((r) => r.status === "confirmada" && r.bikeId === bikeId && r.id !== ignoreId && overlaps(pickup, dropoff, r.pickup, r.dropoff));
}

export function busyDays(list: Reservation[], bikeId: string, ignoreId?: string) {
  const set = new Set<string>();
  for (const r of list) {
    if (r.status !== "confirmada" || r.bikeId !== bikeId || r.id === ignoreId) continue;
    for (let d = r.pickup; d < r.dropoff; d = addDays(d, 1)) set.add(d);
  }
  return set;
}

export type Draft = Omit<Reservation, "id" | "status" | "createdAt">;
export function validate(d: Draft, list: Reservation[], ignoreId?: string): string | null {
  if (!d.name.trim() || !d.phone.trim() || !d.bikeId || !d.pickup || !d.dropoff || !d.hour) return "Completá todos los campos.";
  if (d.phone.replace(/\D/g, "").length < 7) return "Revisá el teléfono, parece incompleto.";
  if (d.dropoff <= d.pickup) return "La devolución tiene que ser después del retiro.";
  if (!HOURS.includes(d.hour)) return "Retiramos de 8:00 a 18:00.";
  if (!isBikeFree(list, d.bikeId, d.pickup, d.dropoff, ignoreId)) return "Esa bici ya está reservada en esas fechas. Probá con otra o cambiá los días.";
  return null;
}

let counter = 0;
const newId = () => `BC-${Date.now().toString(36).slice(-4).toUpperCase()}${(counter++ % 36).toString(36).toUpperCase()}`;

export function seed(): Reservation[] {
  const now = new Date();
  const m = (day: number) => toISO(new Date(now.getFullYear(), now.getMonth(), day));
  const rows: [string, string, string, number, number, string][] = [
    ["U1", "Lucía Fernández", "+51 984 112 307", 3, 6, "09:00"],
    ["U1", "Marco Rossi", "+39 347 552 8190", 14, 17, "10:00"],
    ["U2", "Diego Quispe", "+51 951 640 228", 8, 10, "08:00"],
    ["U3", "Anna Schmidt", "+49 151 2384 7712", 20, 25, "11:00"],
    ["U4", "Sofía Huamán", "+51 974 305 816", 11, 12, "16:00"],
    ["M1", "Tom Becker", "+44 7700 900 412", 5, 9, "08:00"],
    ["M1", "Camila Rojas", "+56 9 6123 4471", 22, 24, "09:00"],
    ["M2", "Julien Moreau", "+33 6 12 48 90 37", 15, 19, "10:00"],
    ["M3", "Renzo Mamani", "+51 962 778 150", 26, 28, "14:00"],
  ];
  return rows.map(([bikeId, name, phone, a, b, hour], i) => ({
    id: `BC-DEMO${i + 1}`, bikeId, name, phone, pickup: m(a), dropoff: m(b), hour, status: "confirmada", createdAt: m(1),
  }));
}

function load(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const s = seed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

export function useReservations() {
  const [list, setList] = useState<Reservation[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setList(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) setList(load()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const save = useCallback((next: Reservation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setList(next);
  }, []);
  const create = (d: Draft) => {
    const err = validate(d, list);
    if (err) return { error: err };
    const r: Reservation = { ...d, id: newId(), status: "confirmada", createdAt: toISO(new Date()) };
    save([...list, r]);
    return { reservation: r };
  };
  const update = (id: string, d: Draft) => {
    const err = validate(d, list, id);
    if (err) return { error: err };
    save(list.map((r) => (r.id === id ? { ...r, ...d } : r)));
    return {};
  };
  const cancel = (id: string) => save(list.map((r) => (r.id === id ? { ...r, status: "cancelada" as const } : r)));
  const reset = () => save(seed());
  return { list, ready, create, update, cancel, reset };
}
