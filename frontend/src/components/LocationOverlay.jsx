import React from 'react';

const LocationOverlay = ({ address, loading, label = "Current Location" }) => {
    return (
        <div className="location-overlay">
            <div className="location-box">
                <div className="location-icon">📍</div>
                <div className="location-text">
                    <span className="location-label">{label}</span>
                    <h2 className="location-name">
                        {loading ? 'Locating...' : (address || 'Unknown Location')}
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default LocationOverlay;
