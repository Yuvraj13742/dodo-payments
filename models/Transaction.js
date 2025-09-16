const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
// Remove direct User import, it will be handled by models/index.js
// const User = require('./User');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Refer to the table name as a string
            key: 'id',
        },
    },
    type: {
        type: DataTypes.ENUM('coin_purchase', 'gift_send', 'gift_receive', 'subscription', 'payout', 'refund'),
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'INR',
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending',
    },
    dodoTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

// Remove direct association definitions, they will be handled by models/index.js
// Transaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = Transaction;
