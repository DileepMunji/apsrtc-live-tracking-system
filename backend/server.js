import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import busRoutes from './routes/busRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bus', busRoutes);

// Test Route
app.get('/api/test', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

    res.json({
        success: true,
        message: `🚌 APSRTC Live Bus Tracking System - Backend is running! DB: ${dbStatus}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        status: dbStatus
    });
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: 'APSRTC Backend API',
        endpoints: {
            test: '/api/test'
        }
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});
