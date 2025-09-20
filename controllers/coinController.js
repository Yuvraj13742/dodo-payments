const { CoinPackage, User, Transaction, sequelize } = require('../models');
const dodoPaymentService = require('../services/dodoPaymentService');
const { Sequelize } = require('sequelize');

/**
 * POST /coins/purchase
 *
 * Creates a Dodo Checkout Session for purchasing a coin package.
 * Input (body): { coinPackageId: number, userId: number }
 * Flow:
 * - Validate package and user
 * - Create Checkout Session server-side (requires Dodo API key)
 * - Persist pending Transaction with dodoTransactionId (session id)
 * - Return { checkoutUrl, transactionId } for client redirect
 * Finalization:
 * - Do NOT trust client redirects for final state; rely on /webhooks/dodo (payment.succeeded) to credit coins.
 * Response examples:
 * - 200: { message, checkoutUrl, transactionId }
 * - 404/500 on errors
 * Docs: https://docs.dodopayments.com/developer-resources/introduction
 */
exports.purchaseCoins = async (req, res) => {
  const { coinPackageId, userId } = req.body;

  try {
    const coinPackage = await CoinPackage.findByPk(coinPackageId);
    if (!coinPackage) {
      return res.status(404).json({ message: 'Coin package not found.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Simulate Dodo Payments checkout session creation
    const checkoutSession = await dodoPaymentService.checkoutSessions.create({
      productCart: [
        {
          productId: `coin_package_${coinPackage.id}`,
          quantity: 1,
          price: coinPackage.price,
        },
      ],
      customer: {
        id: user.id,
        email: user.email,
      },
      returnUrl: process.env.DODO_RETURN_URL,
      cancelUrl: process.env.DODO_CANCEL_URL,
    });

    const transaction = await Transaction.create({
      userId: user.id,
      type: 'coin_purchase',
      amount: coinPackage.price,
      currency: 'INR',
      status: 'pending',
      dodoTransactionId: checkoutSession.id,
      description: `Purchase of ${coinPackage.coins} coins`,
    });

    res.status(200).json({
      message: 'Checkout session created successfully',
      checkoutUrl: checkoutSession.checkoutUrl,
      transactionId: transaction.id,
    });

  } catch (error) {
    console.error('Error purchasing coins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /coins/balance/:userId
 * Returns current wallet coin balance for the user.
 */
exports.getWalletBalance = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ walletBalance: user.walletBalance });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /coins/packages
 * Lists available coin packages with price and coin amount.
 */
exports.getCoinPackages = async (req, res) => {
  try {
    const packages = await CoinPackage.findAll({ attributes: ['id', 'name', 'price', 'coins'] });
    res.status(200).json(packages);
  } catch (error) {
    console.error('Error fetching coin packages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Placeholder for other coin-related functions (e.g., getCoinPackages, getWalletBalance) will be added here.
