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
    }
});

module.exports = Campaign;
