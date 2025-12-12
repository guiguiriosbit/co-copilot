const { sequelize } = require('./config/database');
const Campaign = require('./models/Campaign');
const Ad = require('./models/Ad');
const GeoZone = require('./models/GeoZone');

async function seed() {
    try {
        await sequelize.sync({ force: true }); // Reset DB

        // 1. Create Campaigns
        const campBreakfast = await Campaign.create({
            name: 'Morning Coffee',
            advertiser: 'Starbucks',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        });

        const campDinner = await Campaign.create({
            name: 'Happy Hour',
            advertiser: 'Local Bar',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        });

        // 2. Create Ads
        const adCoffee = await Ad.create({
            type: 'image',
            url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
            duration: 10,
            contextRules: { time: ['morning'] },
            CampaignId: campBreakfast.id
        });

        const adVideo = await Ad.create({
            type: 'video',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            duration: 60,
            contextRules: { time: ['evening', 'afternoon', 'morning'] },
            CampaignId: campDinner.id
        });

        // 3. Create Zones
        // Zone 1: User's Location (Medellin/Antioquia area)
        // Center: 6.16337, -75.59517
        const lat = 6.16337;
        const lng = -75.59517;
        const offset = 0.05; // Approx 5km radius - Huge zone for testing!

        await GeoZone.create({
            name: 'User Current Location',
            polygon: {
                type: 'Polygon',
                coordinates: [[
                    [lng - offset, lat - offset],
                    [lng + offset, lat - offset],
                    [lng + offset, lat + offset],
                    [lng - offset, lat + offset],
                    [lng - offset, lat - offset]
                ]]
            },
            AdId: adVideo.id // Show video here!
        });

        // Zone 2: "Nightlife District" (Dummy)
        await GeoZone.create({
            name: 'Nightlife District',
            polygon: {
                type: 'Polygon',
                coordinates: [[
                    [-0.005, -0.005],
                    [-0.001, -0.005],
                    [-0.001, -0.001],
                    [-0.005, -0.001],
                    [-0.005, -0.005]
                ]]
            },
            AdId: adCoffee.id
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
