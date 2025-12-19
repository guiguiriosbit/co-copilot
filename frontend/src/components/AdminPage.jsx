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

    useEffect(() => {
        fetchBusinesses();
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
        </div>
    );
};

export default AdminPage;
