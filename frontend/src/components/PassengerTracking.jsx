import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { User, Navigation, Phone, Check, X, MapPin, Star } from 'lucide-react';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 16);
    }, [center, map]);
    return null;
};

// Routing Component
const RoutingMachine = ({ start, end }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !start || !end) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            lineOptions: {
                styles: [{ color: '#38bdf8', weight: 6, opacity: 0.8 }]
            },
            createMarker: () => null, // Hide intermediate markers
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false // Hide text instructions
        }).addTo(map);

        return () => map.removeControl(routingControl);
    }, [map, start, end]);

    return null;
};

const PassengerTracking = () => {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [incomingRequest, setIncomingRequest] = useState(null);
    const [isAccepted, setIsAccepted] = useState(false);

    // Mock passenger location (shifted slightly from user)
    const passengerLocation = userLocation ? [userLocation.lat + 0.005, userLocation.lng + 0.005] : null;

    // Mock an incoming request after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!incomingRequest && !isAccepted) {
                simulateRequest();
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const simulateRequest = () => {
        setIncomingRequest({
            id: 1,
            name: "Juan Perez",
            rating: 4.8,
            pickup: "Envigado - Parque Principal",
            distance: "1.2 km",
            time: "4 min",
            fare: "$12,500 COP"
        });
    };

    // Track device location
    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const handleAccept = () => {
        setIsAccepted(true);
        // Add real logic here to notify backend
    };

    const handleReject = () => {
        setIncomingRequest(null);
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#0f172a' }}>
            {/* Map Background */}
            <div style={{ width: '100%', height: '100%', zIndex: 1 }}>
                {userLocation ? (
                    <MapContainer
                        center={[userLocation.lat, userLocation.lng]}
                        zoom={16}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[userLocation.lat, userLocation.lng]} />
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={200}
                            pathOptions={{ fillColor: '#38bdf8', fillOpacity: 0.2, color: '#38bdf8', weight: 1 }}
                        />
                        <MapUpdater center={[userLocation.lat, userLocation.lng]} />

                        {/* Trace Route when accepted */}
                        {isAccepted && passengerLocation && (
                            <>
                                <Marker position={passengerLocation} />
                                <RoutingMachine
                                    start={[userLocation.lat, userLocation.lng]}
                                    end={passengerLocation}
                                />
                            </>
                        )}
                    </MapContainer>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                        <div className="pulse" style={{ width: 10, height: 10, background: '#38bdf8', borderRadius: '50%' }}></div>
                        <span style={{ marginLeft: 15 }}>Buscando tu ubicación...</span>
                    </div>
                )}
            </div>

            {/* Top Buttons Row */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 2000, display: 'flex', justifyContent: 'space-between' }}>
                <button
                    onClick={() => navigate('/register')}
                    style={{
                        background: 'white', border: 'none', padding: '12px', borderRadius: '50%',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer'
                    }}
                >
                    <X size={24} color="#0f172a" />
                </button>

                {!incomingRequest && !isAccepted && (
                    <button
                        onClick={simulateRequest}
                        style={{
                            background: '#38bdf8', border: 'none', padding: '10px 20px', borderRadius: '20px',
                            color: '#0f172a', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer'
                        }}
                    >
                        Simular Llamada
                    </button>
                )}
            </div>

            {/* Incoming Request Drawer - Uber Style */}
            {incomingRequest && !isAccepted && (
                <div
                    style={{
                        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                        width: '90%', maxWidth: '400px', zIndex: 3000,
                        backgroundColor: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(15px)',
                        borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ width: '50px', height: '50px', background: '#38bdf8', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User color="#0f172a" size={30} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{incomingRequest.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#facc15' }}>
                                    <Star size={14} fill="#facc15" />
                                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{incomingRequest.rating}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1.1rem' }}>{incomingRequest.fare}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{incomingRequest.time}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <MapPin size={20} color="#38bdf8" style={{ marginTop: '2px' }} />
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Punto de Recogida</div>
                            <div style={{ color: 'white', fontWeight: '500' }}>{incomingRequest.pickup}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                            onClick={handleReject}
                            style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#1e293b', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            <X size={20} style={{ marginBottom: '-4px', marginRight: '8px' }} /> Rechazar
                        </button>
                        <button
                            onClick={handleAccept}
                            style={{ flex: 2, padding: '16px', borderRadius: '16px', background: '#38bdf8', border: 'none', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 24px rgba(56, 189, 248, 0.3)' }}
                        >
                            <Check size={20} style={{ marginBottom: '-4px', marginRight: '8px' }} /> Aceptar Viaje
                        </button>
                    </div>
                </div>
            )}

            {/* In-Trip View */}
            {isAccepted && (
                <div
                    style={{
                        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                        width: '90%', maxWidth: '400px', zIndex: 100,
                        backgroundColor: '#38bdf8',
                        borderRadius: '24px', padding: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        color: '#0f172a'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(15,23,42,0.1)', borderRadius: '12px' }}>
                            <Navigation size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>En camino</div>
                            <div style={{ fontSize: '0.9rem' }}>Llegada en {incomingRequest?.time || "---"}</div>
                        </div>
                    </div>
                    <button style={{ background: '#0f172a', border: 'none', padding: '12px', borderRadius: '50%', color: 'white' }}>
                        <Phone size={20} />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .pulse {
                    box-shadow: 0 0 0 rgba(56, 189, 248, 0.4);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
                    70% { box-shadow: 0 0 0 15px rgba(56, 189, 248, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
                }
            `}</style>
        </div>
    );
};

export default PassengerTracking;
