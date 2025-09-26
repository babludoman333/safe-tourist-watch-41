import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertOctagon,
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Filter,
  Layers
} from 'lucide-react';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as L.Icon & { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EmergencyEvent {
  id: string;
  type: 'sos' | 'incident';
  tourist_id: string;
  latitude: number;
  longitude: number;
  description: string;
  status: string;
  severity?: string;
  created_at: string;
  resolved_at?: string;
  tourist_info?: {
    name: string;
    phone?: string;
    emergency_contact?: string;
    nationality: string;
  };
}

interface EmergencyMapProps {
  emergencyEvents: EmergencyEvent[];
  loading: boolean;
  onEventSelect?: (event: EmergencyEvent) => void;
}

// Custom marker icons with color coding
const createCustomIcon = (type: 'sos' | 'incident', status: string) => {
  let color = '#94a3b8'; // Default gray
  let icon = '🔴';

  if (type === 'sos') {
    icon = '🚨';
    color = status === 'resolved' ? '#10b981' : '#ef4444'; // Green if resolved, red if active
  } else if (type === 'incident') {
    icon = '⚠️';
    color = status === 'resolved' ? '#10b981' : '#f97316'; // Green if resolved, orange if active
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${status !== 'resolved' ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${icon}
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${color}66; }
          70% { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const MapController: React.FC<{ events: EmergencyEvent[] }> = ({ events }) => {
  const map = useMap();

  useEffect(() => {
    if (events.length > 0) {
      const bounds = L.latLngBounds(events.map(event => [event.latitude, event.longitude]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [events, map]);

  return null;
};

const EmergencyMap: React.FC<EmergencyMapProps> = ({ emergencyEvents, loading, onEventSelect }) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'sos' | 'incident'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredEvents = emergencyEvents.filter(event => {
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    if (statusFilter === 'active' && event.status === 'resolved') return false;
    if (statusFilter === 'resolved' && event.status !== 'resolved') return false;
    if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
    return true;
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getStatusBadge = (status: string, type: string) => {
    if (status === 'resolved') {
      return <Badge variant="outline" className="border-green-500 text-green-700">Resolved</Badge>;
    }
    
    if (type === 'sos') {
      return <Badge variant="destructive">Active SOS</Badge>;
    }
    
    return <Badge variant="default">Open Incident</Badge>;
  };

  const handleCallTourist = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleCallEmergency = (emergency_contact?: string) => {
    if (emergency_contact) {
      window.open(`tel:${emergency_contact}`, '_self');
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={typeFilter} onValueChange={(value: 'all' | 'sos' | 'incident') => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sos">SOS Alerts</SelectItem>
                <SelectItem value="incident">Incidents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'resolved') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="resolved">Resolved Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setSeverityFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>{filteredEvents.length} events</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Map */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertOctagon className="h-5 w-5 mr-2 text-destructive" />
            Emergency Response Map
            <div className="flex items-center space-x-4 ml-auto">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>SOS Alert</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Incident</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Resolved</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[600px] rounded-lg overflow-hidden">
            {loading ? (
              <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                <div className="text-center">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Loading emergency map...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[25.2048, 55.2708]} // Dubai coordinates as default
                zoom={11}
                className="w-full h-full"
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController events={filteredEvents} />
                
                {filteredEvents.map((event) => (
                  <Marker
                    key={event.id}
                    position={[event.latitude, event.longitude]}
                    icon={createCustomIcon(event.type, event.status)}
                    eventHandlers={{
                      click: () => onEventSelect?.(event)
                    }}
                  >
                    <Popup maxWidth={300}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">
                            {event.type === 'sos' ? '🚨 SOS Alert' : '⚠️ Incident Report'}
                          </h4>
                          {getStatusBadge(event.status, event.type)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{formatTimeAgo(event.created_at)}</span>
                          </div>
                          
                          {event.tourist_info?.name && (
                            <div className="font-medium">
                              Tourist: {event.tourist_info.name}
                            </div>
                          )}
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                          
                          {event.severity && (
                            <Badge 
                              variant={event.severity === 'high' ? 'destructive' : 
                                       event.severity === 'medium' ? 'default' : 'secondary'}
                            >
                              {event.severity} Severity
                            </Badge>
                          )}
                        </div>
                        
                        {event.status !== 'resolved' && (
                          <div className="flex space-x-2 pt-2 border-t">
                            {event.tourist_info?.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallTourist(event.tourist_info?.phone)}
                                className="flex-1"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Call Tourist
                              </Button>
                            )}
                            
                            {event.tourist_info?.emergency_contact && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCallEmergency(event.tourist_info?.emergency_contact)}
                                className="flex-1"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Emergency
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyMap;