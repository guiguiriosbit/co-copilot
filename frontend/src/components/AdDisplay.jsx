import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';

const AdDisplay = ({ ad, loopVideos = [] }) => {
    const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const videoRef = useRef(null);
    const previousAdRef = useRef(null);

    // Handle video loop advancement
    const handleVideoEnded = () => {
        if (!ad && loopVideos.length > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentLoopIndex((prevIndex) => (prevIndex + 1) % loopVideos.length);
                setIsTransitioning(false);
            }, 300); // Short transition delay
        }
    };

    // When ad becomes null (exiting zone), advance to next video
    useEffect(() => {
        const wasShowingAd = previousAdRef.current !== null;
        const isNowShowingLoop = ad === null;

        if (wasShowingAd && isNowShowingLoop && loopVideos.length > 0) {
            // Exited zone - advance to next video in loop
            setCurrentLoopIndex((prevIndex) => (prevIndex + 1) % loopVideos.length);
        }

        previousAdRef.current = ad;
    }, [ad, loopVideos.length]);

    // Reset video when source changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [currentLoopIndex, ad]);

    // If showing zone-based ad
    if (ad) {
        return (
            <div className="ad-display">
                {ad.type === 'video' ? (
                    <video
                        ref={videoRef}
                        src={ad.url}
                        autoPlay
                        loop
                        muted
                        className="ad-content"
                    />
                ) : (
                    <img src={ad.url} alt="Ad" className="ad-content" />
                )}

                {/* QR Code Section - Top Right */}
                {ad.targetUrl && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'white',
                        padding: '10px',
                        borderRadius: '10px',
                        zIndex: 20,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        <QRCode value={ad.targetUrl} size={108} />
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
    }

    // If showing video loop
    if (loopVideos.length > 0) {
        const currentVideo = loopVideos[currentLoopIndex];
        return (
            <div
                className="ad-display"
                style={{
                    opacity: isTransitioning ? 0.7 : 1,
                    transition: 'opacity 0.3s ease-in-out'
                }}
            >
                <video
                    ref={videoRef}
                    src={currentVideo}
                    autoPlay
                    muted
                    className="ad-content"
                    onEnded={handleVideoEnded}
                    key={currentVideo} // Force re-render on video change
                />

                {/* Optional: Show loop indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '20px',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    fontSize: '14px',
                    zIndex: 10
                }}>
                    Video {currentLoopIndex + 1} / {loopVideos.length}
                </div>
            </div>
        );
    }

    // No ad and no loop videos - show default message
    return (
        <div className="ad-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <h2 style={{ color: '#475569' }}>Waiting for opportunities...</h2>
        </div>
    );
};

export default AdDisplay;
