import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  AlertTriangle, 
  FileText, 
  Shield, 
  MapPin, 
  Clock,
  TrendingUp,
  Activity,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalTourists: number;
  activeSOS: number;
  pendingEFIRs: number;
  highRiskAlerts: number;
  recentIncidents: any[];
  recentAlerts: any[];
}

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTourists: 0,
    activeSOS: 0,
    pendingEFIRs: 0,
    highRiskAlerts: 0,
    recentIncidents: [],
    recentAlerts: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up real-time subscriptions
    const incidentsChannel = supabase
      .channel('dashboard-incidents')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'app_a857ad95a4_incidents' },
        () => fetchDashboardStats()
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('dashboard-alerts')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_a857ad95a4_alerts' },
        () => fetchDashboardStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incidentsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch tourists count
      const { count: touristsCount } = await supabase
        .from('app_a857ad95a4_tourists')
        .select('*', { count: 'exact', head: true });

      // Fetch active SOS cases
      const { count: sosCount } = await supabase
        .from('app_a857ad95a4_incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      // Fetch pending E-FIRs
      const { count: efirCount } = await supabase
        .from('app_a857ad95a4_efirs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // Fetch high-risk alerts
      const { count: alertsCount } = await supabase
        .from('app_a857ad95a4_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'high')
        .eq('is_read', false);

      // Fetch recent incidents
      const { data: incidents } = await supabase
        .from('app_a857ad95a4_incidents')
        .select('*, app_a857ad95a4_tourists(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent alerts
      const { data: alerts } = await supabase
        .from('app_a857ad95a4_alerts')
        .select('*, app_a857ad95a4_tourists(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalTourists: touristsCount || 0,
        activeSOS: sosCount || 0,
        pendingEFIRs: efirCount || 0,
        highRiskAlerts: alertsCount || 0,
        recentIncidents: incidents || [],
        recentAlerts: alerts || []
      });

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Tourists',
      value: stats.totalTourists,
      icon: Users,
      color: 'bg-gradient-primary',
      textColor: 'text-primary-foreground'
    },
    {
      title: 'Active SOS Cases',
      value: stats.activeSOS,
      icon: AlertTriangle,
      color: 'bg-gradient-danger',
      textColor: 'text-destructive-foreground'
    },
    {
      title: 'Pending E-FIRs',
      value: stats.pendingEFIRs,
      icon: FileText,
      color: 'bg-gradient-warning',
      textColor: 'text-warning-foreground'
    },
    {
      title: 'High-Risk Alerts',
      value: stats.highRiskAlerts,
      icon: Shield,
      color: 'bg-gradient-success',
      textColor: 'text-success-foreground'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="p-6 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  </div>
                  <div className={`w-16 h-full ${card.color} flex items-center justify-center`}>
                    <Icon className={`h-8 w-8 ${card.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Incidents */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-destructive" />
              Recent Incidents
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {stats.recentIncidents.length} active
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentIncidents.length > 0 ? (
              stats.recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      SOS from {incident.app_a857ad95a4_tourists?.name || 'Unknown Tourist'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {incident.incident_id} • {new Date(incident.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {incident.description || 'Emergency assistance required'}
                    </p>
                  </div>
                  <Badge variant={incident.status === 'Active' ? 'destructive' : 'secondary'} className="text-xs">
                    {incident.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent incidents</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Bell className="h-5 w-5 mr-2 text-warning" />
              Recent Alerts
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {stats.recentAlerts.length} total
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentAlerts.length > 0 ? (
              stats.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.severity === 'high' ? 'bg-destructive' : 
                    alert.severity === 'medium' ? 'bg-warning' : 'bg-success'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {alert.app_a857ad95a4_tourists?.name || 'System Alert'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.type} • {new Date(alert.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                  </div>
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' : 
                    alert.severity === 'medium' ? 'secondary' : 'outline'
                  } className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">View Live Map</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">Emergency Response</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;