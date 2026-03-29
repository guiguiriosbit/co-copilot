const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Campaign = require('./Campaign');

const Ad = sequelize.define('Ad', {
    type: {
        type: DataTypes.ENUM('image', 'video'),
        allowNull: false
    },
    sourceType: {
        type: DataTypes.ENUM('file', 'youtube', 'vimeo', 'hls'),
        defaultValue: 'file',
        allowNull: false
    },
    streamUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    targetUrl: {
        type: DataTypes.STRING,
        allowNull: true // Optional, as some ads might not have a specific landing page
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
