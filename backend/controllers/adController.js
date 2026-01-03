const { point, booleanPointInPolygon } = require('@turf/turf');
const GeoZone = require('../models/GeoZone');
const Ad = require('../models/Ad');
const Campaign = require('../models/Campaign');

exports.heartbeat = async (req, res) => {
    try {
        const { lat, lng, weather, time } = req.body;
        console.log('Heartbeat received:', { lat, lng, weather, time });

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Location required' });
        }

        const userLocation = point([parseFloat(lng), parseFloat(lat)]); // Turf uses [lng, lat]

        // Fetch all zones (in a real app, you'd use spatial index to filter candidates first)
        const zones = await GeoZone.findAll({
            order: [['createdAt', 'DESC']], // Prioritize newest zones (user created) over seed data
            include: [{
                model: Ad,
                include: [Campaign]
            }]
        });

        let matchedAd = null;

        for (const zone of zones) {
            if (!zone.polygon) continue;

            // Check if point is in polygon
            const isInside = booleanPointInPolygon(userLocation, zone.polygon);

            if (isInside) {
                // Found a zone!
                // Here we could add more complex logic for context (weather, time)
                // For MVP, we just take the ad associated with the zone
                if (zone.Ad) {
                    matchedAd = zone.Ad;

                    // Simple context check example
                    if (matchedAd.contextRules) {
                        const rules = matchedAd.contextRules;
                        if (rules.weather && weather && !rules.weather.includes(weather)) {
                            // Weather doesn't match, maybe skip or look for another ad?
                            // For now, we'll just log it and maybe keep it as fallback
                            console.log('Weather mismatch, but keeping ad for demo');
                        }
                    }
                    break; // Stop at first match for MVP
                }
            }
        }

        if (matchedAd) {
            res.json({
                action: 'play',
                ad: {
                    id: matchedAd.id,
                    type: matchedAd.type,
                    url: matchedAd.url,
                    targetUrl: matchedAd.targetUrl, // Include targetUrl for QR code
                    duration: matchedAd.duration,
                    campaign: matchedAd.Campaign ? matchedAd.Campaign.name : 'Unknown'
                }
            });
        } else {
            // No zone matched - return loop videos
            const fs = require('fs').promises;
            const path = require('path');
            const videoloopDir = path.join(__dirname, '../public/videoloop');

            try {
                await fs.mkdir(videoloopDir, { recursive: true });
                const files = await fs.readdir(videoloopDir);
                const videoFiles = files
                    .filter(file => {
                        const ext = path.extname(file).toLowerCase();
                        return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
                    })
                    .sort() // Alphabetical order for consistent playback
                    .map(file => `/public/videoloop/${file}`);

                res.json({
                    action: 'loop',
                    loopVideos: videoFiles
                });
            } catch (error) {
                console.error('Error reading videoloop directory:', error);
                // Fallback if directory read fails
                res.json({
                    action: 'loop',
                    loopVideos: []
                });
            }
        }

    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
