# Backend API Documentation

This document describes all backend routes, their request/response schemas, authentication, and how they integrate with Dodo Payments.

Base URL: your-server-url

## Authentication

- Most routes use JWT auth via header `x-auth-token`.
- Dev bypass: if `SKIP_AUTH=true`, auth middleware sets `req.user` to a mock user.

Example:

```
x-auth-token: <jwt>
```

JWT is issued by `POST /auth/login` and `POST /auth/register`.

## Health

GET /
- 200: "Payment Service API"

## Auth

POST /auth/register
- Body:
  - username: string
  - email: string
  - password: string
  - role: 'user' | 'creator' (optional, defaults 'user')
- Responses:
  - 201: { message, token }
  - 400: { message: 'User already exists.' }
  - 500: { message, error }

POST /auth/login
- Body:
  - email: string
  - password: string
- Responses:
  - 200: { message, token }
  - 500: { message, error }

Note: In current dev mode, password verification is bypassed and a test user can be auto-created.

## Coins

POST /coins/purchase (auth)
- Body:
  - coinPackageId: number
  - userId: number
- Behavior:
  - Creates Dodo Checkout Session (mocked) and a pending Transaction with type 'coin_purchase'.
- Responses:
  - 200: { message, checkoutUrl, transactionId }
  - 404: { message: 'Coin package not found.' | 'User not found.' }
  - 500: { message, error }
- Dodo notes:
  - Server should call Create Checkout Session with `Authorization: Bearer <key>` to Test or Live base URL and return the hosted `checkoutUrl` to the client; client redirects to complete payment. See [docs](https://docs.dodopayments.com/developer-resources/introduction).
  - Treat client return as provisional; finalize state via webhooks. Respect rate limits (100/min; 10/sec burst) and monitor `X-RateLimit-Remaining`.

GET /coins/balance/:userId (auth)
- Responses:
  - 200: { walletBalance: number }
  - 404: { message: 'User not found.' }
  - 500: { message, error }

GET /coins/packages
- Responses:
  - 200: Array<{ id, name, price, coins }>
  - 500: { message, error }

## Gifts

POST /gifts/send (auth)
- Body:
  - giftId: number
  - senderId: number
  - receiverId: number
- Behavior:
  - Deducts coins from sender, credits receiver with 70% as earnings, records two transactions.
- Responses:
  - 200: { message: 'Gift sent successfully.' }
  - 400: { message: 'Insufficient coin balance.' }
  - 404: { message: 'Gift not found.' | 'Sender not found.' | 'Receiver not found.' }
  - 500: { message, error }

GET /gifts/ (auth)
- Responses:
  - 200: Gift[]
  - 500: { message, error }

## Subscriptions

POST /subscriptions/create (auth)
- Body:
  - creatorId: number (creator role)
  - subscriberId: number
  - planType: 'monthly' | 'yearly'
  - price: number (INR)
- Behavior:
  - Creates Dodo Checkout Session (mocked) and a pending Subscription and Transaction.
- Responses:
  - 200: { message, checkoutUrl, subscriptionId }
  - 404: { message: 'Creator not found or is not a creator.' | 'Subscriber not found.' }
  - 500: { message, error }
- Dodo notes:
  - Use Checkout Sessions for subscription signups; pass plan details and customer info from your server. See [docs](https://docs.dodopayments.com/developer-resources/introduction).
  - Subscription lifecycle (activate, invoice, renew, cancel) should be tracked via webhooks; client redirects are not the source of truth.

POST /subscriptions/cancel (auth)
- Body:
  - subscriptionId: number
- Responses:
  - 200: { message, subscription }
  - 400: { message: 'Subscription is already cancelled or expired.' }
  - 404: { message: 'Subscription not found.' }
  - 500: { message, error }
- Dodo notes:
  - If using Dodo Subscription APIs (Change Plan, Update, Charge), coordinate status with webhook events to avoid drift. See API groups in [docs](https://docs.dodopayments.com/developer-resources/introduction).

GET /subscriptions/:subscriptionId (auth)
- Responses:
  - 200: { subscription }
  - 404: { message: 'Subscription not found.' }
  - 500: { message, error }

GET /subscriptions/plans (auth)
- Responses:
  - 200: Subscription[] (with creator summary)
  - 500: { message, error }

PUT /subscriptions/update (auth)
- Body:
  - subscriptionId: number
  - planType?: 'monthly' | 'yearly'
  - price?: number
  - autoRenew?: boolean
- Responses:
  - 200: { message, subscription }
  - 404: { message: 'Subscription not found.' }
  - 500: { message, error }

## Creator

POST /creators/withdraw (auth)
- Body:
  - creatorId: number
  - amount: number (INR)
  - bankDetails: object
- Behavior:
  - Enforces min payout, ensures balance, simulates Dodo payout (mock), deducts wallet, creates pending payout transaction.
- Responses:
  - 200: { message, payoutId, processedAmount }
  - 400: { message: 'Minimum payout amount is ₹1000.' | 'Insufficient earnings for payout.' }
  - 404: { message: 'Creator not found or is not a creator.' }
  - 500: { message, error }
- Dodo notes:
  - The sample uses a mocked payout creator. In Dodo, Payouts are tracked (List Payouts) and delivered to your bank; use official payout creation/settlement flows and reconcile via webhooks. See Payouts/Webhooks in [docs](https://docs.dodopayments.com/developer-resources/introduction).

GET /creators/earnings/:creatorId (auth)
- Responses:
  - 200: { walletBalance, totalEarnings, totalPayouts, availableForPayout }
  - 404: { message: 'Creator not found or is not a creator.' }
  - 500: { message, error }

PUT /creators/kyc (auth)
- Body:
  - creatorId: number
  - kycStatus: string
  - bankDetails: object
- Responses:
  - 200: { message, creator }
  - 404: { message: 'Creator not found or is not a creator.' }
  - 500: { message, error }
- Dodo notes:
  - Do not store sensitive bank/KYC data in plaintext. If Dodo offers tokenization/hosted updates (Customer Portal Sessions), prefer those and keep secrets server-side only. See Customers/Portal in [docs](https://docs.dodopayments.com/developer-resources/introduction).

GET /creators/ (auth)
- Responses:
  - 200: Array<{ id, username, email }>
  - 500: { message, error }

## Payments

POST /payments/confirm (auth)
- Body:
  - transactionId: number
  - dodoTransactionId: string
  - status: 'completed' | 'failed' | 'cancelled'
- Behavior:
  - Validates transaction and updates its status; for completed coin purchases, credits wallet based on a placeholder conversion (1 INR = 10 coins). For subscriptions, left as TODO in current code.
- Responses:
  - 200: { message, transaction }
  - 400: { message: 'Dodo transaction ID mismatch.' | 'Transaction already processed or not pending.' }
  - 404: { message: 'Transaction not found.' }
  - 500: { message, error }
- Dodo notes:
  - Treat this endpoint as advisory. The authoritative source is the webhook; use Payments APIs to fetch details/invoices/line items for reconciliation as needed. See Payments in [docs](https://docs.dodopayments.com/developer-resources/introduction).

## Transactions

GET /transactions/:userId (auth)
- Responses:
  - 200: Transaction[] (desc by createdAt)
  - 404: { message: 'User not found.' }
  - 500: { message, error }

## Webhooks (Dodo Payments)

POST /webhooks/dodo
- Body: Dodo event payload
- Behavior:
  - payment.succeeded: marks transaction completed; for coin_purchase adds coins from `CoinPackage`, for subscription marks `Subscription` active and sets `endDate` (example logic: +1 year).
  - payment.failed/payment.cancelled: sets pending transaction to failed/cancelled.
- Responses:
  - 200: 'Webhook Received'
  - 500: { message, error }
- Dodo notes:
  - Verify signatures using your Webhook Signing Key and reject unverified requests. Manage endpoints, headers, and signing key via Webhooks APIs. See Webhooks in [docs](https://docs.dodopayments.com/developer-resources/introduction).

Security Note: This is a placeholder handler; add signature verification using Dodo Webhook Signing Key.

## Models (overview)

- User: id, username, email, password, role, walletBalance, kycStatus, bankDetails, timestamps
- CoinPackage: id, name, price, coins, timestamps
- Gift: id, name, coinCost, timestamps
- Subscription: id, creatorId, subscriberId, planType, price, status, endDate, autoRenew, timestamps
- Transaction: id, userId, type, amount, currency, status, dodoTransactionId, description, timestamps

Associations:
- User 1..* Transaction
- User 1..* Subscription (as Creator)
- User 1..* Subscription (as Subscriber)

## Dodo Payments Integration

- Client wrapper in `services/dodoPaymentService.js` currently mocks:
  - checkoutSessions.create({ productCart, customer, returnUrl, cancelUrl }) -> { id, checkoutUrl }
  - payouts.create({ amount, currency, destination, creatorId }) -> { id, status }
- Replace with real SDK calls and use environment variables:
  - DODO_API_KEY, DODO_BASE_URL, DODO_RETURN_URL, DODO_CANCEL_URL
- Dodo quick facts (from [docs](https://docs.dodopayments.com/developer-resources/introduction)):
  - Environments: Test `https://test.dodopayments.com`, Live `https://live.dodopayments.com`
  - Auth header: `Authorization: Bearer <api_key>` (server-side only)
  - Rate limits: 100/min per key; burst 10/sec; webhooks 1000/min
  - Prefer webhooks for final state; map error codes to user-facing messages

## Environment

- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
- JWT_SECRET
- SKIP_AUTH (optional, 'true' to bypass auth in dev)
- DODO_* variables as above

## Error Handling & Rate Limits

- Errors return { message, error } with appropriate HTTP status.
- Respect Dodo rate limits if calling real API.

## Developer Tools
- Webhook signature verification middleware: `middleware/dodoSignature.js` (enable via `DODO_SIGNATURE_VERIFY=true`)
- HTTP examples: `docs/requests.http`
- Onboarding guide: `DEVELOPER_ONBOARDING.md`

## Notes / TODOs

- Implement real Dodo SDK client and webhook signature verification.
- Finalize coin credit calculation on payment confirmation using `CoinPackage` linkage.
- Implement subscription post-payment linkage and lifecycle updates in payment controller.

## Test vs Live Switch-over

Follow these steps when moving from Test to Live:
- Set environment:
  - Use Live base URL `https://live.dodopayments.com` and Live API key.
  - Rotate keys and restrict access; never commit keys.
- Update webhook endpoint in Dodo dashboard to your production URL and redeploy with `DODO_SIGNATURE_VERIFY=true` and `DODO_WEBHOOK_SECRET`.
- Verify webhook signature enforcement in prod; reject unsigned/invalid requests.
- Update return/cancel URLs to production domains.
- Disable dev shortcuts: set `SKIP_AUTH=false`, remove password bypass in login.
- Use production database; run proper migrations (avoid `sequelize.sync({ alter: true })` in prod).
- Increase observability (structured logs, request IDs, alerts on webhook failures).
- Validate supported payment methods/countries per your market (see below).

References: environments, integration steps [docs](https://docs.dodopayments.com/developer-resources/introduction), API fundamentals [docs](https://docs.dodopayments.com/api-reference/introduction)

## Supported Countries

Before onboarding users or enabling methods, confirm availability:
- Query the Supported Countries endpoint and cache results server-side.
- Gate features and show UX accordingly per country/currency.

Reference: Supported Countries under API Reference — Miscellaneous [docs](https://docs.dodopayments.com/api-reference/introduction)

## How to Review a Dodo Webhook

Use this checklist to safely process events:
1) Verify signature
- Ensure `DODO_SIGNATURE_VERIFY=true` and `DODO_WEBHOOK_SECRET` configured.
- Compute HMAC-SHA256 over the raw JSON and compare to header `x-dodo-signature`.

2) Parse event and enforce idempotency
- Use the event’s payment/subscription ID to locate your local transaction.
- Skip if already processed; log unknown IDs for manual review.

3) Apply domain changes atomically
- For `payment.succeeded`: mark transaction `completed`, then side-effects:
  - `coin_purchase`: add coins from `CoinPackage`.
  - `subscription`: mark `Subscription` active and set `endDate` per plan.
- For `payment.failed`/`payment.cancelled`: set pending transaction accordingly.

4) Respond with 2xx on success; 5xx on internal errors so Dodo retries.

Sample payloads

payment.succeeded
```
{
  "type": "payment.succeeded",
  "data": {
    "id": "cs_123456789",
    "amount": 2999,
    "currency": "INR",
    "metadata": {
      "userId": 1,
      "transactionType": "coin_purchase",
      "relatedEntityId": 3
    }
  }
}
```

payment.failed
```
{
  "type": "payment.failed",
  "data": {
    "id": "cs_123456789",
    "amount": 2999,
    "currency": "INR",
    "metadata": {
      "userId": 1,
      "transactionType": "subscription",
      "relatedEntityId": 10
    }
  }
}
```

Headers
```
Content-Type: application/json
x-dodo-signature: <hex hmac of raw body>
```

References: Webhooks and developer intro [docs](https://docs.dodopayments.com/developer-resources/introduction), API intro [docs](https://docs.dodopayments.com/api-reference/introduction)
