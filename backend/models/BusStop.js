import mongoose from 'mongoose';

const busStopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },
    routes: [String], // Route numbers passing through this stop
    city: String,
    landmark: String
}, { timestamps: true });

// Index for geospatial queries
busStopSchema.index({ location: '2dsphere' });

export default mongoose.model('BusStop', busStopSchema);
