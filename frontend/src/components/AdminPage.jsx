import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = ({ onBack }) => {
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }));
            },
            () => {
                alert('Unable to retrieve your location');
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (editingId) {
                await axios.put(`/api/admin/business/${editingId}`, formData);
                setMessage('Business updated successfully!');
            } else {
                await axios.post('/api/admin/create', formData);
                setMessage('Business created successfully!');
            }

            setFormData({ name: '', videoUrl: '', targetUrl: '', lat: '', lng: '' });
            setEditingId(null);
            fetchBusinesses();
        } catch (error) {
            console.error('Error saving business:', error);
            setMessage('Error saving business. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (business) => {
        const ad = business.Ads[0];
        // Extract lat/lng from polygon if possible, or leave blank for now
        // Since we don't easily have the center, we'll leave lat/lng blank
        // and ask user to re-capture if they want to move it.

        setFormData({
            name: business.name,
            videoUrl: ad.url,
            targetUrl: ad.targetUrl || '',
            lat: '',
            lng: ''
        });
        setEditingId(business.id);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this business?')) return;

        try {
            await axios.delete(`/api/admin/business/${id}`);
            fetchBusinesses();
        } catch (error) {
            console.error('Error deleting business:', error);
            alert('Error deleting business');
        }
    };

    const handleCancelEdit = () => {
        setFormData({ name: '', videoUrl: '', targetUrl: '', lat: '', lng: '' });
        setEditingId(null);
    };

    // Video Loop Management Functions
    const fetchLoopVideos = async () => {
        try {
            const response = await axios.get('/api/admin/videoloop');
            setLoopVideos(response.data);
        } catch (error) {
            console.error('Error fetching loop videos:', error);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid video file (MP4, WebM, OGG, or MOV)');
                return;
            }
            // Validate file size (100MB limit)
            if (file.size > 100 * 1024 * 1024) {
                alert('File size must be less than 100MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUploadVideo = async () => {
        if (!selectedFile) {
            alert('Please select a video file first');
            return;
        }

        setUploadingVideo(true);
        setUploadMessage('');

        try {
            const formData = new FormData();
            formData.append('video', selectedFile);

            await axios.post('/api/admin/videoloop/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadMessage('Video uploaded successfully!');
            setSelectedFile(null);
            // Reset file input
            document.getElementById('videoFileInput').value = '';
            fetchLoopVideos();
        } catch (error) {
            console.error('Error uploading video:', error);
            setUploadMessage('Error uploading video. Please try again.');
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleDeleteLoopVideo = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

        try {
            await axios.delete(`/api/admin/videoloop/${encodeURIComponent(filename)}`);
            fetchLoopVideos();
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Error deleting video');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };


    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white', background: '#1e293b', minHeight: '100vh' }}>
            <button onClick={onBack} style={{ marginBottom: '20px', padding: '10px', cursor: 'pointer' }}>
                ← Back to Home
            </button>

            <h1>{editingId ? 'Edit Business' : 'Create New Business'}</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#0f172a', padding: '20px', borderRadius: '10px' }}>
                <input
                    type="text"
                    name="name"
                    placeholder="Business Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                />
                <input
                    type="url"
                    name="videoUrl"
                    placeholder="Video URL (mp4)"
                    value={formData.videoUrl}
                    onChange={handleChange}
                    required
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                />
                <input
                    type="url"
                    name="targetUrl"
                    placeholder="Target URL (for QR)"
                    value={formData.targetUrl}
                    onChange={handleChange}
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="number"
                        name="lat"
                        placeholder="Latitude"
                        value={formData.lat}
                        onChange={handleChange}
                        required={!editingId} // Only required for new businesses
                        step="any"
                        style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none' }}
                    />
                    <input
                        type="number"
                        name="lng"
                        placeholder="Longitude"
                        value={formData.lng}
                        onChange={handleChange}
                        required={!editingId}
                        step="any"
                        style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none' }}
                    />
                    <button type="button" onClick={handleGetLocation} style={{ padding: '10px', background: '#38bdf8', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        📍 Get Location
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={loading} style={{ flex: 1, padding: '15px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                        {loading ? 'Saving...' : (editingId ? 'Update Business' : 'Create Business')}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleCancelEdit} style={{ padding: '15px', background: '#64748b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </div>

                {message && <p style={{ textAlign: 'center', color: '#4ade80' }}>{message}</p>}
            </form>

            <h2 style={{ marginTop: '40px' }}>Existing Businesses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {businesses.map(business => (
                    <div key={business.id} style={{ background: '#334155', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0' }}>{business.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                                {business.Ads[0]?.url} <br />
                                <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>QR: {business.Ads[0]?.targetUrl || 'None'}</span>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleEdit(business)} style={{ padding: '8px 12px', background: '#facc15', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️ Edit</button>
                            <button onClick={() => handleDelete(business.id)} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Delete</button>
                        </div>
                    </div>
                ))}
                {businesses.length === 0 && <p>No businesses found.</p>}
            </div>

            {/* Video Loop Management Section */}
            <h2 style={{ marginTop: '60px', borderTop: '2px solid #475569', paddingTop: '40px' }}>Video Loop Management</h2>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                Upload videos that will play in a loop when the device is not near any registered business location.
            </p>

            {/* Upload Section */}
            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Upload New Loop Video</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        id="videoFileInput"
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        onChange={handleFileSelect}
                        style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '5px', border: 'none' }}
                    />
                    <button
                        onClick={handleUploadVideo}
                        disabled={!selectedFile || uploadingVideo}
                        style={{
                            padding: '10px 20px',
                            background: selectedFile && !uploadingVideo ? '#22c55e' : '#64748b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: selectedFile && !uploadingVideo ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold'
                        }}
                    >
                        {uploadingVideo ? 'Uploading...' : '📤 Upload Video'}
                    </button>
                </div>
                {selectedFile && (
                    <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                )}
                {uploadMessage && (
                    <p style={{ marginTop: '10px', color: uploadMessage.includes('success') ? '#4ade80' : '#f87171' }}>
                        {uploadMessage}
                    </p>
                )}
            </div>

            {/* Loop Videos List */}
            <h3>Current Loop Videos ({loopVideos.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {loopVideos.map((video, index) => (
                    <div key={video.filename} style={{ background: '#334155', padding: '15px', borderRadius: '8px' }}>
                        <video
                            src={video.url}
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px', marginBottom: '10px' }}
                            controls
                        />
                        <p style={{ margin: '5px 0', fontSize: '0.85rem', wordBreak: 'break-word' }}>
                            <strong>#{index + 1}:</strong> {video.filename}
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                            Size: {formatFileSize(video.size)}
                        </p>
                        <button
                            onClick={() => handleDeleteLoopVideo(video.filename)}
                            style={{
                                width: '100%',
                                marginTop: '10px',
                                padding: '8px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                ))}
                {loopVideos.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        No loop videos uploaded yet. Upload your first video above!
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
