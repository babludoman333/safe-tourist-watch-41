import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationLog {
  id: string;
  tourist_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address: string | null;
  accuracy: string | null;
  in_restricted_zone: boolean;
  app_a857ad95a4_tourists?: {
    name: string;
    nationality: string;
  };
}

interface TouristMapProps {
  locations: LocationLog[];
  className?: string;
}

// Custom icons for different status
const createCustomIcon = (status: 'safe' | 'restricted' | 'outdated') => {
  const colors = {
    safe: '#22c55e', // green
    restricted: '#ef4444', // red
    outdated: '#6b7280', // gray
  };

  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${colors[status]};
        width: 20px;
        height: 20px;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
    className: 'custom-tourist-marker'
  });
};

// Component to fit map bounds to show all markers
const MapBounds: React.FC<{ locations: LocationLog[] }> = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    if (locations.length === 1) {
      // If only one location, center on it
      const location = locations[0];
      map.setView([location.latitude, location.longitude], 13);
    } else {
      // If multiple locations, fit bounds to show all
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations, map]);

  return null;
};

const TouristMap: React.FC<TouristMapProps> = ({ locations, className = '' }) => {
  const mapRef = useRef<L.Map>(null);

  const getLocationStatus = (location: LocationLog): 'safe' | 'restricted' | 'outdated' => {
    if (location.in_restricted_zone) {
      return 'restricted';
    }
    
    const timeDiff = Date.now() - new Date(location.timestamp).getTime();
    const hoursAgo = timeDiff / (1000 * 60 * 60);
    
    if (hoursAgo > 6) {
      return 'outdated';
    }
    
    return 'safe';
  };

  const formatTimeAgo = (timestamp: string) => {
    const timeDiff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  // Default center (you can adjust this to your region's center)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York as default

  return (
    <div className={`h-full w-full rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Fit bounds to show all markers */}
        <MapBounds locations={locations} />
        
        {locations.map((location) => {
          const status = getLocationStatus(location);
          const icon = createCustomIcon(status);

          return (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg mb-2">
                    {location.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
                  </h3>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nationality:</span>
                      <span className="font-medium">
                        {location.app_a857ad95a4_tourists?.nationality || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coordinates:</span>
                      <span className="font-mono text-xs">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Update:</span>
                      <span className="font-medium">
                        {formatTimeAgo(location.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        status === 'safe' ? 'text-green-600' :
                        status === 'restricted' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {status === 'safe' ? 'Safe' :
                         status === 'restricted' ? 'Restricted Zone' :
                         'Outdated Location'}
                      </span>
                    </div>
                    
                    {location.address && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-600 text-xs">Address:</span>
                        <p className="text-xs mt-1 break-words">
                          {location.address}
                        </p>
                      </div>
                    )}
                    
                    {location.accuracy && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className="text-xs">
                          {location.accuracy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TouristMap;