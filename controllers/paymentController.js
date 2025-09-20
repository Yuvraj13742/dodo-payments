const { Transaction, User, Subscription, CoinPackage, sequelize } = require('../models');

/**
 * POST /payments/confirm
 *
 * Advisory endpoint to reflect client-returned payment status.
 * Input (body): { transactionId, dodoTransactionId, status: 'completed'|'failed'|'cancelled' }
 * Behavior:
 * - Validates transaction, updates status in a transaction
 * - On 'completed' coin_purchase, credits wallet (placeholder conversion)
 * Guidance:
 * - Source of truth is /webhooks/dodo with Dodo-signed events. Prefer reconciling via webhooks
 *   and/or fetching payment details from Dodo if needed.
 */
exports.confirmPayment = async (req, res) => {
    const { transactionId, dodoTransactionId, status } = req.body;

    try {
        const transaction = await Transaction.findByPk(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        if (transaction.dodoTransactionId !== dodoTransactionId) {
            return res.status(400).json({ message: 'Dodo transaction ID mismatch.' });
        }

        if (transaction.status !== 'pending') {
            return res.status(400).json({ message: 'Transaction already processed or not pending.' });
        }

        const t = await sequelize.transaction();

        try {
            await transaction.update({ status: status }, { transaction: t });

            if (status === 'completed') {
                const user = await User.findByPk(transaction.userId);
                if (!user) {
                    throw new Error('User not found for transaction.');
                }

                // Update user's wallet balance based on transaction type
                if (transaction.type === 'coin_purchase') {
                    // Assuming transaction.amount here is the INR amount, we need to find the coins based on the package.
                    // For simplicity, let's assume coins were already determined and stored in description or can be recalculated.
                    // For now, let's just add a placeholder amount to walletBalance for demo purposes.
                    // In a real scenario, you'd link back to CoinPackage to get the exact coins purchased.
                    const coinsToAdd = transaction.amount * 10; // Example: 1 INR = 10 coins
                    await user.update({ walletBalance: user.walletBalance + coinsToAdd }, { transaction: t });
                } else if (transaction.type === 'subscription') {
                    // For subscriptions, mark the subscription as active and set end date
                    // This assumes you have a way to link the transaction to a specific subscription record.
                    // For now, let's just update the user's role if it's a creator subscription (simplistic)
                    // You would need to query the Subscription model to find the relevant subscription and update its status/endDate.
                }
            }

            await t.commit();

            res.status(200).json({ message: 'Payment confirmed and transaction updated.', transaction });

        } catch (transactionError) {
            await t.rollback();
            console.error('Transaction confirmation failed:', transactionError);
            res.status(500).json({ message: 'Transaction confirmation failed', error: transactionError.message });
        }

    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
