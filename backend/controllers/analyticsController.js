const Impression = require('../models/Impression');
const Click = require('../models/Click');
const { Op, fn, col, literal } = require('sequelize');

// POST /api/impression — Register a single impression
exports.registerImpression = async (req, res) => {
    try {
        const { screenId, businessName, videoFilename, isAd, durationSeconds, lat, lng, language, weather } = req.body;

        const impression = await Impression.create({
            screenId: screenId || 'unknown',
            businessName: businessName || '',
            videoFilename: videoFilename || '',
            isAd: !!isAd,
            durationSeconds: durationSeconds ? parseFloat(durationSeconds) : null,
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            language: language || 'es',
            weather: weather || ''
        });

        res.status(201).json({ ok: true, id: impression.id });
    } catch (error) {
        console.error('[IMPRESSION] Error registering impression:', error);
        res.status(500).json({ error: 'Failed to register impression' });
    }
};

exports.registerClick = async (req, res) => {
    try {
        const { screenId, businessName, targetUrl, adType, lat, lng } = req.body;

        const click = await Click.create({
            screenId: screenId || 'unknown',
            businessName: businessName || '',
            targetUrl: targetUrl || '',
            adType: adType || 'video',
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null
        });

        res.status(201).json({ ok: true, id: click.id });
    } catch (error) {
        console.error('[CLICK] Error registering click:', error);
        res.status(500).json({ error: 'Failed to register click' });
    }
};

// GET /api/analytics/impressions — Summary metrics
exports.getSummary = async (req, res) => {
    try {
        const totalImpressions = await Impression.count();
        const adImpressions = await Impression.count({ where: { isAd: true } });
        const loopImpressions = await Impression.count({ where: { isAd: false } });

        const totalClicks = await Click.count();
        const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

        // Top businesses by impression count
        const topBusinesses = await Impression.findAll({
            attributes: [
                'businessName',
                [fn('COUNT', col('id')), 'count']
            ],
            where: { businessName: { [Op.ne]: '' } },
            group: ['businessName'],
            order: [[literal('count'), 'DESC']],
            limit: 10,
            raw: true
        });

        const topBusinessesByClick = await Click.findAll({
            attributes: [
                'businessName',
                [fn('COUNT', col('id')), 'count']
            ],
            where: { businessName: { [Op.ne]: '' } },
            group: ['businessName'],
            order: [[literal('count'), 'DESC']],
            limit: 10,
            raw: true
        });

        // Impressions by hour of day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentImpressions = await Impression.findAll({
            where: { createdAt: { [Op.gte]: sevenDaysAgo } },
            order: [['createdAt', 'DESC']],
            limit: 500,
            raw: true
        });

        // Group by hour
        const byHour = Array(24).fill(0);
        recentImpressions.forEach(imp => {
            const h = new Date(imp.createdAt).getHours();
            byHour[h]++;
        });

        // Impressions per day (last 7 days)
        const byDay = {};
        recentImpressions.forEach(imp => {
            const day = new Date(imp.createdAt).toISOString().split('T')[0];
            byDay[day] = (byDay[day] || 0) + 1;
        });

        // Language breakdown
        const byLanguage = await Impression.findAll({
            attributes: [
                'language',
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['language'],
            raw: true
        });

        // Weather breakdown
        const byWeather = await Impression.findAll({
            attributes: [
                'weather',
                [fn('COUNT', col('id')), 'count']
            ],
            where: { weather: { [Op.ne]: '' } },
            group: ['weather'],
            raw: true
        });

        res.json({
            totals: {
                all: totalImpressions,
                ads: adImpressions,
                loop: loopImpressions,
                clicks: totalClicks,
                ctr: parseFloat(ctr)
            },
            topBusinesses,
            topBusinessesByClick,
            byHour,
            byDay,
            byLanguage,
            byWeather,
            recent: recentImpressions.slice(0, 50)
        });
    } catch (error) {
        console.error('[ANALYTICS] Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
