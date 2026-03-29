const axios = require('axios');

exports.getWeatherForecast = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'Lat/Lng required' });

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const response = await axios.get(url);

        // Formatear respuesta para el frontend
        const daily = response.data.daily;
        const forecast = daily.time.map((date, i) => ({
            date,
            maxTemp: Math.round(daily.temperature_2m_max[i]),
            minTemp: Math.round(daily.temperature_2m_min[i]),
            weathercode: daily.weathercode[i]
        })).slice(0, 3); // Solo 3 días

        res.json(forecast);
    } catch (error) {
        console.error('>>> [FORECAST] Error:', error.message);
        res.status(500).json({ error: 'Error fetching forecast' });
    }
};

exports.getNearbyPOIs = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'Lat/Lng required' });

        // Overpass API Query: buscar bancos, hospitales, parques y gasolineras en 1km
        const radius = 1000;
        const query = `
            [out:json][timeout:25];
            (
              node["amenity"~"hospital|atm|bank|pharmacy"](around:${radius},${lat},${lng});
              node["leisure"="park"](around:${radius},${lat},${lng});
              node["amenity"="fuel"](around:${radius},${lat},${lng});
            );
            out body 5;
        `;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await axios.get(url);

        const pois = response.data.elements.map(e => ({
            name: e.tags.name || e.tags.amenity || e.tags.leisure || 'Lugar de interés',
            type: e.tags.amenity || e.tags.leisure,
            lat: e.lat,
            lng: e.lon
        }));

        res.json(pois);
    } catch (error) {
        console.error('>>> [POIS] Error:', error.message);
        res.status(500).json({ error: 'Error fetching POIs' });
    }
};
