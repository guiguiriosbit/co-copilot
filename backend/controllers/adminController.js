const { point, buffer, bbox, bboxPolygon } = require('@turf/turf');
const Campaign = require('../models/Campaign');
const Ad = require('../models/Ad');
const GeoZone = require('../models/GeoZone');

exports.createBusiness = async (req, res) => {
    try {
        const { name, videoUrl, targetUrl, lat, lng } = req.body;

        if (!name || !videoUrl || !lat || !lng) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create Campaign (Simplified: 1 Campaign per Business)
        const campaign = await Campaign.create({
            name: `${name} Campaign`,
            advertiser: name,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year default
            status: 'active'
        });

        // 2. Create Ad
        const ad = await Ad.create({
            type: 'video',
            url: videoUrl,
            targetUrl: targetUrl || '',
            duration: 30, // Default duration
            CampaignId: campaign.id
        });

        // 3. Create GeoZone (100m radius)
        // ... (rest of create logic same)
        const center = point([parseFloat(lng), parseFloat(lat)]);
        const buffered = buffer(center, 0.1, { units: 'kilometers' });
        const polygonGeometry = buffered.geometry;

        const zone = await GeoZone.create({
            name: `${name} Zone`,
            polygon: polygonGeometry,
            AdId: ad.id
        });

        console.log(`>>> [ADMIN] Created Business: ${name}, AdId: ${ad.id}, ZoneId: ${zone.id}`);

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
        const { name, videoUrl, targetUrl, lat, lng, status } = req.body;

        const campaign = await Campaign.findByPk(id);
        if (!campaign) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Update Campaign
        if (name) campaign.name = name;
        if (status) campaign.status = status;
        await campaign.save();

        // Update Ad (Assuming 1 ad per campaign for this MVP)
        const ad = await Ad.findOne({ where: { CampaignId: id } });
        if (ad) {
            if (videoUrl) ad.url = videoUrl;
            if (targetUrl) ad.targetUrl = targetUrl;
            await ad.save();

            // Update GeoZone if lat/lng provided
            if (lat && lng) {
                const geoZone = await GeoZone.findOne({ where: { AdId: ad.id } });
                if (geoZone) {
                    const pointLocation = point([parseFloat(lng), parseFloat(lat)]);
                    const buffered = buffer(pointLocation, 0.1, { units: 'kilometers' }); // 100 meters
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
