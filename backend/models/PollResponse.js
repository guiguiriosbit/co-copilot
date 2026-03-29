const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PollResponse = sequelize.define('PollResponse', {
    pollId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    selectedOption: {
        type: DataTypes.STRING,
        allowNull: false
    },
    screenId: {
        type: DataTypes.STRING
    },
    lat: {
        type: DataTypes.FLOAT
    },
    lng: {
        type: DataTypes.FLOAT
    }
});

module.exports = PollResponse;
