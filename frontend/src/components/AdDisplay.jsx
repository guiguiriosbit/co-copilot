import React from 'react';

const AdDisplay = ({ ad }) => {
    if (!ad) {
        return (
            <div className="ad-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                <h2 style={{ color: '#475569' }}>Waiting for opportunities...</h2>
            </div>
        );
    }

    return (
        <div className="ad-display">
            {ad.type === 'video' ? (
                <video src={ad.url} autoPlay loop muted className="ad-content" />
            ) : (
                <img src={ad.url} alt="Ad" className="ad-content" />
            )}

            <div className="ad-overlay">
                <h3 className="ad-title">{ad.campaign}</h3>
                <p>Special offer just for you!</p>
                <div className="ad-cta">Tap for details</div>
            </div>
        </div>
    );
};

export default AdDisplay;
