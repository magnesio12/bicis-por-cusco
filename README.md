# Alquiler De Bicis Cusco

App de reservas para un negocio chico de alquiler de bicicletas en Cusco. El cliente
ve la disponibilidad real, elige bici y fechas, paga (paso simulado) y recibe un
código; el operador gestiona todo desde un panel protegido por clave.

**Estado:** reserva, pago simulado y gestión local disponibles. Sin base de datos:
los datos viven en el navegador. El envío de confirmaciones por correo está
pendiente de configurar un dominio propio del negocio; hoy no se envía ningún correo.
El cobro real sigue separado y documentado para más adelante.

---

## 1. Cómo correrla

```sh
npm i          # o: bun install
npm run dev    # abre en http://localhost:8080
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo con recarga en caliente |
| `npm test` | corre los tests (`vitest run`): reglas de negocio, correo/código y rutas |
| `npm run build` | build de producción |
| `npm run preview` | sirve el build |
| `npm run lint` / `npm run format` | ESLint / Prettier |

---

## 2. Rutas

| URL | Archivo | Qué es |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | reserva pública (catálogo → fechas → bici → datos → pago → confirmación) |
| `/admin` | `src/routes/admin.tsx` | panel del operador, protegido por clave |
| `/gestionar` | `src/routes/gestionar.tsx` | consulta, cambio de fechas/hora y cancelación con correo + código |
| `/info` | `src/routes/info.tsx` | servicios, dirección con enlace a Google Maps, horarios y redes sociales |

Estas son las cuatro páginas. `src/routeTree.gen.ts` se genera solo: no se edita a mano.
Ver también `src/routes/README.md` con las convenciones de rutas de TanStack Start.

---

## 3. Flujo del cliente (`/`)

1. **Elegí qué bici** — urbana o montaña, con precio y cantidad de unidades.
2. **Tocá el día de retiro y el de devolución** — calendario con los días en que
   *todas* las bicis de ese tipo están ocupadas.
3. **Elegí tu bici** — solo se pueden tocar las libres en esas fechas; las ocupadas
   salen apagadas.
4. **Tus datos** — nombre, teléfono, correo electrónico obligatorio y hora de retiro.
5. **Ir a pagar** — valida la reserva y abre la pasarela (`PaymentSheet`).
6. **Confirmación** — código tipo `BC-XXXX`, correo, resumen, comprobante y dirección de retiro. La pantalla informa que el correo todavía no se envía.

El botón fijo de abajo muestra el total en vivo (`priceFor`).

### Gestionar reserva (`/gestionar`)

El encabezado incluye **Reservar / Gestionar reserva / Admin**. El cliente ingresa
el correo utilizado y el código de su reserva. Ambos deben coincidir; se ignoran
espacios externos y diferencias de mayúsculas. El resultado muestra nombre, correo,
bici, fechas, hora, estado, total y comprobante del pago simulado.

Puede cambiar fechas/hora de la misma bici (se revalidan disponibilidad y precio)
o cancelar con confirmación. Cancelar libera las fechas. Los cambios de precio no
cobran ni reembolsan dinero porque el pago sigue simulado. Las reservas canceladas
se pueden consultar, pero no editar ni reactivar desde esta página.

**Límite importante:** solo encuentra reservas en el mismo navegador y dispositivo.
Correo + código es una consulta de demo, no autenticación ni protección real:
los datos están en localStorage. No se guardan las credenciales de consulta en la URL.
Las reservas anteriores/de ejemplo sin correo no aparecen en esta consulta; el
operador puede seguir moviéndolas sin correo o agregarles uno desde el panel.

### Confirmación por correo — pendiente

El dueño pidió enviar la reserva y el código al correo ingresado después del pago
simulado y de guardar correctamente la reserva. Falta configurar un dominio de
envío propio del negocio; el proyecto no tiene uno y **hoy no envía correos**.
No se muestra un aviso falso de «correo enviado» ni se simula su entrega.

Una vez configurado el dominio, continuar la implementación usando los app emails
administrados de Lovable: plantilla fija con nombre, código, bici, fechas, hora,
total y aclaración de pago simulado; envío desde servidor a un único destinatario,
con clave de idempotencia derivada de la reserva. No crear colas ni tablas de correo.
La gestión seguirá limitada a este navegador mientras las reservas sean locales.

### Compartir por WhatsApp

La confirmación tiene el botón **Compartir por WhatsApp**: abre `https://wa.me/?text=...`
con un mensaje predefinido (código, bici, retiro, devolución, total y dirección) y el
cliente elige a qué chat mandarlo. No envía nada automáticamente ni usa un número del
negocio. El texto está en `whatsappSummary()` de `src/routes/index.tsx`.

### Aviso sin almacenamiento local

Si el navegador bloquea `localStorage` (modo privado estricto, datos del sitio
deshabilitados), `SiteHeader` muestra un aviso rojo en todas las páginas
(`storageAvailable()` en `src/lib/rentals.ts`). La app sigue funcionando, pero las
reservas viven solo en memoria y se pierden al recargar.

## 4. Panel del operador (`/admin`)

Clave: **`cusco2024`** (`ADMIN_KEY` en `src/lib/rentals.ts`). Está a la vista en la
pantalla de acceso porque es una demo; hay que cambiarla antes de publicar.

- **Tres números:** reservas activas, bicis en la calle hoy, ingresos previstos.
- **Reservas:** crear, mover (revalida reglas), cancelar (libera fechas), ver
  canceladas, restaurar los datos de ejemplo.
- **Bloquear fechas:** marca una bici como no disponible (desde/hasta inclusive,
  motivo opcional) sin inventar un cliente. Se guarda como reserva con
  `kind: "bloqueo"`, ocupa el calendario igual que una reserva, no suma a ingresos
  ni a "reservas activas", no aparece en "Gestionar reserva" y se libera con
  **Quitar bloqueo**.
- **Calendarios:** un calendario por bici con sus días ocupados (reservas y bloqueos).
- Cada fila muestra el precio y si está `pagado · tarjeta` / `pagado · yape` o
  `paga al retirar`.
- Se muestra el correo cuando existe y se puede agregar/editar desde el formulario.

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
| Correo obligatorio y con formato válido en reservas nuevas; edición de reservas antiguas sin correo permitida | `validate` |
| Consulta exige correo y código coincidentes, sin distinguir mayúsculas y espacios externos | `findReservation`, `normalizeEmail` |
| Precio = tarifa × días | `priceFor` |
| Bloqueo del operador: rango válido y sin pisar reservas/bloqueos; ocupa la bici | `validateBlock`, `block` |

## 6. Datos y dónde se guardan

**No hay backend ni base de datos** (decisión del dueño). Las reservas se guardan en
`localStorage` bajo la clave `bicis-cusco-v1`, a través de `useReservations()`.
Al recargar se mantienen; si el navegador está vacío, `seed()` carga 9 reservas de
ejemplo del mes actual.

### Cómo reiniciar los datos de ejemplo

- **Desde la app:** entrá a `/admin` con `cusco2024`, abrí **Reservas**, pulsá
  **Demo** y aceptá la confirmación. Reemplaza todas las reservas por las 9 de ejemplo.
- **Borrando localStorage:** en las herramientas de desarrollador del navegador,
  abrí **Application / Aplicación → Local Storage**, elegí el dominio de la app y
  borrá la clave **`bicis-cusco-v1`**. Abrí o recargá **Reservar (`/`)**: se recrean
  las 9 reservas del mes actual. Si recargás Admin, volvé a entrar con la clave
  para cargarlas. También podés ejecutar en la consola de **Reservar (`/`)**:

  ```js
  localStorage.removeItem("bicis-cusco-v1");
  location.reload();
  ```

Ambas opciones eliminan las reservas creadas, cambios y cancelaciones de ese
navegador. No borran datos de otros dispositivos. Los ejemplos no tienen correo,
por lo que se gestionan desde Admin, no desde la consulta por correo y código.

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
- **Nombres de las 9 reservas de ejemplo** (`seed()`); sus teléfonos son ficticios a
  propósito (`+51 900 000 00X` y similares), y la clave `cusco2024`.
- **Página `/info`:** redes (`@bicis.cusco` en Instagram/Facebook/TikTok), el texto
  "incluye casco y candado" y el horario de lunes a domingo 8:00–18:00 son de ejemplo
  (`src/routes/info.tsx`, constantes arriba del archivo).

Cosas que **no** tiene: envío de correos (pendiente de dominio), WhatsApp del negocio
(solo el botón para que el cliente comparta su resumen),
notificaciones de cambios/cancelaciones ni cobro real. Los correos de pruebas
con `example.com` son ejemplos, no destinatarios reales.

## 10. Estructura

```
src/
  lib/rentals.ts        reglas de negocio, tipos, precios, seed, useReservations
  components/
    PaymentSheet.tsx    pasarela simulada (única pantalla de pago)
    BikeCalendar.tsx    calendario reutilizable (mes, días ocupados, rango)
    SiteHeader.tsx      encabezado con Reservar / Gestionar reserva / Admin
  routes/
    __root.tsx          shell de la app, fuentes y pantallas de error/404
    index.tsx           reserva pública
    admin.tsx           panel del operador
    gestionar.tsx       consulta y gestión local por correo y código
    info.tsx            servicios, Google Maps, horarios y redes
  test/
    rentals.test.ts     reglas de reserva, correo y búsqueda por código
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
