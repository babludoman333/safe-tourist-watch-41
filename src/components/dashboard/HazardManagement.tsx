import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus, MapPin, Calendar, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Hazard {
  id: string;
  type: string;
  message: string;
  severity: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface RestrictedZone {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  coordinates: any;
  is_active: boolean;
  created_at: string;
}

const HazardManagement: React.FC = () => {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [restrictedZones, setRestrictedZones] = useState<RestrictedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hazards' | 'zones'>('hazards');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hazardsResult, zonesResult] = await Promise.all([
        supabase
          .from('app_a857ad95a4_hazards')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('app_a857ad95a4_restricted_zones')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (hazardsResult.error) throw hazardsResult.error;
      if (zonesResult.error) throw zonesResult.error;

      setHazards(hazardsResult.data || []);
      setRestrictedZones(zonesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hazard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isHazardActive = (hazard: Hazard) => {
    if (!hazard.is_active) return false;
    if (!hazard.expires_at) return true;
    return new Date(hazard.expires_at) > new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Hazard Management</h1>
        </div>
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
          <AlertTriangle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Hazard Management</h1>
        </div>
        <Button className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add New Hazard
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'hazards' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('hazards')}
          className="px-6"
        >
          Active Hazards ({hazards.filter(h => isHazardActive(h)).length})
        </Button>
        <Button
          variant={activeTab === 'zones' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('zones')}
          className="px-6"
        >
          Restricted Zones ({restrictedZones.filter(z => z.is_active).length})
        </Button>
      </div>

      {/* Hazards Tab */}
      {activeTab === 'hazards' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {hazards.map((hazard) => (
              <Card key={hazard.id} className={`transition-all hover:shadow-md ${!isHazardActive(hazard) ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${hazard.severity === 'high' ? 'bg-destructive/10 text-destructive' : 
                        hazard.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted'}`}>
                        {getSeverityIcon(hazard.severity)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg capitalize">{hazard.type.replace('_', ' ')}</h3>
                          <Badge variant={getSeverityColor(hazard.severity) as any}>
                            {hazard.severity} severity
                          </Badge>
                          <Badge variant={isHazardActive(hazard) ? 'default' : 'secondary'}>
                            {isHazardActive(hazard) ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground">{hazard.message}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{hazard.latitude.toFixed(4)}, {hazard.longitude.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Radius: {hazard.radius_km} km</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {formatDate(hazard.created_at)}</span>
                          </div>
                          {hazard.expires_at && (
                            <div className="flex items-center space-x-1">
                              <span>Expires: {formatDate(hazard.expires_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View on Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hazards.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hazards reported</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Restricted Zones Tab */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {restrictedZones.map((zone) => (
              <Card key={zone.id} className={`transition-all hover:shadow-md ${!zone.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${zone.severity === 'high' ? 'bg-destructive/10 text-destructive' : 
                        zone.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted'}`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{zone.name}</h3>
                          <Badge variant={getSeverityColor(zone.severity) as any}>
                            {zone.severity} risk
                          </Badge>
                          <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                            {zone.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        {zone.description && (
                          <p className="text-muted-foreground">{zone.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {formatDate(zone.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Coordinates: {Array.isArray(zone.coordinates) ? zone.coordinates.length : 0} points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {restrictedZones.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No restricted zones defined</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HazardManagement;