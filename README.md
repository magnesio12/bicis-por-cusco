# Alquiler De Bicis Cusco

App de reservas para un negocio chico de alquiler de bicicletas en Cusco. El cliente
ve la disponibilidad real, elige bici y fechas, paga (paso simulado) y recibe un
código; el operador gestiona todo desde un panel protegido por clave.

**Estado:** funciona completo de punta a punta. Sin backend: los datos viven en el
navegador. El cobro real es un cambio a posteriori, ya separado y documentado.

---

## 1. Cómo correrla

```sh
npm i          # o: bun install
npm run dev    # abre en http://localhost:8080
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo con recarga en caliente |
| `npm test` | corre los 8 tests (`vitest run`): 7 de reglas de negocio + 1 de rutas |
| `npm run build` | build de producción |
| `npm run preview` | sirve el build |
| `npm run lint` / `npm run format` | ESLint / Prettier |

---

## 2. Rutas

| URL | Archivo | Qué es |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | reserva pública (catálogo → fechas → bici → datos → pago → confirmación) |
| `/admin` | `src/routes/admin.tsx` | panel del operador, protegido por clave |

No hay otras rutas. `src/routeTree.gen.ts` se genera solo: no se edita a mano.
Ver también `src/routes/README.md` con las convenciones de rutas de TanStack Start.

---

## 3. Flujo del cliente (`/`)

1. **Elegí qué bici** — urbana o montaña, con precio y cantidad de unidades.
2. **Tocá el día de retiro y el de devolución** — calendario con los días en que
   *todas* las bicis de ese tipo están ocupadas.
3. **Elegí tu bici** — solo se pueden tocar las libres en esas fechas; las ocupadas
   salen apagadas.
4. **Tus datos** — nombre, teléfono y hora de retiro.
5. **Ir a pagar** — valida la reserva y abre la pasarela (`PaymentSheet`).
6. **Confirmación** — código tipo `BC-XXXX`, resumen, comprobante y dirección de retiro.

El botón fijo de abajo muestra el total en vivo (`priceFor`).

## 4. Panel del operador (`/admin`)

Clave: **`cusco2024`** (`ADMIN_KEY` en `src/lib/rentals.ts`). Está a la vista en la
pantalla de acceso porque es una demo; hay que cambiarla antes de publicar.

- **Tres números:** reservas activas, bicis en la calle hoy, ingresos previstos.
- **Reservas:** crear, mover (revalida reglas), cancelar (libera fechas), ver
  canceladas, restaurar los datos de ejemplo.
- **Calendarios:** un calendario por bici con sus días ocupados.
- Cada fila muestra el precio y si está `pagado · tarjeta` / `pagado · yape` o
  `paga al retirar`.

---

## 5. Reglas de negocio

Todas están en `src/lib/rentals.ts` y están cubiertas por `src/test/rentals.test.ts`.
**No se mueven de ahí ni se duplican en las pantallas.**

| Regla | Dónde |
| --- | --- |
| Urbana S/ 35/día, montaña S/ 55/día | `BIKE_TYPES` |
| 4 urbanas (U1–U4) y 3 de montaña (M1–M3) | `BIKES` |
| Retiros de 8:00 a 18:00 | `HOURS` |
| El rango es `[pickup, dropoff)`: el día de devolución queda libre para el siguiente cliente | `overlaps`, `busyDays` |
| Devolución tiene que ser después del retiro | `validate` |
| Sin solapes en la misma bici | `isBikeFree` |
| Cancelar libera las fechas | `cancel` |
| Mover revalida todo (ignorándose a sí misma) | `update` → `validate(..., ignoreId)` |
| Teléfono con 7 dígitos como mínimo | `validate` |
| Precio = tarifa × días | `priceFor` |

## 6. Datos y dónde se guardan

**No hay backend ni base de datos** (decisión del dueño). Las reservas se guardan en
`localStorage` bajo la clave `bicis-cusco-v1`, a través de `useReservations()`.
Al recargar se mantienen; si el navegador está vacío, `seed()` carga 9 reservas de
ejemplo del mes actual.

Limitaciones de esto, para que no sorprendan después:

- Las reservas **no se comparten entre dispositivos ni navegadores**: lo que reserva
  un cliente no lo ve el operador en su celular.
- Borrar los datos del sitio los borra todos.
- Por eso el cobro real (que necesita confirmar un pago en el servidor) exige pasar
  las reservas a una tabla online primero.

## 7. Pasarela de pago: SIMULADA

La app **no cobra nada**. El paso de pago existe, se ve como uno real y ya está
cableado a la reserva, pero el dinero no se mueve: `PaymentSheet` muestra
"Procesando…" 1,6 s y devuelve un comprobante falso `PAY-XXXXXX`.

**Cómo probarla:** tarjeta `4242 4242 4242 4242` → aceptada. Cualquier tarjeta
terminada en `0002` → rechazada (la reserva no se guarda y la bici sigue libre).
Yape: celular de 9 dígitos + código de 6 dígitos.

Para pasar a cobro real, la guía completa está en **[`docs/PAGO.md`](docs/PAGO.md)**:
archivos y líneas exactas, qué reemplazar y qué hace falta agregar. Todo el código de
pago está marcado en el fuente con el texto `PASARELA DE PAGO`:

```sh
rg -n "PASARELA DE PAGO" src
```

Resumen de lo que hace falta (detalle en `docs/PAGO.md`): reservas en la nube
(Lovable Cloud), un server function que cree el cobro real en el lugar del
`setTimeout`, y el aviso del procesador que confirme la reserva. Tarjeta con la
integración de pagos de Lovable; Yape con un procesador peruano (Culqi, Niubiz,
Izipay) y cuenta propia del negocio.

## 8. Diseño

| Token | Valor | Uso |
| --- | --- | --- |
| `--primary` | verde `#2F5233` | títulos, botones secundarios, detalles |
| fondo | blanco `#FFFFFF` | superficies |
| `--accent` | naranja `#E8641E` | precios y llamados a la acción |
| texto | verde muy oscuro `#1A2B1C` | cuerpo y titulares |

Fuentes: **Poppins** (títulos) e **Inter** (cuerpo), por `<link>` en
`src/routes/__root.tsx`. Todo el color y las sombras salen de los tokens de
`src/styles.css`; de ahí vienen las utilidades `bg-hero`, `shadow-cta` e `input`, y
el color `bg-busy` para lo ocupado. Mobile-first: se pensó y probó primero
en celular (390×844).

Idioma: español, trato informal con voseo. Nada de texto de relleno.

## 9. Qué hay que reemplazar antes de publicar

Datos **inventados** por mí, que el dueño tiene que cambiar por los reales:

- **Dirección de retiro:** `Calle Tandapata 352, San Blas` (está en la confirmación
  de `/` y en el encabezado del sitio).
- **Apodos de las bicis:** Qori, Inti, Killa, Wayra, Apu, Kuntur, Puma (`BIKES`).
- **Nombres y teléfonos de las 9 reservas de ejemplo** (`seed()`), y la clave
  `cusco2024`.

Cosas que a propósito **no** tiene: correo, WhatsApp, notificaciones ni cobro real.

## 10. Estructura

```
src/
  lib/rentals.ts        reglas de negocio, tipos, precios, seed, useReservations
  components/
    PaymentSheet.tsx    pasarela simulada (única pantalla de pago)
    BikeCalendar.tsx    calendario reutilizable (mes, días ocupados, rango)
    SiteHeader.tsx      encabezado con enlace al panel
  routes/
    __root.tsx          shell de la app, fuentes y pantallas de error/404
    index.tsx           reserva pública
    admin.tsx           panel del operador
  test/
    rentals.test.ts     7 tests de reglas de negocio
    app-routing.test.tsx  1 test de rutas
docs/PAGO.md            guía para pasar a cobro real
AGENTS.md               reglas para que la IA no rompa lo acordado
```

Los archivos dentro de `src/components/ui/` son componentes de shadcn/ui
predeterminados: no se tocan.

---

## Build with Lovable

Este proyecto se construyó con [Lovable](https://lovable.dev). Si el repositorio está
conectado a GitHub, los cambios hechos en el editor se commitean solos y los tuyos se
sincronizan de vuelta.

## Built with

TanStack Start (React 19 + Vite), TypeScript, Tailwind CSS v4, shadcn/ui, Vitest.
