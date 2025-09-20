const express = require('express');
const router = express.Router();
const { Transaction, User, Subscription, CoinPackage } = require('../models'); // Corrected path
const dodoSignature = require('../middleware/dodoSignature');
const bodyParser = require('body-parser');

/**
 * POST /webhooks/dodo
 *
 * Dodo Webhooks entrypoint (source of truth):
 * - Verify the webhook signature using the Dodo Webhook Signing Key before processing.
 * - Consume events such as payment.succeeded, payment.failed, payout.succeeded, etc.
 * - Use event.data metadata (userId, transactionType, relatedEntityId) to correlate local records.
 *
 * Security:
 * - Capture the raw request body for signature verification (Express json() may need a raw body parser here).
 * - Reject (4xx) when signature verification fails.
 *
 * Idempotency:
 * - Ensure each external event processes at-most-once (e.g., check existing Transaction status).
 *
 * Expected event mapping (example):
 * - payment.succeeded -> mark Transaction completed; apply side-effects:
 *   - coin_purchase: credit coins from CoinPackage
 *   - subscription: activate Subscription and set endDate per plan
 * - payment.failed/payment.cancelled -> mark pending Transaction failed/cancelled
 *
 * Response:
 * - Always return 2xx on successful processing to stop retries.
 * - Return 5xx on internal errors to allow retry from Dodo.
 *
 * Docs: https://docs.dodopayments.com/developer-resources/introduction
 */

// Raw body parser must come before signature verification
router.post('/', bodyParser.raw({ type: 'application/json' }), dodoSignature, async (req, res) => {
  const json = JSON.parse(req.body.toString('utf8') || '{}');
  console.log('Dodo Payments Webhook received:', JSON.stringify(json, null, 2));

  const event = json;

  try {
    // Implement actual webhook processing logic here based on Dodo Payments event types
    // Example: Handle a payment success event
    if (event.type === 'payment.succeeded') {
      const dodoTransactionId = event.data.id; // Dodo Payments' transaction ID
      const amount = event.data.amount;
      const currency = event.data.currency;
      const userId = event.data.metadata.userId; // Assuming you pass userId in metadata during checkout
      const transactionType = event.data.metadata.transactionType; // e.g., 'coin_purchase', 'subscription'
      const relatedEntityId = event.data.metadata.relatedEntityId; // e.g., coinPackageId or subscriptionId

      const transaction = await Transaction.findOne({ where: { dodoTransactionId } });

      if (transaction) {
        if (transaction.status === 'pending') {
          await transaction.update({ status: 'completed' });

          const user = await User.findByPk(userId);
          if (user) {
            if (transactionType === 'coin_purchase') {
              // Add coins to user's wallet (recalculate or get from stored data)
              const coinPackage = await CoinPackage.findByPk(relatedEntityId); // Need to import CoinPackage
              if (coinPackage) {
                await user.update({ walletBalance: user.walletBalance + coinPackage.coins });
              }
            } else if (transactionType === 'subscription') {
              // Update subscription status and end date
              const subscription = await Subscription.findByPk(relatedEntityId); // Need to import Subscription
              if (subscription) {
                await subscription.update({ status: 'active', endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) }); // Example: 1 year subscription
              }
            }
            // Other balance updates as needed
          }
        }
      } else {
        console.warn('Webhook received for unknown or already processed transaction:', dodoTransactionId);
        // You might want to log this for manual review
      }
    } else if (event.type === 'payment.failed' || event.type === 'payment.cancelled') {
      const dodoTransactionId = event.data.id;
      const transaction = await Transaction.findOne({ where: { dodoTransactionId } });
      if (transaction && transaction.status === 'pending') {
        await transaction.update({ status: event.type === 'payment.failed' ? 'failed' : 'cancelled' });
      }
    }
    // Add handlers for other event types (e.g., payout.succeeded, payout.failed, refund.succeeded)

    res.status(200).send('Webhook Received');

  } catch (error) {
    console.error('Error processing Dodo Payments webhook:', error);
    res.status(500).json({ message: 'Webhook processing error', error: error.message });
  }
});

module.exports = router;
