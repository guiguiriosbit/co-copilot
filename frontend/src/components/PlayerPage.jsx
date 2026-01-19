import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { detectLanguageFromAddress } from '../utils/languageDetector';
import AdDisplay from './AdDisplay';
import InfoBar from './InfoBar';

const PlayerPage = () => {
    const { t, i18n } = useTranslation();
    const [position, setPosition] = useState({ lat: 0, lng: 0 });
    const [weatherData, setWeatherData] = useState({ temp: '--', condition: 'Loading...' });
    const [timeOfDay, setTimeOfDay] = useState('morning');
    const [currentAd, setCurrentAd] = useState(null);
    const [lastPlayedAdId, setLastPlayedAdId] = useState(null);
    const [loopVideos, setLoopVideos] = useState(() => {
        const cached = localStorage.getItem('commercial_copilot_loop_videos');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                console.log('>>> [RESILIENCY] Loaded loop videos from cache:', parsed.length);
                return parsed;
            } catch (e) {
                console.error('>>> [RESILIENCY] Failed to parse cached videos:', e);
            }
        }
        return [];
    });
    const [isOffline, setIsOffline] = useState(false);
    const [logs, setLogs] = useState([]);
    const [address, setAddress] = useState('');
    const [cityState, setCityState] = useState('');
    const [addressLoading, setAddressLoading] = useState(false);
    const [initialCheckComplete, setInitialCheckComplete] = useState(false);

    // Reverse Geocoding
    const fetchAddress = async (lat, lng) => {
        if (lat === 0 && lng === 0) return;
        setAddressLoading(true);
        try {
            console.log(`>>> [GEO] Fetching address for: ${lat}, ${lng}`);
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
        console.log(`>>> [WEATHER] Fetching data for coordinates: ${lat}, ${lng}`);
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

    const checkLocation = React.useCallback(async () => {
        try {
            const backendUrl = '/api/heartbeat';
            const response = await axios.post(backendUrl, {
                lat: position.lat,
                lng: position.lng,
                weather: weatherData.condition.toLowerCase(),
                time: timeOfDay
            });

            if (isOffline) {
                setIsOffline(false);
                addLog('Conexión con servidor recuperada.');
            }

            // Mark initial check as complete after first heartbeat
            if (!initialCheckComplete) {
                setInitialCheckComplete(true);
                console.log('>>> [PlayerPage] Initial heartbeat complete. System ready.');
            }

            // Always update loop videos
            if (response.data.loopVideos && JSON.stringify(loopVideos) !== JSON.stringify(response.data.loopVideos)) {
                console.log('>>> [PlayerPage] Updating loopVideos and cache:', response.data.loopVideos);
                console.log(`>>> [PlayerPage] Received ${response.data.loopVideos.length} loop videos from backend`);

                // Clear old cache and set new data
                localStorage.removeItem('commercial_copilot_loop_videos');
                setLoopVideos(response.data.loopVideos);
                localStorage.setItem('commercial_copilot_loop_videos', JSON.stringify(response.data.loopVideos));

                // Log each video for debugging
                response.data.loopVideos.forEach((video, index) => {
                    console.log(`>>> [PlayerPage] Video ${index + 1}: ${video.businessName} - ${video.url}`);
                });
            } else if (response.data.loopVideos) {
                console.log(`>>> [PlayerPage] Loop videos unchanged (${response.data.loopVideos.length} videos)`);
            } else {
                console.warn('>>> [PlayerPage] No loop videos received from backend!');
            }

            if (response.data.action === 'play') {
                const newAd = response.data.ad;
                const isAlreadyPlayed = lastPlayedAdId === newAd.id;
                const isSameAsCurrent = currentAd && currentAd.id === newAd.id;

                if (!isAlreadyPlayed && !isSameAsCurrent) {
                    console.log(`>>> [TRANSITION] Triggering ad: ${newAd.campaign}`);
                    addLog(`Ad detectado: ${newAd.campaign}`);
                    setCurrentAd(newAd);
                }
            } else if (response.data.action === 'loop') {
                if (currentAd) {
                    console.log('>>> [TRANSITION] Exited ad zone');
                    setCurrentAd(null);
                    addLog('Saliendo de zona de anuncio. Volviendo al bucle.');
                }
                if (lastPlayedAdId !== null) {
                    setLastPlayedAdId(null);
                }
            }
        } catch (error) {
            console.error('>>> [RESILIENCY] Heartbeat failed:', error.message);
            if (!isOffline) {
                setIsOffline(true);
                addLog('Servidor no disponible. Usando datos en caché.');
            }
            // Even on error, mark as complete so loop videos can play
            if (!initialCheckComplete) {
                setInitialCheckComplete(true);
            }
        }
    }, [position, weatherData, timeOfDay, currentAd, loopVideos, lastPlayedAdId, initialCheckComplete]);

    const handleAdEnded = React.useCallback(() => {
        if (currentAd) {
            const adName = currentAd.campaign;
            console.log(`>>> [FLOW] Ad finished: ${adName}. Returning to loop.`);
            addLog(`Anuncio terminado. Iniciando videos públicos.`);
            setLastPlayedAdId(currentAd.id);
            setCurrentAd(null);
        }
    }, [currentAd]);

    const handleLoopCycleComplete = React.useCallback(() => {
        console.log(`>>> [FLOW] Public loop cycle complete. Resetting ad gate.`);
        if (lastPlayedAdId) {
            setLastPlayedAdId(null);
            // Trigger check to see if we should play the ad again immediately
            setTimeout(checkLocation, 500);
        }
    }, [lastPlayedAdId, checkLocation]);

    // Heartbeat to Backend
    useEffect(() => {
        // Immediate check on mount
        console.log('>>> [HEARTBEAT] Starting location tracker...');
        checkLocation();

        const interval = setInterval(checkLocation, 2000);
        return () => clearInterval(interval);
    }, [checkLocation]);

    // Real Geolocation Hook
    useEffect(() => {
        if (!navigator.geolocation) {
            addLog('Geolocation is not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                console.log(`>>> [GPS] New signal received: ${latitude}, ${longitude}`);
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
            <AdDisplay
                ad={currentAd}
                loopVideos={loopVideos}
                address={currentAd ? currentAd.campaign : address}
                addressLoading={addressLoading && !currentAd}
                addressLabel={currentAd ? t('playerPage.nearbyBusiness') : t('playerPage.currentLocation')}
                onAdEnded={handleAdEnded}
                onLoopCycleComplete={handleLoopCycleComplete}
            />
            <InfoBar weatherData={weatherData} />




        </div>
    );
};

export default PlayerPage;
