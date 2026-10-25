import { Link } from "@tanstack/react-router";
import { Bike } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2">
        <Link to="/" className="flex items-center gap-2 font-display text-base font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent"><Bike className="h-5 w-5" /></span>
          Bicis Cusco
        </Link>
        <nav aria-label="Navegación principal" className="flex flex-wrap gap-1 text-sm font-medium">
          <Link to="/" className="rounded-full px-3 py-2" activeOptions={{ exact: true }} activeProps={{ className: "bg-primary-foreground/15" }}>Reservar</Link>
          <Link to="/gestionar" className="rounded-full px-3 py-2" activeProps={{ className: "bg-primary-foreground/15" }}>Gestionar reserva</Link>
          <Link to="/admin" className="rounded-full px-3 py-2" activeProps={{ className: "bg-primary-foreground/15" }}>Admin</Link>
        </nav>
      </div>
    </header>
  );
}
