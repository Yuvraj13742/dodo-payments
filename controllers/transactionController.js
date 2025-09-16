const { Transaction, User, sequelize } = require('../models');

exports.getUserTransactions = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(transactions);

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
