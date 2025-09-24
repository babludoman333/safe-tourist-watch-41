import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Users, 
  Filter, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  Navigation
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const TouristMonitoring: React.FC = () => {
  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [severityFilter, setSeverityFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchLocationData();
    
    // Set up real-time subscription for location updates
    const channel = supabase
      .channel('location-monitoring')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_a857ad95a4_location_logs' },
        () => fetchLocationData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeFilter]);

  useEffect(() => {
    filterLocations();
  }, [locations, searchTerm, severityFilter]);

  const fetchLocationData = async () => {
    try {
      setLoading(true);
      
      // Calculate time filter
      const now = new Date();
      const timeThreshold = new Date();
      switch (timeFilter) {
        case '1h':
          timeThreshold.setHours(now.getHours() - 1);
          break;
        case '24h':
          timeThreshold.setHours(now.getHours() - 24);
          break;
        case '7d':
          timeThreshold.setDate(now.getDate() - 7);
          break;
        default:
          timeThreshold.setHours(now.getHours() - 24);
      }

      const { data, error } = await supabase
        .from('app_a857ad95a4_location_logs')
        .select(`
          *,
          app_a857ad95a4_tourists(name, nationality)
        `)
        .gte('timestamp', timeThreshold.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setLocations(data || []);
    } catch (error: any) {
      console.error('Error fetching location data:', error);
      toast({
        title: "Error",
        description: "Failed to load location data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = () => {
    let filtered = locations;

    // Filter by search term (tourist name)
    if (searchTerm) {
      filtered = filtered.filter(location =>
        location.app_a857ad95a4_tourists?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by severity/risk level
    if (severityFilter !== 'all') {
      switch (severityFilter) {
        case 'restricted':
          filtered = filtered.filter(location => location.in_restricted_zone);
          break;
        case 'safe':
          filtered = filtered.filter(location => !location.in_restricted_zone);
          break;
      }
    }

    setFilteredLocations(filtered);
  };

  const getLocationStatus = (location: LocationLog) => {
    if (location.in_restricted_zone) {
      return {
        status: 'Restricted Zone',
        variant: 'destructive' as const,
        color: 'bg-destructive'
      };
    }
    
    const timeDiff = Date.now() - new Date(location.timestamp).getTime();
    const hoursAgo = timeDiff / (1000 * 60 * 60);
    
    if (hoursAgo > 6) {
      return {
        status: 'Outdated',
        variant: 'secondary' as const,
        color: 'bg-muted-foreground'
      };
    }
    
    return {
      status: 'Safe',
      variant: 'outline' as const,
      color: 'bg-success'
    };
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

  // Group locations by tourist to show latest position
  const latestLocationsByTourist = filteredLocations.reduce((acc, location) => {
    const existing = acc.find(l => l.tourist_id === location.tourist_id);
    if (!existing || new Date(location.timestamp) > new Date(existing.timestamp)) {
      acc = acc.filter(l => l.tourist_id !== location.tourist_id);
      acc.push(location);
    }
    return acc;
  }, [] as LocationLog[]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tourist Monitoring</h2>
          <p className="text-muted-foreground">Real-time location tracking and safety monitoring</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={fetchLocationData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Search tourists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Safety status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectItem value="safe">Safe zones</SelectItem>
                <SelectItem value="restricted">Restricted zones</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{latestLocationsByTourist.length} tourists</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Live Location Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg h-96 flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center space-y-4">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-semibold text-foreground">Interactive Map View</p>
                <p className="text-muted-foreground">Real-time tourist locations with clusters and heatmaps</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Map integration (Mapbox/Leaflet) would be implemented here
                </p>
              </div>
              <Button variant="outline">
                <Navigation className="h-4 w-4 mr-2" />
                Enable Full Map View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location List */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Current Tourist Positions
            </div>
            <Badge variant="secondary">
              {latestLocationsByTourist.length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : latestLocationsByTourist.length > 0 ? (
            <div className="space-y-4">
              {latestLocationsByTourist.map((location) => {
                const status = getLocationStatus(location);
                
                return (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-foreground">
                            {location.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {location.app_a857ad95a4_tourists?.nationality}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(location.timestamp)}
                          </span>
                          {location.address && (
                            <span className="truncate max-w-xs">
                              {location.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={status.variant}>
                        {status.status}
                      </Badge>
                      
                      {location.in_restricted_zone && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Location Data</h3>
              <p>No tourist locations found for the selected criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TouristMonitoring;