import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  MapPin, 
  Clock,
  AlertTriangle,
  User,
  CheckCircle,
  Navigation,
  Heart,
  HelpCircle,
  UserX
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
  };
}

interface SosAlertCardProps {
  alert: SosAlert;
  onUpdate: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const SosAlertCard: React.FC<SosAlertCardProps> = ({ alert, onUpdate }) => {
  const [timeActive, setTimeActive] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const alertTime = new Date(alert.created_at);
      const diff = now.getTime() - alertTime.getTime();
      
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        setTimeActive(`${hours}h ${minutes % 60}m`);
      } else {
        setTimeActive(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [alert.created_at]);

  const getSosTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'medical':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'lost':
        return <HelpCircle className="h-5 w-5 text-orange-500" />;
      case 'harassment':
        return <UserX className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const handleCallTourist = () => {
    // In a real app, this would initiate a call
    toast({
      title: "Calling Tourist",
      description: `Initiating call to ${alert.app_a857ad95a4_tourists?.name}...`,
    });
  };

  const handleCallEmergencyContact = () => {
    toast({
      title: "Calling Emergency Contact",
      description: `Calling emergency contact: ${alert.app_a857ad95a4_tourists?.emergency_contact}`,
    });
  };

  const handleMarkAsResolved = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('app_a857ad95a4_alerts')
        .update({ 
          is_read: true,
          // You might want to add a resolved_at timestamp column
        })
        .eq('id', alert.id);

      if (error) throw error;

      toast({
        title: "SOS Resolved",
        description: "The SOS alert has been marked as resolved",
      });
      
      onUpdate();
    } catch (error: unknown) {
      console.error('Error resolving SOS:', error);
      toast({
        title: "Error",
        description: "Failed to resolve SOS alert",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewLocation = () => {
    // Open map centered on tourist location
    const url = `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="shadow-lg border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-destructive">
                <AvatarFallback className="bg-destructive/10">
                  {getInitials(alert.app_a857ad95a4_tourists?.name || 'Unknown')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
              </div>
            </div>
            
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{alert.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}</span>
                {getSosTypeIcon(alert.type)}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  ID: {alert.app_a857ad95a4_tourists?.tourist_code}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="animate-pulse">
              ACTIVE SOS
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {timeActive}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SOS Details */}
        <div className="bg-background/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">SOS Type:</span>
            <Badge variant="outline" className="capitalize">
              {alert.type || 'General Emergency'}
            </Badge>
          </div>
          <div>
            <span className="font-semibold text-sm block mb-1">Message:</span>
            <p className="text-sm text-muted-foreground">
              {alert.message || 'Emergency assistance required'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Emergency Contact:</span>
            <span className="text-sm font-mono">
              {alert.app_a857ad95a4_tourists?.emergency_contact || 'N/A'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleCallTourist}
            className="flex-1 min-w-[120px]"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Tourist
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleCallEmergencyContact}
            className="flex-1 min-w-[140px]"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Emergency
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleViewLocation}
            className="flex-1 min-w-[120px]"
          >
            <Navigation className="h-4 w-4 mr-2" />
            View Location
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleMarkAsResolved}
            disabled={processing}
            className="flex-1 min-w-[120px]"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {processing ? 'Resolving...' : 'Mark Resolved'}
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex justify-between">
            <span>Nationality: {alert.app_a857ad95a4_tourists?.nationality}</span>
            <span>Alert ID: {alert.id.substring(0, 8)}...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SosAlertCard;