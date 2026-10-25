import { Link } from "@tanstack/react-router";
import { Bike } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-base font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent"><Bike className="h-5 w-5" /></span>
          Bicis Cusco
        </Link>
        <nav className="flex gap-1 text-sm font-medium">
          <Link to="/" className="rounded-full px-3 py-2" activeOptions={{ exact: true }} activeProps={{ className: "bg-primary-foreground/15" }}>Reservar</Link>
          <Link to="/admin" className="rounded-full px-3 py-2" activeProps={{ className: "bg-primary-foreground/15" }}>Admin</Link>
        </nav>
      </div>
    </header>
  );
}
