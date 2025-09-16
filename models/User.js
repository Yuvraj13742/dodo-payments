const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    walletBalance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
    },
    role: {
        type: DataTypes.ENUM('user', 'creator', 'admin'),
        defaultValue: 'user',
    },
    kycStatus: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
    },
    bankDetails: {
        type: DataTypes.JSON, // Changed from JSONB to JSON for MySQL compatibility
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = User;
