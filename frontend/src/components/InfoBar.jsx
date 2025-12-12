import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Clock } from 'lucide-react';

const InfoBar = ({ weather }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="info-bar">
            <div className="weather-widget">
                {weather === 'rain' ? <Cloud size={24} /> : <Sun size={24} />}
                <span>{weather === 'rain' ? '18°C Rain' : '24°C Sunny'}</span>
            </div>

            <div className="news-ticker">
                Latest: Local traffic is flowing smoothly • Stock market up 2% • New park opening downtown...
            </div>

            <div className="time-widget">
                <Clock size={24} />
                <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
};

export default InfoBar;
