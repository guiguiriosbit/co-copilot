const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Impression = sequelize.define('Impression', {
    screenId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Unique identifier for the display screen'
    },
    businessName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    videoFilename: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isAd: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'true = geofenced ad, false = public loop video'
    },
    durationSeconds: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'How long the content played before ending'
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    lng: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Language active at time of impression'
    },
    weather: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Impression;
