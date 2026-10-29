import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Bike } from "lucide-react";
import { storageAvailable } from "@/lib/rentals";

export function SiteHeader() {
  const [noStorage, setNoStorage] = useState(false);
  useEffect(() => setNoStorage(!storageAvailable()), []);
  return (
    <>
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2">
        <Link to="/" className="flex items-center gap-2 font-display text-base font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent"><Bike className="h-5 w-5" /></span>
          Bicis Cusco
        </Link>
        <nav aria-label="Navegación principal" className="flex flex-wrap gap-1 text-sm font-medium">
          <Link to="/" className="rounded-full px-3 py-2" activeOptions={{ exact: true }} activeProps={{ className: "bg-primary-foreground/15" }}>Reservar</Link>
          <Link to="/info" className="rounded-full px-3 py-2" activeProps={{ className: "bg-primary-foreground/15" }}>Info</Link>
          <Link to="/gestionar" className="rounded-full px-3 py-2" activeProps={{ className: "bg-primary-foreground/15" }}>Gestionar reserva</Link>
          <Link to="/admin" className="rounded-full px-3 py-2" activeProps={{ className: "bg-primary-foreground/15" }}>Admin</Link>
        </nav>
      </div>
    </header>
    {noStorage && (
      <div role="alert" className="flex items-start gap-2 bg-busy px-4 py-3 text-sm font-medium text-busy-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="mx-auto max-w-5xl flex-1">Tu navegador tiene bloqueado el almacenamiento local. Podés mirar la página, pero las reservas no se van a guardar al recargar. Probá salir del modo privado o habilitar los datos del sitio.</p>
      </div>
    )}
    </>
  );
}
