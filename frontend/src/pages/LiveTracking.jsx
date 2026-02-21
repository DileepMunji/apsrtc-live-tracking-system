import { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import api from '../api/axios';
import toast from 'react-hot-toast';

function LiveTracking() {
    const { socket, connected } = useSocket();
    const navigate = useNavigate();
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusOnUser, setFocusOnUser] = useState(false);

    useEffect(() => {
        fetchActiveBuses();
        getUserLocation();
    }, []);

    useEffect(() => {
        if (!socket || !connected) return;

        // Listen for bus location updates
        socket.on('busLocationUpdated', (data) => {
            setBuses(prevBuses => {
                const existingIndex = prevBuses.findIndex(b => b.id === data.busId);
                if (existingIndex >= 0) {
                    // Update existing bus
                    const updated = [...prevBuses];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        lat: data.lat,
                        lng: data.lng,
                        heading: data.heading,
                        speed: data.speed
                    };
                    return updated;
                } else {
                    // Add new bus
                    return [...prevBuses, {
                        id: data.busId,
                        busNumber: data.busNumber,
                        lat: data.lat,
                        lng: data.lng,
                        heading: data.heading,
                        speed: data.speed
                    }];
                }
            });
        });

        return () => {
            socket.off('busLocationUpdated');
        };
    }, [socket, connected]);

    const getUserLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setFocusOnUser(true); // Focus on user initially
                setTimeout(() => setFocusOnUser(false), 2000); // Reset focus trigger
            },
            (error) => {
                console.error('Error getting location:', error);
                toast.error('Unable to retrieve your location');
            }
        );
    };

    const fetchActiveBuses = async () => {
        try {
            const res = await api.get('/api/bus/active');
            if (res.data.success) {
                setBuses(res.data.buses);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching buses:', error);
            setLoading(false);
        }
    };

    // Haversine formula to calculate distance in km
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const filteredBuses = useMemo(() => {
        let filtered = buses;

        // If search query exists, filter by bus number or route
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = buses.filter(bus =>
                bus.busNumber.toLowerCase().includes(query) ||
                (bus.routeNumber && bus.routeNumber.toLowerCase().includes(query)) ||
                (bus.sourceCity && bus.sourceCity.toLowerCase().includes(query)) ||
                (bus.destinationCity && bus.destinationCity.toLowerCase().includes(query))
            );
        }

        // Calculate distance if user location is available
        if (userLocation) {
            filtered = filtered.map(bus => ({
                ...bus,
                distance: getDistance(userLocation.lat, userLocation.lng, bus.lat, bus.lng)
            }));

            // If NO search query, sort by distance (Nearby mode)
            if (!searchQuery.trim()) {
                filtered.sort((a, b) => a.distance - b.distance);
            }
        }

        return filtered;
    }, [buses, searchQuery, userLocation]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
            {/* Header */}
            <nav className="bg-white border-b border-slate-200 shadow-sm relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <span className="block text-lg font-display font-bold text-slate-900">APSRTC</span>
                            <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-widest">Live Tracking</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={getUserLocation}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Locate Me"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium hover:bg-slate-200 transition-colors"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </nav>

            {/* Map Container */}
            <div className="absolute inset-0 pt-16 flex flex-col">
                {/* Search Bar Overlay */}
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4">
                    <div className="bg-white rounded-full shadow-lg border border-slate-200 p-2 flex items-center gap-2">
                        <div className="pl-3 text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Filters available buses by bus number, route or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 outline-none text-slate-700 bg-transparent py-2 placeholder:text-sm placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {/* Status Pill */}
                    <div className="flex justify-center mt-2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-md px-4 py-1 text-xs font-bold text-slate-600 flex items-center gap-2 border border-slate-100">
                            {connected ? (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    {filteredBuses.length} Active Bus{filteredBuses.length !== 1 ? 'es' : ''} Found
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    Reconnecting...
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 w-full h-full">
                    {loading ? (
                        <div className="flex items-center justify-center h-full bg-slate-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        <Map
                            buses={filteredBuses}
                            userLocation={userLocation}
                            focusOnUser={focusOnUser}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default LiveTracking;
