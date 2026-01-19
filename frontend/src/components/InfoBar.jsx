import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Clock, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InfoBar = ({ weatherData }) => {
    const { t, i18n } = useTranslation();
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
            const lang = i18n.language || 'es';

            const feedsByLang = {
                es: [
                    { id: 'sports', name: 'Deportes', url: 'https://www.espn.com/espn/rss/news' },
                    { id: 'entertainment', name: 'Entretenimiento', url: 'https://www.usmagazine.com/feed/' },
                    { id: 'economy', name: 'Economía', url: 'https://www.economist.com/finance-and-economics/rss.xml' },
                    { id: 'local_politics', name: 'Política', url: 'https://www.eltiempo.com/rss/politica.xml' },
                    { id: 'technology', name: 'Tecnología', url: 'https://techcrunch.com/feed/' }
                ],
                en: [
                    { id: 'sports', name: 'Sports', url: 'http://rss.cnn.com/rss/edition_sport.rss' },
                    { id: 'entertainment', name: 'Entertainment', url: 'http://rss.cnn.com/rss/edition_entertainment.rss' },
                    { id: 'economy', name: 'Economy', url: 'http://rss.cnn.com/rss/edition_business.rss' },
                    { id: 'technology', name: 'Technology', url: 'https://www.theverge.com/rss/index.xml' },
                    { id: 'world', name: 'World', url: 'http://rss.cnn.com/rss/edition_world.rss' }
                ],
                fr: [
                    { id: 'sports', name: 'Sports', url: 'https://www.lequipe.fr/rss/actu_rss.xml' },
                    { id: 'entertainment', name: 'Culture', url: 'https://www.lefigaro.fr/rss/figaro_culture.xml' },
                    { id: 'economy', name: 'Économie', url: 'https://www.lesechos.fr/rss/rss_economie.xml' },
                    { id: 'technology', name: 'Tech', url: 'https://www.01net.com/flux-rss/actualites/' },
                    { id: 'world', name: 'Monde', url: 'https://www.lemonde.fr/rss/une.xml' }
                ],
                pt: [
                    { id: 'sports', name: 'Esportes', url: 'https://ge.globo.com/rst/feed/esporte/' },
                    { id: 'entertainment', name: 'Gshow', url: 'https://gshow.globo.com/rss/gshow/' },
                    { id: 'economy', name: 'Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
                    { id: 'technology', name: 'Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/' },
                    { id: 'world', name: 'Mundo', url: 'https://g1.globo.com/rss/g1/mundo/' }
                ]
            };

            const categories = feedsByLang[lang.startsWith('en') ? 'en' : lang.startsWith('pt') ? 'pt' : lang.startsWith('fr') ? 'fr' : 'es'];

            // Fallback data (5 items per category)
            const fallbackData = {
                sports: ["Score updates...", "Match highlights...", "Tournament news...", "Athlete profiles...", "League standings..."],
                entertainment: ["Movie releases...", "Music awards...", "Celebrity gossip...", "TV show reviews...", "Art exhibitions..."],
                economy: ["Market trends...", "Currency values...", "Startup funding...", "Trade agreements...", "Industrial growth..."],
                technology: ["AI breakthroughs...", "Gadget launches...", "Software updates...", "Cybersecurity alerts...", "Space exploration..."],
                local_politics: ["City council news...", "Legislative updates...", "Public initiatives...", "Economic policy...", "Civic events..."],
                world: ["Global events...", "International relations...", "Climate reports...", "Diplomatic talks...", "Summit outcomes..."],
                culture: ["Expositions d'art...", "Sorties cinéma...", "Événements culturels...", "Festivals de musique...", "Critiques de livres..."],
                economie: ["Bourse en direct...", "Indicateurs économiques...", "Fusions et acquisitions...", "Politique fiscale...", "Commerce extérieur..."],
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
                        .catch(() => ({ category: cat.name, items: fallbackData[cat.id] || ["Loading news..."] }))
                );

                const results = await Promise.all(promises);

                for (let i = 0; i < 5; i++) {
                    results.forEach(catResult => {
                        if (catResult && catResult.items && catResult.items[i]) {
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
                setNews([{ title: "Unable to load news at the moment", category: "System" }]);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 300000); // Update every 5 mins
        return () => clearInterval(interval);
    }, [i18n.language]);

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
