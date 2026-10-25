import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { BikeCalendar } from "@/components/BikeCalendar";
import {
  ADMIN_KEY, BIKES, HOURS, addDays, bikeById, busyDays, fmtDate, priceFor, toISO, useReservations,
  type Draft, type Reservation,
} from "@/lib/rentals";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel del operador — Alquiler De Bicis Cusco" },
      { name: "description", content: "Gestioná reservas y calendarios de cada bici." },
      { property: "og:title", content: "Panel del operador — Bicis Cusco" },
      { property: "og:description", content: "Reservas, calendarios y disponibilidad por bici." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [ok, setOk] = useState(false);
  const [key, setKey] = useState("");
  const [err, setErr] = useState(false);

  if (!ok) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-sm px-4 py-12">
          <form onSubmit={(e) => { e.preventDefault(); if (key === ADMIN_KEY) setOk(true); else setErr(true); }} className="rounded-2xl border border-border p-6">
            <Lock className="h-8 w-8 text-primary" />
            <h1 className="mt-3 text-2xl font-bold">Panel del operador</h1>
            <p className="mt-1 text-sm text-muted-foreground">Poné la clave para ver las reservas.</p>
            <input type="password" value={key} onChange={(e) => { setKey(e.target.value); setErr(false); }} placeholder="Clave" className="input mt-4" autoFocus />
            {err && <p role="alert" className="mt-2 text-sm font-medium text-busy-foreground">Esa no es la clave. Probá de nuevo.</p>}
            <button className="mt-4 h-12 w-full rounded-full bg-accent font-semibold text-accent-foreground shadow-cta">Entrar</button>
            <p className="mt-4 rounded-lg bg-secondary p-3 text-center text-sm">Clave de demo: <b className="text-primary">{ADMIN_KEY}</b></p>
          </form>
        </main>
      </div>
    );
  }
  return <Dashboard onLogout={() => { setOk(false); setKey(""); }} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const store = useReservations();
  const [editing, setEditing] = useState<Reservation | "new" | null>(null);
  const [tab, setTab] = useState<"reservas" | "calendarios">("reservas");
  const [showCancelled, setShowCancelled] = useState(false);
  const today = toISO(new Date());
  const rows = store.list
    .filter((r) => showCancelled || r.status === "confirmada")
    .sort((a, b) => a.pickup.localeCompare(b.pickup));
  const active = store.list.filter((r) => r.status === "confirmada");
  const out = active.filter((r) => r.pickup <= today && today < r.dropoff).length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Hola, operador 👋</h1>
          <button onClick={onLogout} className="text-sm font-medium text-primary underline">Salir</button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Reservas activas" value={active.length} />
          <Stat label="Bicis en la calle hoy" value={`${out}/${BIKES.length}`} />
          <Stat label="Ingresos previstos" value={`S/ ${active.reduce((s, r) => s + priceFor(r.bikeId, r.pickup, r.dropoff), 0)}`} accent />
        </div>

        <div className="mt-6 flex gap-2">
          {(["reservas", "calendarios"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`h-11 rounded-full px-5 font-medium capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{t}</button>
          ))}
        </div>

        {tab === "reservas" ? (
          <section className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="h-5 w-5 accent-primary" />Ver canceladas</label>
              <div className="flex gap-2">
                <button onClick={() => confirm("¿Restaurar los datos de ejemplo? Se pierden los cambios.") && store.reset()} className="flex h-11 items-center gap-1 rounded-full border border-border px-4 text-sm"><RotateCcw className="h-4 w-4" />Demo</button>
                <button onClick={() => setEditing("new")} className="flex h-11 items-center gap-1 rounded-full bg-accent px-4 font-semibold text-accent-foreground shadow-cta"><Plus className="h-4 w-4" />Nueva</button>
              </div>
            </div>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {rows.map((r) => {
                const b = bikeById(r.bikeId);
                return (
                  <li key={r.id} className={`rounded-2xl border border-border p-4 ${r.status === "cancelada" ? "opacity-55" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-semibold">{r.name}</p>
                        <p className="text-sm text-muted-foreground">{r.phone}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.status === "confirmada" ? "bg-secondary text-primary" : "bg-busy text-busy-foreground"}`}>{r.status}</span>
                    </div>
                    <p className="mt-2 text-sm"><b>{b.name}</b> "{b.nickname}" · {fmtDate(r.pickup)} → {fmtDate(r.dropoff)} · {r.hour}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display font-bold text-accent">S/ {priceFor(r.bikeId, r.pickup, r.dropoff)}<small className="ml-1 text-xs font-medium text-muted-foreground">{r.payment ? `pagado · ${r.payment.method}` : "paga al retirar"}</small></span>
                      {r.status === "confirmada" && (
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(r)} className="flex h-10 items-center gap-1 rounded-full bg-secondary px-4 text-sm font-medium"><Pencil className="h-4 w-4" />Mover</button>
                          <button onClick={() => confirm(`¿Cancelar la reserva de ${r.name}? Las fechas quedan libres.`) && store.cancel(r.id)} className="flex h-10 items-center gap-1 rounded-full border border-border px-4 text-sm font-medium text-busy-foreground"><X className="h-4 w-4" />Cancelar</button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
              {rows.length === 0 && <li className="rounded-2xl bg-secondary p-6 text-center text-muted-foreground">No hay reservas todavía.</li>}
            </ul>
          </section>
        ) : (
          <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BIKES.map((b) => (
              <div key={b.id} className="rounded-2xl border border-border p-4">
                <p className="mb-2 font-display font-semibold">{b.name} <span className="text-muted-foreground">"{b.nickname}"</span></p>
                <BikeCalendar busy={busyDays(store.list, b.id)} compact />
              </div>
            ))}
          </section>
        )}
      </main>
      {editing && (
        <EditDialog
          initial={editing === "new" ? null : editing}
          list={store.list}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            const res = editing === "new" ? store.create(d) : store.update(editing.id, d);
            if (!res.error) setEditing(null);
            return res.error ?? null;
          }}
        />
      )}
    </div>
  );
}

function EditDialog({ initial, list, onClose, onSave }: { initial: Reservation | null; list: Reservation[]; onClose: () => void; onSave: (d: Draft) => string | null }) {
  const today = toISO(new Date());
  const [d, setD] = useState<Draft>(initial ?? { bikeId: "U1", name: "", phone: "", pickup: today, dropoff: addDays(today, 1), hour: "09:00" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setD({ ...d, [k]: e.target.value }); setError(null); };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-deep/60 sm:items-center" onClick={onClose}>
      <form noValidate onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); setError(onSave(d)); }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{initial ? "Mover reserva" : "Nueva reserva"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <L t="Nombre"><input className="input" value={d.name} onChange={set("name")} placeholder="Ej.: Marco Rossi" /></L>
          <L t="Teléfono"><input className="input" type="tel" value={d.phone} onChange={set("phone")} placeholder="+51 984 000 000" /></L>
          <L t="Bici">
            <select className="input" value={d.bikeId} onChange={set("bikeId")}>
              {BIKES.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.nickname}</option>)}
            </select>
          </L>
          <div className="grid grid-cols-2 gap-3">
            <L t="Retiro"><input className="input" type="date" value={d.pickup} onChange={set("pickup")} /></L>
            <L t="Devolución"><input className="input" type="date" value={d.dropoff} onChange={set("dropoff")} /></L>
          </div>
          <L t="Hora de retiro"><select className="input" value={d.hour} onChange={set("hour")}>{HOURS.map((h) => <option key={h}>{h}</option>)}</select></L>
          <div className="rounded-2xl border border-border p-3">
            <p className="mb-1 text-sm font-medium">Ocupación de {bikeById(d.bikeId).nickname}</p>
            <BikeCalendar compact busy={busyDays(list, d.bikeId, initial?.id)} start={d.pickup} end={d.dropoff}
              onPick={(iso) => { setError(null); setD(iso <= d.pickup ? { ...d, pickup: iso } : { ...d, dropoff: iso }); }} />
          </div>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-busy px-3 py-2 text-sm font-medium text-busy-foreground">{error}</p>}
        <button className="mt-4 h-12 w-full rounded-full bg-accent font-semibold text-accent-foreground shadow-cta">Guardar</button>
      </form>
    </div>
  );
}

function L({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{t}</span>{children}</label>;
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <p className={`font-display text-lg font-bold sm:text-2xl ${accent ? "text-accent" : "text-primary"}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
