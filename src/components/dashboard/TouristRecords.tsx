import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, MapPin, Phone, FileText, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tourist {
  id: string;
  tourist_id: string;
  name: string;
  nationality: string;
  doc_type: string;
  doc_id: string;
  emergency_contact: string;
  last_known_location: any;
  created_at: string;
  tourist_code?: string;
  medical_info?: string;
}

interface LocationLog {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address: string | null;
  in_restricted_zone: boolean;
}

const TouristRecords: React.FC = () => {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [filteredTourists, setFilteredTourists] = useState<Tourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
  const [touristLocation, setTouristLocation] = useState<LocationLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTourists();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tourists.filter(tourist =>
        tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tourist.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tourist.tourist_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTourists(filtered);
    } else {
      setFilteredTourists(tourists);
    }
  }, [searchTerm, tourists]);

  const fetchTourists = async () => {
    try {
      const { data, error } = await supabase
        .from('app_a857ad95a4_tourists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTourists(data || []);
      setFilteredTourists(data || []);
    } catch (error) {
      console.error('Error fetching tourists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tourist records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTouristLocation = async (touristId: string) => {
    try {
      const { data, error } = await supabase
        .from('app_a857ad95a4_location_logs')
        .select('*')
        .eq('tourist_id', touristId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('No location found:', error);
        setTouristLocation(null);
        return;
      }

      setTouristLocation(data);
    } catch (error) {
      console.error('Error fetching location:', error);
      setTouristLocation(null);
    }
  };

  const handleViewTourist = async (tourist: Tourist) => {
    setSelectedTourist(tourist);
    await fetchTouristLocation(tourist.tourist_id);
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

  const getLocationStatus = (location: LocationLog | null) => {
    if (!location) return { status: 'unknown', color: 'secondary' };
    
    if (location.in_restricted_zone) {
      return { status: 'restricted', color: 'destructive' };
    }
    
    const timeDiff = Date.now() - new Date(location.timestamp).getTime();
    const hoursAgo = timeDiff / (1000 * 60 * 60);
    
    if (hoursAgo > 6) {
      return { status: 'outdated', color: 'secondary' };
    }
    
    return { status: 'safe', color: 'default' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tourist Records</h1>
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
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Tourist Records</h1>
          <Badge variant="secondary">{filteredTourists.length} tourists</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, nationality, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTourists.map((tourist) => (
              <Card key={tourist.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-semibold text-lg">{tourist.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {tourist.tourist_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nationality</p>
                      <Badge variant="outline">{tourist.nationality}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Document</p>
                      <p className="text-sm font-medium">{tourist.doc_type}: {tourist.doc_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registered</p>
                      <p className="text-sm">{formatDate(tourist.created_at)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTourist(tourist)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}

            {filteredTourists.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No tourists match your search' : 'No tourists registered yet'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tourist Detail Modal */}
      {selectedTourist && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-background shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tourist Profile: {selectedTourist.name}</CardTitle>
            <Button variant="outline" onClick={() => setSelectedTourist(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Name:</span> {selectedTourist.name}</p>
                    <p><span className="text-muted-foreground">Tourist ID:</span> {selectedTourist.tourist_id}</p>
                    <p><span className="text-muted-foreground">Nationality:</span> {selectedTourist.nationality}</p>
                    <p><span className="text-muted-foreground">Document:</span> {selectedTourist.doc_type} - {selectedTourist.doc_id}</p>
                    {selectedTourist.tourist_code && (
                      <p><span className="text-muted-foreground">Tourist Code:</span> {selectedTourist.tourist_code}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Emergency Contact
                  </h3>
                  <p>{selectedTourist.emergency_contact}</p>
                </div>

                {selectedTourist.medical_info && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Medical Information
                    </h3>
                    <p className="text-sm">{selectedTourist.medical_info}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Last Known Location
                  </h3>
                  {touristLocation ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={getLocationStatus(touristLocation).color as any}>
                          {getLocationStatus(touristLocation).status}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Coordinates:</span> 
                        {touristLocation.latitude.toFixed(4)}, {touristLocation.longitude.toFixed(4)}
                      </p>
                      {touristLocation.address && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Address:</span> {touristLocation.address}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="text-muted-foreground">Last Update:</span> {formatDate(touristLocation.timestamp)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No location data available</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Registration Details</h3>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Registered:</span> {formatDate(selectedTourist.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TouristRecords;