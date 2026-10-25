import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { bikeById, findReservation, fmtDate, HOURS, priceFor, useReservations } from "@/lib/rentals";

export const Route = createFileRoute("/gestionar")({
  head: () => ({ meta: [
    { title: "Gestionar reserva — Alquiler De Bicis Cusco" },
    { name: "description", content: "Consultá, cambiá las fechas o cancelá tu reserva con tu correo y código." },
    { property: "og:title", content: "Gestionar reserva — Bicis Cusco" },
    { property: "og:description", content: "Tu reserva de bici en Cusco, con tu correo y código." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ManageReservation,
});

function ManageReservation() {
  const store = useReservations();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [access, setAccess] = useState<{ email: string; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [hour, setHour] = useState("09:00");
  const reservation = access ? findReservation(store.list, access.email, access.code) : undefined;
  const bike = reservation ? bikeById(reservation.bikeId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        <CalendarDays className="h-9 w-9 text-accent" />
        <h1 className="mt-3 text-2xl font-bold">Gestionar reserva</h1>
        {!reservation ? (
          <form noValidate className="mt-6 space-y-4" onSubmit={(e) => {
            e.preventDefault(); setNotice(null);
            const found = findReservation(store.list, email, code);
            if (!found) { setError("No encontramos una reserva con ese correo y código. Revisá ambos datos y usá el navegador donde reservaste."); return; }
            setAccess({ email, code }); setError(null); setEditing(false); setCancelling(false);
          }}>
            <Field label="Correo electrónico"><input type="email" required autoComplete="email" className="input" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder="tu@correo.com" /></Field>
            <Field label="Código de reserva"><input required autoCapitalize="characters" spellCheck={false} className="input" value={code} onChange={(e) => { setCode(e.target.value); setError(null); }} placeholder="BC-XXXXX" /></Field>
            <p className="text-sm text-muted-foreground">Las reservas de esta demo se guardan solo en el navegador donde las hiciste.</p>
            {error && <p role="alert" className="rounded-lg bg-busy p-3 text-sm text-busy-foreground">{error}</p>}
            <Button disabled={!store.ready} type="submit" className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"><Search />Buscar reserva</Button>
          </form>
        ) : (
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <p className="font-display text-xl font-bold text-primary">{reservation.id}</p>
              <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${reservation.status === "confirmada" ? "bg-secondary text-primary" : "bg-busy text-busy-foreground"}`}>{reservation.status}</span>
            </div>
            <dl className="space-y-3 py-5 text-sm">
              <Row label="Nombre" value={reservation.name} />
              <Row label="Correo" value={reservation.email ?? "—"} />
              <Row label="Bici" value={`${bike?.name} · ${bike?.nickname}`} />
              <Row label="Retiro" value={`${fmtDate(reservation.pickup)} · ${reservation.hour}`} />
              <Row label="Devolución" value={fmtDate(reservation.dropoff)} />
              <Row label="Total" value={`S/ ${priceFor(reservation.bikeId, reservation.pickup, reservation.dropoff)}`} />
              <Row label="Pago" value={reservation.payment ? `Simulado · ${reservation.payment.method} · ${reservation.payment.ref}` : "Al retirar"} />
            </dl>
            {notice && <p role="status" className="mb-4 rounded-lg bg-secondary p-3 text-sm text-primary">{notice}</p>}
            {reservation.status === "confirmada" && !editing && !cancelling && (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => { setPickup(reservation.pickup); setDropoff(reservation.dropoff); setHour(reservation.hour); setEditing(true); setError(null); setNotice(null); }}><CalendarDays />Cambiar fechas</Button>
                <Button variant="outline" onClick={() => { setCancelling(true); setNotice(null); }}><X />Cancelar reserva</Button>
              </div>
            )}
            {editing && <form noValidate className="space-y-4 border-t border-border pt-5" onSubmit={(e) => {
              e.preventDefault();
              const result = store.update(reservation.id, { ...reservation, pickup, dropoff, hour });
              if (result.error) { setError(result.error); return; }
              setEditing(false); setError(null); setNotice("¡Listo! Guardamos las nuevas fechas de tu reserva.");
            }}>
              <h2 className="font-semibold">Cambiar fechas</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Retiro"><input type="date" className="input" value={pickup} onChange={(e) => setPickup(e.target.value)} /></Field>
                <Field label="Devolución"><input type="date" className="input" value={dropoff} onChange={(e) => setDropoff(e.target.value)} /></Field>
              </div>
              <Field label="Hora de retiro"><select className="input" value={hour} onChange={(e) => setHour(e.target.value)}>{HOURS.map((h) => <option key={h}>{h}</option>)}</select></Field>
              <p className="text-sm text-muted-foreground">Nuevo total: S/ {priceFor(reservation.bikeId, pickup, dropoff)} · El pago sigue siendo simulado; no se cobra ni se devuelve dinero.</p>
              {error && <p role="alert" className="text-sm text-busy-foreground">{error}</p>}
              <div className="flex gap-3"><Button type="submit">Guardar cambios</Button><Button type="button" variant="outline" onClick={() => { setEditing(false); setError(null); }}>Volver</Button></div>
            </form>}
            {cancelling && <div className="space-y-4 border-t border-border pt-5">
              <p>¿Cancelar tu reserva? La bici quedará libre. No hay reembolso porque el pago fue simulado.</p>
              <div className="flex flex-wrap gap-3"><Button variant="destructive" onClick={() => { store.cancel(reservation.id); setCancelling(false); setNotice("Tu reserva quedó cancelada."); }}>Sí, cancelar</Button><Button variant="outline" onClick={() => setCancelling(false)}>Conservar reserva</Button></div>
            </div>}
            <Button variant="link" className="mt-6 px-0" onClick={() => { setAccess(null); setCode(""); setEditing(false); setCancelling(false); setError(null); setNotice(null); }}>Consultar otra reserva</Button>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}</label>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="shrink-0 text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-medium">{value}</dd></div>;
}