const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Passenger = sequelize.define('Passenger', {
    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cellphone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    }
});

module.exports = Passenger;
