import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different tourist statuses
const createCustomIcon = (color: string, isRestricted: boolean = false) => {
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z"/>
      <circle fill="${isRestricted ? '#ffffff' : color}" stroke="${isRestricted ? color : '#ffffff'}" stroke-width="2" cx="12.5" cy="12.5" r="6"/>
      ${isRestricted ? '<path fill="' + color + '" d="M12.5 7.5L15 10L10 15L7.5 12.5L12.5 7.5Z"/>' : ''}
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

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

interface LiveLocationMapProps {
  locations: LocationLog[];
  onLocationClick?: (location: LocationLog) => void;
  height?: string;
}

// Component to handle map controls and updates
const MapController: React.FC<{ locations: LocationLog[] }> = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations, map]);

  return null;
};

const LiveLocationMap: React.FC<LiveLocationMapProps> = ({ 
  locations, 
  onLocationClick, 
  height = "400px" 
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapRef = useRef<any>(null);

  // Group locations by tourist to show latest position
  const latestLocationsByTourist = locations.reduce((acc, location) => {
    const existing = acc.find(l => l.tourist_id === location.tourist_id);
    if (!existing || new Date(location.timestamp) > new Date(existing.timestamp)) {
      acc = acc.filter(l => l.tourist_id !== location.tourist_id);
      acc.push(location);
    }
    return acc;
  }, [] as LocationLog[]);

  const getMarkerColor = (location: LocationLog) => {
    if (location.in_restricted_zone) return '#ef4444'; // red
    
    const timeDiff = Date.now() - new Date(location.timestamp).getTime();
    const hoursAgo = timeDiff / (1000 * 60 * 60);
    
    if (hoursAgo > 6) return '#6b7280'; // gray
    return '#22c55e'; // green
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

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const resetView = () => {
    if (mapRef.current && latestLocationsByTourist.length > 0) {
      const bounds = L.latLngBounds(
        latestLocationsByTourist.map(loc => [loc.latitude, loc.longitude])
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  // Default center (can be configured based on your area)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York coordinates as example

  return (
    <Card className={`shadow-soft ${isFullScreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          Live Location Map
          <Badge variant="secondary" className="ml-2">
            {latestLocationsByTourist.length} tourists
          </Badge>
        </CardTitle>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullScreen}>
            <Navigation className="h-4 w-4" />
            {isFullScreen ? 'Exit Full Map' : 'Full Map View'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div 
          style={{ 
            height: isFullScreen ? 'calc(100vh - 120px)' : height,
            minHeight: '400px',
            border: '1px solid #ccc'
          }}
          className="w-full relative rounded-lg overflow-hidden"
        >
          <MapContainer
            ref={mapRef}
            center={defaultCenter}
            zoom={latestLocationsByTourist.length > 0 ? 10 : 2}
            style={{ height: '100%', width: '100%' }}
            className="leaflet-container"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {latestLocationsByTourist.length > 0 && (
              <MapController locations={latestLocationsByTourist} />
            )}
            
            {latestLocationsByTourist.map((location) => (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                icon={createCustomIcon(
                  getMarkerColor(location), 
                  location.in_restricted_zone
                )}
                eventHandlers={{
                  click: () => onLocationClick?.(location),
                }}
              >
                <Popup>
                  <div className="min-w-64">
                    <div className="font-semibold text-lg mb-2">
                      {location.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Nationality:</span>
                        <Badge variant="outline">
                          {location.app_a857ad95a4_tourists?.nationality}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge 
                          variant={location.in_restricted_zone ? "destructive" : "default"}
                        >
                          {location.in_restricted_zone ? 'Restricted Zone' : 'Safe Zone'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last seen:</span>
                        <span>{formatTimeAgo(location.timestamp)}</span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="text-xs text-gray-500">
                          <div>Lat: {location.latitude.toFixed(6)}</div>
                          <div>Lng: {location.longitude.toFixed(6)}</div>
                          {location.address && (
                            <div className="mt-1 font-medium">
                              {location.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Show a default marker when no tourist data is available */}
            {latestLocationsByTourist.length === 0 && (
              <Marker position={defaultCenter}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">No Tourist Data Available</p>
                    <p className="text-sm text-gray-600">The map is ready to display tourist locations</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveLocationMap;