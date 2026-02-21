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
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [scheduledStartTime, setScheduledStartTime] = useState('');

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

    const [selectedRouteType, setSelectedRouteType] = useState(null);
    const [startSuggestions, setStartSuggestions] = useState([]);
    const [endSuggestions, setEndSuggestions] = useState([]);

    const fetchSuggestions = async (query, type) => {
        if (query.length < 2) {
            if (type === 'start') setStartSuggestions([]);
            else setEndSuggestions([]);
            return;
        }
        try {
            const res = await api.get(`/api/bus/stops/search?query=${query}&city=${user?.homeCity || ''}`);
            if (type === 'start') setStartSuggestions(res.data.stops);
            else setEndSuggestions(res.data.stops);
        } catch (error) {
            console.error('Failed to fetch suggestions');
        }
    };

    // ... existing code ...

    const handleStartService = async () => {
        if (!busNumber.trim()) { toast.error('Please enter bus number'); return; }
        if (!routeNumber.trim()) { toast.error('Please enter route number'); return; }
        if (!startLocation.trim()) { toast.error('Please enter starting location'); return; }
        if (!endLocation.trim()) { toast.error('Please enter ending location'); return; }

        // For 'both' type drivers, we default to the routeType they chose at registration
        const resolvedType = selectedRouteType || user?.routeType || 'city';

        setActionLoading(true);
        try {
            const payload = {
                busNumber,
                routeNumber,
                startLocation,
                endLocation,
                scheduledStartTime: scheduledStartTime || null,
                routeType: resolvedType
            };

            const res = await api.post('/api/bus/start', payload);

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
                setStartLocation('');
                setEndLocation('');
                setScheduledStartTime('');
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
        <div className="min-h-screen bg-[#0F172A] text-slate-200 overflow-x-hidden relative font-sans">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <span className="block text-xl font-display font-bold text-white tracking-tight leading-none uppercase">APSRTC</span>
                            <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest mt-1">Driver Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white">{user?.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <div className="mb-12 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">System Online</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{user?.name}</span> 👋</h1>
                    <p className="text-lg text-slate-400">Manage your bus service and real-time tracking</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Driver Info Card */}
                    <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white">Driver Profile</h2>
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-orange-500 transition-colors">License Number</p>
                                <p className="text-lg font-bold text-white tracking-wider">{user?.licenseNumber}</p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-orange-500 transition-colors">Phone Contact</p>
                                <p className="text-lg font-bold text-white">{user?.phone}</p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-orange-500 transition-colors">Route Designation</p>
                                <p className="text-lg font-bold text-white flex items-center gap-2">
                                    {user?.routeType === 'city' && <>🚌 <span className="capitalize">City Bus</span></>}
                                    {user?.routeType === 'express' && <>🚍 <span className="capitalize">Express Bus</span></>}
                                    {user?.routeType === 'both' && <>🚌🚍 <span className="capitalize">Multi-Route</span></>}
                                </p>
                            </div>
                            {user?.homeCity && (
                                <div className="group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-orange-500 transition-colors">Base City</p>
                                    <p className="text-lg font-bold text-white">{user?.homeCity}</p>
                                </div>
                            )}
                            {user?.operatingCities && user.operatingCities.length > 0 && (
                                <div className="md:col-span-2 group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 group-hover:text-orange-500 transition-colors">Operating Regions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.operatingCities.map((city, index) => (
                                            <span key={index} className="px-4 py-1.5 bg-white/5 border border-white/5 text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm">
                                                {city}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bus Service Control Card */}
                    <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white">Service Control</h2>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${busStatus ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {busStatus
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    }
                                </svg>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                                </div>
                            </div>
                        ) : busStatus ? (
                            // Active Service View
                            <div className="space-y-8">
                                <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                            Active
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-green-500/60 uppercase tracking-widest mb-1">Vehicle Unit</p>
                                                <p className="text-2xl font-display font-bold text-white tracking-widest">{busStatus.busNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-green-500/60 uppercase tracking-widest mb-1">On-Duty Time</p>
                                                <p className="text-2xl font-display font-bold text-white">{getServiceDuration()}</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Service Route</p>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-green-400 uppercase mb-1">Origin</div>
                                                    <p className="text-base font-bold text-white truncate">{busStatus.startLocation || busStatus.sourceCity || '—'}</p>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 opacity-40">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Route {busStatus.routeNumber}</span>
                                                    <svg className="w-8 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                </div>
                                                <div className="flex-1 text-right">
                                                    <div className="text-xs font-bold text-red-500 uppercase mb-1">Destination</div>
                                                    <p className="text-base font-bold text-white truncate">{busStatus.endLocation || busStatus.destinationCity || '—'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {busStatus.scheduledStartTime && (
                                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Start Time</span>
                                                <span className="text-base font-bold text-orange-400">{busStatus.scheduledStartTime}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {locationTracking && connected && (
                                    <div className="flex items-center gap-3 px-5 py-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                                        <div className="relative">
                                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">GPS Transmission Active</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Broadcasting live coordinates to passengers</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleStopService}
                                    disabled={actionLoading}
                                    className="w-full h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-lg hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10 py-0 flex items-center justify-center gap-3 group"
                                >
                                    {actionLoading ? 'Terminating Service...' : 'Shut Down Service'}
                                    {!actionLoading && (
                                        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ) : (
                            // Start Service Form
                            <div className="space-y-6">
                                {/* Route Type selector — only for 'both' drivers */}
                                {user?.routeType === 'both' && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service Classification</label>
                                        <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRouteType('city')}
                                                className={`py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${selectedRouteType === 'city'
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                🚌 City Bus
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRouteType('express')}
                                                className={`py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${selectedRouteType === 'express'
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                🚍 Express Bus
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={busNumber}
                                            onChange={(e) => setBusNumber(e.target.value.toUpperCase())}
                                            placeholder=" "
                                            className="peer w-full h-16 px-5 pt-6 pb-2 rounded-2xl border border-white/10 bg-white/5 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-white font-bold tracking-widest placeholder:text-transparent"
                                        />
                                        <label className="absolute left-5 top-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-orange-500">
                                            Vehicle Registration Number *
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={routeNumber}
                                            onChange={(e) => setRouteNumber(e.target.value.toUpperCase())}
                                            placeholder=" "
                                            className="peer w-full h-16 px-5 pt-6 pb-2 rounded-2xl border border-white/10 bg-white/5 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-white font-bold tracking-wider placeholder:text-transparent"
                                        />
                                        <label className="absolute left-5 top-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-orange-500">
                                            Service Route Number * (e.g. 222R)
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={startLocation}
                                                onChange={(e) => {
                                                    setStartLocation(e.target.value);
                                                    fetchSuggestions(e.target.value, 'start');
                                                }}
                                                placeholder=" "
                                                className="peer w-full h-16 px-5 pt-6 pb-2 rounded-2xl border border-white/10 bg-white/5 outline-none focus:border-green-500 transition-all text-white font-medium"
                                            />
                                            <label className="absolute left-5 top-2 text-[10px] font-bold text-green-500/60 uppercase tracking-widest pointer-events-none transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-green-500">
                                                🟢 Point of Origin *
                                            </label>
                                            {startSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] border border-white/10 rounded-2xl py-2 shadow-2xl z-50">
                                                    {startSuggestions.map(stop => (
                                                        <button
                                                            key={stop._id}
                                                            onClick={() => {
                                                                setStartLocation(stop.name);
                                                                setStartSuggestions([]);
                                                            }}
                                                            className="w-full px-5 py-3 text-left hover:bg-white/5 text-sm text-slate-300 font-bold"
                                                        >
                                                            {stop.name} <span className="text-[10px] text-slate-500 ml-2">({stop.city})</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={endLocation}
                                                onChange={(e) => {
                                                    setEndLocation(e.target.value);
                                                    fetchSuggestions(e.target.value, 'end');
                                                }}
                                                placeholder=" "
                                                className="peer w-full h-16 px-5 pt-6 pb-2 rounded-2xl border border-white/10 bg-white/5 outline-none focus:border-red-500 transition-all text-white font-medium"
                                            />
                                            <label className="absolute left-5 top-2 text-[10px] font-bold text-red-500/60 uppercase tracking-widest pointer-events-none transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-red-500">
                                                🔴 Destination *
                                            </label>
                                            {endSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] border border-white/10 rounded-2xl py-2 shadow-2xl z-50">
                                                    {endSuggestions.map(stop => (
                                                        <button
                                                            key={stop._id}
                                                            onClick={() => {
                                                                setEndLocation(stop.name);
                                                                setEndSuggestions([]);
                                                            }}
                                                            className="w-full px-5 py-3 text-left hover:bg-white/5 text-sm text-slate-300 font-bold"
                                                        >
                                                            {stop.name} <span className="text-[10px] text-slate-500 ml-2">({stop.city})</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={scheduledStartTime}
                                            onChange={(e) => setScheduledStartTime(e.target.value)}
                                            className="peer w-full h-16 px-5 pt-6 pb-2 rounded-2xl border border-white/10 bg-white/5 outline-none focus:border-orange-500 transition-all text-white font-bold"
                                        />
                                        <label className="absolute left-5 top-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">
                                            Scheduled Departure Time
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartService}
                                    disabled={actionLoading}
                                    className="group w-full h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg transition-all shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 px-0 py-0"
                                >
                                    {actionLoading ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/33 border-t-white"></div>
                                    ) : (
                                        <>
                                            <span className="uppercase tracking-widest">Initiate Live Service</span>
                                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
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

