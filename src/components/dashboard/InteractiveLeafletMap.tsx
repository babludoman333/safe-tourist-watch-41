import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, RotateCcw, AlertCircle } from 'lucide-react';

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

interface InteractiveLeafletMapProps {
  locations: LocationLog[];
  height?: string;
  onLocationClick?: (location: LocationLog) => void;
}

const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({ 
  locations, 
  height = "400px",
  onLocationClick 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Group locations by tourist to show latest position
  const latestLocationsByTourist = locations.reduce((acc, location) => {
    const existing = acc.find(l => l.tourist_id === location.tourist_id);
    if (!existing || new Date(location.timestamp) > new Date(existing.timestamp)) {
      acc = acc.filter(l => l.tourist_id !== location.tourist_id);
      acc.push(location);
    }
    return acc;
  }, [] as LocationLog[]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const L = await import('leaflet');
        const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
        
        if (!mapRef.current || !isMounted) return;

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (isMounted) {
          setIsMapReady(true);
          setMapError(null);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        if (isMounted) {
          setMapError('Failed to load map components');
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
    };
  }, []);

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

  if (mapError) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-semibold">Failed to load interactive map</p>
            <p className="text-muted-foreground text-sm mt-2">{mapError}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isMapReady) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Loading Interactive Map...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            style={{ height }}
            className="w-full bg-muted/30 rounded-lg flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div>
                <p className="text-lg font-semibold text-foreground">Loading Map Components</p>
                <p className="text-muted-foreground">Initializing Leaflet...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default center coordinates
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York

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
          <Button variant="outline" size="sm">
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
          ref={mapRef}
          style={{ 
            height: isFullScreen ? 'calc(100vh - 120px)' : height,
            minHeight: '400px'
          }}
          className="w-full rounded-lg overflow-hidden border"
        >
          <LeafletMapComponent 
            center={defaultCenter}
            locations={latestLocationsByTourist}
            onLocationClick={onLocationClick}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Separate component for the actual Leaflet map to avoid SSR issues
const LeafletMapComponent: React.FC<{
  center: [number, number];
  locations: LocationLog[];
  onLocationClick?: (location: LocationLog) => void;
}> = ({ center, locations, onLocationClick }) => {
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    const loadMapComponents = async () => {
      try {
        const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
        const L = await import('leaflet');
        
        setMapComponents({ MapContainer, TileLayer, Marker, Popup, L });
      } catch (error) {
        console.error('Error loading map components:', error);
      }
    };

    loadMapComponents();
  }, []);

  if (!mapComponents) {
    return (
      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, L } = mapComponents;

  // Create custom marker icons
  const createCustomIcon = (color: string, isRestricted: boolean = false) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${isRestricted ? '⚠️' : '📍'}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  };

  const getMarkerColor = (location: LocationLog) => {
    if (location.in_restricted_zone) return '#ef4444';
    
    const timeDiff = Date.now() - new Date(location.timestamp).getTime();
    const hoursAgo = timeDiff / (1000 * 60 * 60);
    
    if (hoursAgo > 6) return '#6b7280';
    return '#22c55e';
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

  return (
    <MapContainer
      center={center}
      zoom={locations.length > 0 ? 10 : 2}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {locations.map((location) => (
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
            <div className="min-w-48">
              <div className="font-semibold text-base mb-2">
                {location.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nationality:</span>
                  <span className="font-medium">
                    {location.app_a857ad95a4_tourists?.nationality || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    location.in_restricted_zone ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {location.in_restricted_zone ? '⚠️ Restricted Zone' : '✅ Safe Zone'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last seen:</span>
                  <span>{formatTimeAgo(location.timestamp)}</span>
                </div>
                
                <div className="pt-2 border-t text-xs text-gray-500">
                  <div>Lat: {location.latitude.toFixed(6)}</div>
                  <div>Lng: {location.longitude.toFixed(6)}</div>
                  {location.address && (
                    <div className="mt-1 font-medium text-gray-700">
                      📍 {location.address}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Default marker when no tourist data */}
      {locations.length === 0 && (
        <Marker position={center}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Map Ready</p>
              <p className="text-sm text-gray-600">Tourist locations will appear here</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default InteractiveLeafletMap;