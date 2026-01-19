const fs = require('fs').promises;
const path = require('path');
const { point, booleanPointInPolygon, distance } = require('@turf/turf');
const GeoZone = require('../models/GeoZone');
const Ad = require('../models/Ad');
const Campaign = require('../models/Campaign');
const LoopVideo = require('../models/LoopVideo');

exports.heartbeat = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            console.warn('>>> [HEARTBEAT] Missing coordinates in request body');
            return res.status(400).json({ error: 'Location required' });
        }

        const userPoint = point([parseFloat(lng), parseFloat(lat)]);
        console.log(`>>> [HEARTBEAT] Processing: [${lat}, ${lng}]`);

        // 1. Check for Geolocation Ads (Priority 1)
        const zones = await GeoZone.findAll({
            include: [{
                model: Ad,
                required: true,
                include: [{
                    model: Campaign,
                    where: { status: 'active' },
                    required: true
                }]
            }]
        });

        let matchedAd = null;
        for (const zone of zones) {
            if (!zone.polygon || zone.polygon.type !== 'Polygon') continue;

            try {
                if (booleanPointInPolygon(userPoint, zone.polygon)) {
                    matchedAd = zone.Ad;
                    console.log(`>>> [AD MATCHED] ${matchedAd.Campaign?.name || 'Unnamed'} (Ad ID: ${matchedAd.id})`);
                    break;
                }
            } catch (err) {
                console.error(`>>> [AD ERROR] Failed to check polygon for zone ${zone.id}:`, err.message);
            }
        }

        // 2. Fetch and Filter Loop Videos (Priority 2: Proximity)
        const activeLoopVideos = await LoopVideo.findAll({ where: { status: 'active' } });
        console.log(`>>> [LOOP] Found ${activeLoopVideos.length} active loop videos in DB`);

        let regularLoop = [];
        let nearbyLoop = [];

        for (const meta of activeLoopVideos) {
            const videoData = {
                url: `/public/videoloop/${meta.filename}`,
                businessName: meta.businessName || '',
                targetUrl: meta.targetUrl || '',
                phoneNumber: meta.phoneNumber || '',
                description: meta.description || '',
                logoUrl: meta.logoUrl || ''
            };

            // Check if video has geolocation data
            if (meta.lat && meta.lng) {
                try {
                    const videoPoint = point([parseFloat(meta.lng), parseFloat(meta.lat)]);
                    const dist = distance(userPoint, videoPoint, { units: 'kilometers' });
                    console.log(`>>> [LOOP] Video "${meta.businessName || meta.filename}" is ${(dist * 1000).toFixed(0)}m away`);

                    if (dist <= 0.2) { // 200 meters
                        console.log(`>>> [LOOP] ✓ Video "${meta.businessName || meta.filename}" is NEARBY (within 200m)`);
                        nearbyLoop.push(videoData);
                    }
                } catch (err) {
                    console.error(`>>> [LOC ERROR] Dist check failed for ${meta.filename}:`, err.message);
                }
            } else {
                console.log(`>>> [LOOP] Video "${meta.businessName || meta.filename}" has no geolocation`);
            }

            // Always add to regular loop as fallback
            regularLoop.push(videoData);
        }

        // Sort to maintain consistency
        regularLoop.sort((a, b) => a.url.localeCompare(b.url));
        nearbyLoop.sort((a, b) => a.url.localeCompare(b.url));

        // 3. Construct Response
        // If we found nearby loop videos, prioritize them; otherwise use all active videos
        const finalLoop = nearbyLoop.length > 0 ? nearbyLoop : regularLoop;

        console.log(`>>> [LOOP] Returning ${finalLoop.length} videos (${nearbyLoop.length} nearby, ${regularLoop.length} total active)`);

        const responseData = matchedAd ? {
            action: 'play',
            ad: {
                id: matchedAd.id,
                type: matchedAd.type,
                url: matchedAd.url,
                targetUrl: matchedAd.targetUrl,
                duration: matchedAd.duration,
                campaign: matchedAd.Campaign?.name || 'Unknown'
            },
            loopVideos: finalLoop
        } : {
            action: 'loop',
            loopVideos: finalLoop
        };

        if (!res.headersSent) {
            res.json(responseData);
        }

    } catch (error) {
        console.error('>>> [CRITICAL HEARTBEAT ERROR]:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }
};
