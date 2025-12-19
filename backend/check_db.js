const { sequelize } = require('./config/database');
const Ad = require('./models/Ad');
const Campaign = require('./models/Campaign');

async function check() {
    try {
        const ads = await Ad.findAll({
            include: [Campaign]
        });
        console.log(JSON.stringify(ads, null, 2));
    } catch (error) {
        console.error(error);
    }
}

check();
