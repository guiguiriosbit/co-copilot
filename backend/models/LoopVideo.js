const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoopVideo = sequelize.define('LoopVideo', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    sourceType: {
        type: DataTypes.ENUM('file', 'youtube', 'vimeo', 'hls'),
        defaultValue: 'file',
        allowNull: false
    },
    streamUrl: {
        type: DataTypes.STRING,
        allowNull: true // Only for non-'file' sources
    },
    businessName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    targetUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    logoUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
        allowNull: false
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    lng: {
        type: DataTypes.FLOAT,
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
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
});

module.exports = LoopVideo;
