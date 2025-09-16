const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Gift = sequelize.define('Gift', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    animationUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    coinCost: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = Gift;
