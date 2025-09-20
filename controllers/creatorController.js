const { User, Transaction, sequelize } = require('../models');
const dodoPaymentService = require('../services/dodoPaymentService');
const { Sequelize } = require('sequelize');

const MIN_PAYOUT_AMOUNT = 1000;
const APP_COMMISSION_RATE = 0.25; // 25% commission

/**
 * POST /creators/withdraw
 *
 * Initiates a payout for a creator.
 * Input (body): { creatorId, amount, bankDetails }
 * Flow:
 * - Validate creator role, min payout, sufficient wallet balance
 * - Create payout via Dodo (mocked here); capture payout id
 * - Deduct wallet and create pending 'payout' Transaction (status updated by webhook)
 * - Return { payoutId, processedAmount }
 * Dodo notes:
 * - Use Payouts + Webhooks to track settlement; do not store raw bank details in plaintext
 * - Verify webhook signatures and reconcile payout.succeeded/failed
 */
exports.requestPayout = async (req, res) => {
  const { creatorId, amount, bankDetails } = req.body; // bankDetails would be an object with bank_account_number, ifsc_code, etc.

  try {
    const creator = await User.findByPk(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ message: 'Creator not found or is not a creator.' });
    }

    if (amount < MIN_PAYOUT_AMOUNT) {
      return res.status(400).json({ message: `Minimum payout amount is ₹${MIN_PAYOUT_AMOUNT}.` });
    }

    if (creator.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient earnings for payout.' });
    }

    // Simulate Dodo Payments payout request (replace with actual Dodo API call)
    // This would typically involve Dodo Payments handling the bank transfer
    const payoutAmount = amount * (1 - APP_COMMISSION_RATE);

    // In a real scenario, you'd interact with Dodo Payments API for payouts.
    // For this mock, we'll simulate a successful payout.
    const dodoPayoutResponse = await dodoPaymentService.payouts.create({
      amount: payoutAmount,
      currency: 'INR',
      destination: bankDetails, // This would be structured as per Dodo's API requirements
      creatorId: creator.id,
      // Add KYC verification status here if available from user model or a dedicated service
    });

    const t = await sequelize.transaction();

    try {
      await creator.update({ walletBalance: creator.walletBalance - amount }, { transaction: t });

      await Transaction.create({
        userId: creator.id,
        type: 'payout',
        amount: -amount,
        currency: 'INR',
        status: 'pending', // Status will be updated by webhook from Dodo Payments
        dodoTransactionId: dodoPayoutResponse.id, // Assuming Dodo returns an ID
        description: `Payout request for ₹${amount}`,
      }, { transaction: t });

      await t.commit();

      res.status(200).json({
        message: 'Payout request submitted successfully.',
        payoutId: dodoPayoutResponse.id,
        processedAmount: payoutAmount,
      });

    } catch (transactionError) {
      await t.rollback();
      console.error('Payout transaction failed:', transactionError);
      res.status(500).json({ message: 'Payout transaction failed', error: transactionError.message });
    }

  } catch (error) {
    console.error('Error requesting payout:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /creators/earnings/:creatorId
 * Summarizes wallet, total earnings (gift_receive + subscription), total payouts, availableForPayout.
 */
exports.getEarningsDashboard = async (req, res) => {
  const { creatorId } = req.params;

  try {
    const creator = await User.findByPk(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ message: 'Creator not found or is not a creator.' });
    }

    const totalEarnings = await Transaction.sum('amount', {
      where: {
        userId: creatorId,
        type: {
          [Sequelize.Op.in]: ['gift_receive', 'subscription'],
        },
        status: 'completed',
      },
    });

    const totalPayouts = await Transaction.sum('amount', {
      where: {
        userId: creatorId,
        type: 'payout',
        status: 'completed',
      },
    });

    res.status(200).json({
      walletBalance: creator.walletBalance,
      totalEarnings: totalEarnings || 0,
      totalPayouts: Math.abs(totalPayouts) || 0, // Payouts are stored as negative
      availableForPayout: creator.walletBalance,
    });

  } catch (error) {
    console.error('Error fetching earnings dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PUT /creators/kyc
 * Updates creator KYC status and bankDetails.
 * Guidance:
 * - Prefer tokenization/hosted flows where possible. Restrict access to sensitive data.
 */
exports.updateKYCStatus = async (req, res) => {
  const { creatorId, kycStatus, bankDetails } = req.body;

  try {
    const creator = await User.findByPk(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ message: 'Creator not found or is not a creator.' });
    }

    // In a real application, bankDetails would be securely handled and stored,
    // possibly with encryption or via a tokenization service from Dodo Payments.
    // KYC status would be updated based on verification from a third-party service.
    await creator.update({ kycStatus, bankDetails }); // Assuming kycStatus and bankDetails fields exist on User model

    res.status(200).json({ message: 'KYC status and bank details updated successfully.', creator });

  } catch (error) {
    console.error('Error updating KYC status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /creators/
 * Lists creators.
 */
exports.getAllCreators = async (req, res) => {
  try {
    const creators = await User.findAll({ where: { role: 'creator' }, attributes: ['id', 'username', 'email'] });
    res.status(200).json(creators);
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Placeholder for other creator-related functions (e.g., getEarningsDashboard, updateKYCStatus) will be added here.
