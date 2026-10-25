import { useState } from "react";
import { CreditCard, Loader2, Lock, Smartphone, X } from "lucide-react";

export type PaymentInfo = { method: "tarjeta" | "yape"; ref: string };
type Props = { amount: number; summary: string; onPaid: (p: PaymentInfo) => void; onClose: () => void };

const digits = (s: string) => s.replace(/\D/g, "");

/** Simulated checkout: nothing is charged. Card ending in 0002 is declined to demo errors. */
export function PaymentSheet({ amount, summary, onPaid, onClose }: Props) {
  const [method, setMethod] = useState<PaymentInfo["method"]>("tarjeta");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [yape, setYape] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (method === "tarjeta") {
      if (digits(card).length !== 16) return setError("El número de tarjeta tiene que tener 16 dígitos.");
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return setError("Vencimiento en formato MM/AA.");
      if (digits(cvc).length < 3) return setError("Revisá el código de seguridad.");
    } else {
      if (digits(yape).length !== 9) return setError("Poné tu celular de 9 dígitos.");
      if (digits(code).length !== 6) return setError("El código de aprobación de Yape tiene 6 dígitos.");
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (method === "tarjeta" && digits(card).endsWith("0002")) return setError("Tu banco rechazó el pago. Probá con otra tarjeta.");
      onPaid({ method, ref: `PAY-${Date.now().toString().slice(-6)}` });
    }, 1600);
  };

  const tab = (m: PaymentInfo["method"], label: string, Icon: typeof CreditCard) => (
    <button type="button" onClick={() => { setMethod(m); setError(null); }}
      className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 font-medium ${method === m ? "border-primary bg-secondary" : "border-border"}`}>
      <Icon className="h-5 w-5" />{label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-deep/60 sm:items-center" onClick={busy ? undefined : onClose}>
      <form noValidate onSubmit={pay} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Pagá tu reserva</h2>
          <button type="button" disabled={busy} onClick={onClose} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary p-4">
          <span className="text-sm text-muted-foreground">{summary}</span>
          <span className="font-display text-2xl font-bold text-accent">S/ {amount}</span>
        </div>
        <div className="mt-4 flex gap-2">{tab("tarjeta", "Tarjeta", CreditCard)}{tab("yape", "Yape", Smartphone)}</div>
        <div className="mt-4 space-y-3">
          {method === "tarjeta" ? (
            <>
              <F t="Número de tarjeta"><input className="input" inputMode="numeric" value={card} onChange={(e) => setCard(e.target.value)} autoComplete="cc-number" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F t="Vence (MM/AA)"><input className="input" inputMode="numeric" value={exp} onChange={(e) => setExp(e.target.value)} autoComplete="cc-exp" /></F>
                <F t="CVC"><input className="input" inputMode="numeric" value={cvc} onChange={(e) => setCvc(e.target.value)} autoComplete="cc-csc" /></F>
              </div>
            </>
          ) : (
            <>
              <F t="Celular con Yape"><input className="input" inputMode="numeric" value={yape} onChange={(e) => setYape(e.target.value)} placeholder="984 112 307" /></F>
              <F t="Código de aprobación"><input className="input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 dígitos" /></F>
            </>
          )}
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-busy px-3 py-2 text-sm font-medium text-busy-foreground">{error}</p>}
        <button disabled={busy} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent font-display font-semibold text-accent-foreground shadow-cta disabled:opacity-80">
          {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Procesando…</> : <><Lock className="h-4 w-4" />Pagar S/ {amount}</>}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Pago de demostración: no se cobra nada. Tarjeta terminada en 0002 = rechazada.</p>
      </form>
    </div>
  );
}

function F({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{t}</span>{children}</label>;
}
