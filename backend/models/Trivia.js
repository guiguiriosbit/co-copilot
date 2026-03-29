const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trivia = sequelize.define('Trivia', {
    question: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'General'
    },
    duration: {
        type: DataTypes.INTEGER, // Segundos para mostrar antes de revelar respuesta o pasar al siguiente
        defaultValue: 15
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'es'
    }
});

module.exports = Trivia;
