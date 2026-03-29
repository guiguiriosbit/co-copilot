import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { User, Search, MapPin, Clock, CreditCard, ChevronRight, Car, Bike, ShieldCheck, Star } from 'lucide-react';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Car Icon
const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

// Component to update map center dynamically
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15);
            map.invalidateSize();
        }
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
                styles: [{ color: '#2563eb', weight: 6, opacity: 0.8 }]
            },
            createMarker: () => null,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false
        }).addTo(map);

        return () => map.removeControl(routingControl);
    }, [map, start, end]);

    return null;
};

const PassengerDashboard = () => {
    const navigate = useNavigate();
    // Default to Medellin coordinates if location takes too long
    const [userLocation, setUserLocation] = useState({ lat: 6.2442, lng: -75.5812 });
    const [destination, setDestination] = useState('');
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [nearbyVehicles, setNearbyVehicles] = useState([]);
    const [hasLocated, setHasLocated] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [activeNegotiation, setActiveNegotiation] = useState(null);

    // Sync negotiation from localStorage
    useEffect(() => {
        const interval = setInterval(() => {
            const data = localStorage.getItem('active_negotiation');
            if (data) {
                const parsed = JSON.parse(data);
                if (JSON.stringify(parsed) !== JSON.stringify(activeNegotiation)) {
                    setActiveNegotiation(parsed);
                }
            } else {
                if (activeNegotiation !== null) setActiveNegotiation(null);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeNegotiation]);

    // Track device location
    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                setHasLocated(true);
                generateNearbyVehicles(loc);
            },
            (err) => {
                console.warn('>>> Geolocation error, using default:', err);
                generateNearbyVehicles(userLocation);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, []);

    const generateNearbyVehicles = (loc) => {
        const vehicles = [];
        for (let i = 0; i < 8; i++) {
            vehicles.push({
                id: i,
                lat: loc.lat + (Math.random() - 0.5) * 0.015,
                lng: loc.lng + (Math.random() - 0.5) * 0.015,
            });
        }
        setNearbyVehicles(vehicles);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!destination.trim()) return;

        setIsSearching(true);
        console.log('>>> Searching for:', destination);

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const coords = [parseFloat(lat), parseFloat(lon)];
                setDestinationCoords(coords);
                generateAvailableDrivers(coords);
            } else {
                alert('No se pudo encontrar la ubicación. Intenta con una más específica.');
            }
        } catch (error) {
            console.error('Error geocoding:', error);
            alert('Error al buscar la ubicación.');
        } finally {
            setIsSearching(false);
        }
    };

    const generateAvailableDrivers = (destCoords) => {
        const drivers = [
            { id: 101, name: 'Rodrigo M.', vehicle: 'Mazda 3 Blanco', rating: 4.8, price: '$12.500', time: '3 min', icon: <Car size={24} />, bio: 'Conductor Pro' },
            { id: 102, name: 'Elena G.', vehicle: 'Chevrolet Onix Gris', rating: 4.9, price: '$13.200', time: '5 min', icon: <Car size={24} />, bio: 'Excelente servicio' },
            { id: 103, name: 'Carlos T.', vehicle: 'Suzuki Gixxer Negra', rating: 4.7, price: '$7.800', time: '2 min', icon: <Bike size={24} />, bio: 'Rápido y puntual' },
        ];
        setAvailableDrivers(drivers);
    };

    const handleNegotiate = (driver) => {
        const neg = {
            id: Date.now(),
            driverId: driver.id,
            driverName: driver.name,
            price: driver.price,
            status: 'pending',
            destination: destination,
            updatedBy: 'passenger'
        };
        localStorage.setItem('active_negotiation', JSON.stringify(neg));
        setActiveNegotiation(neg);
    };

    const handleAcceptNegotiation = () => {
        const newData = { ...activeNegotiation, status: 'accepted', updatedBy: 'passenger' };
        localStorage.setItem('active_negotiation', JSON.stringify(newData));
        setActiveNegotiation(newData);
    };

    const handleCancelNegotiation = () => {
        localStorage.removeItem('active_negotiation');
        setActiveNegotiation(null);
    };

    const rideOptions = [
        { id: 1, name: 'UberX', price: '$12.500', time: '3 min', icon: <Car size={24} />, desc: 'Viajes económicos, todos los días' },
        { id: 2, name: 'Premium', price: '$18.200', time: '5 min', icon: <ShieldCheck size={24} />, desc: 'Autos de alta gama con los mejores socios' },
        { id: 3, name: 'Moto', price: '$7.800', time: '2 min', icon: <Bike size={24} />, desc: 'La forma más rápida de evitar el tráfico' },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#f3f4f6', fontFamily: "'Inter', sans-serif" }}>

            {/* Header: Where to? */}
            <form
                onSubmit={handleSearch}
                style={{
                    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    width: '90%', maxWidth: '500px', zIndex: 1000,
                    backgroundColor: 'white', borderRadius: '12px', padding: '12px 20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px'
                }}
            >
                <Search size={22} color="#64748b" />
                <input
                    type="text"
                    placeholder="¿A dónde vas?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '1.1rem', width: '100%', color: '#1e293b' }}
                />
            </form>

            {/* Map Area */}
            <div style={{ width: '100%', height: '60%', zIndex: 1 }}>
                <MapContainer
                    center={[userLocation.lat, userLocation.lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* User Location */}
                    {hasLocated && <Marker position={[userLocation.lat, userLocation.lng]} />}

                    {/* Nearby Vehicles */}
                    {nearbyVehicles.map(v => (
                        <Marker key={v.id} position={[v.lat, v.lng]} icon={carIcon} />
                    ))}


                    {/* Destination Marker */}
                    {destinationCoords && (
                        <Marker position={destinationCoords}>
                            <Popup>Destino: {destination}</Popup>
                        </Marker>
                    )}

                    {/* Suggested Route */}
                    {destinationCoords && (
                        <RoutingMachine
                            start={[userLocation.lat, userLocation.lng]}
                            end={destinationCoords}
                        />
                    )}

                    <MapUpdater center={destinationCoords || [userLocation.lat, userLocation.lng]} />
                </MapContainer>
            </div>

            {/* Bottom Drawer: Ride Options */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
                backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.1)', padding: '20px', zIndex: 1000,
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <div style={{ width: '40px', height: '5px', borderRadius: '10px', backgroundColor: '#e2e8f0' }}></div>
                </div>

                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 'bold' }}>
                    {availableDrivers.length > 0 ? 'Conductores Disponibles' : 'Elige un viaje'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(availableDrivers.length > 0 ? availableDrivers : rideOptions).map(option => (
                        <div key={option.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', cursor: 'pointer',
                            transition: 'all 0.2s', backgroundColor: 'white'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '12px', color: '#0f172a' }}>
                                    {option.icon}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {option.name}
                                        {option.rating && (
                                            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Star size={12} fill="#facc15" color="#facc15" /> {option.rating}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {option.time} • {option.vehicle || option.desc}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{option.price}</div>
                                {availableDrivers.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNegotiate(option);
                                        }}
                                        style={{
                                            marginTop: '5px', padding: '4px 12px', borderRadius: '8px',
                                            backgroundColor: '#38bdf8', color: '#0f172a', border: 'none',
                                            fontSize: '0.75rem', fontWeight: 'bold'
                                        }}
                                    >
                                        Negociar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Payment */}
                <div style={{ marginTop: '20px', padding: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCard size={20} />
                        <span>Efectivo • Personal</span>
                    </div>
                    <ChevronRight size={20} />
                </div>

                <button style={{
                    width: '100%', marginTop: '15px', padding: '16px', borderRadius: '12px',
                    backgroundColor: 'black', color: 'white', fontWeight: 'bold', border: 'none',
                    fontSize: '1.1rem', cursor: 'pointer'
                }}>
                    Confirmar {rideOptions[0].name}
                </button>
            </div>

            {/* Float Navigation Buttons */}
            <div style={{ position: 'absolute', top: '90px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                    onClick={() => navigate('/register')}
                    style={{ background: 'white', border: 'none', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                >
                    <User size={20} color="#0f172a" />
                </button>
                <button
                    onClick={() => navigate('/simulator/driver')}
                    style={{ background: '#0f172a', border: 'none', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', title: 'Ver como Conductor' }}
                >
                    <Car size={20} color="white" />
                </button>
            </div>

            {/* Negotiation Overlay */}
            {activeNegotiation && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
                    zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '400px', backgroundColor: 'white',
                        borderRadius: '24px', padding: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', backgroundColor: '#f1f5f9',
                            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <Car size={32} color="#0f172a" />
                        </div>

                        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: '#0f172a' }}>
                            Negociando con {activeNegotiation.driverName}
                        </h2>

                        <div style={{
                            fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a',
                            margin: '20px 0', padding: '15px', backgroundColor: '#f8fafc',
                            borderRadius: '16px'
                        }}>
                            {activeNegotiation.price}
                        </div>

                        <p style={{ color: '#64748b', marginBottom: '30px' }}>
                            {activeNegotiation.status === 'pending' ? 'Esperando respuesta del conductor...' :
                                activeNegotiation.status === 'countered' ? 'El conductor ha hecho una contra-oferta.' :
                                    activeNegotiation.status === 'accepted' ? '¡El conductor ha aceptado! Preparando tu viaje...' :
                                        activeNegotiation.status === 'rejected' ? 'El conductor no puede realizar este viaje.' : ''}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {activeNegotiation.status === 'countered' && (
                                <button
                                    onClick={handleAcceptNegotiation}
                                    style={{
                                        padding: '16px', borderRadius: '12px', backgroundColor: 'black',
                                        color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    Aceptar Nuevo Precio
                                </button>
                            )}

                            {activeNegotiation.status === 'accepted' ? (
                                <button
                                    onClick={() => {
                                        handleCancelNegotiation();
                                        navigate('/tracking');
                                    }}
                                    style={{
                                        padding: '16px', borderRadius: '12px', backgroundColor: '#10b981',
                                        color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    Ir al Seguimiento
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancelNegotiation}
                                    style={{
                                        padding: '12px', borderRadius: '12px', backgroundColor: 'transparent',
                                        color: '#ef4444', fontWeight: 'bold', border: '1px solid #ef4444', cursor: 'pointer'
                                    }}
                                >
                                    {activeNegotiation.status === 'rejected' ? 'Cerrar' : 'Cancelar Solicitud'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PassengerDashboard;
