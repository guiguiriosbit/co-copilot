const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Settings = sequelize.define('Settings', {
    key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

module.exports = Settings;
