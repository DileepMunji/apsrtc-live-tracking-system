import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
    routeNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    routeName: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    from: {
        type: String,
        trim: true
    },
    to: {
        type: String,
        trim: true
    },
    viaText: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    stops: [{
        stopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BusStop'
        },
        sequence: {
            type: Number,
            required: true
        },
        isMajor: {
            type: Boolean,
            default: false
        },
        estimatedTimeFromStart: {
            type: Number, // In minutes
            required: true
        }
    }],
    totalDistance: Number,
    averageDuration: Number
}, { timestamps: true });

export default mongoose.model('Route', routeSchema);
