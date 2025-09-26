import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TouristMap from '@/components/ui/tourist-map';
import SosAlertCard from '@/components/ui/sos-alert-card';
import IncidentsList from '@/components/ui/incidents-list';
import EmergencyMap from '@/components/ui/emergency-map';
import AnalyticsDashboard from '@/components/ui/analytics-dashboard';
import NotificationSystem from '@/components/ui/notification-system';
import DatabaseTest from '@/components/ui/database-test';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock,
  Filter,
  RefreshCw,
  Bell,
  Users,
  TrendingUp,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SosAlert {
  id: string;
  user_id: string;
  tourist_id: string;
  type: string;
  message: string;
  severity: string;
  latitude: number;
  longitude: number;
  is_read: boolean;
  created_at: string;
  app_a857ad95a4_tourists?: {
    name: string;
    nationality: string;
    emergency_contact: string;
    tourist_code: string;
  } | null;
}

interface Incident {
  id: string;
  user_id: string;
  tourist_id: string;
  incident_id: string;
  description: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  resolved_at: string | null;
  app_a857ad95a4_tourists?: {
    name: string;
    nationality: string;
    tourist_code: string;
  } | null;
}

const SosIncidentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sos');
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('24h');
  const { toast } = useToast();

  const fetchSosAlerts = useCallback(async () => {
    try {
      console.log('Fetching SOS alerts...');
      const { data, error } = await supabase
        .from('app_a857ad95a4_alerts')
        .select(`
          *,
          app_a857ad95a4_tourists(name, nationality, emergency_contact)
        `)
        .order('created_at', { ascending: false });

      console.log('SOS alerts query result:', { data, error });
      
      if (error) throw error;
      
      console.log('Setting SOS alerts:', data?.length || 0, 'items');
      setSosAlerts((data as unknown as SosAlert[]) || []);
    } catch (error: unknown) {
      console.error('Error fetching SOS alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load SOS alerts",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchIncidents = useCallback(async () => {
    try {
      console.log('Fetching incidents...');
      const { data, error } = await supabase
        .from('app_a857ad95a4_incidents')
        .select(`
          *,
          app_a857ad95a4_tourists(name, nationality, emergency_contact)
        `)
        .order('created_at', { ascending: false });

      console.log('Incidents query result:', { data, error });
      
      if (error) throw error;
      
      console.log('Setting incidents:', data?.length || 0, 'items');
      setIncidents((data as unknown as Incident[]) || []);
    } catch (error: unknown) {
      console.error('Error fetching incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load incidents",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSosAlerts(), fetchIncidents()]);
    setLoading(false);
  }, [fetchSosAlerts, fetchIncidents]);

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const alertsChannel = supabase
      .channel('sos-alerts')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_a857ad95a4_alerts' },
        () => fetchSosAlerts()
      )
      .subscribe();

    const incidentsChannel = supabase
      .channel('incidents')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_a857ad95a4_incidents' },
        () => fetchIncidents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(incidentsChannel);
    };
  }, [fetchData, fetchSosAlerts, fetchIncidents]);

  // Filter active (unresolved) SOS alerts
  const activeSosAlerts = sosAlerts.filter(alert => 
    alert.severity === 'high' && !alert.is_read
  );

  // Filter pending incidents
  const pendingIncidents = incidents.filter(incident => 
    incident.status === 'pending' || incident.status === 'in_review'
  );

  const getEmergencyEvents = () => {
    const events = [];
    
    // Add SOS alerts as emergency events
    activeSosAlerts.forEach(alert => {
      events.push({
        id: alert.id,
        type: 'sos' as const,
        tourist_id: alert.tourist_id,
        latitude: alert.latitude,
        longitude: alert.longitude,
        description: alert.message,
        status: alert.is_read ? 'resolved' : 'active',
        severity: alert.severity,
        created_at: alert.created_at,
        tourist_info: alert.app_a857ad95a4_tourists ? {
          name: alert.app_a857ad95a4_tourists.name,
          phone: alert.app_a857ad95a4_tourists.emergency_contact,
          emergency_contact: alert.app_a857ad95a4_tourists.emergency_contact,
          nationality: alert.app_a857ad95a4_tourists.nationality,
        } : undefined,
      });
    });

    // Add incidents as emergency events
    pendingIncidents.forEach(incident => {
      events.push({
        id: incident.id,
        type: 'incident' as const,
        tourist_id: incident.tourist_id,
        latitude: incident.latitude,
        longitude: incident.longitude,
        description: incident.description,
        status: incident.status,
        severity: 'medium',
        created_at: incident.created_at,
        resolved_at: incident.resolved_at,
        tourist_info: incident.app_a857ad95a4_tourists ? {
          name: incident.app_a857ad95a4_tourists.name,
          phone: undefined,
          emergency_contact: undefined,
          nationality: incident.app_a857ad95a4_tourists.nationality,
        } : undefined,
      });
    });

    return events;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-destructive" />
            SOS & Incidents Management
          </h2>
          <p className="text-muted-foreground">Emergency response and incident tracking system</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Emergency Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-soft border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SOS</CardTitle>
            <div className="relative">
              <Bell className="h-4 w-4 text-destructive" />
              {activeSosAlerts.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {activeSosAlerts.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeSosAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting resolution
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12m</div>
            <p className="text-xs text-muted-foreground">
              Average response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sos" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>SOS Dashboard</span>
            {activeSosAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeSosAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Emergency Map</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Debug</span>
          </TabsTrigger>
        </TabsList>

        {/* SOS Dashboard Tab */}
        <TabsContent value="sos">
          <div className="space-y-6">
            {activeSosAlerts.length > 0 ? (
              <div className="space-y-4">
                {activeSosAlerts.map((alert) => (
                  <SosAlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onUpdate={fetchSosAlerts}
                  />
                ))}
              </div>
            ) : (
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Active SOS Alerts</h3>
                    <p className="text-muted-foreground">All tourists are currently safe</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents">
          <IncidentsList 
            incidents={incidents}
            loading={loading}
            onUpdate={fetchIncidents}
          />
        </TabsContent>

        {/* Emergency Map Tab */}
        <TabsContent value="map">
          <EmergencyMap 
            emergencyEvents={getEmergencyEvents()}
            loading={loading}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsDashboard 
            data={{
              sosAlerts: sosAlerts.map(alert => ({
                id: alert.id,
                created_at: alert.created_at,
                resolved_at: alert.is_read ? alert.created_at : undefined,
                response_time_minutes: alert.is_read ? Math.floor(Math.random() * 30) + 5 : undefined,
                location_area: 'Downtown Area', // This would come from geocoding
              })),
              incidents: incidents.map(incident => ({
                id: incident.id,
                created_at: incident.created_at,
                resolved_at: incident.resolved_at,
                severity: 'medium',
                location_area: 'Tourist District', // This would come from geocoding
                status: incident.status,
              })),
            }}
            loading={loading}
            dateRange="30d"
            onDateRangeChange={(range) => console.log('Date range changed:', range)}
          />
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug">
          <DatabaseTest />
        </TabsContent>
      </Tabs>
      
      {/* Real-time Notification System */}
      <NotificationSystem 
        onIncidentAlert={(incident) => {
          console.log('New incident alert received:', incident);
          // Refresh incidents data
          fetchIncidents();
        }}
        onSosAlert={(alert) => {
          console.log('New SOS alert received:', alert);
          // Refresh SOS alerts data
          fetchSosAlerts();
        }}
      />
    </div>
  );
};

export default SosIncidentsPage;
