import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Calendar, User, AlertCircle, Download, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EFir {
  id: string;
  efir_id: string;
  tourist_id: string;
  user_id: string;
  reason: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  generated_at: string;
  filed_at: string | null;
  created_at: string;
  updated_at: string;
  app_a857ad95a4_tourists?: {
    name: string;
    nationality: string;
  };
}

const EfirManagement: React.FC = () => {
  const [efirs, setEfirs] = useState<EFir[]>([]);
  const [filteredEfirs, setFilteredEfirs] = useState<EFir[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchEfirs();
  }, []);

  useEffect(() => {
    let filtered = efirs;

    if (searchTerm) {
      filtered = filtered.filter(efir =>
        efir.efir_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        efir.tourist_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        efir.app_a857ad95a4_tourists?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        efir.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(efir => efir.status.toLowerCase() === selectedStatus);
    }

    setFilteredEfirs(filtered);
  }, [searchTerm, selectedStatus, efirs]);

  const fetchEfirs = async () => {
    try {
      const { data, error } = await supabase
        .from('app_a857ad95a4_efirs')
        .select(`
          *,
          app_a857ad95a4_tourists (
            name,
            nationality
          )
        `)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setEfirs(data || []);
      setFilteredEfirs(data || []);
    } catch (error) {
      console.error('Error fetching E-FIRs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch E-FIR records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEfirStatus = async (efirId: string, newStatus: string) => {
    try {
      const updates: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'Filed') {
        updates.filed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('app_a857ad95a4_efirs')
        .update(updates)
        .eq('id', efirId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `E-FIR status updated to ${newStatus}`,
      });

      await fetchEfirs();
    } catch (error) {
      console.error('Error updating E-FIR status:', error);
      toast({
        title: "Error",
        description: "Failed to update E-FIR status",
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
      case 'pending': return 'default';
      case 'filed': return 'secondary';
      case 'resolved': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'filed': return <CheckCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusCounts = () => {
    const pending = efirs.filter(e => e.status === 'Pending').length;
    const filed = efirs.filter(e => e.status === 'Filed').length;
    const resolved = efirs.filter(e => e.status === 'Resolved').length;
    return { pending, filed, resolved, total: efirs.length };
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">E-FIR Management</h1>
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
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">E-FIR Management</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total E-FIRs</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filed</p>
                <p className="text-2xl font-bold text-blue-600">{counts.filed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by E-FIR ID, Tourist ID, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              {['all', 'pending', 'filed', 'resolved'].map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEfirs.map((efir) => (
              <Card key={efir.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(efir.status)}
                        <span className="font-mono text-sm font-medium">{efir.efir_id}</span>
                      </div>
                      <Badge variant={getStatusColor(efir.status) as any}>
                        {efir.status}
                      </Badge>
                      {efir.assigned_to && (
                        <Badge variant="outline">
                          Assigned: {efir.assigned_to}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {efir.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
                          </span>
                          {efir.app_a857ad95a4_tourists?.nationality && (
                            <Badge variant="outline" className="text-xs">
                              {efir.app_a857ad95a4_tourists.nationality}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Tourist ID: {efir.tourist_id}</p>
                        <p className="text-sm font-medium">Reason: {efir.reason}</p>
                        {efir.description && (
                          <p className="text-sm text-muted-foreground mt-1">{efir.description}</p>
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Generated:</span>
                          <span>{formatDate(efir.generated_at)}</span>
                        </div>
                        {efir.filed_at && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Filed:</span>
                            <span>{formatDate(efir.filed_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {efir.status === 'Pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEfirStatus(efir.id, 'Filed')}
                      >
                        Mark as Filed
                      </Button>
                    )}
                    {efir.status === 'Filed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEfirStatus(efir.id, 'Resolved')}
                      >
                        Mark as Resolved
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredEfirs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedStatus !== 'all' 
                    ? 'No E-FIRs match your filters' 
                    : 'No E-FIRs generated yet'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EfirManagement;