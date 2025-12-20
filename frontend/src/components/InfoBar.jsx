import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Clock, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InfoBar = ({ weatherData }) => {
    const { t } = useTranslation();
    const [time, setTime] = useState(new Date());
    const [news, setNews] = useState([]);

    // Update Time
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch News
    useEffect(() => {
        const fetchNews = async () => {
            const categories = [
                { id: 'sports', name: 'Sports', url: 'https://www.espn.com/espn/rss/news' },
                { id: 'entertainment', name: 'Entertainment', url: 'https://www.usmagazine.com/feed/' },
                { id: 'economy', name: 'Economy', url: 'https://www.economist.com/finance-and-economics/rss.xml' },
                { id: 'local_politics', name: 'Local Politics', url: 'https://www.eltiempo.com/rss/politica.xml' },
                { id: 'int_politics', name: 'Int. Politics', url: 'http://rss.cnn.com/rss/edition_world.rss' },
                { id: 'technology', name: 'Technology', url: 'https://techcrunch.com/feed/' }
            ];

            // Fallback data (5 items per category)
            const fallbackData = {
                sports: [
                    "Local team wins championship in thriller", "Star player announces retirement", "World Cup host city announced", "New record set in marathon", "Playoffs schedule released"
                ],
                entertainment: [
                    "Award season nominations announced", "Top movie breaks box office records", "Celebrity charity concert raises millions", "New streaming series goes viral", "Music festival lineup revealed"
                ],
                economy: [
                    "Global markets rally on positive data", "Inflation rates drop slightly", "Tech giant acquires startup", "New trade agreement signed", "Cryptocurrency sees volatile week"
                ],
                local_politics: [
                    "New infrastructure project approved", "City council debates budget", "Mayor announces new initiative", "Public transport updates planned", "Community center opening soon"
                ],
                int_politics: [
                    "Peace summit scheduled for next month", "International trade talks resume", "UN releases climate report", "Diplomatic visit strengthens ties", "Global health initiative launched"
                ],
                technology: [
                    "New AI model surpasses expectations", "Electric vehicle battery breakthrough", "Latest smartphone released", "Space mission successfully lands", "Cybersecurity measures updated"
                ]
            };

            let interleavedNews = [];

            try {
                const promises = categories.map(cat =>
                    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(cat.url)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.status === 'ok' && data.items) {
                                return { category: cat.name, items: data.items.slice(0, 5).map(i => i.title) };
                            }
                            throw new Error('Feed failed');
                        })
                        .catch(() => ({ category: cat.name, items: fallbackData[cat.id] }))
                );

                const results = await Promise.all(promises);

                // Interleave items: 1st from each, then 2nd from each, etc.
                for (let i = 0; i < 5; i++) {
                    results.forEach(catResult => {
                        if (catResult.items[i]) {
                            interleavedNews.push({
                                title: catResult.items[i],
                                category: catResult.category
                            });
                        }
                    });
                }

                setNews(interleavedNews);

            } catch (error) {
                console.error('Error fetching news:', error);
                // Fallback interleaving
                let fallbackInterleaved = [];
                for (let i = 0; i < 5; i++) {
                    categories.forEach(cat => {
                        fallbackInterleaved.push({
                            title: fallbackData[cat.id][i],
                            category: cat.name
                        });
                    });
                }
                setNews(fallbackInterleaved);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 300000); // Update every 5 mins
        return () => clearInterval(interval);
    }, []);

    // Translate weather condition
    const translateWeatherCondition = (condition) => {
        if (!condition) return t('infoBar.weather.loading');
        const conditionLower = condition.toLowerCase();

        if (conditionLower.includes('sunny')) return t('infoBar.weather.sunny');
        if (conditionLower.includes('partly cloudy')) return t('infoBar.weather.partlyCloudy');
        if (conditionLower.includes('cloudy')) return t('infoBar.weather.cloudy');
        if (conditionLower.includes('foggy')) return t('infoBar.weather.foggy');
        if (conditionLower.includes('heavy rain')) return t('infoBar.weather.heavyRain');
        if (conditionLower.includes('rainy') || conditionLower.includes('rain')) return t('infoBar.weather.rainy');
        if (conditionLower.includes('snowy') || conditionLower.includes('snow')) return t('infoBar.weather.snowy');
        if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) return t('infoBar.weather.thunderstorm');

        return condition; // Return original if no match
    };

    const getWeatherIcon = (condition) => {
        if (!condition) return <Sun size={24} />;
        switch (condition.toLowerCase()) {
            case 'rainy':
            case 'heavy rain': return <CloudRain size={24} />;
            case 'snowy': return <CloudSnow size={24} />;
            case 'thunderstorm': return <CloudLightning size={24} />;
            case 'partly cloudy':
            case 'foggy': return <Cloud size={24} />;
            default: return <Sun size={24} />;
        }
    };

    return (
        <div className="info-bar">
            <div className="weather-widget">
                {getWeatherIcon(weatherData.condition)}
                <span>{weatherData.temp}°C {translateWeatherCondition(weatherData.condition)}</span>
            </div>

            <div className="news-ticker-container">
                <div className="news-ticker-content">
                    {news.map((item, index) => {
                        const title = typeof item === 'string' ? item : item.title;
                        const category = typeof item === 'string' ? 'General' : (item.category || 'News');

                        if (!title) return null;

                        return (
                            <span key={index} className="ticker-item">
                                <span style={{ color: '#3b82f6', fontWeight: 'bold', marginRight: '5px' }}>
                                    [{category}]
                                </span>
                                {title} &nbsp;&nbsp;&nbsp;
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="time-widget">
                <Clock size={24} />
                <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
};

export default InfoBar;
