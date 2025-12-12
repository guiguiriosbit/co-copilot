const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Campaign = require('./Campaign');

const Ad = sequelize.define('Ad', {
    type: {
        type: DataTypes.ENUM('image', 'video'),
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER, // in seconds
        defaultValue: 10
    },
    contextRules: {
        type: DataTypes.JSON, // e.g., { weather: ['rain'], time: ['morning'] }
        allowNull: true
    }
});

Ad.belongsTo(Campaign);
Campaign.hasMany(Ad);

module.exports = Ad;
