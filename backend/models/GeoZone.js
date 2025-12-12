const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Ad = require('./Ad');

const GeoZone = sequelize.define('GeoZone', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Storing polygon as GeoJSON string since SQLite doesn't have native POLYGON type
    // Example: { type: 'Polygon', coordinates: [...] }
    polygon: {
        type: DataTypes.JSON,
        allowNull: false
    }
});

// A zone can trigger a specific ad (simplified relationship)
GeoZone.belongsTo(Ad);
Ad.hasMany(GeoZone);

module.exports = GeoZone;
