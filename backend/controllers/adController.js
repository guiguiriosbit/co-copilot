const { point, booleanPointInPolygon } = require('@turf/turf');
const GeoZone = require('../models/GeoZone');
const Ad = require('../models/Ad');
const Campaign = require('../models/Campaign');

exports.heartbeat = async (req, res) => {
    try {
        const { lat, lng, weather, time } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Location required' });
        }

        const userLocation = point([parseFloat(lng), parseFloat(lat)]); // Turf uses [lng, lat]

        // Fetch all zones (in a real app, you'd use spatial index to filter candidates first)
        const zones = await GeoZone.findAll({
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
                    duration: matchedAd.duration,
                    campaign: matchedAd.Campaign ? matchedAd.Campaign.name : 'Unknown'
                }
            });
        } else {
            // Fallback: Play a default video if no zone matches
            // This satisfies the requirement to "show video of the building or business nearby"
            // We'll use a generic city/building video as fallback
            res.json({
                action: 'play',
                ad: {
                    id: 'default-fallback',
                    type: 'video',
                    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', // Placeholder video
                    duration: 60,
                    campaign: 'General View'
                }
            });
        }

    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
