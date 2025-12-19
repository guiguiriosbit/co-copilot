import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdDisplay from './AdDisplay';
import InfoBar from './InfoBar';
import LocationOverlay from './LocationOverlay';

const PlayerPage = () => {
    const [position, setPosition] = useState({ lat: 0, lng: 0 });
    const [weather, setWeather] = useState('sunny');
    const [timeOfDay, setTimeOfDay] = useState('morning');
    const [currentAd, setCurrentAd] = useState(null);
    const [logs, setLogs] = useState([]);
    const [address, setAddress] = useState('');
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
                const addr = response.data.address;
                const buildingName = response.data.name ||
                    addr.building ||
                    addr.amenity ||
                    addr.shop ||
                    addr.tourism ||
                    addr.office ||
                    `${addr.road || ''} ${addr.house_number || ''}`.trim();

                setAddress(buildingName || 'Unknown Location');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        } finally {
            setAddressLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchAddress(position.lat, position.lng);
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
                    weather,
                    time: timeOfDay
                });

                if (response.data.action === 'play') {
                    if (!currentAd || currentAd.id !== response.data.ad.id) {
                        setCurrentAd(response.data.ad);
                        addLog(`Playing ad: ${response.data.ad.campaign}`);
                    }
                } else {
                    if (currentAd) {
                        setCurrentAd(null);
                        addLog('Exited zone. Default content.');
                    }
                }
            } catch (error) {
                console.error('Error fetching ad:', error);
            }
        };

        const interval = setInterval(checkLocation, 2000);
        return () => clearInterval(interval);
    }, [position, weather, timeOfDay, currentAd]);

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
                label={currentAd ? "Negocio Cercano" : "Ubicación Actual"}
            />
            <AdDisplay ad={currentAd} />
            <InfoBar weather={weather} />

            {/* Debug Overlay */}
            <div style={{
                position: 'absolute',
                bottom: '100px',
                right: '20px', // Moved to right
                textAlign: 'right',
                background: 'rgba(0,0,0,0.7)',
                color: '#00ff00',
                padding: '10px',
                borderRadius: '5px',
                fontFamily: 'monospace',
                zIndex: 9999,
                pointerEvents: 'none'
            }}>
                📍 GPS: {position.lat.toFixed(5)}, {position.lng.toFixed(5)} <br />
                🏢 Addr: {address} <br />
                {logs.length > 0 && <span style={{ color: 'red' }}>⚠️ {logs[logs.length - 1]}</span>}
            </div>
        </div>
    );
};

export default PlayerPage;
