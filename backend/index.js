const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Robust CORS configuration
app.use(cors({
    origin: true, // Reflects the request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// GLOBAL logger - VERY TOP
app.use((req, res, next) => {
    console.log(`>>> [SERVER RECV] ${req.method} ${req.url}`);
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.send('Commercial Copilot API is running');
});

const adController = require('./controllers/adController');
const adminController = require('./controllers/adminController');
const videoLoopController = require('./controllers/videoLoopController');
const analyticsController = require('./controllers/analyticsController');
const authController = require('./controllers/authController');
const triviaController = require('./controllers/triviaController');
const newsController = require('./controllers/newsController');
const locationExtraController = require('./controllers/locationExtraController');
const pollController = require('./controllers/pollController');
const passengerController = require('./controllers/passengerController');

// Serve static files from public directory
app.use('/public', express.static('public'));

// Health check
app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Routes
app.post('/api/heartbeat', adController.heartbeat);
app.post('/api/admin/create', adminController.createBusiness);
app.get('/api/admin/businesses', adminController.getBusinesses);
app.put('/api/admin/business/:id', adminController.updateBusiness);
app.delete('/api/admin/business/:id', adminController.deleteBusiness);

app.post('/api/passenger/register', passengerController.registerPassenger);

// Trivia / Entertainment routes
app.get('/api/entertainment/trivia', triviaController.getRandomTrivia);
app.get('/api/admin/trivias', triviaController.getTrivias);
app.post('/api/admin/trivia', triviaController.createTrivia);
app.put('/api/admin/trivia/:id', triviaController.updateTrivia);
app.delete('/api/admin/trivia/:id', triviaController.deleteTrivia);

// News / RSS routes
app.get('/api/entertainment/news', newsController.getNews);
app.post('/api/admin/settings/rss', newsController.updateRssUrl);

// Extended Location / Utility routes
app.get('/api/entertainment/forecast', locationExtraController.getWeatherForecast);
app.get('/api/entertainment/pois', locationExtraController.getNearbyPOIs);

// Poll / Feedback routes
app.get('/api/entertainment/poll', pollController.getRandomPoll);
app.post('/api/entertainment/poll/vote', pollController.submitVote);
app.get('/api/admin/polls', pollController.getAllPolls);
app.post('/api/admin/polls', pollController.createPoll);
app.get('/api/admin/polls/:id/results', pollController.getPollResults);
app.delete('/api/admin/polls/:id', pollController.deletePoll);

// Auth routes
app.post('/api/auth/login', authController.login);

// Analytics routes
app.post('/api/impression', analyticsController.registerImpression);
app.post('/api/click', analyticsController.registerClick);
app.get('/api/analytics/impressions', analyticsController.getSummary);

// Video loop management routes - Refactored to Router for stability
const loopRouter = express.Router();
loopRouter.use((req, res, next) => {
    console.log(`[LOOP ROUTER] ${req.method} ${req.originalUrl} -> ${req.url}`);
    next();
});

loopRouter.get('/', videoLoopController.listLoopVideos);
loopRouter.post('/upload', videoLoopController.uploadLoopVideo);
loopRouter.put('/metadata', videoLoopController.updateLoopVideoMetadata);
loopRouter.delete('/delete', videoLoopController.deleteLoopVideo);

app.use('/api/admin/videoloop', loopRouter);

// Compatibility route for old frontend code (PUT /api/admin/videoloop/filename.mp4)
app.put('/api/admin/videoloop/:filename', (req, res, next) => {
    const { filename } = req.params;
    if (filename === 'metadata' || filename === 'delete') return next();
    console.log(`[COMPAT] Handling old-style PUT request for: ${filename}`);
    req.query.filename = filename;
    videoLoopController.updateLoopVideoMetadata(req, res);
});

// Compatibility route for old-style DELETE
app.delete('/api/admin/videoloop/:filename', (req, res, next) => {
    const { filename } = req.params;
    if (filename === 'metadata' || filename === 'delete') return next();
    console.log(`[COMPAT] Handling old-style DELETE request for: ${filename}`);
    req.query.filename = filename;
    videoLoopController.deleteLoopVideo(req, res);
});

// Catch-all for unmatched routes
app.use((req, res) => {
    console.log(`[404 NOT FOUND] ${req.method} ${req.url}`);
    res.status(404).json({ error: `Route not found: ${req.url}` });
});

// Startup function
async function startServer() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        // Disabling alter: true as it causes issues with SQLite during complex migrations
        await sequelize.sync();
        console.log('Database synced.');

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Ready to receive requests...');
        });

        server.on('error', (e) => {
            console.error('SERVER ERROR:', e);
            if (e.code === 'EADDRINUSE') {
                console.error(`Error: Port ${PORT} is already in use. Please check if another instance is running.`);
            }
        });

        // Keep process alive explicitly
        setInterval(() => {
            if (server.listening) {
                // Just keeping the event loop occupied
            }
        }, 60000);

        process.on('SIGINT', () => {
            console.log('>>> [SERVER] SIGINT received. Closing...');
            server.close(() => {
                console.log('>>> [SERVER] Closed.');
                process.exit(0);
            });
        });

        process.on('SIGTERM', () => {
            console.log('>>> [SERVER] SIGTERM received. Closing...');
            server.close(() => {
                console.log('>>> [SERVER] Closed.');
                process.exit(0);
            });
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

// Global error handler - MUST BE LAST
app.use((err, req, res, next) => {
    console.error('>>> [GLOBAL ERROR HANDLER]', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        files: req.files ? Object.keys(req.files) : null
    });

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Startup function
