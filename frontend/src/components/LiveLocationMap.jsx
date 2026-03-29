import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
// We use a local fix or a reliable CDN that doesn't 404
const iconFix = () => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
};

iconFix();

// Component to update map center dynamically
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16); // Smoother transition with zoom level 14
            // Invalidating size is crucial if the container size changes or it was hidden
            map.invalidateSize();
        }
    }, [center, map]);
    return null;
};

const LiveLocationMap = ({ userLocation, businessLocation, businessName }) => {
    // Default to a safe fallback (e.g., 0,0) but we will try to center on user
    const [mapReady, setMapReady] = useState(false);

    // Ensure we have valid coordinates
    const validUserLoc = userLocation && userLocation.lat !== 0 && userLocation.lng !== 0;
    const center = validUserLoc ? [userLocation.lat, userLocation.lng] : [0, 0];

    useEffect(() => {
        // Delay rendering slightly to ensure container has dimensions
        const timer = setTimeout(() => setMapReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!mapReady) return <div style={{ width: '100%', height: '100%', background: '#333' }}>Loading Map...</div>;

    return (
        <div className="live-map-container" style={{
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            position: 'relative',
            zIndex: 1 // Internal z-index
        }}>
            <MapContainer
                center={center}
                zoom={14} // Zoom level 14 for a closer view
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                attributionControl={false} // Remove attribution for cleaner look on small widget
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* User Location Marker - Blue/Standard */}
                {validUserLoc && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>Tu ubicación</Popup>
                    </Marker>
                )}

                {/* Business Location Marker */}
                {businessLocation && businessLocation.lat && businessLocation.lng && (
                    <Marker position={[businessLocation.lat, businessLocation.lng]}>
                        <Tooltip permanent direction="top" offset={[0, -20]} className="business-map-label">
                            {businessName || "Destino"}
                        </Tooltip>
                    </Marker>
                )}

                <MapUpdater center={center} />
            </MapContainer>
        </div>
    );
};

export default LiveLocationMap;
