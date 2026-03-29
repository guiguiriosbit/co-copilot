import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import LiveLocationMap from './LiveLocationMap';
import TriviaCard from './TriviaCard';
import NewsTicker from './NewsTicker';
import WeatherForecast from './WeatherForecast';
import LocalPOIs from './LocalPOIs';
import PollCard from './PollCard';
import ReactPlayer from 'react-player';

const AdDisplay = ({ ad, loopVideos = [], address, addressLabel, addressLoading, onAdEnded, onLoopCycleComplete, userLocation, screenId, currentLanguage, currentWeather }) => {
    const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isMapFocused, setIsMapFocused] = useState(false);
    const [showTrivia, setShowTrivia] = useState(false);
    const [triviaData, setTriviaData] = useState(null);
    const [contentCounter, setContentCounter] = useState(0);

    // Phase 3 Utility state
    const [showForecast, setShowForecast] = useState(false);
    const [forecastData, setForecastData] = useState(null);
    const [showPOIs, setShowPOIs] = useState(false);
    const [poisData, setPoisData] = useState(null);
    const [showPoll, setShowPoll] = useState(false);
    const [pollData, setPollData] = useState(null);
    const videoRef = useRef(null);
    const imageTimerRef = useRef(null);
    const playStartRef = useRef(null); // Tracks when current content started playing

    // Determine what to show - moved to top to prevent ReferenceError in hooks
    const activeVideo = ad || (loopVideos.length > 0 ? loopVideos[currentLoopIndex] : null);

    // Logic to extract business location from ad/video if available
    const getBusinessLocation = () => {
        if (activeVideo && activeVideo.lat && activeVideo.lng) {
            return {
                lat: parseFloat(activeVideo.lat),
                lng: parseFloat(activeVideo.lng)
            };
        }
        return null;
    };

    const businessLocation = getBusinessLocation();

    // Record impression to backend
    const recordImpression = (content, isAdContent) => {
        const duration = playStartRef.current ? (Date.now() - playStartRef.current) / 1000 : null;
        const payload = {
            screenId: screenId || localStorage.getItem('cc_screen_id') || 'unknown',
            businessName: content?.businessName || content?.campaign || '',
            videoFilename: content?.url ? content.url.split('/').pop() : '',
            isAd: !!isAdContent,
            durationSeconds: duration,
            lat: userLocation?.lat || null,
            lng: userLocation?.lng || null,
            language: currentLanguage || 'es',
            weather: currentWeather || ''
        };
        fetch('/api/impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.warn('[AdDisplay] Failed to record impression:', err));
    };

    const recordClick = (content) => {
        if (!content?.targetUrl) return;

        const payload = {
            screenId: screenId || localStorage.getItem('cc_screen_id') || 'unknown',
            businessName: content.businessName || content.campaign || '',
            targetUrl: content.targetUrl,
            adType: ad?.type || 'video',
            lat: userLocation?.lat || null,
            lng: userLocation?.lng || null
        };

        fetch('/api/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.warn('[AdDisplay] Failed to record click:', err));
    };

    // Track start time when active video changes
    useEffect(() => {
        playStartRef.current = Date.now();
    }, [ad?.id, currentLoopIndex]);

    // Handle initial click to enable audio
    const handleStartClick = () => {
        console.log('>>> [AdDisplay] User interacted. Enabling audio.');
        setHasInteracted(true);
        if (videoRef.current) {
            videoRef.current.play().catch(err => {
                console.warn('>>> [AdDisplay] Play on interaction failed:', err);
            });
        }
    };

    // Unified handler for content end
    const handleContentEnded = () => {
        console.log('>>> [AdDisplay] Content Ended. isAd:', !!ad);

        const nextCount = contentCounter + 1;
        setContentCounter(nextCount);

        // Rotation logic: every 4 items, show something external
        if (nextCount > 0 && nextCount % 16 === 0) {
            // Every 16: Poll
            console.log('>>> [AdDisplay] Time for Poll!');
            const lng = currentLanguage || 'es';
            fetch(`/api/entertainment/poll?lng=${lng}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setPollData(data);
                        setShowPoll(true);
                    } else {
                        continueToNextContent();
                    }
                })
                .catch(() => continueToNextContent());
        } else if (nextCount > 0 && nextCount % 12 === 0) {
            // Every 12: POIs
            console.log('>>> [AdDisplay] Time for POIs!');
            fetch(`/api/entertainment/pois?lat=${userLocation.lat}&lng=${userLocation.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setPoisData(data);
                        setShowPOIs(true);
                    } else {
                        continueToNextContent();
                    }
                })
                .catch(() => continueToNextContent());
        } else if (nextCount > 0 && nextCount % 8 === 0) {
            // Every 8: Forecast
            console.log('>>> [AdDisplay] Time for Forecast!');
            fetch(`/api/entertainment/forecast?lat=${userLocation.lat}&lng=${userLocation.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setForecastData(data);
                        setShowForecast(true);
                    } else {
                        continueToNextContent();
                    }
                })
                .catch(() => continueToNextContent());
        } else if (nextCount > 0 && nextCount % 4 === 0) {
            // Every 4: Trivia
            console.log('>>> [AdDisplay] Time for Trivia!');
            const lng = currentLanguage || 'es';
            fetch(`/api/entertainment/trivia?lng=${lng}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setTriviaData(data);
                        setShowTrivia(true);
                    } else {
                        continueToNextContent();
                    }
                })
                .catch(() => continueToNextContent());
        } else {
            continueToNextContent();
        }
    };

    const continueToNextContent = () => {
        if (ad) {
            console.log('>>> [AdDisplay] Ad Ended:', ad.campaign);
            recordImpression(ad, true);
            if (onAdEnded) onAdEnded();
        } else if (loopVideos.length > 0) {
            const current = loopVideos[currentLoopIndex];
            recordImpression(current, !!current?.isAd);
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

    // Handle Image Ad and Stream Duration timeouts
    useEffect(() => {
        const currentContent = activeVideo;
        if (!currentContent) return;

        // Determine if we need a manual timeout
        // 1. Image ads always need a timeout
        // 2. Streams with a specified duration need a timeout
        const isImage = ad?.type === 'image' || currentContent?.type === 'image' || currentContent?.adType === 'image';
        const isStream = currentContent.sourceType && currentContent.sourceType !== 'file';
        
        let timeoutDuration = 0;
        if (isImage) {
            timeoutDuration = (currentContent.duration || 10) * 1000;
        } else if (isStream && currentContent.duration) {
            timeoutDuration = currentContent.duration * 1000;
        }

        if (timeoutDuration > 0) {
            console.log(`>>> [AdDisplay] Content needs manual timeout. Setting timer for ${timeoutDuration}ms`);
            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
            imageTimerRef.current = setTimeout(() => {
                console.log('>>> [AdDisplay] Content duration reached (timeout)');
                handleContentEnded();
            }, timeoutDuration);
        }

        return () => {
            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        };
    }, [activeVideo?.url, activeVideo?.id, ad?.id]);

    if (activeVideo) {
        // Log is helpful for remote debugging but can be noisy
        // console.log(`>>> [AdDisplay] Active Content: ${activeVideo.url}, isAd: ${!!(ad || activeVideo.isAd)}`);
    }

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

                {(data.phoneNumber || data.address || data.email) && (
                    <div className="card-section-ad">
                        {data.phoneNumber && <p className="ad-description">📞 {data.phoneNumber}</p>}
                        {data.address && <p className="ad-description">🏠 {data.address}</p>}
                        {data.email && <p className="ad-description">📧 {data.email}</p>}
                    </div>
                )}
            </div>
        </div>
    );

    // businessLocation defined at top

    return (
        <div
            className="ad-display"
            onClick={() => {
                if (!hasInteracted) setHasInteracted(true);
                if (activeVideo?.targetUrl) recordClick(activeVideo);
            }}
            style={{
                opacity: isTransitioning ? 0.7 : 1,
                transition: 'opacity 0.3s ease-in-out',
                backgroundColor: '#000',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                cursor: activeVideo?.targetUrl ? 'pointer' : 'default'
            }}
        >
            {showTrivia && triviaData ? (
                <TriviaCard
                    trivia={triviaData}
                    onComplete={() => {
                        setShowTrivia(false);
                        continueToNextContent();
                    }}
                />
            ) : showForecast && forecastData ? (
                <WeatherForecast
                    forecast={forecastData}
                    onComplete={() => {
                        setShowForecast(false);
                        continueToNextContent();
                    }}
                />
            ) : showPOIs && poisData ? (
                <LocalPOIs
                    pois={poisData}
                    onComplete={() => {
                        setShowPOIs(false);
                        continueToNextContent();
                    }}
                />
            ) : showPoll && pollData ? (
                <PollCard
                    poll={pollData}
                    userLocation={userLocation}
                    onComplete={() => {
                        setShowPoll(false);
                        continueToNextContent();
                    }}
                />
            ) : activeVideo ? (
                <>
                    {/* Interaction Overlay to satisfy browser autoplay policies */}
                    {/* Interaction Overlay removed to avoid blocking view. Autoplay uses muted instead. */}

                    {ad?.type === 'image' ? (
                        <div className="ad-content-image-wrapper" style={{ width: '100%', height: '100%' }}>
                            <img
                                src={activeVideo.url}
                                alt={ad.campaign}
                                className="ad-content"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    ) : (activeVideo.sourceType && activeVideo.sourceType !== 'file') ? (
                        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000' }}>
                            <ReactPlayer
                                url={activeVideo.url}
                                playing={true}
                                controls={false}
                                onEnded={handleContentEnded}
                                onError={(e) => {
                                    console.error('>>> [AdDisplay] ReactPlayer Error:', e);
                                    handleContentEnded();
                                }}
                                config={{
                                    youtube: { playerVars: { disablekb: 1, rel: 0, modestbranding: 1 } },
                                    file: { forceHLS: activeVideo.sourceType === 'hls' }
                                }}
                                muted={!hasInteracted}
                                volume={hasInteracted ? 1 : 0}
                                className="ad-content"
                                width="100%"
                                height="100%"
                            />
                        </div>
                    ) : (
                        <video
                            key={activeVideo.url}
                            ref={videoRef}
                            src={activeVideo.url}
                            autoPlay
                            muted={!hasInteracted}
                            playsInline
                            className="ad-content"
                            onEnded={handleContentEnded}
                            onError={(e) => {
                                console.error('>>> [AdDisplay] Video Error:', e.nativeEvent, 'URL:', activeVideo?.url);
                                handleContentEnded();
                            }}
                        />
                    )}

                    {/* Top Left Business Logo */}
                    {activeVideo.logoUrl && (
                        <div className="business-logo-overlay">
                            <img src={activeVideo.logoUrl} alt="Business Logo" />
                        </div>
                    )}


                    {/* Bottom UI Group: Map and Info Card side-by-side */}
                    <div className="bottom-ui-group">
                        {(ad || activeVideo?.isAd) ? (
                            <div className="unified-card-overlay">
                                <div className="unified-card">
                                    <div className="card-section-location">
                                        <div className="location-icon">📍</div>
                                        <div className="location-text">
                                            <span className="location-label">ANUNCIO - {addressLabel}</span>
                                            <h2 className="location-name">
                                                {activeVideo?.campaign || ad?.campaign || "Zona de Interés"}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="card-section-ad">
                                        <h3 className="ad-title">{activeVideo?.businessName || "Publicidad Local"}</h3>
                                        {(activeVideo?.phoneNumber || ad?.phoneNumber) && (
                                            <p className="ad-description">📞 {activeVideo?.phoneNumber || ad?.phoneNumber}</p>
                                        )}
                                        {(activeVideo?.address || ad?.address) && (
                                            <p className="ad-description">🏠 {activeVideo?.address || ad?.address}</p>
                                        )}
                                        {(activeVideo?.email || ad?.email) && (
                                            <p className="ad-description">📧 {activeVideo?.email || ad?.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            renderMetadataCard(activeVideo)
                        )}

                        {userLocation && (
                            <div
                                className={`live-location-map-wrapper ${isMapFocused ? 'is-focused' : ''}`}
                                onClick={() => setIsMapFocused(!isMapFocused)}
                            >
                                <LiveLocationMap
                                    userLocation={userLocation}
                                    businessLocation={businessLocation}
                                    businessName={activeVideo?.businessName || activeVideo?.campaign || "Destino"}
                                />
                            </div>
                        )}
                        {/* QR Code Section - Inside flex group for desktop row */}
                        {(ad?.targetUrl || activeVideo?.targetUrl) && (
                            <div className="status-container-right">
                                <div className="qr-container">
                                    <QRCode
                                        value={activeVideo?.targetUrl || ad?.targetUrl}
                                        size={Math.min(window.innerWidth * 0.12, 80)}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                    <p className="qr-label">
                                        {(ad || activeVideo?.isAd) ? "Escanear info" : "Contacto QR"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#000' }}>
                    <h2 style={{ color: '#475569' }}>Waiting for opportunities...</h2>
                </div>
            )}

            {/* News Ticker Footer */}
            <NewsTicker />
        </div>
    );
};

export default AdDisplay;
