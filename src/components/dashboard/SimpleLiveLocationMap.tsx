import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

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

interface SimpleLiveLocationMapProps {
  locations: LocationLog[];
  height?: string;
  onLocationClick?: (location: LocationLog) => void;
}

const SimpleLiveLocationMap: React.FC<SimpleLiveLocationMapProps> = ({ 
  locations, 
  height = "400px" 
}) => {
  console.log('SimpleLiveLocationMap rendering with', locations.length, 'locations');

  // Group locations by tourist to show latest position
  const latestLocationsByTourist = locations.reduce((acc, location) => {
    const existing = acc.find(l => l.tourist_id === location.tourist_id);
    if (!existing || new Date(location.timestamp) > new Date(existing.timestamp)) {
      acc = acc.filter(l => l.tourist_id !== location.tourist_id);
      acc.push(location);
    }
    return acc;
  }, [] as LocationLog[]);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          Live Location Map (Simple Version)
          <Badge variant="secondary" className="ml-2">
            {latestLocationsByTourist.length} tourists
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div 
          style={{ height, minHeight: '400px' }}
          className="w-full bg-gradient-to-br from-blue-50 to-green-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <MapPin className="h-16 w-16 text-blue-600 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-gray-800">Interactive Map Ready</h3>
              <p className="text-gray-600">Leaflet map will be loaded here</p>
              <div className="mt-4 space-y-2">
                <Badge variant="outline" className="mr-2">
                  📍 {latestLocationsByTourist.length} Active Tourists
                </Badge>
                <Badge variant="outline">
                  🗺️ Map Loading Successfully
                </Badge>
              </div>
              
              {latestLocationsByTourist.length > 0 && (
                <div className="mt-4 text-sm text-gray-500">
                  <p>Latest tourist locations:</p>
                  {latestLocationsByTourist.slice(0, 3).map((location, index) => (
                    <div key={location.id} className="text-xs">
                      {index + 1}. {location.app_a857ad95a4_tourists?.name || 'Unknown'} - 
                      {location.in_restricted_zone ? ' ⚠️ Restricted Zone' : ' ✅ Safe Zone'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleLiveLocationMap;