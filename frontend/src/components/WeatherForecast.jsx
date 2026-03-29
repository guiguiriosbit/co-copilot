import React from 'react';
import { useTranslation } from 'react-i18next';

const getWeatherIcon = (code) => {
    if (code === 0) return '☀️'; // Clear sky
    if (code >= 1 && code <= 3) return '⛅'; // Part cloudy
    if (code >= 45 && code <= 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Rain
    if (code >= 71 && code <= 77) return '❄️'; // Snow
    if (code >= 80 && code <= 82) return '🚿'; // Shovers
    if (code >= 95) return '⛈️'; // Thunder
    return '🌡️';
};

const getDayName = (dateStr) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const date = new Date(dateStr + 'T00:00:00');
    return days[date.getDay()];
};

const WeatherForecast = ({ forecast, onComplete }) => {
    const { t, i18n } = useTranslation();
    if (!forecast || forecast.length === 0) return null;

    const getDayName = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString(i18n.language, { weekday: 'short' });
    };

    return (
        <div className="entertainment-card" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '30px',
            borderRadius: '24px',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '400px',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#38bdf8', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                ⛅ {t('entertainment.weather.title')}
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '15px' }}>
                {forecast.map((day, idx) => (
                    <div key={idx} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '15px',
                        borderRadius: '16px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#94a3b8' }}>
                            {idx === 0 ? t('entertainment.weather.today', 'Hoy') : getDayName(day.date)}
                        </span>
                        <span style={{ fontSize: '2.5rem' }}>{getWeatherIcon(day.weathercode)}</span>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                            <span style={{ color: '#f87171' }}>{day.maxTemp}°</span>
                            <span style={{ color: '#60a5fa', opacity: 0.7 }}>{day.minTemp}°</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '25px', marginBottom: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    background: '#38bdf8',
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

export default WeatherForecast;
