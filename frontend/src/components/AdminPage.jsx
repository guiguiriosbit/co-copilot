import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationPicker = ({ lat, lng, onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return lat && lng ? <Marker position={[lat, lng]} /> : null;
};

const AdminPage = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('businesses'); // 'businesses' or 'videoloop'
    const [formData, setFormData] = useState({
        name: '',
        videoUrl: '',
        targetUrl: '',
        lat: '',
        email: '',
        radiusKm: 0.1,       // default 100m
        scheduleStart: '',   // HH:MM or empty
        scheduleEnd: '',
        adType: 'video',     // 'video' or 'image'
        duration: 30,         // seconds
        sourceType: 'file'
    });
    const [businesses, setBusinesses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Video loop state
    const [loopVideos, setLoopVideos] = useState([]);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loopMetadata, setLoopMetadata] = useState({
        businessName: '',
        targetUrl: '',
        phoneNumber: '',
        description: '',
        lat: '',
        lng: '',
        address: '',
        email: '',
        sourceType: 'file',
        streamUrl: '',
        duration: 0
    });
    const [logoFile, setLogoFile] = useState(null);
    const [editingLoopFilename, setEditingLoopFilename] = useState(null);

    // Trivia state
    const [trivias, setTrivias] = useState([]);
    const [triviaForm, setTriviaForm] = useState({ question: '', answer: '', category: 'General', duration: 15, language: 'es' });
    const [editingTriviaId, setEditingTriviaId] = useState(null);

    // RSS state
    const [rssUrl, setRssUrl] = useState('');
    const [rssMessage, setRssMessage] = useState('');

    // Polls state
    const [polls, setPolls] = useState([]);
    const [pollForm, setPollForm] = useState({ question: '', options: '', category: 'General', language: 'es' });
    const [editingPollId, setEditingPollId] = useState(null);

    useEffect(() => {
        fetchBusinesses();
        fetchLoopVideos();
        fetchTrivias();
        fetchPolls();
    }, []);

    const fetchBusinesses = async () => {
        try {
            const response = await axios.get('/api/admin/businesses');
            setBusinesses(response.data);
        } catch (error) {
            console.error('Error fetching businesses:', error);
        }
    };

    const fetchLoopVideos = async () => {
        try {
            const response = await axios.get('/api/admin/videoloop');
            setLoopVideos(response.data);
        } catch (error) {
            console.error('Error fetching loop videos:', error);
        }
    };

    const fetchTrivias = async () => {
        try {
            const response = await axios.get('/api/admin/trivias');
            setTrivias(response.data);
        } catch (error) {
            console.error('Error fetching trivias:', error);
        }
    };

    const fetchPolls = async () => {
        try {
            const response = await axios.get('/api/admin/polls');
            setPolls(response.data);
        } catch (error) {
            console.error('Error fetching polls:', error);
        }
    };

    const handleRssSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/settings/rss', { url: rssUrl });
            setRssMessage('Configuración RSS actualizada correctamente');
            setTimeout(() => setRssMessage(''), 3000);
        } catch (error) {
            setRssMessage('Error actualizando RSS');
        }
    };

    const handleTriviaSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTriviaId) {
                await axios.put(`/api/admin/trivia/${editingTriviaId}`, triviaForm);
            } else {
                await axios.post('/api/admin/trivia', triviaForm);
            }
            setTriviaForm({ question: '', answer: '', category: 'General', duration: 15 });
            setEditingTriviaId(null);
            fetchTrivias();
        } catch (error) {
            console.error('Error saving trivia:', error);
        }
    };

    const deleteTrivia = async (id) => {
        if (!window.confirm('¿Eliminar esta trivia?')) return;
        try {
            await axios.delete(`/api/admin/trivia/${id}`);
            fetchTrivias();
        } catch (error) {
            console.error('Error deleting trivia:', error);
        }
    };

    const handleBusinessSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (editingId) {
                await axios.put(`/api/admin/business/${editingId}`, formData);
                setMessage('Negocio actualizado con éxito!');
            } else {
                await axios.post('/api/admin/create', formData);
                setMessage('Negocio creado con éxito!');
            }

            setFormData({ name: '', videoUrl: '', targetUrl: '', lat: '', lng: '', phoneNumber: '', address: '', email: '', radiusKm: 0.1, scheduleStart: '', scheduleEnd: '', adType: 'video', duration: 30, sourceType: 'file' });
            setEditingId(null);
            fetchBusinesses();
        } catch (error) {
            console.error('Error saving business:', error);
            setMessage('Error al guardar el negocio.');
        } finally {
            setLoading(false);
        }
    };

    const toggleBusinessStatus = async (business) => {
        try {
            const newStatus = business.status === 'active' ? 'suspended' : 'active';
            await axios.put(`/api/admin/business/${business.id}`, { status: newStatus });
            fetchBusinesses();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error al cambiar el estado');
        }
    };

    const handleDeleteBusiness = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este negocio?')) return;
        try {
            await axios.delete(`/api/admin/business/${id}`);
            fetchBusinesses();
        } catch (error) {
            console.error('Error deleting business:', error);
            alert('Error al eliminar el negocio');
        }
    };

    const toggleLoopStatus = async (video) => {
        try {
            const newStatus = video.status === 'active' ? 'suspended' : 'active';
            const updateUrl = `/api/admin/videoloop/metadata?filename=${encodeURIComponent(video.filename)}`;
            await axios.put(updateUrl, { status: newStatus });
            fetchLoopVideos();
        } catch (error) {
            console.error('Error toggling loop status:', error);
            alert('Error al cambiar el estado del video');
        }
    };

    const handleDeleteLoopVideo = async (filename) => {
        if (!window.confirm(`¿Estás seguro de eliminar ${filename}?`)) return;
        try {
            const deleteUrl = `/api/admin/videoloop/delete?filename=${encodeURIComponent(filename)}`;
            await axios.delete(deleteUrl);
            fetchLoopVideos();
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Error al eliminar el video');
        }
    };

    const handleUploadVideo = async () => {
        // Check if we're creating a new video or editing existing one
        const isNewUpload = editingLoopFilename === 'new';

        if (isNewUpload && !selectedFile) {
            alert('Selecciona un video para subir.');
            return;
        }

        if (!isNewUpload && !editingLoopFilename) {
            alert('Selecciona un video para editar.');
            return;
        }

        setUploadingVideo(true);
        setUploadMessage('');

        try {
            const fd = new FormData();
            fd.append('businessName', loopMetadata.businessName);
            fd.append('targetUrl', loopMetadata.targetUrl);
            fd.append('phoneNumber', loopMetadata.phoneNumber);
            fd.append('description', loopMetadata.description);
            fd.append('lat', loopMetadata.lat);
            fd.append('lng', loopMetadata.lng);
            if (loopMetadata.address) fd.append('address', loopMetadata.address);
            if (loopMetadata.email) fd.append('email', loopMetadata.email);
            fd.append('sourceType', loopMetadata.sourceType);
            if (loopMetadata.streamUrl) fd.append('streamUrl', loopMetadata.streamUrl);
            if (loopMetadata.duration) fd.append('duration', loopMetadata.duration);
            if (logoFile) fd.append('logo', logoFile);

            if (isNewUpload) {
                // NEW VIDEO UPLOAD
                fd.append('video', selectedFile);
                console.log('>>> [AdminPage] Uploading new video:', selectedFile.name);
                await axios.post('/api/admin/videoloop/upload', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUploadMessage('Video subido con éxito!');
                setSelectedFile(null);
            } else {
                // UPDATE EXISTING METADATA
                const updateUrl = `/api/admin/videoloop/metadata?filename=${encodeURIComponent(editingLoopFilename)}`;
                console.log('>>> [AdminPage] Updating metadata for:', editingLoopFilename);
                await axios.put(updateUrl, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUploadMessage('Metadatos actualizados!');
            }

            // Reset
            setEditingLoopFilename(null);
            setLoopMetadata({ businessName: '', targetUrl: '', phoneNumber: '', description: '', lat: '', lng: '', address: '', email: '', sourceType: 'file', streamUrl: '', duration: 0 });
            setLogoFile(null);
            fetchLoopVideos();
        } catch (error) {
            console.error('>>> [AdminPage] Upload/Update error:', error);
            setUploadMessage(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setUploadingVideo(false);
        }
    };

    const getCurrentLocation = (type) => {
        if (!navigator.geolocation) {
            alert('Geolocalización no soportada por el navegador');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (type === 'business') {
                    setFormData(prev => ({ ...prev, lat: latitude.toString(), lng: longitude.toString() }));
                } else {
                    setLoopMetadata(prev => ({ ...prev, lat: latitude.toString(), lng: longitude.toString() }));
                }
            },
            (err) => alert(`Error al obtener ubicación: ${err.message}`),
            { enableHighAccuracy: true }
        );
    };

    // Styles
    const dashboardContainer = {
        display: 'flex',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif"
    };

    const sidebarStyle = {
        width: '260px',
        background: '#1e293b',
        borderRight: '1px solid #334155',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    };

    const mainContentStyle = {
        flex: 1,
        padding: '40px',
        overflowY: 'auto'
    };

    const menuButtonStyle = (active) => ({
        padding: '12px 15px',
        background: active ? '#38bdf8' : 'transparent',
        color: active ? '#0f172a' : '#cbd5e1',
        border: 'none',
        borderRadius: '8px',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '600',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });

    const cardStyle = {
        background: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #334155',
        marginBottom: '20px'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px'
    };

    const thStyle = {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid #334155',
        color: '#94a3b8',
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    const tdStyle = {
        padding: '15px 12px',
        borderBottom: '1px solid #334155',
        fontSize: '14px'
    };

    const actionButtonStyle = (color) => ({
        padding: '6px 10px',
        background: color,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold'
    });

    const statusBadge = (status) => ({
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        background: status === 'active' || status === 'source' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        color: status === 'active' || status === 'source' ? '#4ade80' : '#f87171',
        border: `1px solid ${status === 'active' || status === 'source' ? '#22c55e' : '#ef4444'}`
    });

    return (
        <div style={dashboardContainer}>
            {/* Sidebar */}
            <div style={sidebarStyle}>
                <div style={{ marginBottom: '30px', padding: '0 10px' }}>
                    <h2 style={{ fontSize: '1.2rem', color: '#38bdf8', margin: 0 }}>Copilot Admin</h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Dashboard de Control</p>
                </div>

                <button
                    style={menuButtonStyle(activeTab === 'businesses')}
                    onClick={() => { setActiveTab('businesses'); setEditingId(null); }}
                >
                    🏢 Gestión de Negocios
                </button>
                <button
                    style={menuButtonStyle(activeTab === 'videoloop')}
                    onClick={() => { setActiveTab('videoloop'); setEditingLoopFilename(null); }}
                >
                    🎬 Loop de Video
                </button>
                <button
                    style={menuButtonStyle(activeTab === 'trivia')}
                    onClick={() => { setActiveTab('trivia'); setEditingTriviaId(null); }}
                >
                    💡 Entretenimiento
                </button>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                    <button onClick={onBack} style={{ ...menuButtonStyle(false), width: '100%', color: '#f87171' }}>
                        🚪 Volver al Home
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={mainContentStyle}>
                {activeTab === 'businesses' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Gestión de Negocios</h1>
                            <button
                                onClick={() => {
                                    setEditingId(editingId === 'new' ? null : 'new');
                                    setFormData({ name: '', videoUrl: '', sourceType: 'file', targetUrl: '', lat: '', lng: '', radiusKm: 0.1, scheduleStart: '', scheduleEnd: '', adType: 'video', duration: 30 });
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#38bdf8',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingId === 'new' ? '✖ Cancelar' : '+ Nuevo Negocio'}
                            </button>
                        </div>

                        {editingId && (
                            <div style={cardStyle}>
                                <h3>{editingId === 'new' ? 'Crear Nuevo Negocio' : 'Editar Negocio'}</h3>
                                <form onSubmit={handleBusinessSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                    <div className="form-section-title">Información Básica</div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Nombre del Negocio</label>
                                        <input
                                            className="admin-input"
                                            placeholder="Ej: Restaurante La Parrilla"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Tipo de Origen</label>
                                        <select
                                            className="admin-input"
                                            value={formData.sourceType}
                                            onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                                            style={{ backgroundColor: '#0f172a', color: 'white' }}
                                        >
                                            <option value="file">📁 Archivo Local/URL Directa</option>
                                            <option value="youtube">🎬 YouTube (Link/ID)</option>
                                            <option value="hls">🌐 Streaming En Vivo (HLS)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{formData.sourceType === 'file' ? 'URL del Contenido (mp4/jpg/png)' : 'URL del Streaming'}</label>
                                        <input
                                            className="admin-input"
                                            placeholder="https://..."
                                            value={formData.videoUrl}
                                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">URL de Destino (QR)</label>
                                        <input
                                            className="admin-input"
                                            placeholder="Link de menú o contacto"
                                            value={formData.targetUrl}
                                            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-section-title">Información de Contacto</div>
                                    <div className="form-group">
                                        <label className="form-label">WhatsApp / Teléfono</label>
                                        <input
                                            className="admin-input"
                                            placeholder="+57300..."
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email de Contacto</label>
                                        <input
                                            className="admin-input"
                                            type="email"
                                            placeholder="contacto@negocio.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Dirección Física</label>
                                        <input
                                            className="admin-input"
                                            placeholder="Calle 123 #45-67"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-section-title">📍 Zona de Activación</div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Coordenadas (Lat / Lng)</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                className="admin-input"
                                                placeholder="Latitud"
                                                value={formData.lat}
                                                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                className="admin-input"
                                                placeholder="Longitud"
                                                value={formData.lng}
                                                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => getCurrentLocation('business')}
                                                style={{ padding: '0 20px', background: '#334155', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
                                            >📍</button>
                                        </div>
                                    </div>

                                    {/* Mapa Interactivo */}
                                    <div className="form-group" style={{ gridColumn: 'span 2', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', marginBottom: '15px' }}>
                                        <MapContainer
                                            center={formData.lat && formData.lng ? [formData.lat, formData.lng] : [-34.6037, -58.3816]}
                                            zoom={13}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <LocationPicker
                                                lat={formData.lat}
                                                lng={formData.lng}
                                                onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))}
                                            />
                                            {formData.lat && formData.lng && (
                                                <Circle
                                                    center={[formData.lat, formData.lng]}
                                                    radius={formData.radiusKm * 1000}
                                                    pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.2 }}
                                                />
                                            )}
                                        </MapContainer>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
                                            🖱️ Haz clic en el mapa para posicionar el negocio
                                        </div>
                                    </div>

                                    {/* Radio configurble */}
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">
                                            📡 Radio de GeoFence: <strong style={{ color: '#38bdf8' }}>{formData.radiusKm >= 1 ? `${formData.radiusKm} km` : `${Math.round(formData.radiusKm * 1000)} m`}</strong>
                                        </label>
                                        <input
                                            type="range"
                                            min="0.05"
                                            max="5"
                                            step="0.05"
                                            value={formData.radiusKm}
                                            onChange={(e) => setFormData({ ...formData, radiusKm: parseFloat(e.target.value) })}
                                            style={{ width: '100%', accentColor: '#38bdf8', marginTop: '6px' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                                            <span>50m</span><span>500m</span><span>1km</span><span>2.5km</span><span>5km</span>
                                        </div>
                                    </div>

                                    {/* Horario activo */}
                                    <div className="form-section-title">🕐 Horario de Campaña (Opcional)</div>
                                    <div className="form-group">
                                        <label className="form-label">Inicio (HH:MM, 24h)</label>
                                        <input
                                            type="time"
                                            className="admin-input"
                                            value={formData.scheduleStart}
                                            onChange={(e) => setFormData({ ...formData, scheduleStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fin (HH:MM, 24h)</label>
                                        <input
                                            type="time"
                                            className="admin-input"
                                            value={formData.scheduleEnd}
                                            onChange={(e) => setFormData({ ...formData, scheduleEnd: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-section-title">🎬 Configuración del Anuncio</div>
                                    <div className="form-group">
                                        <label className="form-label">Tipo de Contenido</label>
                                        <select
                                            className="admin-input"
                                            value={formData.adType}
                                            onChange={(e) => setFormData({ ...formData, adType: e.target.value })}
                                            style={{ backgroundColor: '#0f172a', color: 'white' }}
                                        >
                                            <option value="video">Video (MP4)</option>
                                            <option value="image">Imagen (JPG/PNG)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Duración (segundos)</label>
                                        <input
                                            type="number"
                                            className="admin-input"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            min="3"
                                            max="300"
                                        />
                                    </div>

                                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', marginTop: '20px' }}>
                                        <button
                                            type="submit"
                                            style={{
                                                flex: 1,
                                                padding: '15px',
                                                background: '#22c55e',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: '800',
                                                fontSize: '1.1rem',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s ease'
                                            }}
                                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            {loading ? '⌛ Guardando...' : '💾 Guardar Negocio'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div style={cardStyle}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Nombre / Cliente</th>
                                        <th style={thStyle}>Estado</th>
                                        <th style={thStyle}>GeoFencing</th>
                                        <th style={thStyle}>Horario / Tipo</th>
                                        <th style={thStyle}>Contenido</th>
                                        <th style={thStyle}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {businesses.map(b => (
                                        <tr key={b.id}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 'bold' }}>{b.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{b.advertiser}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={statusBadge(b.status)}>{b.status}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ fontSize: '13px' }}>
                                                    {b.radiusKm >= 1 ? `${b.radiusKm} km` : `${Math.round((b.radiusKm || 0.1) * 1000)} m`}
                                                </div>
                                                {b.Ads?.[0]?.GeoZones?.[0]?.polygon?.coordinates ? (
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>📍 Geolocalizado</div>
                                                ) : (
                                                    <div style={{ fontSize: '11px', color: '#f87171' }}>⚠️ Sin zona</div>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                {b.scheduleStart && b.scheduleEnd ? (
                                                    <div style={{ fontSize: '13px', color: '#38bdf8' }}>
                                                        🕒 {b.scheduleStart} - {b.scheduleEnd}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>24/7</div>
                                                )}
                                                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                                                    <span style={{
                                                        background: b.Ads?.[0]?.type === 'image' ? '#78350f' : '#1e1b4b',
                                                        color: b.Ads?.[0]?.type === 'image' ? '#fbbf24' : '#818cf8',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {b.Ads?.[0]?.type || 'video'} ({b.Ads?.[0]?.duration || 30}s)
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                {b.Ads?.[0]?.url ? (
                                                    <a
                                                        href={b.Ads[0].url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#38bdf8',
                                                            textDecoration: 'none',
                                                            fontSize: '12px',
                                                            display: 'block',
                                                            maxWidth: '200px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title={b.Ads[0].url}
                                                    >
                                                        🎥 {b.Ads[0].url}
                                                    </a>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Sin Video</span>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                {b.Ads?.[0]?.targetUrl ? (
                                                    <a
                                                        href={b.Ads[0].targetUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#22c55e',
                                                            textDecoration: 'none',
                                                            fontSize: '12px',
                                                            display: 'block',
                                                            maxWidth: '200px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title={b.Ads[0].targetUrl}
                                                    >
                                                        🔗 {b.Ads[0].targetUrl}
                                                    </a>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Sin URL</span>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(b.id);
                                                            const ad = b.Ads?.[0];
                                                            setFormData({
                                                                name: b.name,
                                                                videoUrl: ad?.url || '',
                                                                targetUrl: ad?.targetUrl || '',
                                                                lat: '',
                                                                lng: '',
                                                                phoneNumber: b.phoneNumber || '',
                                                                address: b.address || '',
                                                                email: b.email || '',
                                                                radiusKm: b.radiusKm || 0.1,
                                                                scheduleStart: b.scheduleStart || '',
                                                                scheduleEnd: b.scheduleEnd || '',
                                                                adType: ad?.type || 'video',
                                                                duration: ad?.duration || 30
                                                            });
                                                        }}
                                                        style={actionButtonStyle('#eab308')}
                                                    >✏️</button>
                                                    <button
                                                        onClick={() => toggleBusinessStatus(b)}
                                                        style={actionButtonStyle(b.status === 'active' ? '#f97316' : '#22c55e')}
                                                    >
                                                        {b.status === 'active' ? '⏸' : '▶'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBusiness(b.id)}
                                                        style={actionButtonStyle('#ef4444')}
                                                    >🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'videoloop' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Gestión de Video Loop</h1>
                            <button
                                onClick={() => {
                                    setEditingLoopFilename(editingLoopFilename === 'new' ? null : 'new');
                                    setLoopMetadata({ businessName: '', targetUrl: '', phoneNumber: '', description: '', lat: '', lng: '', address: '', email: '', sourceType: 'file', streamUrl: '', duration: 0 });
                                    setLogoFile(null);
                                    setSelectedFile(null);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#38bdf8',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingLoopFilename === 'new' ? '✖ Cancelar' : '+ Subir Video'}
                            </button>
                        </div>

                        {editingLoopFilename && (
                            <div style={cardStyle}>
                                <h3>{editingLoopFilename === 'new' ? 'Subir Nuevo Video al Loop' : `Editar: ${editingLoopFilename}`}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                    <div className="form-section-title">Contenido Visual</div>
                                    {editingLoopFilename === 'new' && (
                                        <div style={{ gridColumn: 'span 2' }} className="form-group">
                                            <label className="form-label">Tipo de Origen</label>
                                            <select
                                                className="admin-input"
                                                value={loopMetadata.sourceType}
                                                onChange={(e) => setLoopMetadata({ ...loopMetadata, sourceType: e.target.value })}
                                                style={{ backgroundColor: '#0f172a', color: 'white' }}
                                            >
                                                <option value="file">📁 Archivo Local (MP4)</option>
                                                <option value="youtube">🎬 YouTube (Link/ID)</option>
                                                <option value="hls">🌐 Streaming En Vivo (HLS/m3u8)</option>
                                            </select>
                                        </div>
                                    )}

                                    {editingLoopFilename === 'new' && loopMetadata.sourceType === 'file' && (
                                        <div style={{ gridColumn: 'span 1' }} className="form-group">
                                            <label className="form-label">Archivo de Video</label>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                className="admin-input"
                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                            />
                                            {selectedFile && (
                                                <p style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px' }}>
                                                    📹 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {editingLoopFilename === 'new' && loopMetadata.sourceType !== 'file' && (
                                        <div style={{ gridColumn: 'span 1' }} className="form-group">
                                            <label className="form-label">URL del Streaming / Video</label>
                                            <input
                                                className="admin-input"
                                                placeholder={loopMetadata.sourceType === 'youtube' ? 'Ej: https://youtube.com/watch?v=...' : 'Ej: https://dominio.com/streaming.m3u8'}
                                                value={loopMetadata.streamUrl}
                                                onChange={(e) => setLoopMetadata({ ...loopMetadata, streamUrl: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
                                        <label className="form-label">Duración Máxima (segundos, 0 = auto)</label>
                                        <input
                                            type="number"
                                            className="admin-input"
                                            placeholder="0"
                                            value={loopMetadata.duration}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, duration: e.target.value })}
                                        />
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                            Útil para rotar canales de streaming largos.
                                        </p>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: editingLoopFilename === 'new' ? 'span 1' : 'span 2' }}>
                                        <label className="form-label">Logo del Negocio</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="admin-input"
                                            onChange={(e) => setLogoFile(e.target.files[0])}
                                        />
                                        {logoFile && <p style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px' }}>✅ {logoFile.name}</p>}
                                    </div>

                                    <div className="form-section-title">Información del Negocio</div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Nombre del Negocio / Campaña</label>
                                        <input
                                            className="admin-input"
                                            placeholder="Ej: Oferta Especial Mayo"
                                            value={loopMetadata.businessName}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, businessName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">WhatsApp (con código)</label>
                                        <input
                                            className="admin-input"
                                            placeholder="+57300..."
                                            value={loopMetadata.phoneNumber}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, phoneNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">URL de QR / Menú</label>
                                        <input
                                            className="admin-input"
                                            placeholder="https://..."
                                            value={loopMetadata.targetUrl}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, targetUrl: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email de Contacto</label>
                                        <input
                                            className="admin-input"
                                            type="email"
                                            placeholder="contacto@negocio.com"
                                            value={loopMetadata.email}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Dirección Física</label>
                                        <input
                                            className="admin-input"
                                            placeholder="Calle 123 #45-67"
                                            value={loopMetadata.address}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, address: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-section-title">Ubicación y Mensaje</div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Asignar Ubicación (Lat / Lng)</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                className="admin-input"
                                                placeholder="Latitud"
                                                value={loopMetadata.lat}
                                                onChange={(e) => setLoopMetadata({ ...loopMetadata, lat: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                className="admin-input"
                                                placeholder="Longitud"
                                                value={loopMetadata.lng}
                                                onChange={(e) => setLoopMetadata({ ...loopMetadata, lng: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => getCurrentLocation('loop')}
                                                style={{ padding: '0 20px', background: '#334155', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
                                            >📍</button>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Descripción Publicitaria (Marquee)</label>
                                        <textarea
                                            className="admin-input"
                                            placeholder="Mensaje que aparecerá rotando en pantalla"
                                            value={loopMetadata.description}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, description: e.target.value })}
                                            style={{ minHeight: '80px', resize: 'vertical' }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUploadVideo}
                                        style={{ gridColumn: 'span 2', padding: '15px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '800', marginTop: '10px', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {uploadingVideo ? '⌛ Procesando...' : '📤 Guardar Cambios'}
                                    </button>
                                </div>
                                {uploadMessage && <p style={{ color: '#4ade80', marginTop: '10px', textAlign: 'center' }}>{uploadMessage}</p>}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {loopVideos.map(v => (
                                <div key={v.filename} style={cardStyle}>
                                    <div style={{ position: 'relative', height: '150px', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                                        <video
                                            src={v.url}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onMouseOver={(e) => e.target.play()}
                                            onMouseOut={(e) => e.target.pause()}
                                            muted
                                            loop
                                        />
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                                            <span style={statusBadge('source')}>{v.sourceType?.toUpperCase() || 'FILE'}</span>
                                            <span style={statusBadge(v.status)}>{v.status}</span>
                                        </div>
                                    </div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{v.businessName || 'Sin Nombre'}</h4>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>{v.filename}</p>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => {
                                                setEditingLoopFilename(v.filename);
                                                setLoopMetadata({
                                                    businessName: v.businessName,
                                                    targetUrl: v.targetUrl,
                                                    phoneNumber: v.phoneNumber,
                                                    description: v.description,
                                                    lat: v.lat || '',
                                                    lng: v.lng || '',
                                                    address: v.address || '',
                                                    email: v.email || '',
                                                    sourceType: v.sourceType || 'file',
                                                    streamUrl: v.streamUrl || '',
                                                    duration: v.duration || 0
                                                });
                                                setLogoFile(null);
                                            }}
                                            style={{ ...actionButtonStyle('#eab308'), flex: 1 }}
                                        >Editar</button>
                                        <button
                                            onClick={() => toggleLoopStatus(v)}
                                            style={{ ...actionButtonStyle(v.status === 'active' ? '#f97316' : '#22c55e'), flex: 1 }}
                                        >
                                            {v.status === 'active' ? 'Suspender' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLoopVideo(v.filename)}
                                            style={{ ...actionButtonStyle('#ef4444'), flex: 1 }}
                                        >Eliminar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'trivia' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Gestión de Entretenimiento (Trivia)</h1>
                            <button
                                onClick={() => {
                                    setEditingTriviaId(editingTriviaId === 'new' ? null : 'new');
                                    setTriviaForm({ question: '', answer: '', category: 'General', duration: 15 });
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#38bdf8',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingTriviaId === 'new' ? '✖ Cancelar' : '+ Nueva Trivia'}
                            </button>
                        </div>

                        {editingTriviaId && (
                            <div style={cardStyle}>
                                <h3>{editingTriviaId === 'new' ? 'Crear Nueva Trivia' : 'Editar Trivia'}</h3>
                                <form onSubmit={handleTriviaSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Pregunta</label>
                                        <textarea
                                            className="admin-input"
                                            value={triviaForm.question}
                                            onChange={(e) => setTriviaForm({ ...triviaForm, question: e.target.value })}
                                            required
                                            style={{ minHeight: '80px' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Respuesta</label>
                                        <input
                                            className="admin-input"
                                            value={triviaForm.answer}
                                            onChange={(e) => setTriviaForm({ ...triviaForm, answer: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Categoría</label>
                                        <input
                                            className="admin-input"
                                            value={triviaForm.category}
                                            onChange={(e) => setTriviaForm({ ...triviaForm, category: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Duración (segundos)</label>
                                        <input
                                            type="number"
                                            className="admin-input"
                                            value={triviaForm.duration}
                                            onChange={(e) => setTriviaForm({ ...triviaForm, duration: e.target.value })}
                                            min="5"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Idioma</label>
                                        <select
                                            className="admin-input"
                                            value={triviaForm.language}
                                            onChange={(e) => setTriviaForm({ ...triviaForm, language: e.target.value })}
                                            style={{ background: '#0f172a', color: 'white' }}
                                        >
                                            <option value="es">Español</option>
                                            <option value="en">English</option>
                                            <option value="pt">Português</option>
                                            <option value="fr">Français</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        style={{ gridColumn: 'span 2', padding: '15px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        💾 Guardar Trivia
                                    </button>
                                </form>
                            </div>
                        )}

                        <div style={cardStyle}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Pregunta</th>
                                        <th style={thStyle}>Respuesta</th>
                                        <th style={thStyle}>Idioma</th>
                                        <th style={thStyle}>Categoría</th>
                                        <th style={thStyle}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trivias.map(t => (
                                        <tr key={t.id}>
                                            <td style={tdStyle}>{t.question}</td>
                                            <td style={tdStyle}>{t.answer}</td>
                                            <td style={tdStyle}>
                                                <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                    {t.language?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>{t.category}</td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => { setEditingTriviaId(t.id); setTriviaForm(t); }} style={actionButtonStyle('#eab308')}>✏️</button>
                                                    <button onClick={() => deleteTrivia(t.id)} style={actionButtonStyle('#ef4444')}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ ...cardStyle, marginTop: '40px', borderTop: '4px solid #ef4444' }}>
                            <h3 style={{ marginTop: 0 }}>⚙️ Configuración Global de Noticias (RSS)</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                                Introduce la URL de un feed RSS válido (XML) para mostrar titulares en la parte inferior del reproductor.
                            </p>
                            <form onSubmit={handleRssSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">URL del Feed RSS</label>
                                    <input
                                        className="admin-input"
                                        placeholder="http://ejemplo.com/rss.xml"
                                        value={rssUrl}
                                        onChange={(e) => setRssUrl(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    style={{ padding: '15px 30px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    📥 Actualizar Feed
                                </button>
                            </form>
                            {rssMessage && <div style={{ marginTop: '10px', color: '#4ade80', fontWeight: 'bold' }}>{rssMessage}</div>}
                            <div style={{ marginTop: '15px', fontSize: '12px', color: '#64748b' }}>
                                Sugerencia: <code>http://feeds.bbci.co.uk/mundo/rss.xml</code> (BBC Mundo)
                            </div>
                        </div>

                        <div style={{ marginTop: '50px', borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>📊 Gestión de Encuestas</h2>
                                <button
                                    onClick={() => {
                                        setEditingPollId(editingPollId === 'new' ? null : 'new');
                                        setPollForm({ question: '', options: '', category: 'General', language: 'es' });
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#818cf8',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editingPollId === 'new' ? '✖ Cancelar' : '+ Nueva Encuesta'}
                                </button>
                            </div>

                            {editingPollId === 'new' && (
                                <div style={cardStyle}>
                                    <h3>Crear Nueva Encuesta</h3>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const optionsArray = pollForm.options.split(',').map(o => o.trim());
                                        await axios.post('/api/admin/polls', { ...pollForm, options: optionsArray });
                                        setEditingPollId(null);
                                        fetchPolls();
                                    }}>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label className="form-label">Pregunta</label>
                                            <input
                                                className="admin-input"
                                                value={pollForm.question}
                                                onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label className="form-label">Idioma</label>
                                            <select
                                                className="admin-input"
                                                value={pollForm.language}
                                                onChange={(e) => setPollForm({ ...pollForm, language: e.target.value })}
                                                style={{ background: '#0f172a', color: 'white' }}
                                            >
                                                <option value="es">Español</option>
                                                <option value="en">English</option>
                                                <option value="pt">Português</option>
                                                <option value="fr">Français</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label className="form-label">Opciones (separadas por comas)</label>
                                            <input
                                                className="admin-input"
                                                placeholder="Opción 1, Opción 2, Opción 3"
                                                value={pollForm.options}
                                                onChange={(e) => setPollForm({ ...pollForm, options: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <button type="submit" style={{ padding: '12px 25px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                                            🚀 Publicar Encuesta
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div style={cardStyle}>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>Pregunta</th>
                                            <th style={thStyle}>Idioma</th>
                                            <th style={thStyle}>Opciones</th>
                                            <th style={thStyle}>Categoría</th>
                                            <th style={thStyle}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {polls.map(p => (
                                            <tr key={p.id}>
                                                <td style={tdStyle}>{p.question}</td>
                                                <td style={tdStyle}>
                                                    <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                        {p.language?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>{p.options.join(', ')}</td>
                                                <td style={tdStyle}>{p.category}</td>
                                                <td style={tdStyle}>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('¿Eliminar encuesta?')) {
                                                                await axios.delete(`/api/admin/polls/${p.id}`);
                                                                fetchPolls();
                                                            }
                                                        }}
                                                        style={actionButtonStyle('#ef4444')}
                                                    >🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default AdminPage;
