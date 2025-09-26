import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Type definitions
interface Incident {
  id: string;
  description: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  resolved_at?: string;
  app_a857ad95a4_tourists?: {
    name: string;
    nationality: string;
    emergency_contact: string;
  };
}

interface Alert {
  id: string;
  message: string;
  severity: string;
  latitude: number;
  longitude: number;
  created_at: string;
  app_a857ad95a4_tourists?: {
    name: string;
    nationality: string;
    emergency_contact: string;
  };
}

interface NotificationItem {
  id: string;
  type: 'incident' | 'sos';
  title: string;
  description: string;
  tourist: string;
  location: string;
  timestamp: Date;
  severity: string;
  data: Incident | Alert;
}

// Extended Audio interface to include our custom method
interface ExtendedAudio extends HTMLAudioElement {
  playBeep?: () => void;
}

interface NotificationSystemProps {
  onIncidentAlert?: (incident: Incident) => void;
  onSosAlert?: (alert: Alert) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  onIncidentAlert, 
  onSosAlert 
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { toast } = useToast();
  const audioRef = useRef<ExtendedAudio | null>(null);
  const previousIncidentsRef = useRef<Set<string>>(new Set());
  const previousAlertsRef = useRef<Set<string>>(new Set());

  // Create audio context for notification sounds
  useEffect(() => {
    // Create audio element for notification sound
    const audio = new Audio() as ExtendedAudio;
    audioRef.current = audio;
    
    // Create a simple beep sound using Web Audio API
    const createBeepSound = () => {
      try {
        if (!window.AudioContext) {
          console.warn('AudioContext not supported');
          return;
        }
        
        const audioContext = new window.AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      } catch (error) {
        console.warn('Audio context not available:', error);
      }
    };

    // Store the function for later use
    if (audioRef.current) {
      audioRef.current.playBeep = createBeepSound;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      if (audioRef.current && audioRef.current.playBeep) {
        audioRef.current.playBeep();
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  // Initialize previous incidents from database
  useEffect(() => {
    const initializePreviousData = async () => {
      try {
        // Get existing incidents
        const { data: incidents } = await supabase
          .from('app_a857ad95a4_incidents')
          .select('id')
          .order('created_at', { ascending: false });

        // Get existing alerts
        const { data: alerts } = await supabase
          .from('app_a857ad95a4_alerts')
          .select('id')
          .order('created_at', { ascending: false });

        // Store existing IDs to avoid notifying for old data
        if (incidents) {
          incidents.forEach(incident => previousIncidentsRef.current.add(incident.id));
        }
        if (alerts) {
          alerts.forEach(alert => previousAlertsRef.current.add(alert.id));
        }
      } catch (error) {
        console.error('Error initializing previous data:', error);
      }
    };

    initializePreviousData();
  }, []);

  // Set up real-time subscriptions for incidents
  useEffect(() => {
    const incidentChannel = supabase
      .channel('admin-incidents-notifications')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'app_a857ad95a4_incidents' 
        },
        async (payload) => {
          console.log('New incident detected:', payload);
          
          // Check if this is truly a new incident
          if (!previousIncidentsRef.current.has(payload.new.id)) {
            previousIncidentsRef.current.add(payload.new.id);
            
            // Fetch full incident details with tourist info
            try {
              const { data: incidentData, error } = await supabase
                .from('app_a857ad95a4_incidents')
                .select(`
                  *,
                  app_a857ad95a4_tourists(name, nationality, emergency_contact)
                `)
                .eq('id', payload.new.id)
                .single();

              if (error) throw error;

              // Play notification sound
              playNotificationSound();

              const touristName = incidentData?.app_a857ad95a4_tourists?.name || 'Unknown Tourist';

              // Show toast notification
              toast({
                title: "🚨 NEW INCIDENT ALERT",
                description: `New incident reported by ${touristName}`,
                variant: "destructive",
                duration: 10000, // Show for 10 seconds
              });

              // Add to notifications list
              const newNotification: NotificationItem = {
                id: payload.new.id,
                type: 'incident',
                title: 'New Incident Report',
                description: incidentData?.description || 'No description provided',
                tourist: touristName,
                location: `${incidentData?.latitude?.toFixed(4)}, ${incidentData?.longitude?.toFixed(4)}`,
                timestamp: new Date(),
                severity: 'high',
                data: incidentData as Incident
              };

              setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep max 10 notifications

              // Call callback if provided
              if (onIncidentAlert) {
                onIncidentAlert(incidentData as Incident);
              }

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification('🚨 New Emergency Incident', {
                  body: `${touristName} reported an incident`,
                  icon: '/favicon.ico',
                  tag: 'incident-' + payload.new.id
                });
              }
            } catch (error) {
              console.error('Error fetching incident details:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incidentChannel);
    };
  }, [toast, onIncidentAlert]);

  // Set up real-time subscriptions for SOS alerts
  useEffect(() => {
    const alertChannel = supabase
      .channel('admin-alerts-notifications')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'app_a857ad95a4_alerts' 
        },
        async (payload) => {
          console.log('New SOS alert detected:', payload);
          
          // Check if this is truly a new alert
          if (!previousAlertsRef.current.has(payload.new.id)) {
            previousAlertsRef.current.add(payload.new.id);
            
            // Fetch full alert details with tourist info
            try {
              const { data: alertData, error } = await supabase
                .from('app_a857ad95a4_alerts')
                .select(`
                  *,
                  app_a857ad95a4_tourists(name, nationality, emergency_contact)
                `)
                .eq('id', payload.new.id)
                .single();

              if (error) throw error;

              const touristName = alertData?.app_a857ad95a4_tourists?.name || 'Unknown Tourist';

              // Play notification sound (louder for SOS)
              playNotificationSound();
              setTimeout(playNotificationSound, 500); // Second beep
              setTimeout(playNotificationSound, 1000); // Third beep

              // Show toast notification
              toast({
                title: "🚨 SOS EMERGENCY ALERT",
                description: `SOS triggered by ${touristName}`,
                variant: "destructive",
                duration: 15000, // Show for 15 seconds
              });

              // Add to notifications list
              const newNotification: NotificationItem = {
                id: payload.new.id,
                type: 'sos',
                title: '🚨 SOS Emergency Alert',
                description: alertData?.message || 'Emergency assistance required',
                tourist: touristName,
                location: `${alertData?.latitude?.toFixed(4)}, ${alertData?.longitude?.toFixed(4)}`,
                timestamp: new Date(),
                severity: alertData?.severity || 'high',
                data: alertData as Alert
              };

              setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);

              // Call callback if provided
              if (onSosAlert) {
                onSosAlert(alertData as Alert);
              }

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification('🚨 SOS EMERGENCY ALERT', {
                  body: `${touristName} needs immediate help!`,
                  icon: '/favicon.ico',
                  tag: 'sos-' + payload.new.id,
                  requireInteraction: true // Keep notification until user interacts
                });
              }
            } catch (error) {
              console.error('Error fetching SOS alert details:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
    };
  }, [toast, onSosAlert]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`shadow-lg border-2 animate-in slide-in-from-right ${
            notification.type === 'sos' 
              ? 'border-red-500 bg-red-50' 
              : 'border-orange-500 bg-orange-50'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {notification.type === 'sos' ? (
                    <AlertOctagon className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <Badge 
                    variant={notification.severity === 'high' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {notification.severity?.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>{notification.tourist}</strong>
                </p>
                
                <p className="text-xs text-muted-foreground mb-2">
                  📍 {notification.location}
                </p>
                
                <p className="text-xs text-muted-foreground">
                  {notification.description}
                </p>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeNotification(notification.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {notifications.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllNotifications}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;