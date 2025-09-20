/**
 * Dodo Payments Client (Mock)
 *
 * Purpose:
 * - Provides a thin wrapper that mimics Dodo Payments SDK methods used in this codebase
 * - Used for local/dev testing without calling real Dodo endpoints
 *
 * Replace with real SDK:
 * - Install and import the official SDK (TypeScript/Node supported)
 * - Configure base URL per environment:
 *   - Test: https://test.dodopayments.com
 *   - Live: https://live.dodopayments.com
 * - Authenticate all server-side requests with:
 *   Authorization: Bearer <DODO_API_KEY>
 * - Never expose API keys to the client.
 *
 * Required environment variables:
 * - DODO_API_KEY        // Secret key from Dodo dashboard (Test/Live)
 * - DODO_RETURN_URL     // Where hosted checkout redirects on success
 * - DODO_CANCEL_URL     // Where hosted checkout redirects on cancel
 *
 * Rate limits (see docs):
 * - Standard: 100 req/min per key; Burst: 10 req/sec
 * - Monitor X-RateLimit-Remaining header on real requests
 *
 * Webhooks:
 * - Treat webhook events as the source of truth for payment/subscription states
 * - Implement signature verification using Dodo Webhook Signing Key
 *
 * Docs: https://docs.dodopayments.com/developer-resources/introduction
 */
const DodoPayments = require('dodopayments');
require('dotenv').config();

const client = {
  checkoutSessions: {
    create: async ({ productCart, customer, returnUrl, cancelUrl }) => {
      console.log('Mock Dodo Payments: Creating checkout session...', { productCart, customer, returnUrl, cancelUrl });
      // Simulate a Dodo Payments checkout session response
      const mockSessionId = `cs_${Date.now()}`;
      const mockCheckoutUrl = `${returnUrl}?status=success&transactionId=${Math.floor(Math.random() * 100000)}&dodoTransactionId=${mockSessionId}`;
      return {
        id: mockSessionId,
        checkoutUrl: mockCheckoutUrl,
      };
    },
  },
  payouts: {
    create: async ({ amount, currency, destination, creatorId }) => {
      console.log('Mock Dodo Payments: Creating payout...', { amount, currency, destination, creatorId });
      // Simulate a Dodo Payments payout response
      const mockPayoutId = `po_${Date.now()}`;
      return {
        id: mockPayoutId,
        status: 'pending',
      };
    },
  },
  // Add other Dodo Payments API methods as needed
};

module.exports = client;
