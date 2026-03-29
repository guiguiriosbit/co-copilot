const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Poll = sequelize.define('Poll', {
    question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    options: {
        type: DataTypes.JSON, // Array de strings ["Opción A", "Opción B", ...]
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'Feedback'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'es'
    }
});

module.exports = Poll;
