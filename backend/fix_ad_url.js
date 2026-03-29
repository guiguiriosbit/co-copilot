const { sequelize } = require('./config/database');
const Ad = require('./models/Ad');

async function fixAdUrl() {
    try {
        console.log('>>> [DB FIX] Updating Ad URL for ID 2 (Guaduales de la paz)');
        const ad = await Ad.findByPk(2);
        if (ad) {
            // Using the local Salsa video as a working substitute for now
            ad.url = '/public/videoloop/video_cumbanchero_1768850836567.mp4';
            await ad.save();
            console.log('>>> [DB FIX] Ad ID 2 updated successfully.');
        } else {
            console.warn('>>> [DB FIX] Ad ID 2 not found.');
        }
    } catch (error) {
        console.error('>>> [DB FIX] Failed to update Ad:', error);
    } finally {
        process.exit(0);
    }
}

fixAdUrl();
