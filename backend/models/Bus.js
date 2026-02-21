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
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },

    // Service timing
    startedAt: { type: Date, default: null },
    scheduledStartTime: { type: String, default: null },  // e.g. "06:30"
    endedAt: { type: Date, default: null },

    // Route details (unified for both city and express)
    routeNumber: { type: String, default: null, trim: true, uppercase: true },
    startLocation: { type: String, default: null, trim: true },
    endLocation: { type: String, default: null, trim: true },

    // Legacy / backward compat fields
    operatingCity: { type: String, default: null },
    sourceCity: { type: String, default: null },
    destinationCity: { type: String, default: null }

}, { timestamps: true });

busSchema.index({ driverId: 1, status: 1 });
busSchema.index({ status: 1 });

const Bus = mongoose.model('Bus', busSchema);
export default Bus;
