const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
const listRoutes = require('./routes/list');
const adminRoutes = require('./routes/admin');
const initializeDatabase = require('./config/init-db');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/list', listRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database tables (safe to run multiple times)
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();
