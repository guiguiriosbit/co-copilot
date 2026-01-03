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

// Handle preflight requests explicitly - Removed due to Express 5 compatibility issue
// app.options('*', cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('Commercial Copilot API is running');
});

const adController = require('./controllers/adController');
const adminController = require('./controllers/adminController');
const videoLoopController = require('./controllers/videoLoopController');

// Serve static files from public directory
app.use('/public', express.static('public'));

// Routes
app.post('/api/heartbeat', adController.heartbeat);
app.post('/api/admin/create', adminController.createBusiness);
app.get('/api/admin/businesses', adminController.getBusinesses);
app.put('/api/admin/business/:id', adminController.updateBusiness);
app.delete('/api/admin/business/:id', adminController.deleteBusiness);

// Video loop management routes
app.get('/api/admin/videoloop', videoLoopController.listLoopVideos);
app.post('/api/admin/videoloop/upload', videoLoopController.uploadLoopVideo);
app.delete('/api/admin/videoloop/:filename', videoLoopController.deleteLoopVideo);


// Sync database and start server
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});
