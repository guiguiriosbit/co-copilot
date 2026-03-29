import React from 'react';
import { useTranslation } from 'react-i18next';

const getPOIIcon = (type) => {
    const icons = {
        hospital: '🏥',
        pharmacy: '💊',
        bank: '🏦',
        atm: '🏧',
        fuel: '⛽',
        park: '🌳'
    };
    return icons[type] || '📍';
};

const LocalPOIs = ({ pois, onComplete }) => {
    const { t } = useTranslation();
    if (!pois || pois.length === 0) return null;

    return (
        <div className="entertainment-card" style={{
            background: 'linear-gradient(135deg, #0f1711 0%, #1e2922 100%)',
            padding: '30px',
            borderRadius: '24px',
            color: 'white',
            textAlign: 'left',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '420px',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#4ade80', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}>
                📍 {t('entertainment.pois.title')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pois.slice(0, 5).map((poi, idx) => (
                    <div key={idx} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        borderLeft: '4px solid #4ade80'
                    }}>
                        <span style={{ fontSize: '1.8rem' }}>{getPOIIcon(poi.type)}</span>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#f1f5f9' }}>{poi.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                                {t(`entertainment.pois.${poi.type}`) || t('entertainment.pois.place')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '25px', marginBottom: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    background: '#4ade80',
                    animation: 'revealProgress 10s linear forwards'
                }}></div>
            </div>

            <style>
                {`
                @keyframes revealProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
        </div>
    );
};

export default LocalPOIs;
