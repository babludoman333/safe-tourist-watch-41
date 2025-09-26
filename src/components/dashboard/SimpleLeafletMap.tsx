import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
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

interface SimpleLeafletMapProps {
  locations: LocationLog[];
  height?: string;
  onLocationClick?: (location: LocationLog) => void;
}

const SimpleLeafletMap: React.FC<SimpleLeafletMapProps> = ({ 
  locations, 
  height = "400px",
  onLocationClick 
}) => {
  console.log('SimpleLeafletMap rendering with', locations.length, 'locations');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Group locations by tourist to show latest position
  const latestLocationsByTourist = locations.reduce((acc, location) => {
    const existing = acc.find(l => l.tourist_id === location.tourist_id);
    if (!existing || new Date(location.timestamp) > new Date(existing.timestamp)) {
      acc = acc.filter(l => l.tourist_id !== location.tourist_id);
      acc.push(location);
    }
    return acc;
  }, [] as LocationLog[]);

  // Initialize map immediately without waiting for geolocation
  useEffect(() => {
    if (!mapRef.current) return;

    try {
      console.log('Initializing Leaflet map...');
      
      // Fix for default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialize map with default location (London)
      const initialCenter: [number, number] = [51.5074, -0.1278]; // London coordinates
      const map = L.map(mapRef.current).setView(initialCenter, 6); // Zoom out to see more area
      leafletMapRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      console.log('Leaflet map initialized successfully');
      setMapReady(true);
      setMapError(null);

      // Try to get user location AFTER map is ready (non-blocking)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('User location detected:', latitude, longitude);
            setUserLocation([latitude, longitude]);
            setLocationError(null);
            
            // Add user location marker to existing map
            const userLocationIcon = L.divIcon({
              html: `
                <div style="
                  background-color: #3b82f6;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                ">
                  🫵
                </div>
              `,
              className: 'user-location-icon',
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });

            L.marker([latitude, longitude], { icon: userLocationIcon })
              .bindPopup(`
                <div style="text-align: center;">
                  <strong>📍 Your Location</strong>
                  <br><small>Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}</small>
                </div>
              `)
              .addTo(map);
              
            // Optionally center on user location
            map.setView([latitude, longitude], 12);
          },
          (error) => {
            console.warn('Geolocation error:', error.message);
            setLocationError(error.message);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 600000 // Cache for 10 minutes
          }
        );
      } else {
        setLocationError('Geolocation not supported by this browser');
      }

    } catch (error: any) {
      console.error('Error initializing Leaflet map:', error);
      setMapError(error.message || 'Failed to initialize map');
    }

    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // No dependencies - map loads immediately

  // Update markers when locations change
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    const markers: L.Marker[] = [];
    
    latestLocationsByTourist.forEach((location) => {
      const getMarkerColor = (loc: LocationLog) => {
        if (loc.in_restricted_zone) return '#ef4444';
        const timeDiff = Date.now() - new Date(loc.timestamp).getTime();
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

      // Create custom icon
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${getMarkerColor(location)};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">
            ${location.in_restricted_zone ? '⚠️' : '📍'}
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // Create marker
      const marker = L.marker([location.latitude, location.longitude], { icon: customIcon });
      
      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">
            ${location.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Nationality:</strong> ${location.app_a857ad95a4_tourists?.nationality || 'Unknown'}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Status:</strong> 
            <span style="color: ${location.in_restricted_zone ? '#ef4444' : '#22c55e'};">
              ${location.in_restricted_zone ? '⚠️ Restricted Zone' : '✅ Safe Zone'}
            </span>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Last seen:</strong> ${formatTimeAgo(location.timestamp)}
          </div>
          <div style="padding-top: 8px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <div>Lat: ${location.latitude.toFixed(6)}</div>
            <div>Lng: ${location.longitude.toFixed(6)}</div>
            ${location.address ? `<div style="margin-top: 4px; font-weight: bold;">📍 ${location.address}</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Add click handler
      marker.on('click', () => {
        onLocationClick?.(location);
      });

      marker.addTo(leafletMapRef.current!);
      markers.push(marker);
    });

    markersRef.current = markers;

    // Fit bounds to show all markers
    if (latestLocationsByTourist.length > 0) {
      const group = new L.FeatureGroup(markers);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [latestLocationsByTourist, mapReady, onLocationClick]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // Trigger a resize event after state change
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 100);
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
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-semibold mb-2">Failed to load map</p>
            <p className="text-muted-foreground text-sm">{mapError}</p>
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

  return (
    <Card className={`shadow-soft ${isFullScreen ? 'fixed inset-4 z-50 bg-background' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          Live Location Map
          <Badge variant="secondary" className="ml-2">
            {latestLocationsByTourist.length} tourists
          </Badge>
          {locationError && (
            <Badge variant="outline" className="ml-2 text-xs">
              Using default location
            </Badge>
          )}
          {userLocation && !locationError && (
            <Badge variant="outline" className="ml-2 text-xs">
              📍 Your location detected
            </Badge>
          )}
        </CardTitle>
        
        <div className="flex items-center space-x-2">
          {userLocation && (
            <Button variant="outline" size="sm" onClick={() => {
              if (leafletMapRef.current && userLocation) {
                leafletMapRef.current.setView(userLocation, 12);
              }
            }} title="Center on your location">
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            if (leafletMapRef.current && latestLocationsByTourist.length > 0) {
              const group = new L.FeatureGroup(markersRef.current);
              leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
            }
          }} title="Fit all tourists">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullScreen}>
            <Navigation className="h-4 w-4" />
            {isFullScreen ? 'Exit Full Map' : 'Full Map'}
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
          className="w-full rounded-lg overflow-hidden border bg-gray-100"
        >
          {/* The map will render directly into this div */}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleLeafletMap;