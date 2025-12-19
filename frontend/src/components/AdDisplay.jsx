import React from 'react';
import QRCode from 'react-qr-code';

const AdDisplay = ({ ad }) => {
    console.log('AdDisplay received ad:', ad);
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

            {/* QR Code Section - Top Left */}
            {ad.targetUrl && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'white',
                    padding: '10px',
                    borderRadius: '10px',
                    zIndex: 20,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}>
                    <QRCode value={ad.targetUrl} size={120} />
                    <p style={{ color: 'black', fontSize: '12px', margin: '5px 0 0 0', textAlign: 'center', fontWeight: 'bold' }}>Escanear info</p>
                </div>
            )}

            <div className="ad-overlay">
                <h3 className="ad-title">{ad.campaign}</h3>
                <p>¡Oferta especial para ti!</p>
                <div className="ad-cta">Ver detalles</div>
            </div>
        </div>
    );
};

export default AdDisplay;
