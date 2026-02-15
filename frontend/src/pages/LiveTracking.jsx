import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import api from '../api/axios';

function LiveTracking() {
    const { socket, connected } = useSocket();
    const navigate = useNavigate();
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveBuses();
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
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
                            <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-widest">Live Tracking</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium hover:bg-slate-200 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </nav>

            {/* Map Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Live Bus Tracking</h1>
                        <p className="text-slate-600 mt-1">
                            {connected ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Connected - {buses.length} bus{buses.length !== 1 ? 'es' : ''} active
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    Connecting...
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Map */}
                <div className="bg-white rounded-2xl shadow-lg p-4" style={{ height: '600px' }}>
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        <Map buses={buses} />
                    )}
                </div>

                {buses.length === 0 && !loading && (
                    <div className="mt-6 text-center">
                        <p className="text-slate-500">No active buses at the moment</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LiveTracking;
