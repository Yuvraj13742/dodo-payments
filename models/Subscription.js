const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
// Remove direct User import, it will be handled by models/index.js
// const User = require('./User'); 

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Refer to the table name as a string
            key: 'id',
        },
    },
    subscriberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Refer to the table name as a string
            key: 'id',
        },
    },
    planType: {
        type: DataTypes.ENUM('monthly', 'yearly', 'pay-per-view'),
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('active', 'cancelled', 'expired'),
        defaultValue: 'active',
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    autoRenew: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
});

// Remove direct association definitions, they will be handled by models/index.js
// Subscription.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
// Subscription.belongsTo(User, { as: 'Subscriber', foreignKey: 'subscriberId' });

module.exports = Subscription;
