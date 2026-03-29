const Parser = require('rss-parser');
const Settings = require('../models/Settings');
const parser = new Parser();

// Caché por idioma
let newsCache = {
    // es: { data: [], lastFetch: 0 },
    // en: { data: [], lastFetch: 0 },
    // ...
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

const DEFAULT_FEEDS = {
    es: 'http://feeds.bbci.co.uk/mundo/rss.xml',
    en: 'http://feeds.bbci.co.uk/news/rss.xml',
    pt: 'https://g1.globo.com/rss/g1/',
    fr: 'https://www.france24.com/fr/rss'
};

exports.getNews = async (req, res) => {
    try {
        const { lng = 'es' } = req.query;
        const now = Date.now();

        if (newsCache[lng] && (now - newsCache[lng].lastFetch < CACHE_DURATION)) {
            return res.json(newsCache[lng].data);
        }

        // Obtener URL del feed de la configuración (o usar el default por idioma)
        const settingKey = `rss_url_${lng}`;
        let rssUrlSetting = await Settings.findOne({ where: { key: settingKey } });

        // Si no hay configuración específica, intentar la genérica 'rss_url'
        if (!rssUrlSetting) {
            rssUrlSetting = await Settings.findOne({ where: { key: 'rss_url' } });
        }

        const url = rssUrlSetting ? rssUrlSetting.value : (DEFAULT_FEEDS[lng] || DEFAULT_FEEDS.es);

        console.log(`>>> [NEWS] Fetching [${lng}] RSS from: ${url}`);
        const feed = await parser.parseURL(url);

        const items = feed.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            contentSnippet: item.contentSnippet
        }));

        newsCache[lng] = {
            data: items,
            lastFetch: now
        };

        res.json(items);
    } catch (error) {
        console.error('>>> [NEWS] Error fetching RSS:', error.message);
        res.json(newsCache[req.query.lng]?.data || []);
    }
};

exports.updateRssUrl = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        let setting = await Settings.findOne({ where: { key: 'rss_url' } });
        if (setting) {
            setting.value = url;
            await setting.save();
        } else {
            await Settings.create({ key: 'rss_url', value: url });
        }

        // Limpiar caché para forzar recarga
        newsCache.data = [];
        res.json({ message: 'RSS URL updated' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating RSS URL' });
    }
};
