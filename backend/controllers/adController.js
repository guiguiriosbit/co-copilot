const fs = require('fs').promises;
const path = require('path');
const { point, booleanPointInPolygon, distance } = require('@turf/turf');
const GeoZone = require('../models/GeoZone');
const Ad = require('../models/Ad');
const Campaign = require('../models/Campaign');
const LoopVideo = require('../models/LoopVideo');

// Check if current time (UTC-adjusted to server local) is within HH:MM-HH:MM window
const isWithinSchedule = (scheduleStart, scheduleEnd) => {
    if (!scheduleStart || !scheduleEnd) return true; // no schedule = always active
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = scheduleStart.split(':').map(Number);
    const [eh, em] = scheduleEnd.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    // Support overnight ranges (e.g. 22:00 - 06:00)
    if (startMin <= endMin) return nowMinutes >= startMin && nowMinutes < endMin;
    return nowMinutes >= startMin || nowMinutes < endMin;
};

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

        // 2. If a geo-ad matched, check its campaign schedule
        if (matchedAd) {
            const campaign = matchedAd.Campaign;
            if (campaign && !isWithinSchedule(campaign.scheduleStart, campaign.scheduleEnd)) {
                console.log(`>>> [SCHEDULE] Ad "${campaign.name}" is outside its active hours (${campaign.scheduleStart}-${campaign.scheduleEnd}). Falling to loop.`);
                matchedAd = null;
            }
        }

        // 3. Fetch and Filter Loop Videos (Priority 2: Proximity)
        const activeLoopVideos = await LoopVideo.findAll({ where: { status: 'active' } });
        console.log(`>>> [LOOP] Found ${activeLoopVideos.length} active loop videos in DB`);

        let regularLoop = [];
        let nearbyLoop = [];

        for (const meta of activeLoopVideos) {
            const videoData = {
                id: meta.id,
                filename: meta.filename,
                sourceType: meta.sourceType,
                streamUrl: meta.streamUrl,
                url: meta.sourceType === 'file' ? `/public/videoloop/${meta.filename}` : meta.streamUrl,
                businessName: meta.businessName || '',
                targetUrl: meta.targetUrl || '',
                phoneNumber: meta.phoneNumber || '',
                description: meta.description || '',
                logoUrl: meta.logoUrl || '',
                lat: meta.lat,
                lng: meta.lng
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

        // 3. Construct Response: Order Logic (Ad First -> Loop)
        const regularWithoutNearby = regularLoop.filter(rv => !nearbyLoop.some(nv => nv.url === rv.url));
        let loopSequence = [...nearbyLoop, ...regularWithoutNearby]; // Prioritize nearby within the public loop part

        let finalLoop = [];

        // 4. Handle Geolocation Ad (Gestion de Negocios) FIRST
        if (matchedAd) {
            console.log(`>>> [AD INTEGRATION] Prepending matched ad "${matchedAd.Campaign?.name}" to loop`);
            finalLoop.push({
                url: matchedAd.url,
                streamUrl: matchedAd.streamUrl,
                sourceType: matchedAd.sourceType,
                targetUrl: matchedAd.targetUrl,
                duration: matchedAd.duration,
                campaign: matchedAd.Campaign?.name || 'Unknown',
                id: matchedAd.id,
                type: matchedAd.type,
                isAd: true // Special flag for frontend
            });
        }

        // 5. Append Public Loop Videos AFTER Ad
        finalLoop = [...finalLoop, ...loopSequence];

        console.log(`>>> [LOOP] Constructed Ad-First loop. Total items: ${finalLoop.length}`);

        const responseData = {
            action: matchedAd ? 'play' : 'loop',
            ad: matchedAd ? {
                url: matchedAd.url,
                streamUrl: matchedAd.streamUrl,
                sourceType: matchedAd.sourceType,
                targetUrl: matchedAd.targetUrl,
                duration: matchedAd.duration,
                campaign: matchedAd.Campaign?.name || 'Unknown',
                id: matchedAd.id,
                type: matchedAd.type,
                isAd: true
            } : null,
            loopVideos: loopSequence // Use just the public loop here, since ad is separate
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
