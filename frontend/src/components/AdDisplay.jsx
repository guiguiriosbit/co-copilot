import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';

const AdDisplay = ({ ad, loopVideos = [], address, addressLoading, addressLabel, onAdEnded, onLoopCycleComplete }) => {
    const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const videoRef = useRef(null);
    const imageTimerRef = useRef(null);

    // Unified handler for content end
    const handleContentEnded = () => {
        console.log('>>> [AdDisplay] Content Ended. isAd:', !!ad);
        if (ad) {
            console.log('>>> [AdDisplay] Ad Ended:', ad.campaign);
            if (onAdEnded) onAdEnded();
        } else if (loopVideos.length > 0) {
            console.log(`>>> [AdDisplay] Loop Video Ended: ${currentLoopIndex + 1}/${loopVideos.length}`);
            setIsTransitioning(true);

            if (currentLoopIndex === loopVideos.length - 1) {
                console.log(`>>> [AdDisplay] FULL LOOP CYCLE COMPLETE`);
                if (onLoopCycleComplete) onLoopCycleComplete();
            }

            setTimeout(() => {
                const nextIndex = (currentLoopIndex + 1) % loopVideos.length;
                console.log(`>>> [AdDisplay] Moving to next video index: ${nextIndex}`);
                setCurrentLoopIndex(nextIndex);
                setIsTransitioning(false);

                // Force replay if we're cycling back to the same video (single video loop)
                if (nextIndex === currentLoopIndex && videoRef.current) {
                    console.log('>>> [AdDisplay] Same index - forcing video replay');
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(err => {
                        console.warn('>>> [AdDisplay] Forced replay failed:', err);
                    });
                }
            }, 300);
        }
    };

    // Handle Image Ad Duration
    useEffect(() => {
        if (ad && ad.type === 'image') {
            const duration = (ad.duration || 10) * 1000;
            console.log(`>>> [AdDisplay] Image ad detected. Setting timer for ${duration}ms`);

            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);

            imageTimerRef.current = setTimeout(() => {
                console.log('>>> [AdDisplay] Image ad duration reached');
                handleContentEnded();
            }, duration);
        }
        return () => {
            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        };
    }, [ad?.id, ad?.type]);

    // Determine what to show
    const activeVideo = ad || (loopVideos.length > 0 ? loopVideos[currentLoopIndex] : null);

    // Force play when active video changes
    useEffect(() => {
        if (activeVideo && activeVideo.url && (ad?.type !== 'image')) {
            if (videoRef.current) {
                console.log('>>> [AdDisplay] Playing video:', activeVideo.url);
                videoRef.current.load();
                videoRef.current.play().catch(err => {
                    console.warn('>>> [AdDisplay] Playback failed:', err);
                });
            }
        }
    }, [activeVideo?.url, ad?.id]);

    // Reset loop index if loopVideos changes
    useEffect(() => {
        console.log(`>>> [AdDisplay] loopVideos changed. Count: ${loopVideos.length}, currentIndex: ${currentLoopIndex}`);
        if (loopVideos.length > 0 && currentLoopIndex >= loopVideos.length) {
            console.log(`>>> [AdDisplay] Resetting index to 0 (was ${currentLoopIndex})`);
            setCurrentLoopIndex(0);
        } else if (loopVideos.length === 0) {
            console.warn('>>> [AdDisplay] No loop videos available!');
        }
    }, [loopVideos.length]);

    const renderMetadataCard = (data) => (
        <div className="unified-card-overlay">
            <div className="unified-card">
                <div className="card-section-location">
                    <div className="location-icon">🏢</div>
                    <div className="location-text">
                        <span className="location-label">{addressLabel}</span>
                        <h2 className="location-name">
                            {data.businessName || address || "Socio Comercial"}
                        </h2>
                    </div>
                </div>

                {data.phoneNumber && (
                    <div className="card-section-ad">
                        <p className="ad-description">📞 {data.phoneNumber}</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="ad-display" style={{
            opacity: isTransitioning ? 0.7 : 1,
            transition: 'opacity 0.3s ease-in-out',
            backgroundColor: '#000',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {activeVideo ? (
                <>
                    {ad?.type === 'image' ? (
                        <div className="ad-content-image-wrapper" style={{ width: '100%', height: '100%' }}>
                            <img
                                src={activeVideo.url}
                                alt={ad.campaign}
                                className="ad-content"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    ) : (
                        <video
                            key={activeVideo.url}
                            ref={videoRef}
                            src={activeVideo.url}
                            autoPlay
                            playsInline
                            className="ad-content"
                            onEnded={handleContentEnded}
                        />
                    )}

                    {/* Top Left Business Logo */}
                    {activeVideo.logoUrl && (
                        <div className="business-logo-overlay">
                            <img src={activeVideo.logoUrl} alt="Business Logo" />
                        </div>
                    )}

                    {/* Marquee Section */}
                    {activeVideo.description && (
                        <div className="marquee-overlay">
                            <div className="marquee-content">
                                <span className="marquee-text-fun">{activeVideo.description}</span>
                            </div>
                        </div>
                    )}

                    {/* QR Code Section */}
                    {activeVideo.targetUrl && (
                        <div className="status-container-right">
                            <div className="qr-container">
                                <QRCode
                                    value={activeVideo.targetUrl}
                                    size={Math.min(window.innerWidth * 0.12, 80)}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                />
                                <p className="qr-label">
                                    {ad ? "Escanear info" : "Contacto QR"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Overlay Section */}
                    {ad ? (
                        <div className="unified-card-overlay">
                            <div className="unified-card">
                                <div className="card-section-location">
                                    <div className="location-icon">📍</div>
                                    <div className="location-text">
                                        <span className="location-label">{addressLabel}</span>
                                        <h2 className="location-name">
                                            {addressLoading ? "Cargando..." : (address || "Ubicación")}
                                        </h2>
                                    </div>
                                </div>
                                <div className="card-section-ad">
                                    <h3 className="ad-title">{ad.campaign}</h3>
                                </div>
                            </div>
                        </div>
                    ) : (
                        renderMetadataCard(activeVideo)
                    )}
                </>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#000' }}>
                    <h2 style={{ color: '#475569' }}>Waiting for opportunities...</h2>
                </div>
            )}
        </div>
    );
};

export default AdDisplay;
