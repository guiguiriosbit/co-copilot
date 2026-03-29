import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PollCard = ({ poll, onComplete, userLocation }) => {
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [progress, setProgress] = useState(100);

    // Auto-dismiss if no vote after 15 seconds
    useEffect(() => {
        if (submitted) return;

        const duration = 15000; // 15 seconds
        const interval = 100;
        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev - (100 / (duration / interval));
                if (next <= 0) {
                    clearInterval(timer);
                    onComplete();
                    return 0;
                }
                return next;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [submitted, onComplete]);

    const handleVote = async (option) => {
        setSelected(option);
        try {
            await fetch('/api/entertainment/poll/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pollId: poll.id,
                    selectedOption: option,
                    screenId: localStorage.getItem('cc_screen_id'),
                    lat: userLocation?.lat,
                    lng: userLocation?.lng
                })
            });
            setSubmitted(true);
            // Wait 3 seconds to show thank you message then complete
            setTimeout(onComplete, 3000);
        } catch (error) {
            console.error('Error voting:', error);
            onComplete();
        }
    };

    if (!poll) return null;

    return (
        <div className="entertainment-card" style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            padding: '30px',
            borderRadius: '24px',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '450px',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            {!submitted ? (
                <>
                    <h2 style={{ margin: '0 0 10px 0', color: '#818cf8', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        📊 {t('entertainment.poll.title')}
                    </h2>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '25px', color: '#f8fafc' }}>{poll.question}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {poll.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleVote(option)}
                                style={{
                                    padding: '15px 20px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: selected === option ? '#818cf8' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ padding: '40px 0', animation: 'scaleIn 0.3s ease-out' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                    <h3 style={{ fontSize: '1.8rem', color: '#818cf8' }}>{t('entertainment.poll.thanks')}</h3>
                    <p style={{ color: '#94a3b8' }}>{t('entertainment.poll.improvement')}</p>
                </div>
            )}

            {!submitted && (
                <div style={{ marginTop: '25px', marginBottom: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        background: '#818cf8',
                        width: `${progress}%`,
                        transition: 'width 0.1s linear'
                    }}></div>
                </div>
            )}

            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                `}
            </style>
        </div>
    );
};

export default PollCard;
