const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('Commercial Copilot API is running');
});

const adController = require('./controllers/adController');
app.post('/api/heartbeat', adController.heartbeat);

// Sync database and start server
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});
