const { point, buffer, bbox, bboxPolygon } = require('@turf/turf');
const Campaign = require('../models/Campaign');
const Ad = require('../models/Ad');
const GeoZone = require('../models/GeoZone');

exports.createBusiness = async (req, res) => {
    try {
        const { name, videoUrl, targetUrl, lat, lng, phoneNumber, address, email, radiusKm, scheduleStart, scheduleEnd, adType, duration, sourceType } = req.body;

        if (!name || !videoUrl || !lat || !lng) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const geoRadius = parseFloat(radiusKm) || 0.1; // default 100m

        // Create Campaign (Simplified: 1 Campaign per Business)
        const campaign = await Campaign.create({
            name: `${name} Campaign`,
            advertiser: name,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            status: 'active',
            phoneNumber: phoneNumber || '',
            address: address || '',
            email: email || '',
            scheduleStart: scheduleStart || null,
            scheduleEnd: scheduleEnd || null,
            radiusKm: geoRadius
        });

        // 2. Create Ad
        const ad = await Ad.create({
            type: adType || 'video',
            sourceType: sourceType || 'file',
            streamUrl: sourceType !== 'file' ? videoUrl : '',
            url: videoUrl,
            targetUrl: targetUrl || '',
            duration: duration ? parseInt(duration) : (adType === 'image' ? 10 : 30),
            CampaignId: campaign.id
        });

        // 3. Create GeoZone (100m radius)
        // ... (rest of create logic same)
        const center = point([parseFloat(lng), parseFloat(lat)]);
        const buffered = buffer(center, geoRadius, { units: 'kilometers' });
        const polygonGeometry = buffered.geometry;

        const zone = await GeoZone.create({
            name: `${name} Zone`,
            polygon: polygonGeometry,
            AdId: ad.id
        });

        console.log(`>>> [ADMIN] Created Business: ${name}, radius: ${geoRadius * 1000}m, AdId: ${ad.id}`);

        res.status(201).json({
            message: 'Business created successfully',
            business: {
                name: campaign.name,
                status: campaign.status,
                campaignId: campaign.id,
                adId: ad.id,
                zoneId: zone.id
            }
        });

    } catch (error) {
        console.error('Error creating business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBusinesses = async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
            include: [{
                model: Ad,
                include: [GeoZone]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(campaigns);
    } catch (error) {
        console.error('Get businesses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, videoUrl, targetUrl, lat, lng, status, phoneNumber, address, email, radiusKm, scheduleStart, scheduleEnd, adType, duration, sourceType } = req.body;

        const campaign = await Campaign.findByPk(id);
        if (!campaign) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Update Campaign
        if (name) campaign.name = name;
        if (status) campaign.status = status;
        if (phoneNumber !== undefined) campaign.phoneNumber = phoneNumber;
        if (address !== undefined) campaign.address = address;
        if (email !== undefined) campaign.email = email;
        if (scheduleStart !== undefined) campaign.scheduleStart = scheduleStart || null;
        if (scheduleEnd !== undefined) campaign.scheduleEnd = scheduleEnd || null;
        if (radiusKm !== undefined) campaign.radiusKm = parseFloat(radiusKm) || 0.1;
        await campaign.save();

        // Update Ad (Assuming 1 ad per campaign for this MVP)
        const ad = await Ad.findOne({ where: { CampaignId: id } });
        if (ad) {
            if (sourceType) ad.sourceType = sourceType;
            if (videoUrl) {
                ad.url = videoUrl;
                if (sourceType && sourceType !== 'file') ad.streamUrl = videoUrl;
            }
            if (targetUrl) ad.targetUrl = targetUrl;
            if (adType) ad.type = adType;
            if (duration) ad.duration = parseInt(duration);
            await ad.save();

            // Update GeoZone if lat/lng provided
            if (lat && lng) {
                const geoZone = await GeoZone.findOne({ where: { AdId: ad.id } });
                if (geoZone) {
                    const geoRadius = parseFloat(radiusKm) || 0.1;
                    const pointLocation = point([parseFloat(lng), parseFloat(lat)]);
                    const buffered = buffer(pointLocation, geoRadius, { units: 'kilometers' });
                    geoZone.polygon = buffered.geometry;
                    await geoZone.save();
                }
            }
        }

        res.json({ message: 'Business updated successfully' });

    } catch (error) {
        console.error('Update business error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findByPk(id);

        if (!campaign) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Manual Cascade Delete
        const ads = await Ad.findAll({ where: { CampaignId: id } });
        for (const ad of ads) {
            await GeoZone.destroy({ where: { AdId: ad.id } });
            await ad.destroy();
        }
        await campaign.destroy();

        res.json({ message: 'Business deleted successfully' });

    } catch (error) {
        console.error('Delete business error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
