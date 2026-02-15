import express from 'express';
import Driver from '../models/Driver.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new driver
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, licenseNumber, busNumber, routeType, homeCity, operatingCities } = req.body;

        // Validation
        if (!name || !email || !phone || !password || !licenseNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if driver already exists
        const existingDriver = await Driver.findOne({
            $or: [{ email }, { licenseNumber }]
        });

        if (existingDriver) {
            if (existingDriver.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
            if (existingDriver.licenseNumber === licenseNumber.toUpperCase()) {
                return res.status(400).json({
                    success: false,
                    message: 'License number already registered'
                });
            }
        }

        // Create new driver
        const driver = new Driver({
            name,
            email,
            phone,
            password,
            licenseNumber,
            busNumber: busNumber || null,
            routeType: routeType || 'both',
            homeCity: homeCity || null,
            operatingCities: operatingCities || []
        });

        await driver.save();

        // Return success (no token in Slice 2)
        res.status(201).json({
            success: true,
            message: '🎉 Registration successful! You can now login.',
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                licenseNumber: driver.licenseNumber
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages[0]
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login driver and return JWT token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if driver exists
        const driver = await Driver.findOne({ email: email.toLowerCase() });

        if (!driver) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isPasswordValid = await driver.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const jwt = await import('jsonwebtoken');
        const token = jwt.default.sign(
            {
                id: driver._id,
                email: driver.email,
                routeType: driver.routeType
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        );

        // Return success with token
        res.status(200).json({
            success: true,
            message: '🎉 Login successful!',
            token,
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                licenseNumber: driver.licenseNumber,
                busNumber: driver.busNumber,
                routeType: driver.routeType,
                homeCity: driver.homeCity,
                operatingCities: driver.operatingCities,
                isActive: driver.isActive
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

export default router;
