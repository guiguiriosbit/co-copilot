import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const NewsTicker = () => {
    const { t, i18n } = useTranslation();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const lng = i18n.language || 'es';
                const response = await fetch(`/api/entertainment/news?lng=${lng}`);
                const data = await response.json();
                setNews(data);
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 10 * 60 * 1000); // Refrescar cada 10 min
        return () => clearInterval(interval);
    }, [i18n.language]);

    if (loading || news.length === 0) return null;

    const tickerStyle = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '40px',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(5px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 100,
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500'
    };

    const labelStyle = {
        background: '#ef4444',
        padding: '0 15px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '12px',
        letterSpacing: '1px',
        zIndex: 101,
        boxShadow: '5px 0 10px rgba(0,0,0,0.3)'
    };

    const scrollContainerStyle = {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        paddingLeft: '110%',
        animation: `ticker-scroll ${Math.max(news.length * 15, 60)}s linear infinite`
    };

    const newsItemStyle = {
        display: 'inline-block',
        padding: '0 40px',
        color: '#f8fafc'
    };

    const separatorStyle = {
        color: '#38bdf8',
        fontWeight: 'bold',
        margin: '0 10px'
    };

    return (
        <div style={tickerStyle}>
            <div style={labelStyle}>🔴 {t('entertainment.news.breaking')}</div>
            <div style={scrollContainerStyle}>
                {news.map((item, index) => (
                    <span key={index} style={newsItemStyle}>
                        <span style={separatorStyle}>•</span> {item.title}
                    </span>
                ))}
            </div>
            <style>
                {`
                @keyframes ticker-scroll {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-100%, 0, 0); }
                }
                `}
            </style>
        </div>
    );
};

export default NewsTicker;
