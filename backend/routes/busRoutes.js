import express from 'express';
import Bus from '../models/Bus.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/bus/start
// @desc    Start bus service
// @access  Protected
router.post('/start', protect, async (req, res) => {
    try {
        const { busNumber, routeNumber, sourceCity, destinationCity, operatingCity } = req.body;
        const driver = req.user;

        // Validation
        if (!busNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bus number is required'
            });
        }

        // Check if driver already has an active bus
        const existingActiveBus = await Bus.findOne({
            driverId: driver._id,
            status: 'active'
        });

        if (existingActiveBus) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active bus service. Please stop it first.'
            });
        }

        // Route type specific validation
        if (driver.routeType === 'express') {
            if (!sourceCity || !destinationCity) {
                return res.status(400).json({
                    success: false,
                    message: 'Source and destination cities are required for express buses'
                });
            }
        }

        // Create new bus record
        const bus = new Bus({
            busNumber: busNumber.toUpperCase(),
            routeType: driver.routeType,
            driverId: driver._id,
            status: 'active',
            startedAt: new Date(),
            operatingCity: driver.routeType === 'city' ? (operatingCity || driver.homeCity) : null,
            routeNumber: driver.routeType === 'city' ? routeNumber : null,
            sourceCity: driver.routeType === 'express' ? sourceCity : null,
            destinationCity: driver.routeType === 'express' ? destinationCity : null
        });

        await bus.save();

        res.status(201).json({
            success: true,
            message: '🚌 Bus service started successfully!',
            bus: {
                id: bus._id,
                busNumber: bus.busNumber,
                routeType: bus.routeType,
                status: bus.status,
                startedAt: bus.startedAt,
                operatingCity: bus.operatingCity,
                routeNumber: bus.routeNumber,
                sourceCity: bus.sourceCity,
                destinationCity: bus.destinationCity
            }
        });

    } catch (error) {
        console.error('Start bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   POST /api/bus/stop
// @desc    Stop bus service
// @access  Protected
router.post('/stop', protect, async (req, res) => {
    try {
        const driver = req.user;

        // Find active bus for this driver
        const bus = await Bus.findOne({
            driverId: driver._id,
            status: 'active'
        });

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'No active bus service found'
            });
        }

        // Update bus status
        bus.status = 'inactive';
        bus.endedAt = new Date();
        await bus.save();

        res.status(200).json({
            success: true,
            message: '🛑 Bus service stopped successfully!',
            bus: {
                id: bus._id,
                busNumber: bus.busNumber,
                status: bus.status,
                startedAt: bus.startedAt,
                endedAt: bus.endedAt
            }
        });

    } catch (error) {
        console.error('Stop bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   GET /api/bus/status
// @desc    Get current bus status for logged-in driver
// @access  Protected
router.get('/status', protect, async (req, res) => {
    try {
        const driver = req.user;

        // Find active bus for this driver
        const bus = await Bus.findOne({
            driverId: driver._id,
            status: 'active'
        });

        if (!bus) {
            return res.status(200).json({
                success: true,
                isActive: false,
                bus: null
            });
        }

        res.status(200).json({
            success: true,
            isActive: true,
            bus: {
                id: bus._id,
                busNumber: bus.busNumber,
                routeType: bus.routeType,
                status: bus.status,
                startedAt: bus.startedAt,
                operatingCity: bus.operatingCity,
                routeNumber: bus.routeNumber,
                sourceCity: bus.sourceCity,
                destinationCity: bus.destinationCity,
                currentLocation: bus.currentLocation
            }
        });

    } catch (error) {
        console.error('Get bus status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   GET /api/bus/active
// @desc    Get all active buses with location
// @access  Public
router.get('/active', async (req, res) => {
    try {
        const activeBuses = await Bus.find({
            status: 'active',
            'currentLocation.lat': { $ne: null },
            'currentLocation.lng': { $ne: null }
        }).select('busNumber routeType routeNumber sourceCity destinationCity currentLocation heading speed');

        const buses = activeBuses.map(bus => ({
            id: bus._id,
            busNumber: bus.busNumber,
            routeType: bus.routeType,
            routeNumber: bus.routeNumber,
            sourceCity: bus.sourceCity,
            destinationCity: bus.destinationCity,
            lat: bus.currentLocation.lat,
            lng: bus.currentLocation.lng,
            heading: bus.heading || 0,
            speed: bus.speed || 0
        }));

        res.status(200).json({
            success: true,
            count: buses.length,
            buses
        });

    } catch (error) {
        console.error('Get active buses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

export default router;

