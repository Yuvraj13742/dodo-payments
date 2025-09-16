const express = require('express');
const router = express.Router();
const { Transaction, User, Subscription, CoinPackage } = require('../models'); // Corrected path

// Placeholder for Dodo Payments webhook handler
router.post('/', async (req, res) => {
  console.log('Dodo Payments Webhook received:', JSON.stringify(req.body, null, 2));

  const event = req.body;

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
