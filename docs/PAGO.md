# Pasarela de pago — dónde está y cómo se pasa a cobro real

**Estado hoy: SIMULADO.** La app no cobra nada. El paso de pago existe, se ve
igual que uno real y ya está cableado a la reserva, pero el dinero no se mueve.

Todo lo que necesita un desarrollador backend está marcado en el código con el
texto **`PASARELA DE PAGO`**. Para ubicarlo en 5 segundos:

```sh
rg -n "PASARELA DE PAGO" src
```

## Dónde vive el código de pago

| Archivo | Línea | Qué hace |
| --- | --- | --- |
| `src/components/PaymentSheet.tsx` | 1–8 | cartel explicativo del componente |
| `src/components/PaymentSheet.tsx` | 28 | `pay()` — valida tarjeta / Yape |
| `src/components/PaymentSheet.tsx` | 40 | **`setTimeout(...)` de 1,6 s: esto es lo que se reemplaza** |
| `src/components/PaymentSheet.tsx` | 43 | entrega el comprobante falso `PAY-XXXXXX` |
| `src/routes/index.tsx` | 54 | abre la pasarela al validar la reserva |
| `src/routes/index.tsx` | 57–61 | `onPaid()` — guarda la reserva después de pagar |
| `src/routes/index.tsx` | 184–186 | monta `<PaymentSheet>` con el monto total |
| `src/lib/rentals.ts` | 15–16 | campo `payment` de la reserva |
| `src/lib/rentals.ts` | 121 | `create()` — hoy escribe en `localStorage` |

`src/routes/admin.tsx` muestra en cada fila si la reserva está pagada y con qué.

## Flujo actual (simulado)

1. El cliente completa la reserva → `submit()` valida → `setPaying(true)`.
2. Se abre `PaymentSheet` con el total (`priceFor(...)`).
3. `pay()` valida los datos, muestra "Procesando…" 1,6 s y **no contacta ningún
   procesador**.
4. Devuelve `{ method, ref }` → `onPaid()` llama a `create()` → la reserva queda
   guardada en el navegador del cliente con estado `confirmada`.

## Para que funcione en la vida real

Hace falta, en este orden:

1. **Base de datos online** (Lovable Cloud). Hoy cada reserva vive solo en el
   navegador de quien la hizo; el procesador no puede confirmar algo que no está
   en el servidor. Migrar `Reservation` a una tabla, respetando las reglas de
   negocio que ya están en `src/lib/rentals.ts` (solapamiento, validación,
   precio) y su test `src/test/rentals.test.ts`.
2. **Server function que crea el pago** en el procesador y reemplaza el
   `setTimeout` de la línea 40 de `PaymentSheet.tsx`.
3. **Webhook del procesador** que, al recibir el pago aprobado, marca la reserva
   como pagada. La confirmación pasa a venir de ahí, no de `onPaid()`.
4. **Producto / precio configurado** en el procesador antes de cobrar.

Requisitos de cuenta:

- **Plan Pro** de Lovable o superior para el cobro real.
- **Tarjeta:** disponible con la integración de pagos de Lovable, sin que el
  dueño cree su propia cuenta en el procesador.
- **Yape:** no viene integrado. Requiere cuenta del negocio en un procesador
  peruano (Culqi, Niubiz, Izipay) y su propia pasarela.

## Cómo probar hoy

- Tarjeta `4242 4242 4242 4242` → pago aceptado, reserva confirmada con
  comprobante.
- Cualquier tarjeta terminada en `0002` → rechazada: la reserva **no** se guarda
  y la bici sigue libre.
- Yape: celular de 9 dígitos + código de 6 dígitos.

## No tocar

El precio, el solapamiento de fechas y la validación están en
`src/lib/rentals.ts` y están cubiertos por `src/test/rentals.test.ts`. El cambio
a cobro real no debe mover esa lógica: solo se cambia de dónde viene el
"pago aprobado".
