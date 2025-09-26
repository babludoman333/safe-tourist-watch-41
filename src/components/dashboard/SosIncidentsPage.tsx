import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, Phone, Clock, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Incident {
  id: string;
  incident_id: string;
  tourist_id: string;
  user_id: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  resolved_at: string | null;
  app_a857ad95a4_tourists?: {
    name: string;
    nationality: string;
    emergency_contact: string;
  };
}

const SosIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const { toast } = useToast();

  useEffect(() => {
    fetchIncidents();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('incidents-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'app_a857ad95a4_incidents' },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('app_a857ad95a4_incidents')
        .select(`
          *,
          app_a857ad95a4_tourists (
            name,
            nationality,
            emergency_contact
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch SOS incidents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const updates: any = { 
        status: newStatus,
      };

      if (newStatus === 'Resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('app_a857ad95a4_incidents')
        .update(updates)
        .eq('id', incidentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Incident status updated to ${newStatus}`,
      });

      await fetchIncidents();
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'destructive';
      case 'acknowledged': return 'default';
      case 'resolved': return 'secondary';
      default: return 'outline';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMins}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (selectedStatus === 'active') return incident.status === 'Active';
    if (selectedStatus === 'acknowledged') return incident.status === 'Acknowledged';
    if (selectedStatus === 'resolved') return incident.status === 'Resolved';
    return true;
  });

  const getStatusCounts = () => {
    const active = incidents.filter(i => i.status === 'Active').length;
    const acknowledged = incidents.filter(i => i.status === 'Acknowledged').length;
    const resolved = incidents.filter(i => i.status === 'Resolved').length;
    return { active, acknowledged, resolved };
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">SOS Incidents</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold">SOS Incidents</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active SOS</p>
                <p className="text-2xl font-bold text-destructive">{counts.active}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
                <p className="text-2xl font-bold text-yellow-600">{counts.acknowledged}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2">
        {[
          { key: 'active', label: 'Active', count: counts.active },
          { key: 'acknowledged', label: 'Acknowledged', count: counts.acknowledged },
          { key: 'resolved', label: 'Resolved', count: counts.resolved }
        ].map((status) => (
          <Button
            key={status.key}
            variant={selectedStatus === status.key ? 'default' : 'outline'}
            onClick={() => setSelectedStatus(status.key)}
          >
            {status.label} ({status.count})
          </Button>
        ))}
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <Card key={incident.id} className={`transition-all hover:shadow-md ${
            incident.status === 'Active' ? 'border-destructive/30 bg-destructive/5' : ''
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      incident.status === 'Active' ? 'bg-destructive/10 text-destructive' :
                      incident.status === 'Acknowledged' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-green-500/10 text-green-600'
                    }`}>
                      {incident.status === 'Active' ? <AlertCircle className="h-5 w-5" /> :
                       incident.status === 'Acknowledged' ? <Clock className="h-5 w-5" /> :
                       <CheckCircle className="h-5 w-5" />}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg">SOS Alert</h3>
                      <p className="text-sm text-muted-foreground">ID: {incident.incident_id}</p>
                    </div>
                    
                    <Badge variant={getStatusColor(incident.status) as any}>
                      {incident.status}
                    </Badge>
                    
                    <Badge variant="outline">
                      {getTimeAgo(incident.created_at)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {incident.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
                        </span>
                        {incident.app_a857ad95a4_tourists?.nationality && (
                          <Badge variant="outline" className="text-xs">
                            {incident.app_a857ad95a4_tourists.nationality}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>Emergency: {incident.app_a857ad95a4_tourists?.emergency_contact || 'N/A'}</span>
                      </div>

                      {incident.description && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Description:</p>
                          <p className="text-sm">{incident.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Location: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Created: {formatDate(incident.created_at)}</span>
                      </div>

                      {incident.resolved_at && (
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span>Resolved: {formatDate(incident.resolved_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {incident.status === 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateIncidentStatus(incident.id, 'Acknowledged')}
                      className="bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20"
                    >
                      Acknowledge
                    </Button>
                  )}
                  
                  {incident.status === 'Acknowledged' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateIncidentStatus(incident.id, 'Resolved')}
                      className="bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                    >
                      Mark Resolved
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredIncidents.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedStatus === 'active' 
                  ? 'No active SOS incidents' 
                  : `No ${selectedStatus} incidents`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SosIncidentsPage;
