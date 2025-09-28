import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertOctagon,
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';
import L from 'leaflet';

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

// Pure Leaflet implementation - no react-leaflet dependencies

// Pure Leaflet implementation - no react-leaflet dependencies
const EmergencyMap: React.FC<EmergencyMapProps> = ({ emergencyEvents, loading, onEventSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
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

  // Initialize map with pure Leaflet
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: [25.2048, 55.2708], // Dubai coordinates
        zoom: 11,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      leafletMapRef.current = map;
    } catch (error) {
      console.error('Error initializing emergency map:', error);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    filteredEvents.forEach(event => {
      if (!leafletMapRef.current) return;

      const iconColor = event.status === 'resolved' ? 'green' : 
                       event.type === 'sos' ? 'red' : 'orange';

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([event.latitude, event.longitude], {
        icon: customIcon
      }).addTo(leafletMapRef.current);

      const popupContent = `
        <div style="min-width: 250px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">
            ${event.type === 'sos' ? '🚨 SOS Alert' : '⚠️ Incident Report'}
          </h4>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${event.latitude.toFixed(6)}, ${event.longitude.toFixed(6)}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${formatTimeAgo(event.created_at)}</p>
          ${event.tourist_info?.name ? `<p style="margin: 4px 0;"><strong>Tourist:</strong> ${event.tourist_info.name}</p>` : ''}
          ${event.description ? `<p style="margin: 4px 0;"><strong>Description:</strong> ${event.description}</p>` : ''}
          ${event.severity ? `<p style="margin: 4px 0;"><strong>Severity:</strong> ${event.severity}</p>` : ''}
          <p style="margin: 4px 0;"><strong>Status:</strong> ${event.status}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        onEventSelect?.(event);
      });

      markersRef.current.push(marker);
    });
  }, [filteredEvents, onEventSelect]);

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
              <div 
                ref={mapRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: '600px' }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyMap;