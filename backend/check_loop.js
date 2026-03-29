const { sequelize } = require('./config/database');
const LoopVideo = require('./models/LoopVideo');

async function check() {
    try {
        console.log('--- LOOP VIDEOS ---');
        const videos = await LoopVideo.findAll();
        console.log(JSON.stringify(videos, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

check();
