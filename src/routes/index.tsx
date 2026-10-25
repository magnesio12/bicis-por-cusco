import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { BikeCalendar } from "@/components/BikeCalendar";
import { PaymentSheet, type PaymentInfo } from "@/components/PaymentSheet";
import {
  BIKES, BIKE_TYPES, HOURS, validate, busyDays, daysBetween, fmtDate, isBikeFree, priceFor, useReservations,
  type BikeType, type Reservation,
} from "@/lib/rentals";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alquiler De Bicis Cusco — Reservá tu bici en minutos" },
      { name: "description", content: "Mirá qué bicis están libres y reservá sola/o, sin escribir por Instagram. Urbanas S/35 y de montaña S/55 por día." },
      { property: "og:title", content: "Alquiler De Bicis Cusco" },
      { property: "og:description", content: "Bicis urbanas y de montaña en Cusco. Disponibilidad real y reserva al toque." },
    ],
  }),
  component: Index,
});

function Index() {
  const { list, create } = useReservations();
  const [type, setType] = useState<BikeType>("urbana");
  const [pickup, setPickup] = useState<string>();
  const [dropoff, setDropoff] = useState<string>();
  const [bikeId, setBikeId] = useState<string>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hour, setHour] = useState("09:00");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Reservation | null>(null);
  const [paying, setPaying] = useState(false);

  const bikes = BIKES.filter((b) => b.type === type);
  // Days where every bike of this type is busy
  const allBusy = useMemo(() => {
    const sets = bikes.map((b) => busyDays(list, b.id));
    return new Set([...(sets[0] ?? [])].filter((d) => sets.every((s) => s.has(d))));
  }, [list, type]);

  const pick = (iso: string) => {
    setError(null); setBikeId(undefined);
    if (!pickup || dropoff || iso <= pickup) { setPickup(iso); setDropoff(undefined); }
    else setDropoff(iso);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(draft, list);
    if (err) return setError(err);
    setPaying(true); // abre la pasarela de pago (PaymentSheet)
  };
  const draft = { bikeId: bikeId ?? "", name, phone, pickup: pickup ?? "", dropoff: dropoff ?? "", hour };
  // PASARELA DE PAGO: único punto donde la reserva se guarda después de pagar.
  // Con cobro real, la confirmación llega del webhook del procesador, no de acá.
  const onPaid = (payment: PaymentInfo) => {
    setPaying(false);
    const res = create({ ...draft, payment });
    if (res.error) return setError(res.error);
    setDone(res.reservation!);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => { setDone(null); setPickup(undefined); setDropoff(undefined); setBikeId(undefined); setName(""); setPhone(""); setError(null); };

  if (done) {
    const b = BIKES.find((x) => x.id === done.bikeId)!;
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-10 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
          <h1 className="mt-4 text-2xl font-bold">¡Listo, {done.name.split(" ")[0]}! Tu bici te espera.</h1>
          <p className="mt-2 text-muted-foreground">Guardá este código y mostralo al retirar.</p>
          <p className="mt-4 inline-block rounded-xl bg-secondary px-5 py-3 font-display text-2xl font-bold tracking-wider text-primary">{done.id}</p>
          <dl className="mt-6 space-y-3 rounded-2xl border border-border p-5 text-left text-sm">
            <Row k="Bici" v={`${b.name} · "${b.nickname}"`} />
            <Row k="Retiro" v={`${fmtDate(done.pickup)} · ${done.hour}`} />
            <Row k="Devolución" v={`${fmtDate(done.dropoff)} · antes de las 18:00`} />
            <Row k={`Pagado con ${done.payment?.method === "yape" ? "Yape" : "tarjeta"}`} v={<span className="font-bold text-accent">S/ {priceFor(done.bikeId, done.pickup, done.dropoff)}</span>} />
            <Row k="Comprobante" v={done.payment?.ref ?? "—"} />
          </dl>
          <p className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />Calle Tandapata 352, San Blas</p>
          <button onClick={restart} className="mt-8 h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground">Hacer otra reserva</button>
        </main>
      </div>
    );
  }

  const nights = pickup && dropoff ? daysBetween(pickup, dropoff) : 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      <SiteHeader />
      <section className="bg-hero px-4 pb-8 pt-6 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">Tu bici en Cusco,<br /><span className="text-accent">sin esperar respuesta.</span></h1>
          <p className="mt-2 max-w-md text-primary-foreground/85">Elegí la bici, marcá los días y listo. Ves la disponibilidad real, al momento.</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-primary-foreground/80"><Clock className="h-4 w-4" />Retiros de 8:00 a 18:00 · San Blas</p>
        </div>
      </section>

      <form onSubmit={submit} noValidate className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Step n={1} title="¿Qué bici querés?">
            <div className="grid gap-3">
              {(Object.keys(BIKE_TYPES) as BikeType[]).map((t) => {
                const info = BIKE_TYPES[t];
                const active = t === type;
                return (
                  <button key={t} type="button" onClick={() => { setType(t); setBikeId(undefined); setError(null); }}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${active ? "border-primary bg-secondary" : "border-border"}`}>
                    <span className="text-3xl" aria-hidden>{info.emoji}</span>
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-display font-semibold">{info.label}</span>
                        <span className="font-display font-bold text-accent">S/ {info.price}<small className="text-xs font-medium">/día</small></span>
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{info.blurb}</span>
                      <span className="mt-1 block text-xs font-medium text-primary">{BIKES.filter((b) => b.type === t).length} unidades</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>

          <Step n={2} title={!pickup ? "Tocá el día de retiro" : !dropoff ? "Ahora el día de devolución" : `${nights} ${nights === 1 ? "día" : "días"} de pedaleo`}>
            <div className="rounded-2xl border border-border p-3">
              <BikeCalendar busy={allBusy} start={pickup} end={dropoff} onPick={pick} />
            </div>
            {pickup && <p className="mt-2 text-sm text-muted-foreground">Retiro: <b className="text-foreground">{fmtDate(pickup)}</b>{dropoff && <> · Devolución: <b className="text-foreground">{fmtDate(dropoff)}</b></>}</p>}
          </Step>
        </div>

        <div className="space-y-6">
          <Step n={3} title="Elegí tu bici">
            {!(pickup && dropoff) ? (
              <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">Marcá las fechas y te mostramos qué bicis están libres.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {bikes.map((b) => {
                  const free = isBikeFree(list, b.id, pickup, dropoff);
                  const active = bikeId === b.id;
                  return (
                    <button key={b.id} type="button" disabled={!free} onClick={() => { setBikeId(b.id); setError(null); }}
                      className={`min-h-16 rounded-2xl border-2 p-3 text-left transition ${!free ? "border-border bg-busy/50 opacity-60" : active ? "border-accent bg-accent/10" : "border-border"}`}>
                      <span className="block font-display font-semibold">{b.nickname}</span>
                      <span className="text-xs text-muted-foreground">{b.name}</span>
                      <span className={`mt-1 block text-xs font-semibold ${free ? "text-primary" : "text-busy-foreground"}`}>{free ? "Libre" : "Ocupada"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          <Step n={4} title="Tus datos">
            <div className="space-y-3">
              <Field label="Nombre y apellido"><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Lucía Fernández" autoComplete="name" className="input" /></Field>
              <Field label="WhatsApp o teléfono"><input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+51 984 000 000" autoComplete="tel" className="input" /></Field>
              <Field label="Hora de retiro">
                <select value={hour} onChange={(e) => setHour(e.target.value)} className="input">
                  {HOURS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </Field>
            </div>
          </Step>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur lg:col-span-2">
          <div className="mx-auto max-w-5xl">
            {error && <p role="alert" className="mb-2 rounded-lg bg-busy px-3 py-2 text-sm font-medium text-busy-foreground">{error}</p>}
            <button type="submit" className="flex h-14 w-full items-center justify-between rounded-full bg-accent px-6 font-display font-semibold text-accent-foreground shadow-cta active:scale-[0.99]">
              <span>Ir a pagar</span>
              <span>{bikeId && pickup && dropoff ? `S/ ${priceFor(bikeId, pickup, dropoff)}` : "→"}</span>
            </button>
          </div>
        </div>
      </form>
      {/* PASARELA DE PAGO: se abre al validar la reserva. El monto es el total calculado. */}
      {paying && bikeId && pickup && dropoff && (
        <PaymentSheet amount={priceFor(bikeId, pickup, dropoff)} summary={`${BIKES.find((b) => b.id === bikeId)!.nickname} · ${nights} ${nights === 1 ? "día" : "días"}`} onPaid={onPaid} onClose={() => setPaying(false)} />
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>{title}
      </h2>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}</label>;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
}
