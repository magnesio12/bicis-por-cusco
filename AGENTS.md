<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All booking data lives in localStorage via `src/lib/rentals.ts` (no backend by user requirement); business rules (overlap, validation, pricing) live there and are covered by `src/test/rentals.test.ts`.
- Customer lookup uses the shared email/code matcher in `src/lib/rentals.ts`; it is a local demo lookup, not server-side authorization. Existing email-less reservations remain editable by the operator.
- App-email sending must use managed sending after an owned sender domain is configured; do not add email queues or database tables. Booking storage remains localStorage.
- Reservation ranges are [pickup, dropoff): the return day is free for the next rider.
- The payment step stays simulated until the owner asks for real charges; the single seam to change is marked `PASARELA DE PAGO` in the code and documented in `docs/PAGO.md`.
- `README.md` is the project's single written reference: any new route, business rule, price, credential, placeholder data or limitation must be annotated there in the same change, and `docs/PAGO.md` must stay in sync with the payment seam's actual line numbers.
