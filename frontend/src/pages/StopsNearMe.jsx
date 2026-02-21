import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── Icons ──────────────────────────────────────────────────────────────────────
const stopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const selectedStopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [30, 46], iconAnchor: [15, 46], popupAnchor: [1, -38], shadowSize: [41, 41]
});
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [30, 46], iconAnchor: [15, 46], popupAnchor: [1, -38], shadowSize: [41, 41]
});

// ── Map helpers ────────────────────────────────────────────────────────────────
function FitBounds({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (positions?.length >= 2) map.fitBounds(positions, { padding: [60, 60] });
    }, [positions, map]);
    return null;
}
function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView([coords.lat, coords.lng], 15);
    }, [coords, map]);
    return null;
}

const RADIUS_OPTIONS = [
    { label: '500 m', value: 500 },
    { label: '1 km', value: 1000 },
    { label: '2 km', value: 2000 },
    { label: '5 km', value: 5000 },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function StopsNearMe() {
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(null);
    const [stops, setStops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [radius, setRadius] = useState(1500);

    const [selectedStop, setSelectedStop] = useState(null);
    const [routeCoords, setRouteCoords] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [fitBounds, setFitBounds] = useState(null);

    // Mobile: 'list' | 'map'
    const [mobileTab, setMobileTab] = useState('list');
    // Desktop: side panel open/closed
    const [panelOpen, setPanelOpen] = useState(true);

    useEffect(() => { getUserLocation(); }, []);

    // ── Location & stops ───────────────────────────────────────────────────
    const getUserLocation = () => {
        setLoading(true); setError(null); clearRoute();
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            setLoading(false); return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(c);
                fetchNearbyStops(c.lat, c.lng, radius);
            },
            () => {
                toast.error('Location access denied');
                setError('location_denied');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const fetchNearbyStops = async (lat, lng, r) => {
        setLoading(true); setError(null); clearRoute();
        try {
            const res = await api.get(`/api/bus/stops/realtime?lat=${lat}&lng=${lng}&radius=${r}`);
            if (res.data.success) {
                setStops(res.data.stops);
                if (!res.data.stops.length)
                    toast('No stops found. Try a larger radius.', { icon: 'ℹ️' });
            }
        } catch (err) {
            const isTimeout = err.response?.status === 503;
            setError(isTimeout ? 'timeout' : 'fetch_failed');
            toast.error(isTimeout ? 'Service busy — tap Retry.' : 'Could not fetch stops.', { duration: 4000 });
        } finally { setLoading(false); }
    };

    const handleRadiusChange = r => {
        setRadius(r);
        if (userLocation) fetchNearbyStops(userLocation.lat, userLocation.lng, r);
    };

    // ── Routing (OSRM — called directly from browser, no backend needed) ───
    const clearRoute = () => {
        setSelectedStop(null); setRouteCoords(null);
        setRouteInfo(null); setFitBounds(null);
    };

    const fetchRoute = async stop => {
        if (!userLocation) { toast.error('Location not available'); return; }
        setSelectedStop(stop);
        setRouteLoading(true);
        setRouteCoords(null);
        setRouteInfo(null);
        // On mobile, switch to map tab so user sees the route being drawn
        setMobileTab('map');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            // OSRM public API — walking profile, called directly from the browser (no CORS issue)
            const url = `https://router.project-osrm.org/route/v1/foot/` +
                `${userLocation.lng},${userLocation.lat};${stop.lng},${stop.lat}` +
                `?overview=full&geometries=geojson`;

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route returned');

            const route = data.routes[0];
            // GeoJSON is [lng, lat] — Leaflet needs [lat, lng]
            const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            const distM = Math.round(route.distance);
            const durS = Math.round(route.duration);

            setRouteCoords(coords);
            setRouteInfo({
                distanceDisplay: distM < 1000 ? `${distM} m` : `${(distM / 1000).toFixed(2)} km`,
                durationMin: Math.ceil(durS / 60),
            });
            setFitBounds([[userLocation.lat, userLocation.lng], [stop.lat, stop.lng]]);

        } catch (err) {
            clearTimeout(timeoutId);
            console.error('OSRM error:', err.message);
            // Fallback: straight line with Haversine distance
            toast('Showing direct path — road routing unavailable.', { icon: '📏', duration: 3000 });
            setRouteCoords([[userLocation.lat, userLocation.lng], [stop.lat, stop.lng]]);
            setRouteInfo({
                distanceDisplay: stop.distanceDisplay,
                durationMin: Math.ceil(stop.distanceMeters / 80),
            });
            setFitBounds([[userLocation.lat, userLocation.lng], [stop.lat, stop.lng]]);
        } finally {
            setRouteLoading(false);
        }
    };

    // ── Stop card (shared between desktop panel and mobile list) ───────────
    const StopCard = ({ stop, idx }) => {
        const isSel = selectedStop?.id === stop.id;
        return (
            <div className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${isSel ? 'bg-orange-500/10 border-orange-500/40 shadow-lg shadow-orange-500/10'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-orange-500/20'
                }`}>
                <div className={`absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${isSel ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-600'
                    }`}>{idx + 1}</div>

                <div className="flex items-start justify-between pl-7">
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-bold truncate pr-2 leading-tight ${isSel ? 'text-orange-400' : 'text-white'}`}>
                            {stop.name}
                        </h3>
                        {stop.routes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {stop.routes.slice(0, 3).map(r => (
                                    <span key={r} className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/10">{r}</span>
                                ))}
                                {stop.routes.length > 3 && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-white/5 text-slate-500 rounded-md">+{stop.routes.length - 3}</span>
                                )}
                            </div>
                        )}
                        {stop.operator && <p className="text-[9px] text-slate-600 mt-1 truncate">{stop.operator}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                        <div className={`text-lg font-black leading-none ${stop.distanceMeters < 300 ? 'text-green-400' :
                                stop.distanceMeters < 800 ? 'text-yellow-400' : 'text-white'
                            }`}>
                            {stop.distanceMeters < 1000 ? stop.distanceMeters : (stop.distanceMeters / 1000).toFixed(1)}
                        </div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight">
                            {stop.distanceMeters < 1000 ? 'meters' : 'km away'}
                        </div>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                    <button onClick={() => fetchRoute(stop)} disabled={routeLoading}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${isSel ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                : 'bg-white/5 text-slate-400 hover:bg-orange-500/20 hover:text-orange-400'
                            }`}>
                        🗺️ {isSel ? 'Route Active' : 'Get Route'}
                    </button>
                    <button onClick={() => navigate('/track')}
                        className="px-3 py-2 rounded-xl text-[9px] font-black uppercase bg-white/5 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-all">
                        🚌 Track
                    </button>
                </div>
            </div>
        );
    };

    // ── Route info banner ──────────────────────────────────────────────────
    const RouteInfoBanner = () => (
        (routeLoading || routeInfo) ? (
            <div className="p-4 border-b border-white/5 bg-orange-500/5">
                {routeLoading ? (
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        <p className="text-xs font-bold text-orange-400">Finding shortest walking path…</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex gap-4 flex-1">
                            <div>
                                <div className="text-base font-black text-white leading-none">{routeInfo.distanceDisplay}</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Walk dist</div>
                            </div>
                            <div className="w-px bg-white/10"></div>
                            <div>
                                <div className="text-base font-black text-orange-400 leading-none">{routeInfo.durationMin} min</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Walk time</div>
                            </div>
                            {selectedStop && (
                                <>
                                    <div className="w-px bg-white/10"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold text-slate-300 truncate">{selectedStop.name}</div>
                                        <div className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Destination</div>
                                    </div>
                                </>
                            )}
                        </div>
                        <button onClick={clearRoute}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        ) : null
    );

    // ── Shared map ─────────────────────────────────────────────────────────
    const MapView = () => (
        <div className="relative h-full w-full">
            <MapContainer center={[17.3850, 78.4867]} zoom={14}
                style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

                {userLocation && !routeCoords && (
                    <Circle center={[userLocation.lat, userLocation.lng]} radius={radius}
                        pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.04, weight: 1, dashArray: '6 4' }} />
                )}

                {routeCoords && (
                    <>
                        <Polyline positions={routeCoords} pathOptions={{ color: '#f97316', weight: 10, opacity: 0.15 }} />
                        <Polyline positions={routeCoords} pathOptions={{ color: '#f97316', weight: 4, opacity: 0.95, dashArray: '10 6', lineCap: 'round', lineJoin: 'round' }} />
                    </>
                )}

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                        <Popup>
                            <div className="text-center p-2">
                                <p className="font-bold text-slate-900 text-sm">📍 Your Location</p>
                                <p className="text-[10px] text-slate-500 mt-1">{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {stops.map((stop, idx) => {
                    const isSel = selectedStop?.id === stop.id;
                    return (
                        <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={isSel ? selectedStopIcon : stopIcon}>
                            <Popup>
                                <div className="p-3 w-52 font-sans">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-black text-slate-900 text-sm leading-tight flex-1 pr-2">{stop.name}</h3>
                                        <span className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">#{idx + 1}</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black mb-3 ${stop.distanceMeters < 300 ? 'bg-green-50 text-green-700' :
                                            stop.distanceMeters < 800 ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                                        }`}>📍 {stop.distanceDisplay} away</div>

                                    {routeInfo && isSel && (
                                        <div className="flex gap-3 mb-3 p-2 bg-orange-50 rounded-xl">
                                            <div className="text-center flex-1">
                                                <div className="text-sm font-black text-orange-700">{routeInfo.distanceDisplay}</div>
                                                <div className="text-[8px] text-orange-500 font-bold uppercase">Walk dist</div>
                                            </div>
                                            <div className="w-px bg-orange-200"></div>
                                            <div className="text-center flex-1">
                                                <div className="text-sm font-black text-orange-700">{routeInfo.durationMin} min</div>
                                                <div className="text-[8px] text-orange-500 font-bold uppercase">Walk time</div>
                                            </div>
                                        </div>
                                    )}

                                    {stop.routes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {stop.routes.map(r => (
                                                <span key={r} className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">{r}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => fetchRoute(stop)}
                                            className="flex-1 py-2.5 bg-orange-500 text-white text-[10px] font-black rounded-xl uppercase hover:bg-orange-600 transition-all">
                                            {isSel ? '🗺️ Reroute' : '🗺️ Route'}
                                        </button>
                                        <button onClick={() => navigate('/track')}
                                            className="px-3 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase hover:bg-slate-700 transition-all">🚌</button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {fitBounds ? <FitBounds positions={fitBounds} /> : <RecenterMap coords={userLocation} />}
            </MapContainer>

            {/* Route loading overlay */}
            {routeLoading && (
                <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
                    <div className="bg-[#0B1628]/90 backdrop-blur-xl border border-orange-500/20 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-white">Finding shortest path…</span>
                    </div>
                </div>
            )}

            {/* GPS status pill */}
            <div className="absolute top-4 right-4 z-[1000]">
                <div className="bg-[#0B1628]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-2xl">
                    <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                    <div>
                        <span className="block text-[9px] font-black text-white uppercase tracking-widest leading-none">
                            {loading ? 'Scanning…' : routeLoading ? 'Routing…' : userLocation ? 'GPS Active' : 'No GPS'}
                        </span>
                        <span className="block text-[8px] font-bold text-slate-500 mt-0.5">
                            {routeInfo ? `${routeInfo.distanceDisplay} · ${routeInfo.durationMin} min walk`
                                : userLocation ? `${stops.length} stops nearby` : 'Awaiting signal'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── List content ───────────────────────────────────────────────────────
    const ListContent = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-white/10 rounded-lg w-3/4"></div>
                                <div className="h-3 bg-white/5 rounded-lg w-1/2"></div>
                            </div>
                            <div className="h-8 w-16 bg-white/10 rounded-lg ml-4"></div>
                        </div>
                    </div>
                ))
            ) : error ? (
                <div className="py-16 text-center px-6">
                    <div className="text-5xl mb-4 opacity-30">{error === 'timeout' ? '⏱️' : error === 'location_denied' ? '📵' : '⚠️'}</div>
                    <p className="text-slate-300 font-bold text-sm mb-2">
                        {error === 'timeout' ? 'Map service busy' : error === 'location_denied' ? 'Location denied' : 'Failed to load'}
                    </p>
                    <p className="text-slate-600 text-xs mb-6">
                        {error === 'timeout' ? 'Please wait and retry.' : error === 'location_denied' ? 'Enable location in browser settings.' : 'Check your connection.'}
                    </p>
                    {error !== 'location_denied' && (
                        <button onClick={() => userLocation && fetchNearbyStops(userLocation.lat, userLocation.lng, radius)}
                            className="px-6 py-3 bg-orange-500 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-orange-600 transition-all">
                            Retry Now
                        </button>
                    )}
                </div>
            ) : stops.length === 0 ? (
                <div className="py-16 text-center px-6">
                    <div className="text-5xl mb-4 opacity-20">🚏</div>
                    <p className="text-slate-400 font-bold text-sm mb-2">No stops found nearby</p>
                    <p className="text-slate-600 text-xs">Try increasing the search radius above</p>
                </div>
            ) : (
                stops.map((stop, idx) => <StopCard key={stop.id} stop={stop} idx={idx} />)
            )}
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-[#0F172A] font-sans text-slate-200 overflow-hidden">

            {/* ════════════════════════════════════════════════════════════
                DESKTOP LAYOUT  (md and above)
                Side panel (left) + Map (right) — same as original
            ════════════════════════════════════════════════════════════ */}
            <div className="hidden md:flex h-full">

                {/* Side panel */}
                <div className={`${panelOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}
                    h-full bg-[#0B1628]/95 backdrop-blur-2xl border-r border-white/5
                    transition-all duration-500 ease-in-out flex flex-col`}>

                    {/* Panel header */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-4 mb-5">
                            <button onClick={() => navigate('/')}
                                className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight leading-none">Nearby Bus Stops</h2>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                                    {loading ? 'Scanning…' : `${stops.length} stops · Live OSM data`}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {RADIUS_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => handleRadiusChange(opt.value)}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${radius === opt.value ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                        }`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <RouteInfoBanner />
                    <ListContent />

                    {/* Footer */}
                    <div className="p-5 border-t border-white/5">
                        <button onClick={getUserLocation}
                            className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Location
                        </button>
                    </div>
                </div>

                {/* Map — desktop */}
                <div className="flex-1 relative">
                    {/* Panel toggle */}
                    <button onClick={() => setPanelOpen(!panelOpen)}
                        className="absolute top-5 left-5 z-[1000] w-10 h-10 bg-[#0B1628]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        {panelOpen ? '◀' : '▶'}
                    </button>
                    <MapView />
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                MOBILE LAYOUT  (below md)
                Top bar + tab switcher + List/Map tabs
            ════════════════════════════════════════════════════════════ */}
            <div className="flex md:hidden flex-col h-full">

                {/* Top bar */}
                <div className="shrink-0 bg-[#0B1628]/95 backdrop-blur-2xl border-b border-white/5 px-4 pt-4 pb-3 z-50">
                    <div className="flex items-center gap-3 mb-3">
                        <button onClick={() => navigate('/')}
                            className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-black text-white leading-none">Nearby Bus Stops</h1>
                            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">
                                {loading ? 'Scanning…' : `${stops.length} stops · Live OSM`}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2.5 py-1.5 shrink-0">
                            <div className={`w-1.5 h-1.5 rounded-full ${userLocation ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{userLocation ? 'GPS' : 'No GPS'}</span>
                        </div>
                    </div>

                    {/* Radius */}
                    <div className="flex gap-2 mb-3">
                        {RADIUS_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => handleRadiusChange(opt.value)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${radius === opt.value ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                    }`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab switcher */}
                    <div className="flex gap-2">
                        <button onClick={() => setMobileTab('list')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${mobileTab === 'list' ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-500'
                                }`}>
                            📋 List {stops.length > 0 ? `(${stops.length})` : ''}
                        </button>
                        <button onClick={() => setMobileTab('map')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${mobileTab === 'map' ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-500'
                                }`}>
                            🗺️ Map {routeInfo ? '· Route' : ''}
                        </button>
                    </div>
                </div>

                {/* Route info (mobile) */}
                {(routeLoading || routeInfo) && (
                    <div className="shrink-0 px-4 py-3 bg-[#0B1628]/80 border-b border-white/5">
                        <RouteInfoBanner />
                    </div>
                )}

                {/* List tab */}
                {mobileTab === 'list' && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#0B1628]/80">
                        <ListContent />
                        <div className="shrink-0 p-4 border-t border-white/5">
                            <button onClick={getUserLocation}
                                className="w-full h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh Location
                            </button>
                        </div>
                    </div>
                )}

                {/* Map tab */}
                {mobileTab === 'map' && (
                    <div className="flex-1 overflow-hidden">
                        <MapView />
                    </div>
                )}
            </div>
        </div>
    );
}
