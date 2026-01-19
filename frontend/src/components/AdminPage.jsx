import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('businesses'); // 'businesses' or 'videoloop'
    const [formData, setFormData] = useState({
        name: '',
        videoUrl: '',
        targetUrl: '',
        lat: '',
        lng: ''
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
        lng: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [editingLoopFilename, setEditingLoopFilename] = useState(null);

    useEffect(() => {
        fetchBusinesses();
        fetchLoopVideos();
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

            setFormData({ name: '', videoUrl: '', targetUrl: '', lat: '', lng: '' });
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
            setLoopMetadata({ businessName: '', targetUrl: '', phoneNumber: '', description: '', lat: '', lng: '' });
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
        background: status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        color: status === 'active' ? '#4ade80' : '#f87171',
        border: `1px solid ${status === 'active' ? '#22c55e' : '#ef4444'}`
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
                                    setFormData({ name: '', videoUrl: '', targetUrl: '', lat: '', lng: '' });
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
                                <form onSubmit={handleBusinessSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input
                                        placeholder="Nombre del Negocio"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                    />
                                    <input
                                        placeholder="URL del Video (mp4)"
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                        required
                                        style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                    />
                                    <input
                                        placeholder="URL de Destino (QR)"
                                        value={formData.targetUrl}
                                        onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                                        style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            placeholder="Latitud"
                                            value={formData.lat}
                                            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                                            style={{ flex: 1, padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                        />
                                        <input
                                            placeholder="Longitud"
                                            value={formData.lng}
                                            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                                            style={{ flex: 1, padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => getCurrentLocation('business')}
                                            style={{ padding: '0 15px', background: '#334155', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                        >📍</button>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                                        <button type="submit" style={{ flex: 1, padding: '12px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '700' }}>
                                            {loading ? 'Guardando...' : '💾 Guardar Negocio'}
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
                                        <th style={thStyle}>Video URL</th>
                                        <th style={thStyle}>QR URL</th>
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
                                                                lng: ''
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
                                    setLoopMetadata({ businessName: '', targetUrl: '', phoneNumber: '', description: '' });
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {editingLoopFilename === 'new' && (
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                                style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', width: '100%' }}
                                            />
                                            {selectedFile && (
                                                <p style={{ fontSize: '12px', color: '#38bdf8', marginTop: '8px' }}>
                                                    📹 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        placeholder="Nombre del Negocio / Campaña"
                                        value={loopMetadata.businessName}
                                        onChange={(e) => setLoopMetadata({ ...loopMetadata, businessName: e.target.value })}
                                        style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                    />
                                    <input
                                        placeholder="WhatsApp (con código)"
                                        value={loopMetadata.phoneNumber}
                                        onChange={(e) => setLoopMetadata({ ...loopMetadata, phoneNumber: e.target.value })}
                                        style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                    />
                                    <input
                                        placeholder="URL de QR / Menú"
                                        value={loopMetadata.targetUrl}
                                        onChange={(e) => setLoopMetadata({ ...loopMetadata, targetUrl: e.target.value })}
                                        style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px', gridColumn: 'span 2' }}>
                                        <input
                                            placeholder="Latitud"
                                            value={loopMetadata.lat}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, lat: e.target.value })}
                                            style={{ flex: 1, padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                        />
                                        <input
                                            placeholder="Longitud"
                                            value={loopMetadata.lng}
                                            onChange={(e) => setLoopMetadata({ ...loopMetadata, lng: e.target.value })}
                                            style={{ flex: 1, padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => getCurrentLocation('loop')}
                                            style={{ padding: '0 15px', background: '#334155', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                        >📍</button>
                                    </div>
                                    <textarea
                                        placeholder="Descripción (Marquee)"
                                        value={loopMetadata.description}
                                        onChange={(e) => setLoopMetadata({ ...loopMetadata, description: e.target.value })}
                                        style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', gridColumn: 'span 2', minHeight: '80px' }}
                                    />
                                    <button
                                        onClick={handleUploadVideo}
                                        style={{ gridColumn: 'span 2', padding: '12px', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '700' }}
                                    >
                                        {uploadingVideo ? 'Procesando...' : '📤 Guardar Cambios'}
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
                                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
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
                                                    lng: v.lng || ''
                                                });
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
            </div>
        </div>
    );
};

export default AdminPage;
