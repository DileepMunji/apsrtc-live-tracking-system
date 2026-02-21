import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

function RouteTracking() {
    const { routeNumber } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [routeData, setRouteData] = useState(null);
    const [liveBuses, setLiveBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        fetchRouteData();
        const interval = setInterval(fetchLiveStatus, 5000);
        return () => clearInterval(interval);
    }, [routeNumber]);

    useEffect(() => {
        if (socket) {
            socket.on('locationUpdated', (data) => {
                if (data.routeNumber === routeNumber?.toUpperCase()) {
                    setLiveBuses(prev => {
                        const existing = prev.find(b => b.busNumber === data.busNumber);
                        if (existing) {
                            return prev.map(b => b.busNumber === data.busNumber ? { ...b, ...data } : b);
                        }
                        return [...prev, data];
                    });
                    setLastUpdated(new Date());
                }
            });
        }
        return () => socket?.off('locationUpdated');
    }, [socket, routeNumber]);

    const fetchRouteData = async () => {
        try {
            const res = await api.get(`/api/bus/route/${routeNumber}`);
            setRouteData(res.data.route);
            fetchLiveStatus();
        } catch (error) {
            toast.error('Failed to load route data');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveStatus = async () => {
        try {
            const res = await api.get(`/api/bus/route/live/${routeNumber}`);
            setLiveBuses(res.data.activeBuses);
            // Update route metadata if it was synthesized on the backend
            if (res.data.stops) {
                setRouteData(prev => ({
                    ...prev,
                    from: res.data.from || prev?.from,
                    to: res.data.to || prev?.to,
                    viaText: res.data.viaText || prev?.viaText,
                    stops: res.data.stops
                }));
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Live status fetch failed');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <div className="space-y-4 text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Route Schedule...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans pb-20">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 h-20 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-white leading-none uppercase tracking-tight">{routeNumber}</h1>
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">{routeData?.routeName}</p>
                    </div>
                    <div className="w-10"></div>
                </div>
            </nav>

            <main className="pt-32 max-w-2xl mx-auto px-4">
                {/* Trip Summary Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-xl">🏙️</div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Operating City</span>
                                <span className="block text-sm font-black text-white mt-1">{routeData?.city}</span>
                            </div>
                        </div>
                        {routeData?.notes && (
                            <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black px-2 py-1 rounded border border-blue-500/20 uppercase">
                                {routeData.notes}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/5 p-6 rounded-2xl border border-white/5">
                        <div className="relative">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xs font-black shadow-lg shadow-green-500/20">A</div>
                                <div className="flex-1">
                                    <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Origin Terminal</span>
                                    <span className="block text-sm font-black text-white">{routeData?.from || routeData?.stops[0]?.stopId?.name || 'Start Terminal'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-black shadow-lg shadow-red-500/20">B</div>
                                <div className="flex-1">
                                    <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Final Destination</span>
                                    <span className="block text-sm font-black text-white">{routeData?.to || routeData?.stops[routeData?.stops.length - 1]?.stopId?.name || 'End Destination'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {routeData?.viaText && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Route Via</span>
                            <p className="text-[11px] font-bold text-slate-400 italic leading-relaxed">
                                {routeData.viaText}
                            </p>
                        </div>
                    )}
                </div>

                {/* Live Banner & Upcoming Queue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute opacity-70"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-white uppercase tracking-widest leading-none">Live Tracking Active</span>
                                <span className="block text-[10px] text-slate-500 font-bold uppercase mt-1">
                                    {liveBuses.length} {liveBuses.length === 1 ? 'Bus' : 'Buses'} on route
                                </span>
                            </div>
                        </div>
                        {lastUpdated && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Sync</span>
                                <span className="text-xs font-black text-orange-500">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Queue */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3">
                            <span className="bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-orange-500/20">Upcoming</span>
                        </div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Scheduled Queue</h3>
                        <div className="space-y-3 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {liveBuses.length > 0 ? (
                                liveBuses.map(bus => (
                                    <div key={bus.busNumber} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5 group hover:border-orange-500/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 font-bold text-xs">
                                                {bus.busNumber.slice(-2)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white">{bus.busNumber}</p>
                                                <p className="text-[8px] text-slate-500 font-bold">{bus.status.replace('-', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-orange-400">{bus.scheduledStartTime || '--:--'}</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Departs</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-slate-600 font-bold uppercase italic p-4 text-center">No buses in current queue</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timeline Layout */}
                <div className="relative pl-12 mt-16">
                    {/* Main Track */}
                    <div className="absolute left-[39px] top-0 bottom-0 w-1.5 bg-white/5 border-x border-white/5 rounded-full"></div>

                    {/* Active Track Progress (Optional: based on first bus etc.) */}
                    <div className="absolute left-[39px] top-0 w-1.5 bg-orange-500 rounded-full opacity-20 blur-sm" style={{ height: '50%' }}></div>

                    <div className="space-y-24">
                        {routeData?.stops.map((stop, index) => {
                            const busesAtStop = liveBuses.filter(b => b.lastStopSequence === stop.sequence);
                            const hasPassed = liveBuses.some(b => b.lastStopSequence > stop.sequence);

                            return (
                                <div key={stop._id} className="relative group">
                                    {/* Stop Node Icon */}
                                    <div className={`absolute left-[-15px] w-10 h-10 rounded-2xl flex items-center justify-center z-10 transition-all duration-700 ${busesAtStop.length > 0 ? 'bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.6)] scale-110 rotate-45' :
                                        hasPassed ? 'bg-green-500/20 border border-green-500/40' :
                                            'bg-[#1E293B] border border-white/10'
                                        }`}>
                                        <div className={`transition-transform ${busesAtStop.length > 0 ? '-rotate-45' : ''}`}>
                                            {busesAtStop.length > 0 ? (
                                                <span className="text-xl">🚍</span>
                                            ) : hasPassed ? (
                                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Floating Bus (In-Transit between this stop and next) */}
                                    {liveBuses.some(b => b.lastStopSequence === stop.sequence && b.status !== 'at-station' && index < routeData.stops.length - 1) && (
                                        <div className="absolute left-[-5px] top-[60px] z-20 animate-bounce duration-[2000ms]">
                                            <div className="relative group/float">
                                                <div className="absolute -inset-2 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
                                                <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center text-sm shadow-xl border border-orange-400/30">
                                                    🚍
                                                </div>
                                                <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 whitespace-nowrap hidden group-hover/float:block text-[8px] font-black text-white uppercase tracking-tighter">
                                                    Moving to NEXT STOP
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stop Info */}
                                    <div className={`ml-12 transition-all duration-500 ${busesAtStop.length > 0 ? 'translate-x-2' : ''}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${hasPassed ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                                                        }`}>
                                                        STOP {stop.sequence}
                                                    </span>
                                                    {stop.isMajor && (
                                                        <span className="text-[9px] font-black text-white bg-orange-600 px-1.5 py-0.5 rounded-sm uppercase italic">Express Stop</span>
                                                    )}
                                                </div>
                                                <h3 className={`text-xl font-black tracking-tight transition-colors ${busesAtStop.length > 0 ? 'text-white' : hasPassed ? 'text-slate-500' : 'text-slate-300'
                                                    }`}>
                                                    {stop.stopId?.name || stop.name}
                                                </h3>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className={`text-lg font-black leading-none ${hasPassed ? 'text-slate-600' : 'text-white'}`}>
                                                    {new Date(Date.now() + stop.estimatedTimeFromStart * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Expected</div>
                                            </div>
                                        </div>

                                        {/* Dynamic Bus Indicators */}
                                        <div className="mt-6 flex flex-wrap gap-4">
                                            {busesAtStop.map(bus => (
                                                <div key={bus.busNumber} className="relative group/bus self-start">
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-25 group-hover/bus:opacity-50 transition duration-1000 group-hover/bus:duration-200"></div>
                                                    <div className="relative bg-[#1E293B] border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                                                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
                                                            🚍
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-white">{bus.busNumber}</span>
                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${bus.status === 'at-station' ? 'bg-green-500 text-white' :
                                                                    bus.status === 'arriving' ? 'bg-blue-500 text-white animate-pulse' :
                                                                        'bg-orange-500 text-white'
                                                                    }`}>
                                                                    {bus.status.replace('-', ' ')}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] font-bold text-slate-500">{bus.speed} km/h</span>
                                                                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                                <span className="text-[9px] font-bold text-slate-500">{Math.round(bus.distanceToNearestStop)}m away</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Connection Line to next stop (shows departed buses) */}
                                    {index < routeData.stops.length - 1 && (
                                        <div className="absolute left-[39px] top-[40px] h-[96px] w-1.5 overflow-hidden">
                                            {liveBuses.filter(b => b.lastStopSequence === stop.sequence && b.status === 'departed').map(bus => (
                                                <div key={bus.busNumber} className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <div className="w-4 h-4 bg-orange-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                                                    <span className="text-[8px] font-black text-orange-500 mt-2 rotate-90">{bus.busNumber}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default RouteTracking;
