const { sequelize } = require('./config/database');
const Ad = require('./models/Ad');
const Campaign = require('./models/Campaign');
const GeoZone = require('./models/GeoZone');

async function check() {
    try {
        console.log('--- CAMPAIGNS & ADS ---');
        const ads = await Ad.findAll({
            include: [Campaign]
        });
        console.log(JSON.stringify(ads, null, 2));

        console.log('\n--- GEOZONES ---');
        const zones = await GeoZone.findAll({
            include: [{
                model: Ad,
                include: [Campaign]
            }]
        });
        console.log(JSON.stringify(zones, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

check();
