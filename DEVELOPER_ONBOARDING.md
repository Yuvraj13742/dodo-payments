# Developer Onboarding

This backend integrates Dodo Payments for hosted checkout, subscriptions, and payouts.

## Prerequisites
- Node 18+
- MySQL 8+ running locally
- Dodo Payments dashboard access (Test mode)

## Setup
1. Copy `.env.example` to `.env` and set values:
   - DB_* credentials
   - JWT_SECRET
   - DODO_API_KEY (Test)
   - DODO_RETURN_URL / DODO_CANCEL_URL
2. Install deps and run:
   - `npm install`
   - `npm run start`
3. DB will auto-sync models (see `models/index.js`).

## Key Endpoints
- Coins: `/coins/purchase`, `/coins/packages`, `/coins/balance/:userId`
- Subscriptions: `/subscriptions/create`, `/subscriptions/cancel`, `/subscriptions/:subscriptionId`, `/subscriptions/plans`, `/subscriptions/update`
- Payments: `/payments/confirm`
- Webhooks: `/webhooks/dodo` (source of truth)
- Creator: `/creators/withdraw`, `/creators/earnings/:creatorId`, `/creators/kyc`

## Dodo Integration Notes
- Create Checkout Sessions server-side and redirect client to `checkoutUrl`.
- Finalize payment/subscription status via webhooks; do not trust client redirects.
- Enable webhook signature verification by setting `DODO_SIGNATURE_VERIFY=true` and `DODO_WEBHOOK_SECRET=...`.
- Payouts are mocked; replace with real calls using the official SDK.

## Testing
- Use `docs/requests.http` for sample requests (VS Code/JetBrains REST client).
- To test webhooks without signatures, leave `DODO_SIGNATURE_VERIFY` unset or false.
- For signature testing, compute HMAC-SHA256 over raw JSON with `DODO_WEBHOOK_SECRET` and send header `x-dodo-signature`.

## Production Checklist
- Use Live API key and base URL
- Enforce signature verification for webhooks
- Map Dodo error codes to user-friendly messages
- Ensure secrets are stored securely and never logged

## Links
- Dodo Developer Resources: https://docs.dodopayments.com/developer-resources/introduction
- Backend README: `backend/README.md`
