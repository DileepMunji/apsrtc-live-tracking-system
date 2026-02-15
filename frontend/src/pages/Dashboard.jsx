import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function Dashboard() {
    const { user, logout } = useAuth();
    const { socket, connected } = useSocket();
    const navigate = useNavigate();
    const [busStatus, setBusStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [locationTracking, setLocationTracking] = useState(false);
    const watchIdRef = useRef(null);
    const locationIntervalRef = useRef(null);

    // Form state
    const [busNumber, setBusNumber] = useState(user?.busNumber || '');
    const [routeNumber, setRouteNumber] = useState('');
    const [sourceCity, setSourceCity] = useState('');
    const [destinationCity, setDestinationCity] = useState('');

    useEffect(() => {
        checkBusStatus();
    }, []);

    // Start/stop location tracking based on bus status
    useEffect(() => {
        if (busStatus && socket && connected) {
            startLocationTracking();
        } else {
            stopLocationTracking();
        }

        return () => stopLocationTracking();
    }, [busStatus, socket, connected]);

    const startLocationTracking = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setLocationTracking(true);

        // Join bus room
        if (socket && busStatus?.id) {
            socket.emit('joinBus', busStatus.id);
        }

        // Watch position with high accuracy
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, heading, speed } = position.coords;

                // Send location update via socket
                if (socket && busStatus?.id) {
                    socket.emit('updateLocation', {
                        busId: busStatus.id,
                        lat: latitude,
                        lng: longitude,
                        heading: heading || 0,
                        speed: speed || 0
                    });
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error('Location permission denied. Please enable location access.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    const stopLocationTracking = () => {
        setLocationTracking(false);

        // Leave bus room
        if (socket && busStatus?.id) {
            socket.emit('leaveBus', busStatus.id);
        }

        // Clear watch position
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        // Clear interval
        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }
    };

    const checkBusStatus = async () => {
        try {
            const res = await api.get('/api/bus/status');
            if (res.data.isActive) {
                setBusStatus(res.data.bus);
                setBusNumber(res.data.bus.busNumber);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error checking bus status:', error);
            setLoading(false);
        }
    };

    const handleStartService = async () => {
        if (!busNumber.trim()) {
            toast.error('Please enter bus number');
            return;
        }

        if (user?.routeType === 'express') {
            if (!sourceCity || !destinationCity) {
                toast.error('Please select source and destination cities');
                return;
            }
        }

        setActionLoading(true);
        try {
            const res = await api.post('/api/bus/start', {
                busNumber,
                routeNumber: user?.routeType === 'city' ? routeNumber : null,
                sourceCity: user?.routeType === 'express' ? sourceCity : null,
                destinationCity: user?.routeType === 'express' ? destinationCity : null
            });

            if (res.data.success) {
                toast.success(res.data.message);
                setBusStatus(res.data.bus);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start service');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStopService = async () => {
        setActionLoading(true);
        try {
            const res = await api.post('/api/bus/stop');
            if (res.data.success) {
                toast.success(res.data.message);
                setBusStatus(null);
                setRouteNumber('');
                setSourceCity('');
                setDestinationCity('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to stop service');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getServiceDuration = () => {
        if (!busStatus?.startedAt) return '0m';
        const start = new Date(busStatus.startedAt);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000 / 60); // minutes
        if (diff < 60) return `${diff}m`;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <span className="block text-lg font-display font-bold text-slate-900">APSRTC</span>
                            <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-widest">Driver Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome, {user?.name}! 👋</h1>
                    <p className="text-lg text-slate-600">Your driver dashboard is ready</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Driver Info Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Driver Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">License Number</p>
                                <p className="text-lg font-bold text-slate-900">{user?.licenseNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                                <p className="text-lg font-bold text-slate-900">{user?.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Route Type</p>
                                <p className="text-lg font-bold text-slate-900 capitalize">
                                    {user?.routeType === 'city' && '🚌 City Bus'}
                                    {user?.routeType === 'express' && '🚍 Express Bus'}
                                    {user?.routeType === 'both' && '🚌🚍 Both'}
                                </p>
                            </div>
                            {user?.homeCity && (
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Home City</p>
                                    <p className="text-lg font-bold text-slate-900">{user?.homeCity}</p>
                                </div>
                            )}
                            {user?.operatingCities && user.operatingCities.length > 0 && (
                                <div className="md:col-span-2">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Operating Cities</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.operatingCities.map((city, index) => (
                                            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium text-sm">
                                                {city}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bus Activation Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Bus Service Control</h2>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                            </div>
                        ) : busStatus ? (
                            // Active Service View
                            <div className="space-y-6">
                                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-lg font-bold text-green-700">SERVICE ACTIVE</span>
                                        </div>
                                        <span className="text-sm font-bold text-green-600">{getServiceDuration()}</span>
                                    </div>

                                    {/* GPS Tracking Indicator */}
                                    {locationTracking && connected && (
                                        <div className="mb-4 flex items-center gap-2 text-sm">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="font-bold">GPS Tracking Active</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-green-600 uppercase mb-1">Bus Number</p>
                                            <p className="text-2xl font-bold text-green-900">{busStatus.busNumber}</p>
                                        </div>

                                        {busStatus.routeType === 'city' && busStatus.routeNumber && (
                                            <div>
                                                <p className="text-xs font-bold text-green-600 uppercase mb-1">Route Number</p>
                                                <p className="text-lg font-bold text-green-900">{busStatus.routeNumber}</p>
                                            </div>
                                        )}

                                        {busStatus.routeType === 'express' && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-green-600 uppercase mb-1">From</p>
                                                    <p className="text-lg font-bold text-green-900">{busStatus.sourceCity}</p>
                                                </div>
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-green-600 uppercase mb-1">To</p>
                                                    <p className="text-lg font-bold text-green-900">{busStatus.destinationCity}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleStopService}
                                    disabled={actionLoading}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Stopping...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                            </svg>
                                            STOP SERVICE
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            // Start Service Form
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Bus Number *</label>
                                    <input
                                        type="text"
                                        value={busNumber}
                                        onChange={(e) => setBusNumber(e.target.value.toUpperCase())}
                                        placeholder="e.g., AP39Z1234"
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-lg"
                                    />
                                </div>

                                {user?.routeType === 'city' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Route Number (Optional)</label>
                                        <input
                                            type="text"
                                            value={routeNumber}
                                            onChange={(e) => setRouteNumber(e.target.value.toUpperCase())}
                                            placeholder="e.g., 28A, 400K"
                                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-lg"
                                        />
                                    </div>
                                )}

                                {user?.routeType === 'express' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Source City *</label>
                                            <select
                                                value={sourceCity}
                                                onChange={(e) => setSourceCity(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-lg"
                                            >
                                                <option value="">Select Source</option>
                                                {user?.operatingCities?.map((city, idx) => (
                                                    <option key={idx} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Destination City *</label>
                                            <select
                                                value={destinationCity}
                                                onChange={(e) => setDestinationCity(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-lg"
                                            >
                                                <option value="">Select Destination</option>
                                                {user?.operatingCities?.filter(city => city !== sourceCity).map((city, idx) => (
                                                    <option key={idx} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={handleStartService}
                                    disabled={actionLoading}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            START SERVICE
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

