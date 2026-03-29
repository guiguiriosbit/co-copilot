const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Click = sequelize.define('Click', {
    screenId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    businessName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    targetUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adType: {
        type: DataTypes.ENUM('video', 'image', 'qr'),
        defaultValue: 'video'
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    lng: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
});

module.exports = Click;
