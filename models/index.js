const { sequelize } = require('../config/database');
const User = require('./User');
const CoinPackage = require('./CoinPackage');
const Gift = require('./Gift');
const Subscription = require('./Subscription');
const Transaction = require('./Transaction');

// Define associations

// User and Transaction
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

// User and Subscription (Creator and Subscriber)
User.hasMany(Subscription, { as: 'CreatedSubscriptions', foreignKey: 'creatorId' });
Subscription.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });

User.hasMany(Subscription, { as: 'UserSubscriptions', foreignKey: 'subscriberId' });
Subscription.belongsTo(User, { as: 'Subscriber', foreignKey: 'subscriberId' });

// Other associations as needed

const syncModels = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to synchronize models:', error);
    }
};

module.exports = {
    sequelize,
    User,
    CoinPackage,
    Gift,
    Subscription,
    Transaction,
    syncModels,
};
