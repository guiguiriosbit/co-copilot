import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdDisplay from './components/AdDisplay';
import InfoBar from './components/InfoBar';
import LocationOverlay from './components/LocationOverlay';
// SimulationMap removed for production

function App() {
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
        // Try to get the most relevant name: building, amenity, or road
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
      // Don't clear address on error to avoid flickering if temporary network issue
    } finally {
      setAddressLoading(false);
    }
  };

  // Update address when position changes significantly (e.g., > 20m) - for now just on every update but debounced could be better
  // Since we update position real-time, we should probably debounce this or only call if distance > threshold.
  // For simplicity in this demo, we'll call it when position changes, but maybe limit it?
  // Actually, let's just add it to a separate effect that depends on position.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAddress(position.lat, position.lng);
    }, 1000); // Debounce by 1 second
    return () => clearTimeout(timeoutId);
  }, [position]);

  // Heartbeat to Backend
  useEffect(() => {
    const checkLocation = async () => {
      try {
        // Use the same hostname as the frontend (e.g., 192.168.x.x) but port 3000
        const backendUrl = `http://${window.location.hostname}:3000/api/heartbeat`;
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

    const interval = setInterval(checkLocation, 2000); // Check every 2 seconds
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
        // Optional: Update speed or heading if available
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
    setLogs(prev => [...prev.slice(-4), msg]); // Keep last 5 logs
  };

  return (
    <div className="app-container">
      {/* Full Screen Smart Window */}
      <div className="smart-window" style={{ width: '100vw', height: '100vh' }}>
        <LocationOverlay address={address} loading={addressLoading} />
        <AdDisplay ad={currentAd} />
        <InfoBar weather={weather} />

        {/* Debug Overlay for User */}
        <div style={{
          position: 'absolute',
          bottom: '100px', // Moved up to avoid InfoBar
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: '#00ff00',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          zIndex: 9999,
          pointerEvents: 'none' // Click through
        }}>
          📍 GPS: {position.lat.toFixed(5)}, {position.lng.toFixed(5)} <br />
          🏢 Addr: {address} <br />
          {logs.length > 0 && <span style={{ color: 'red' }}>⚠️ {logs[logs.length - 1]}</span>}
        </div>
      </div>
    </div>
  );
}

export default App;
