const { Gift, User, Transaction, sequelize } = require('../models');
const { Sequelize } = require('sequelize');

exports.sendGift = async (req, res) => {
  const { giftId, senderId, receiverId } = req.body;

  try {
    const gift = await Gift.findByPk(giftId);
    if (!gift) {
      return res.status(404).json({ message: 'Gift not found.' });
    }

    const sender = await User.findByPk(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found.' });
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found.' });
    }

    if (sender.walletBalance < gift.coinCost) {
      return res.status(400).json({ message: 'Insufficient coin balance.' });
    }

    const t = await sequelize.transaction();

    try {
      // Deduct coins from sender
      await sender.update({ walletBalance: sender.walletBalance - gift.coinCost }, { transaction: t });

      // Credit receiver (creator) with earnings (e.g., after commission)
      const creatorEarning = gift.coinCost * 0.7; // Assuming 30% commission
      await receiver.update({ walletBalance: receiver.walletBalance + creatorEarning }, { transaction: t });

      // Record transaction
      await Transaction.create({
        userId: sender.id,
        type: 'gift_send',
        amount: -gift.coinCost, // Negative for deduction
        currency: 'COINS',
        status: 'completed',
        description: `Sent ${gift.name} to ${receiver.username}`,
      }, { transaction: t });

      // Record transaction for receiver's earnings
      await Transaction.create({
        userId: receiver.id,
        type: 'gift_receive',
        amount: creatorEarning,
        currency: 'COINS',
        status: 'completed',
        description: `Received ${gift.name} from ${sender.username}`,
      }, { transaction: t });

      await t.commit();

      res.status(200).json({ message: 'Gift sent successfully.' });

    } catch (transactionError) {
      await t.rollback();
      console.error('Transaction failed:', transactionError);
      res.status(500).json({ message: 'Transaction failed', error: transactionError.message });
    }

  } catch (error) {
    console.error('Error sending gift:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllGifts = async (req, res) => {
  try {
    const gifts = await Gift.findAll();
    res.status(200).json(gifts);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
