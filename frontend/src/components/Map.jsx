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

// Custom user icon
const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="48" height="48">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
        </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// Component to auto-center map
function MapController({ buses, userLocation, focusOnUser }) {
    const map = useMap();

    useEffect(() => {
        if (focusOnUser && userLocation) {
            map.flyTo([userLocation.lat, userLocation.lng], 15);
        } else if (buses && buses.length > 0) {
            const bounds = L.latLngBounds(buses.map(bus => [bus.lat, bus.lng]));
            if (userLocation) {
                bounds.extend([userLocation.lat, userLocation.lng]);
            }
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [buses, userLocation, focusOnUser, map]);

    return null;
}

function Map({ buses = [], userLocation = null, focusOnUser = false, center = [17.6868, 83.2185], zoom = 13 }) {
    return (
        <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-slate-200">
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

                {/* User Marker */}
                {userLocation && (
                    <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={userIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-lg text-blue-600">You are here</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Bus Markers */}
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
                                {bus.distance && (
                                    <p className="text-xs text-blue-600 font-bold mt-1">
                                        {bus.distance < 1 ?
                                            `${Math.round(bus.distance * 1000)}m away` :
                                            `${bus.distance.toFixed(1)}km away`
                                        }
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapController buses={buses} userLocation={userLocation} focusOnUser={focusOnUser} />
            </MapContainer>
        </div>
    );
}

export default Map;
