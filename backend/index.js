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

app.use(express.json());

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

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

// Prevent immediate exit on errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
