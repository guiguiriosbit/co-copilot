const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Campaign = sequelize.define('Campaign', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    advertiser: {
        type: DataTypes.STRING,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
        allowNull: false
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Optional: active hours for this campaign. Format: 'HH:MM' (24h)
    scheduleStart: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null  // null = always active
    },
    scheduleEnd: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    radiusKm: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.1
    }
});

module.exports = Campaign;
