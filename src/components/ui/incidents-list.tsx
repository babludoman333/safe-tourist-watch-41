import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Filter,
  ArrowUpDown,
  Eye,
  Edit,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  };
}

interface IncidentsListProps {
  incidents: Incident[];
  loading: boolean;
  onUpdate: () => void;
}

const IncidentsList: React.FC<IncidentsListProps> = ({ incidents, loading, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  const filteredAndSortedIncidents = useMemo(() => {
    let filtered = incidents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.app_a857ad95a4_tourists?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.incident_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    // Sort incidents
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'tourist':
          aValue = a.app_a857ad95a4_tourists?.name || '';
          bValue = b.app_a857ad95a4_tourists?.name || '';
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [incidents, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_review':
        return <Badge variant="default">In Review</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-700">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

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

  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    try {
      const updateData: { status: string; resolved_at?: string } = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('app_a857ad95a4_incidents')
        .update(updateData)
        .eq('id', incidentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Incident status updated to ${newStatus}`,
      });
      
      onUpdate();
    } catch (error: unknown) {
      console.error('Error updating incident status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="tourist">Tourist Name</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{filteredAndSortedIncidents.length} incidents</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
              Incident Reports
            </div>
            <Badge variant="secondary">
              {filteredAndSortedIncidents.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedIncidents.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-foreground">
                          {incident.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          ID: {incident.incident_id}
                        </Badge>
                        {getStatusBadge(incident.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {incident.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {incident.app_a857ad95a4_tourists?.tourist_code}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(incident.created_at)}
                        </span>
                        {incident.resolved_at && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved {formatTimeAgo(incident.resolved_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {incident.status !== 'resolved' && (
                        <div className="flex space-x-1">
                          {incident.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(incident.id, 'in_review')}
                              className="text-xs"
                            >
                              Start Review
                            </Button>
                          )}
                          {incident.status === 'in_review' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(incident.id, 'resolved')}
                              className="text-xs"
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <Button size="sm" variant="ghost" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Incidents Found</h3>
              <p>No incidents match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentsList;