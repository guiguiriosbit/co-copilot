import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { detectLanguageFromAddress } from '../utils/languageDetector';
import AdDisplay from './AdDisplay';
import InfoBar from './InfoBar';
import LocationOverlay from './LocationOverlay';

const PlayerPage = () => {
    const { t, i18n } = useTranslation();
    const [position, setPosition] = useState({ lat: 0, lng: 0 });
    const [weatherData, setWeatherData] = useState({ temp: '--', condition: 'Loading...' });
    const [timeOfDay, setTimeOfDay] = useState('morning');
    const [currentAd, setCurrentAd] = useState(null);
    const [loopVideos, setLoopVideos] = useState([]);
    const [logs, setLogs] = useState([]);
    const [address, setAddress] = useState('');
    const [cityState, setCityState] = useState('');
    const [addressLoading, setAddressLoading] = useState(false);

    // Reverse Geocoding
    const fetchAddress = async (lat, lng) => {
        if (lat === 0 && lng === 0) return;
        setAddressLoading(true);
        try {
            // Using OpenStreetMap Nominatim API
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: {
                    'User-Agent': 'CommercialCopilot/1.0'
                }
            });

            if (response.data) {
                // Detect language from location
                const detectedLang = detectLanguageFromAddress(response.data);
                if (detectedLang !== i18n.language) {
                    i18n.changeLanguage(detectedLang);
                    console.log(`Language changed to: ${detectedLang}`);
                }

                const addr = response.data.address;
                const buildingName = response.data.name ||
                    addr.building ||
                    addr.amenity ||
                    addr.shop ||
                    addr.tourism ||
                    addr.office ||
                    `${addr.road || ''} ${addr.house_number || ''}`.trim();

                setAddress(buildingName || 'Unknown Location');

                const city = addr.city || addr.town || addr.village || addr.county || '';
                const state = addr.state || '';
                setCityState(`${city}${city && state ? ', ' : ''}${state}`);
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        } finally {
            setAddressLoading(false);
        }
    };

    // Fetch Weather
    const fetchWeather = async (lat, lng) => {
        if (lat === 0 && lng === 0) return;
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
            );
            const data = await response.json();

            if (data.current_weather) {
                const { temperature, weathercode } = data.current_weather;
                let condition = 'Sunny';

                // Simple WMO code mapping
                if (weathercode >= 1 && weathercode <= 3) condition = 'Partly Cloudy';
                if (weathercode >= 45 && weathercode <= 48) condition = 'Foggy';
                if (weathercode >= 51 && weathercode <= 67) condition = 'Rainy';
                if (weathercode >= 71 && weathercode <= 77) condition = 'Snowy';
                if (weathercode >= 80 && weathercode <= 82) condition = 'Heavy Rain';
                if (weathercode >= 95) condition = 'Thunderstorm';

                setWeatherData({
                    temp: Math.round(temperature),
                    condition
                });
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchAddress(position.lat, position.lng);
            fetchWeather(position.lat, position.lng);
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [position]);

    // Heartbeat to Backend
    useEffect(() => {
        const checkLocation = async () => {
            try {
                const backendUrl = '/api/heartbeat';
                const response = await axios.post(backendUrl, {
                    lat: position.lat,
                    lng: position.lng,
                    weather: weatherData.condition.toLowerCase(),
                    time: timeOfDay
                });

                if (response.data.action === 'play') {
                    // Zone detected - play location-specific ad
                    if (!currentAd || currentAd.id !== response.data.ad.id) {
                        setCurrentAd(response.data.ad);
                        setLoopVideos([]); // Clear loop videos when showing ad
                        addLog(`Playing ad: ${response.data.ad.campaign}`);
                    }
                } else if (response.data.action === 'loop') {
                    // No zone - play loop videos
                    if (currentAd) {
                        setCurrentAd(null);
                        addLog('Exited zone. Resuming video loop.');
                    }
                    if (JSON.stringify(loopVideos) !== JSON.stringify(response.data.loopVideos)) {
                        setLoopVideos(response.data.loopVideos);
                        if (response.data.loopVideos.length > 0) {
                            addLog(`Video loop loaded: ${response.data.loopVideos.length} videos`);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching ad:', error);
            }
        };

        const interval = setInterval(checkLocation, 2000);
        return () => clearInterval(interval);
    }, [position, weatherData, timeOfDay, currentAd, loopVideos]);

    // Real Geolocation Hook
    useEffect(() => {
        if (!navigator.geolocation) {
            addLog('Geolocation is not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition({ lat: latitude, lng: longitude });
            },
            (err) => {
                addLog(`GPS Error: ${err.message}`);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const addLog = (msg) => {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
        setLogs(prev => [...prev.slice(-4), msg]);
    };

    return (
        <div className="smart-window" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* Pass business name if ad is playing, otherwise use address */}
            <LocationOverlay
                address={currentAd ? currentAd.campaign : address}
                loading={addressLoading && !currentAd}
                label={currentAd ? t('playerPage.nearbyBusiness') : t('playerPage.currentLocation')}
            />
            <AdDisplay ad={currentAd} loopVideos={loopVideos} />
            <InfoBar weatherData={weatherData} />




        </div>
    );
};

export default PlayerPage;
