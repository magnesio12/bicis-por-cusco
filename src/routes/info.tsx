import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, MapPin, Music2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { BIKE_TYPES, BIKES, type BikeType } from "@/lib/rentals";

// Datos de ejemplo (dirección, enlaces y redes): reemplazar por los reales. Ver README §9.
const ADDRESS = "Calle Tandapata 352, San Blas, Cusco";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
const SOCIALS = [
  { label: "Instagram", handle: "@bicis.cusco", url: "https://instagram.com/bicis.cusco", Icon: Instagram },
  { label: "Facebook", handle: "Bicis Cusco", url: "https://facebook.com/bicis.cusco", Icon: Facebook },
  { label: "TikTok", handle: "@bicis.cusco", url: "https://tiktok.com/@bicis.cusco", Icon: Music2 },
];

export const Route = createFileRoute("/info")({
  head: () => ({
    meta: [
      { title: "Servicios, horarios y ubicación — Alquiler De Bicis Cusco" },
      { name: "description", content: "Qué bicis alquilamos, dónde estamos en San Blas, horarios de atención y nuestras redes." },
      { property: "og:title", content: "Info — Alquiler De Bicis Cusco" },
      { property: "og:description", content: "Servicios, ubicación en Google Maps, horarios y redes sociales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Info,
});

function Info() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <SiteHeader />
      <section className="bg-hero px-4 pb-8 pt-6 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-extrabold leading-tight">Conocenos</h1>
          <p className="mt-2 max-w-md text-primary-foreground/85">Somos un taller chico de San Blas. Alquilamos bicis cuidadas para que recorras Cusco a tu ritmo.</p>
        </div>
      </section>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-2">
        <section className="space-y-3 md:col-span-2">
          <h2 className="text-xl font-bold">Servicios</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(BIKE_TYPES) as BikeType[]).map((t) => (
              <div key={t} className="rounded-2xl border border-border p-4">
                <p className="flex items-baseline justify-between font-display font-semibold">
                  <span>{BIKE_TYPES[t].emoji} {BIKE_TYPES[t].label}</span>
                  <span className="font-bold text-accent">S/ {BIKE_TYPES[t].price}<small className="text-xs font-medium">/día</small></span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{BIKE_TYPES[t].blurb}</p>
                <p className="mt-1 text-xs font-medium text-primary">{BIKES.filter((b) => b.type === t).length} unidades</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Incluye casco y candado. Reservás online, pagás al toque y retirás con tu código.</p>
        </section>

        <section className="rounded-2xl border border-border p-4">
          <h2 className="flex items-center gap-2 text-xl font-bold"><MapPin className="h-5 w-5 text-primary" />Dónde estamos</h2>
          <p className="mt-2">{ADDRESS}</p>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-12 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground shadow-cta">Abrir en Google Maps</a>
        </section>

        <section className="rounded-2xl border border-border p-4">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Clock className="h-5 w-5 text-primary" />Horarios</h2>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Lunes a domingo</dt><dd className="font-semibold">8:00 – 18:00</dd></div>
            <div className="flex justify-between"><dt>Retiros y devoluciones</dt><dd className="font-semibold">8:00 – 18:00</dd></div>
          </dl>
        </section>

        <section className="md:col-span-2">
          <h2 className="text-xl font-bold">Redes</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {SOCIALS.map(({ label, handle, url, Icon }) => (
              <li key={label}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
                  <Icon className="h-6 w-6 text-primary" />
                  <span><span className="block font-semibold">{label}</span><span className="text-sm text-muted-foreground">{handle}</span></span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Link to="/" className="flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground md:col-span-2">Reservar mi bici</Link>
      </main>
    </div>
  );
}
