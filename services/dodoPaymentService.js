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
