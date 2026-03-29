import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TriviaCard = ({ trivia, onComplete }) => {
    const { t } = useTranslation();
    const [showAnswer, setShowAnswer] = useState(false);
    const [progress, setProgress] = useState(100);

    const duration = (trivia.duration || 15) * 1000;
    const revealTime = duration * 0.6; // Revelar respuesta al 60% del tiempo

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAnswer(true);
        }, revealTime);

        const progressInterval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - (100 / (duration / 100))));
        }, 100);

        const endTimer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
            clearTimeout(endTimer);
        };
    }, [trivia, onComplete, duration, revealTime]);

    const containerStyle = {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#fff',
        padding: '40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
    };

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '800px',
        width: '90%',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 2
    };

    const categoryStyle = {
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: '#818cf8',
        marginBottom: '20px',
        fontWeight: 'bold'
    };

    const questionStyle = {
        fontSize: '2.5rem',
        fontWeight: '800',
        lineHeight: '1.2',
        marginBottom: '30px',
        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
    };

    const answerContainerStyle = {
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.5s ease'
    };

    const answerStyle = {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#4ade80',
        padding: '15px 30px',
        background: 'rgba(74, 222, 128, 0.1)',
        borderRadius: '16px',
        border: '1px solid rgba(74, 222, 128, 0.2)',
        opacity: showAnswer ? 1 : 0,
        transform: showAnswer ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };

    const progressBarStyle = {
        position: 'absolute',
        bottom: 40,
        left: 0,
        height: '6px',
        background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
        width: `${progress}%`,
        transition: 'width 0.1s linear'
    };

    return (
        <div style={containerStyle}>
            {/* Decorative background elements */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)', zIndex: 1 }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)', zIndex: 1 }}></div>

            <div style={cardStyle}>
                <div style={categoryStyle}>{t('entertainment.trivia.category')}: {trivia.category}</div>
                <div style={questionStyle}>{trivia.question}</div>

                <div style={answerContainerStyle}>
                    {!showAnswer ? (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '1.2rem' }}>
                            {t('entertainment.trivia.revealing')}
                        </div>
                    ) : (
                        <div style={answerStyle}>
                            ✅ {trivia.answer}
                        </div>
                    )}
                </div>
            </div>

            <div style={progressBarStyle}></div>
        </div>
    );
};

export default TriviaCard;
