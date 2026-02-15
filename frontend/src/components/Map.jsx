import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom orange bus icon
const busIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f97316" width="48" height="48">
            <path d="M12 2C8.13 2 5 3.79 5 6v12c0 1.1.9 2 2 2h1v1c0 .55.45 1 1 1s1-.45 1-1v-1h4v1c0 .55.45 1 1 1s1-.45 1-1v-1h1c1.1 0 2-.9 2-2V6c0-2.21-3.13-4-7-4zm-5 7h10v5H7v-5zm0-2V6h10v1H7zm1 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// Component to auto-center map on buses
function MapController({ buses }) {
    const map = useMap();

    useEffect(() => {
        if (buses && buses.length > 0) {
            const bounds = L.latLngBounds(buses.map(bus => [bus.lat, bus.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [buses, map]);

    return null;
}

function Map({ buses = [], center = [17.6868, 83.2185], zoom = 13 }) {
    return (
        <div className="w-full h-full rounded-xl overflow-hidden shadow-lg">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {buses.map((bus) => (
                    <Marker
                        key={bus.id}
                        position={[bus.lat, bus.lng]}
                        icon={busIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-lg text-orange-600">{bus.busNumber}</p>
                                <p className="text-sm text-slate-600">
                                    {bus.routeType === 'city' ? '🚌 City Bus' : '🚍 Express Bus'}
                                </p>
                                {bus.routeNumber && (
                                    <p className="text-xs text-slate-500">Route: {bus.routeNumber}</p>
                                )}
                                {bus.sourceCity && bus.destinationCity && (
                                    <p className="text-xs text-slate-500">
                                        {bus.sourceCity} → {bus.destinationCity}
                                    </p>
                                )}
                                {bus.speed && (
                                    <p className="text-xs text-green-600 font-bold mt-1">
                                        Speed: {Math.round(bus.speed * 3.6)} km/h
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {buses.length > 0 && <MapController buses={buses} />}
            </MapContainer>
        </div>
    );
}

export default Map;
