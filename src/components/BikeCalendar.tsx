import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toISO } from "@/lib/rentals";

interface Props {
  busy: Set<string>;
  start?: string | undefined;
  end?: string | undefined;
  onPick?: ((iso: string) => void) | undefined;
  compact?: boolean | undefined;
}

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

export function BikeCalendar({ busy, start, end, onPick, compact }: Props) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const today = toISO(new Date());
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => toISO(new Date(y, m, i + 1)))];
  const size = compact ? "h-8 text-xs" : "h-11 text-sm";

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Mes anterior" onClick={() => setCursor(new Date(y, m - 1, 1))} className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-display font-semibold capitalize">{cursor.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}</p>
        <button type="button" aria-label="Mes siguiente" onClick={() => setCursor(new Date(y, m + 1, 1))} className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEK.map((w, i) => <span key={i} className="text-xs font-semibold text-muted-foreground">{w}</span>)}
        {cells.map((iso, i) => {
          if (!iso) return <span key={i} />;
          const past = iso < today;
          const isBusy = busy.has(iso);
          const isEdge = iso === start || iso === end;
          const inRange = start && end && iso > start && iso < end;
          let cls = "bg-secondary text-foreground";
          if (past) cls = "text-muted-foreground/50";
          else if (isBusy) cls = "bg-busy text-busy-foreground line-through";
          if (inRange) cls = "bg-primary/20 text-foreground";
          if (isEdge) cls = "bg-accent text-accent-foreground font-bold";
          return (
            <button
              key={iso}
              type="button"
              disabled={!onPick || past}
              onClick={() => onPick?.(iso)}
              className={`${size} rounded-lg font-medium transition ${cls} ${onPick && !past ? "active:scale-95" : "cursor-default"}`}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-secondary" />Libre</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-busy" />Ocupada</span>
        {onPick && <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-accent" />Tu elección</span>}
      </div>
    </div>
  );
}
