import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: [true, 'Bus number is required'],
        trim: true,
        uppercase: true
    },
    routeType: {
        type: String,
        enum: ['city', 'express'],
        required: [true, 'Route type is required']
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: [true, 'Driver ID is required']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    currentLocation: {
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    // For City Bus
    operatingCity: {
        type: String,
        default: null
    },
    routeNumber: {
        type: String,
        default: null
    },
    // For Express Bus
    sourceCity: {
        type: String,
        default: null
    },
    destinationCity: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
busSchema.index({ driverId: 1, status: 1 });
busSchema.index({ status: 1 });

const Bus = mongoose.model('Bus', busSchema);

export default Bus;
