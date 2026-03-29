const { sequelize } = require('./config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
    try {
        console.log('>>> [MIGRATION] Starting migration Phase 6...');
        await sequelize.authenticate();

        // Add sourceType and streamUrl to LoopVideos
        console.log('>>> [MIGRATION] Updating LoopVideos table...');
        try {
            await sequelize.query('ALTER TABLE "LoopVideos" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT "file"', { type: QueryTypes.RAW });
            console.log('>>> [MIGRATION] Added sourceType to LoopVideos');
        } catch (e) {
            console.log('>>> [MIGRATION] sourceType already exists in LoopVideos or error:', e.message);
        }

        try {
            await sequelize.query('ALTER TABLE "LoopVideos" ADD COLUMN "streamUrl" TEXT', { type: QueryTypes.RAW });
            console.log('>>> [MIGRATION] Added streamUrl to LoopVideos');
        } catch (e) {
            console.log('>>> [MIGRATION] streamUrl already exists in LoopVideos or error:', e.message);
        }

        // Add sourceType and streamUrl to Ads
        console.log('>>> [MIGRATION] Updating Ads table...');
        try {
            await sequelize.query('ALTER TABLE "Ads" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT "file"', { type: QueryTypes.RAW });
            console.log('>>> [MIGRATION] Added sourceType to Ads');
        } catch (e) {
            console.log('>>> [MIGRATION] sourceType already exists in Ads or error:', e.message);
        }

        try {
            await sequelize.query('ALTER TABLE "Ads" ADD COLUMN "streamUrl" TEXT', { type: QueryTypes.RAW });
            console.log('>>> [MIGRATION] Added streamUrl to Ads');
        } catch (e) {
            console.log('>>> [MIGRATION] streamUrl already exists in Ads or error:', e.message);
        }

        console.log('>>> [MIGRATION] Phase 6 complete.');
        process.exit(0);
    } catch (error) {
        console.error('>>> [MIGRATION] Failed:', error);
        process.exit(1);
    }
}

migrate();
