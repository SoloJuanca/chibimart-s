# Chibimart

## Stripe + OXXO + Webhooks

### Variables de entorno
- `STRIPE_SECRET_KEY`: clave secreta de Stripe.
- `STRIPE_WEBHOOK_SECRET`: signing secret del webhook.
- `VITE_STRIPE_PUBLISHABLE_KEY`: clave pública para Stripe.js.
- `VITE_MARKETPLACE_COMMISSION`: comisión del marketplace en porcentaje (ej. `15`).

### Webhook de Stripe (tracking de pagos)
Se requiere para confirmar pagos asincrónicos (como OXXO) y actualizar el estado de la orden.

1) Crea el endpoint en Stripe:
- URL: `https://TU_DOMINIO/api/stripe/webhook`
- Eventos: `payment_intent.processing`, `payment_intent.succeeded`, `payment_intent.payment_failed`

2) En local, usa Stripe CLI:
```bash
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

3) Copia el signing secret en `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Estados de pago (PaymentIntent)
- `processing`: el pago está en proceso (OXXO).
- `succeeded`: pago confirmado.
- `payment_failed`: pago fallido.

Estos eventos actualizan el pedido en Firestore:
- `PROCESSING`
- `PAID`
- `FAILED`

### Comisión marketplace y Stripe
- Marketplace cobra un % definido por `VITE_MARKETPLACE_COMMISSION`.
- La comisión de Stripe se calcula desde el `balance_transaction.fee` del PaymentIntent.
- Ambas comisiones se guardan en la orden y se muestran en el detalle del pedido.

### Flujos clave
- Checkout crea un **pedido** en Firebase al iniciar pago.
- El webhook actualiza el estado del pedido cuando Stripe confirma el pago.
- Chat comprador/vendedor se encuentra en el detalle de la orden.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
