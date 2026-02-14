import express from 'express';
import Driver from '../models/Driver.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new driver
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, licenseNumber, busNumber } = req.body;

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
            busNumber: busNumber || null
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

export default router;
