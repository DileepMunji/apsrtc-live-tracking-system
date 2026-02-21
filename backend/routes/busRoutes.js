import express from 'express';
import axios from 'axios';
import Bus from '../models/Bus.js';
import BusStop from '../models/BusStop.js';
import Route from '../models/Route.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── Haversine Distance Helper ────────────────────────────────────────────────
const deg2rad = (deg) => deg * (Math.PI / 180);
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // Distance in meters (rounded)
};


// @route   POST /api/bus/start
// @desc    Start bus service
// @access  Protected
router.post('/start', protect, async (req, res) => {
    try {
        const { busNumber, routeNumber, startLocation, endLocation, scheduledStartTime } = req.body;
        const driver = req.user;

        // Validation
        if (!busNumber || !busNumber.trim()) {
            return res.status(400).json({ success: false, message: 'Bus number is required' });
        }
        if (!routeNumber || !routeNumber.trim()) {
            return res.status(400).json({ success: false, message: 'Route number is required' });
        }
        if (!startLocation || !startLocation.trim()) {
            return res.status(400).json({ success: false, message: 'Starting location is required' });
        }
        if (!endLocation || !endLocation.trim()) {
            return res.status(400).json({ success: false, message: 'Ending location is required' });
        }

        // OFFICIAL ROUTE VALIDATION
        const officialRoute = await Route.findOne({
            routeNumber: routeNumber.trim().toUpperCase(),
            from: { $regex: new RegExp('^' + startLocation.trim() + '$', 'i') },
            to: { $regex: new RegExp('^' + endLocation.trim() + '$', 'i') }
        });

        if (!officialRoute) {
            return res.status(400).json({
                success: false,
                message: `Invalid Route Combination. This route (${routeNumber}) does not officially operate from ${startLocation} to ${endLocation} in our register.`
            });
        }

        // Check if driver already has an active bus
        const existingActiveBus = await Bus.findOne({ driverId: driver._id, status: 'active' });
        if (existingActiveBus) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active bus service. Please stop it first.'
            });
        }

        // Determine route type
        let busRouteType = driver.routeType;
        if (driver.routeType === 'both') {
            busRouteType = req.body.routeType;
            if (!busRouteType || !['city', 'express'].includes(busRouteType)) {
                return res.status(400).json({ success: false, message: 'Please specify route type (city or express)' });
            }
        }

        // Create new bus record
        const bus = new Bus({
            busNumber: busNumber.trim().toUpperCase(),
            routeType: busRouteType,
            driverId: driver._id,
            status: 'active',
            startedAt: new Date(),
            scheduledStartTime: scheduledStartTime || null,
            routeNumber: routeNumber.trim().toUpperCase(),
            startLocation: startLocation.trim(),
            endLocation: endLocation.trim(),
            // keep legacy fields for backward compat
            sourceCity: startLocation.trim(),
            destinationCity: endLocation.trim(),
            operatingCity: officialRoute.city || driver.homeCity || null
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
                scheduledStartTime: bus.scheduledStartTime,
                routeNumber: bus.routeNumber,
                startLocation: bus.startLocation,
                endLocation: bus.endLocation
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

// @route   GET /api/bus/search
// @desc    Search buses by source and destination
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ success: false, message: 'Source and destination are required' });
        }

        const activeBuses = await Bus.find({
            status: 'active',
            $or: [
                { sourceCity: { $regex: from, $options: 'i' }, destinationCity: { $regex: to, $options: 'i' } },
                { operatingCity: { $regex: from, $options: 'i' } } // For city buses
            ]
        }).select('busNumber routeType sourceCity destinationCity currentLocation heading speed routeNumber operatingCity');

        const buses = activeBuses.map(bus => ({
            id: bus._id,
            busNumber: bus.busNumber,
            routeType: bus.routeType,
            sourceCity: bus.sourceCity,
            destinationCity: bus.destinationCity,
            routeNumber: bus.routeNumber,
            operatingCity: bus.operatingCity,
            lat: bus.currentLocation?.lat,
            lng: bus.currentLocation?.lng,
            heading: bus.heading || 0,
            speed: bus.speed || 0
        }));

        res.status(200).json({ success: true, count: buses.length, buses });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});

// @route   GET /api/bus/stops/search
// @desc    Search bus stops by name for autocomplete
// @access  Public
router.get('/stops/search', async (req, res) => {
    try {
        const { query, city } = req.query;
        if (!query) return res.status(200).json({ success: true, stops: [] });

        const filter = {
            name: { $regex: query, $options: 'i' }
        };
        if (city) filter.city = city;

        const stops = await BusStop.find(filter).limit(10).select('name city location');
        res.status(200).json({ success: true, stops });
    } catch (error) {
        console.error('Stop search error:', error);
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});

// @route   GET /api/bus/stops/near
// @desc    Get nearby bus stops using geospatial query
// @access  Public
router.get('/stops/near', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; // radius in meters
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'Location is required' });
        }

        const stops = await BusStop.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius)
                }
            }
        });

        res.status(200).json({ success: true, count: stops.length, stops });
    } catch (error) {
        console.error('Near stops error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch nearby stops' });
    }
});

// @route   POST /api/bus/stops/seed
// @desc    Seed sample bus stops (Temporary for testing)
// @access  Public
router.post('/stops/seed', async (req, res) => {
    try {
        const sampleStops = [
            { name: "Ameerpet Metro Stop", location: { type: 'Point', coordinates: [78.4412, 17.4375] }, city: "Hyderabad", routes: ["10H", "49M"] },
            { name: "Hitech City Gateway", location: { type: 'Point', coordinates: [78.3814, 17.4483] }, city: "Hyderabad", routes: ["10H", "222"] },
            { name: "Vijayawada Central", location: { type: 'Point', coordinates: [80.6480, 16.5062] }, city: "Vijayawada", routes: ["EXP-1", "CITY-5"] },
            { name: "Guntur Bus Stand", location: { type: 'Point', coordinates: [80.4365, 16.3067] }, city: "Guntur", routes: ["EXP-1", "G-12"] },
            { name: "Vizag RTC Complex", location: { type: 'Point', coordinates: [83.2985, 17.7265] }, city: "Visakhapatnam", routes: ["V-5", "V-10"] }
        ];

        await BusStop.deleteMany({});
        await BusStop.insertMany(sampleStops);

        res.status(201).json({ success: true, message: 'Sample stops seeded successfully' });
    } catch (error) {
        console.error('Seeding error:', error);
        res.status(500).json({ success: false, message: 'Seeding failed' });
    }
});

// @route   GET /api/bus/stops/realtime
// @desc    Fetch REAL bus stops near a location from OpenStreetMap (Overpass API)
//          - Uses a single optimised query to avoid duplicates at source
//          - Deduplicates by geographic proximity (30m threshold)
//          - Retries on a mirror API if primary fails
// @access  Public
router.get('/stops/realtime', async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        // ── Input validation ────────────────────────────────────────────
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng are required' });
        }
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        if (isNaN(userLat) || isNaN(userLng) ||
            userLat < -90 || userLat > 90 ||
            userLng < -180 || userLng > 180) {
            return res.status(400).json({ success: false, message: 'Invalid coordinates' });
        }

        // Clamp radius: min 200m, max 10 000m
        const searchRadius = Math.min(Math.max(parseInt(radius) || 1500, 200), 10000);

        // ── Overpass query ──────────────────────────────────────────────
        // Single union query — OSM deduplicates nodes internally so we
        // won't get the same node twice from different tag filters.
        const overpassQuery = `
[out:json][timeout:25];
(
  node["highway"="bus_stop"](around:${searchRadius},${userLat},${userLng});
  node["amenity"="bus_station"](around:${searchRadius},${userLat},${userLng});
  node["public_transport"="platform"]["bus"="yes"](around:${searchRadius},${userLat},${userLng});
);
out body;
`;

        // ── Fetch with fallback mirror ──────────────────────────────────
        const OVERPASS_ENDPOINTS = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
            'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
        ];

        let rawElements = null;
        let lastError = null;

        for (const endpoint of OVERPASS_ENDPOINTS) {
            try {
                const response = await axios.post(endpoint, overpassQuery, {
                    headers: { 'Content-Type': 'text/plain' },
                    timeout: 28000
                });
                rawElements = response.data.elements || [];
                break; // success — stop trying mirrors
            } catch (err) {
                lastError = err;
                console.warn(`Overpass mirror failed (${endpoint}): ${err.message}`);
                // continue to next mirror
            }
        }

        if (rawElements === null) {
            throw lastError || new Error('All Overpass mirrors failed');
        }

        // ── Process elements ────────────────────────────────────────────
        const processed = rawElements
            .filter(el => el.lat !== undefined && el.lon !== undefined) // must have coords
            .map(el => {
                const tags = el.tags || {};

                // Best available name — prefer local language names
                const name =
                    tags['name:te'] ||   // Telugu (Andhra Pradesh)
                    tags['name:hi'] ||   // Hindi
                    tags.name ||
                    tags['name:en'] ||
                    tags.ref ||
                    tags.local_ref ||
                    null; // will be filtered or labelled below

                const distanceMeters = haversineDistance(userLat, userLng, el.lat, el.lon);
                const distanceDisplay = distanceMeters < 1000
                    ? `${distanceMeters} m`
                    : `${(distanceMeters / 1000).toFixed(2)} km`;

                const routes = tags.route_ref
                    ? [...new Set(tags.route_ref.split(/[;,]/).map(r => r.trim()).filter(Boolean))]
                    : [];

                return {
                    id: el.id,
                    name: name || 'Bus Stop',
                    hasName: !!name,
                    lat: el.lat,
                    lng: el.lon,
                    distanceMeters,
                    distanceDisplay,
                    routes,
                    operator: tags.operator || tags.network || null,
                    shelter: tags.shelter === 'yes',
                    bench: tags.bench === 'yes',
                    type: tags['public_transport'] || tags.highway || tags.amenity || 'bus_stop'
                };
            });

        // ── Geographic deduplication ────────────────────────────────────
        // If two stops are within DEDUP_THRESHOLD metres of each other,
        // keep only the one with the better name (or lower OSM id as tiebreak).
        const DEDUP_THRESHOLD = 30; // metres
        const kept = [];

        for (const stop of processed) {
            const duplicate = kept.find(k =>
                haversineDistance(k.lat, k.lng, stop.lat, stop.lng) <= DEDUP_THRESHOLD
            );

            if (!duplicate) {
                kept.push(stop);
            } else {
                // Replace existing entry if the new one has a real name and the old one doesn't
                if (!duplicate.hasName && stop.hasName) {
                    const idx = kept.indexOf(duplicate);
                    kept[idx] = stop;
                }
                // Otherwise keep the existing one (already has a name or same quality)
            }
        }

        // ── Final sort & limit ──────────────────────────────────────────
        const stops = kept
            .sort((a, b) => a.distanceMeters - b.distanceMeters)
            .slice(0, 40)
            .map(({ hasName, ...rest }) => rest); // strip internal field

        res.status(200).json({
            success: true,
            count: stops.length,
            userLocation: { lat: userLat, lng: userLng },
            searchRadius,
            stops
        });

    } catch (error) {
        console.error('Real-time stops error:', error.message);

        // Distinguish timeout vs other errors for better client messaging
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        res.status(503).json({
            success: false,
            message: isTimeout
                ? 'Request timed out. The map data service is busy — please try again in a moment.'
                : 'Failed to fetch nearby stops. Please check your connection and try again.',
            stops: []
        });
    }
});


// ... (existing helper functions) ...

// @route   POST /api/bus/routes/seed
// @desc    Seed sample routes with sequential stops
// @access  Public
router.post('/routes/seed', async (req, res) => {
    try {
        // First, ensure we have stops to link to
        let stops = await BusStop.find({ city: "Hyderabad" });
        if (stops.length < 2) {
            // Seed stops first if needed
            const sampleStops = [
                { name: "Ameerpet Metro Stop", location: { type: 'Point', coordinates: [78.4412, 17.4375] }, city: "Hyderabad", routes: ["222R"] },
                { name: "SR Nagar Stop", location: { type: 'Point', coordinates: [78.4480, 17.4430] }, city: "Hyderabad", routes: ["222R"] },
                { name: "ESI Hospital", location: { type: 'Point', coordinates: [78.4350, 17.4500] }, city: "Hyderabad", routes: ["222R"] },
                { name: "Erragadda", location: { type: 'Point', coordinates: [78.4250, 17.4580] }, city: "Hyderabad", routes: ["222R"] },
                { name: "Hitech City Gateway", location: { type: 'Point', coordinates: [78.3814, 17.4483] }, city: "Hyderabad", routes: ["222R"] },
            ];
            await BusStop.deleteMany({ city: "Hyderabad" });
            stops = await BusStop.insertMany(sampleStops);
        }

        const routeData = {
            routeNumber: "222R",
            routeName: "Ameerpet to Hitech City",
            city: "Hyderabad",
            stops: stops.map((s, i) => ({
                stopId: s._id,
                sequence: i + 1,
                isMajor: i === 0 || i === stops.length - 1,
                estimatedTimeFromStart: i * 10
            }))
        };

        await Route.deleteMany({ routeNumber: "222R" });
        const newRoute = new Route(routeData);
        await newRoute.save();

        res.status(201).json({ success: true, message: 'Route 222R seeded successfully', route: newRoute });
    } catch (error) {
        console.error('Route seeding error:', error);
        res.status(500).json({ success: false, message: 'Route seeding failed' });
    }
});

// @route   POST /api/bus/routes/seed/vizag
// @desc    Seed official Visakhapatnam City Bus Routes from tables
// @access  Private (Internal use)
router.post('/routes/seed/vizag', async (req, res) => {
    try {
        const vizagRoutes = [
            {
                routeNumber: "6",
                from: "Simhachalam",
                to: "OHPO",
                viaText: "Gopalapatnam, NAD, Kancharapalem, Convent junction, Town Kotharoad",
                city: "Visakhapatnam",
                routeName: "Simhachalam - OHPO"
            },
            {
                routeNumber: "6A/H",
                from: "RTC complex",
                to: "Simhachalam hills",
                viaText: "Railway Station, Kancharapalem, NAD, Gopalapatnam",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Simhachalam Hills"
            },
            {
                routeNumber: "10A",
                from: "Visakhapatnam Airport",
                to: "R K Beach",
                viaText: "NAD, Gurudwara, RTC Complex",
                notes: "Arrives at 12:30hrs and Departs at 13:00hrs",
                city: "Visakhapatnam",
                routeName: "Airport - RK Beach"
            },
            {
                routeNumber: "111",
                from: "Kuramanapalem",
                to: "Tagarapuvalasa",
                viaText: "Gajuwaka, NAD, Gurudwara, Zoo Park, Madurwada",
                notes: "Highway Services",
                city: "Visakhapatnam",
                routeName: "Kuramanapalem - Tagarapuvalasa"
            },
            {
                routeNumber: "5D",
                from: "Town Kotharoad",
                to: "Dabbanda",
                viaText: "Convent, Kancharapalem, NAD, Gopalapatnam, Pendurthi",
                city: "Visakhapatnam",
                routeName: "Town Kotharoad - Dabbanda"
            },
            {
                routeNumber: "10K",
                from: "RTC complex",
                to: "Kailashagiri",
                viaText: "Jagadamba, Rk beach, Vuda park, Tenneti park",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Kailashagiri"
            },
            {
                routeNumber: "28",
                from: "RK beach",
                to: "Simhachalam Bus Station",
                viaText: "Jagadamba, RTC Complex, NAD, Gopalapatnam",
                city: "Visakhapatnam",
                routeName: "RK Beach - Simhachalam"
            },
            {
                routeNumber: "60",
                from: "Simhachalam",
                to: "OHPO",
                viaText: "Adavivaram, Maddilapalem, RTC Complex, Jagadamba",
                city: "Visakhapatnam",
                routeName: "Simhachalam - OHPO (via RTC)"
            },
            {
                routeNumber: "38",
                from: "RTC Complex",
                to: "Gajuwaka",
                viaText: "Gurudwara, NAD, BHPV",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Gajuwaka"
            },
            {
                routeNumber: "400",
                from: "RTC Complex",
                to: "Kurmannapalem",
                viaText: "Railway Station, Scindia, Malkapuram, Gajuwaka",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Kurmannapalem"
            },
            {
                routeNumber: "222",
                from: "RTC Complex",
                to: "Tagarapuvalasa",
                viaText: "Maddilapalem, Endada, Madhurawada, Anandapuram",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Tagarapuvalasa"
            },
            {
                routeNumber: "25S",
                from: "OHPO",
                to: "Nagarapalem",
                viaText: "Jagadamba, RTC Complex, Maddilapalem, Endada, Carshed",
                city: "Visakhapatnam",
                routeName: "OHPO - Nagarapalem"
            },
            {
                routeNumber: "12D",
                from: "RTC Complex",
                to: "Devarapalle",
                viaText: "NAD, Gopalapatnam, Pendurthi, Kothavalasa, Anandapuram",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Devarapalle"
            },
            {
                routeNumber: "16",
                from: "Purna Market",
                to: "Yarada",
                viaText: "Convent junction, Scindia, Naval base",
                city: "Visakhapatnam",
                routeName: "Purna Market - Yarada"
            },
            {
                routeNumber: "99",
                from: "Collector Office",
                to: "Gajuwaka",
                viaText: "Jagadamba, Town Kotharoad, Convent, Scindia, Malkapuram",
                city: "Visakhapatnam",
                routeName: "Collector Office - Gajuwaka"
            },
            {
                routeNumber: "1T",
                from: "Vuda Park",
                to: "Kapulatunglam",
                viaText: "RK Beach, Jagadamba, Town Kotharoad, Convent, Scindia, Gajuwaka",
                city: "Visakhapatnam",
                routeName: "Vuda Park - Kapulatunglam"
            },
            {
                routeNumber: "500",
                from: "RTC Complex",
                to: "Anakapalle",
                viaText: "Gurudwar, NAD, Gajuwaka, Kurmannapalem, Aganampudi",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Anakapalle"
            },
            {
                routeNumber: "14",
                from: "Venkojipalem",
                to: "OHPO",
                viaText: "MVP Colony, Waltair, AU Outgate, Jagadamba, Town Kotharoad",
                city: "Visakhapatnam",
                routeName: "Venkojipalem - OHPO"
            },
            {
                routeNumber: "48",
                from: "Madhavadhara",
                to: "MN Club",
                viaText: "Muralinagar, Kailasapuram, Akkayyapalem, RTC Complex, Jagadamba",
                city: "Visakhapatnam",
                routeName: "Madhavadhara - MN Club"
            },
            {
                routeNumber: "12K",
                from: "Town Kotharoad",
                to: "Kothavalasa",
                viaText: "Railway Station, Kancharapalem, NAD, GPT, Pendurthi",
                city: "Visakhapatnam",
                routeName: "Town Kotharoad - Kothavalasa"
            },
            {
                routeNumber: "500Y",
                from: "RTC Complex",
                to: "Yelamanchili",
                viaText: "Gurudwar, NAD, Gajuwaka, Kurmannapalem, Anakapalle",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Yelamanchili"
            },
            {
                routeNumber: "555",
                from: "RTC Complex",
                to: "Chodavaram",
                viaText: "Gurudwar, NAD, Gopalapatnam, Pendurthi, Sabbavaram",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Chodavaram"
            },
            {
                routeNumber: "300C",
                from: "RTC Complex",
                to: "Chodavaram",
                viaText: "NAD, Gopalapatnam, Pendurthi, Sabbavaram",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Chodavaram (Fast)"
            },
            {
                routeNumber: "600",
                from: "Anakapalle",
                to: "Simhachalam",
                viaText: "Aganampudi, Kurmannapalem, Gajuwaka, NAD, Gopalapatnam",
                city: "Visakhapatnam",
                routeName: "Anakapalle - Simhachalam"
            },
            {
                routeNumber: "700",
                from: "Simhachalam",
                to: "Vizianagaram",
                viaText: "Adavivaram, Shontyam, Anandapuram, Padmanabham",
                city: "Visakhapatnam",
                routeName: "Simhachalam - Vizianagaram"
            },
            {
                routeNumber: "888",
                from: "Anakapalle",
                to: "Tagarapuvalasa",
                viaText: "Pendurthy, sontyam, Anandapuram",
                city: "Visakhapatnam",
                routeName: "Anakapalle - Tagarapuvalasa"
            },
            {
                routeNumber: "14A",
                from: "Arilova Colony",
                to: "OHPO",
                viaText: "Venkojipalem, Mvp colony, AU Out gate, Jagadamba, Kotha road",
                city: "Visakhapatnam",
                routeName: "Arilova - OHPO"
            },
            {
                routeNumber: "744",
                from: "Collector office",
                to: "Dosuru",
                viaText: "Jagadamba, Town Kotha Road, Convent, Scindia, Gajuwaka, Kurmannapalem, Parawada",
                city: "Visakhapatnam",
                routeName: "Collector Office - Dosuru"
            },
            {
                routeNumber: "99A/C",
                from: "Collector Office",
                to: "Chodavaram",
                viaText: "Jagadamba, Town Kotharoad, Convent, Scindia, Gajuwaka, Kurmannapalem, Anakapalle",
                city: "Visakhapatnam",
                routeName: "Collector Office - Chodavaram"
            },
            {
                routeNumber: "65F",
                from: "Fishing Harbour",
                to: "Gangavaram",
                viaText: "Collector Office, Jagadamba, Town Kotharoad, Convent, Scindia, Gajuwaka, Pedagantyada, Dibbapalem",
                city: "Visakhapatnam",
                routeName: "Fishing Harbour - Gangavaram"
            },
            {
                routeNumber: "500A",
                from: "Maddilapalem",
                to: "Addaroad",
                viaText: "Gurudwar, NAD, Gajuwaka, Kurmannapalem, Anakapalli, Elamanchili",
                city: "Visakhapatnam",
                routeName: "Maddilapalem - Addaroad"
            },
            {
                routeNumber: "25P",
                from: "Ratnagiri HB Colony",
                to: "OHPO",
                viaText: "PM Palem, Endada, Maddilapalem, RTC Complex, Jagadamba",
                city: "Visakhapatnam",
                routeName: "Ratnagiri Colony - OHPO"
            },
            {
                routeNumber: "6B",
                from: "OHPO",
                to: "Chintagatla",
                viaText: "Town Kotharoad, Convent, NAD, Sheelanagar, Narava",
                city: "Visakhapatnam",
                routeName: "OHPO - Chintagatla"
            },
            {
                routeNumber: "333",
                from: "Town Kotharoad",
                to: "Devarapalle",
                viaText: "Convent, NAD, Gopalapatnam, Pendurthi, Kothavalasa",
                city: "Visakhapatnam",
                routeName: "Town Kotharoad - Devarapalle"
            },
            {
                routeNumber: "600C",
                from: "RTC Complex",
                to: "Anakapalle",
                viaText: "Railway Station, Convent, Gajuwaka, Kurmannapalem, Aganampudi",
                city: "Visakhapatnam",
                routeName: "RTC Complex - Anakapalle (via RS)"
            },
            {
                routeNumber: "844",
                from: "Collector Office",
                to: "Kollivanipalem",
                viaText: "Jagadamba, Town Kotharoad, Convent, Scindia, Gajuwaka, Kurmannapalem, Parawada",
                city: "Visakhapatnam",
                routeName: "Collector Office - Kollivanipalem"
            }
        ];

        for (const r of vizagRoutes) {
            await Route.findOneAndUpdate(
                { routeNumber: r.routeNumber },
                r,
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ success: true, message: 'Vizag routes seeded successfully', count: vizagRoutes.length });
    } catch (error) {
        console.error('Vizag seeding error:', error);
        res.status(500).json({ success: false, message: 'Seeding failed' });
    }
});

// @route   GET /api/bus/route/:routeNumber
// @desc    Get ordered stops for a specific route
// @access  Public
router.get('/route/:routeNumber', async (req, res) => {
    try {
        const route = await Route.findOne({ routeNumber: req.params.routeNumber.toUpperCase() })
            .populate('stops.stopId');

        if (!route) {
            return res.status(404).json({ success: false, message: 'Route not found' });
        }

        res.status(200).json({ success: true, route });
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/bus/route/live/:routeNumber
// @desc    Get live status of all buses on a route (Enhanced high-accuracy)
// @access  Public
router.get('/route/live/:routeNumber', async (req, res) => {
    try {
        const routeNumber = req.params.routeNumber.toUpperCase();
        const activeBuses = await Bus.find({
            routeNumber,
            status: 'active',
            'currentLocation.lat': { $ne: null }
        });

        let route = await Route.findOne({ routeNumber }).populate('stops.stopId');
        let fromText = "";
        let toText = "";
        let viaText = "";

        if (route) {
            fromText = route.from;
            toText = route.to;
            viaText = route.viaText;

            // If stops are empty but viaText exists, synthesize stops from it
            if ((!route.stops || route.stops.length === 0) && route.viaText) {
                const viaStopsList = route.viaText.split(',').map(s => s.trim());
                const allNames = [route.from, ...viaStopsList, route.to];

                // PRE-FETCH coordinate data for these stops if they exist in our master list
                const actualStops = await BusStop.find({
                    name: { $in: allNames },
                    city: route.city
                });

                route.stops = allNames.map((stopName, index) => {
                    const actual = actualStops.find(as => as.name.toLowerCase() === stopName.toLowerCase());
                    return {
                        _id: `synth_${index}`,
                        stopId: actual ? actual : { _id: `synth_id_${index}`, name: stopName },
                        sequence: index + 1,
                        estimatedTimeFromStart: index * 10,
                        isMajor: index === 0 || index === allNames.length - 1
                    };
                });
            }
        }

        // If no pre-defined route exists, try to construct one from existing stops
        if (!route) {
            const stops = await BusStop.find({ routes: routeNumber }).sort({ name: 1 }); // Fallback sorting
            if (stops.length > 0) {
                route = {
                    routeName: `Route ${routeNumber}`,
                    city: stops[0].city || "Various",
                    stops: stops.map((s, i) => ({
                        stopId: s,
                        sequence: i + 1,
                        estimatedTimeFromStart: i * 15
                    }))
                };
            }
        }

        if (!route) return res.status(404).json({ success: false, message: 'Route data and stops not found' });

        // Map buses to precise positions in the sequence
        const busStatuses = activeBuses.map(bus => {
            let nearestStop = null;
            let nextStop = null;
            let minDistance = Infinity;
            let nearestIdx = -1;

            if (route.stops && route.stops.length > 0) {
                route.stops.forEach((s, idx) => {
                    // Only calculate distance if stop has coordinates
                    if (s.stopId && s.stopId.location && s.stopId.location.coordinates) {
                        const dist = haversineDistance(
                            bus.currentLocation.lat,
                            bus.currentLocation.lng,
                            s.stopId.location.coordinates[1],
                            s.stopId.location.coordinates[0]
                        );
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearestStop = s;
                            nearestIdx = idx;
                        }
                    }
                });
            }

            // Determine if the bus is heading towards the next stop in sequence
            nextStop = route.stops[nearestIdx + 1] || null;

            let status = 'in-transit';
            if (minDistance < 50) {
                status = 'at-station';
            } else if (minDistance < 300) {
                status = 'arriving';
            } else if (nearestIdx > 0) {
                status = 'departed';
            }

            return {
                busNumber: bus.busNumber,
                currentLocation: bus.currentLocation,
                lastStopSequence: nearestStop?.sequence || 1,
                nextStopSequence: nextStop?.sequence || 2,
                status,
                distanceToNearestStop: minDistance === Infinity ? 0 : minDistance,
                speed: bus.speed || 0,
                heading: bus.heading || 0,
                scheduledStartTime: bus.scheduledStartTime,
                lastUpdated: bus.updatedAt,
                // Sub-route markers
                startLocation: bus.startLocation,
                endLocation: bus.endLocation
            };
        }).sort((a, b) => {
            if (a.scheduledStartTime && b.scheduledStartTime) {
                return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
            }
            return a.busNumber.localeCompare(b.busNumber);
        });

        res.status(200).json({
            success: true,
            route: route.routeName,
            city: route.city,
            from: fromText,
            to: toText,
            viaText: viaText,
            stops: route.stops,
            activeBuses: busStatuses,
            queueCount: busStatuses.filter(b => b.status === 'in-transit' || b.status === 'arriving').length
        });
    } catch (error) {
        console.error('Live route status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
