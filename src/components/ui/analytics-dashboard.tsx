import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  AlertOctagon,
  Users,
  Timer,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  sosAlerts: Array<{
    id: string;
    created_at: string;
    resolved_at?: string;
    response_time_minutes?: number;
    location_area?: string;
  }>;
  incidents: Array<{
    id: string;
    created_at: string;
    resolved_at?: string;
    severity?: string;
    location_area?: string;
    status: string;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  loading: boolean;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316'
};

const PIE_COLORS = [COLORS.danger, COLORS.warning, COLORS.accent, COLORS.primary];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  data, 
  loading, 
  dateRange, 
  onDateRangeChange 
}) => {
  const [viewType, setViewType] = useState<'overview' | 'incidents' | 'response'>('overview');

  const analyticsMetrics = useMemo(() => {
    const now = Date.now();
    const timeRange = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    }[dateRange] || 30 * 24 * 60 * 60 * 1000;

    const cutoffTime = now - timeRange;

    const recentSOS = data.sosAlerts.filter(alert => 
      new Date(alert.created_at).getTime() > cutoffTime
    );
    
    const recentIncidents = data.incidents.filter(incident => 
      new Date(incident.created_at).getTime() > cutoffTime
    );

    // Response time analysis
    const responseTimeData = recentSOS
      .filter(alert => alert.resolved_at && alert.response_time_minutes)
      .map(alert => ({
        date: new Date(alert.created_at).toLocaleDateString(),
        responseTime: alert.response_time_minutes || 0
      }));

    const avgResponseTime = responseTimeData.length > 0 
      ? responseTimeData.reduce((sum, item) => sum + item.responseTime, 0) / responseTimeData.length 
      : 0;

    // Incident frequency by location
    const locationFrequency = [...recentSOS, ...recentIncidents]
      .reduce((acc, event) => {
        const location = event.location_area || 'Unknown Area';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const locationData = Object.entries(locationFrequency)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily incident trends
    const dailyTrends = [...recentSOS, ...recentIncidents]
      .reduce((acc, event) => {
        const date = new Date(event.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, sos: 0, incidents: 0, total: 0 };
        }
        if ('severity' in event) {
          acc[date].incidents++;
        } else {
          acc[date].sos++;
        }
        acc[date].total++;
        return acc;
      }, {} as Record<string, { date: string; sos: number; incidents: number; total: number }>);

    const trendData = Object.values(dailyTrends)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Severity distribution
    const severityData = recentIncidents
      .reduce((acc, incident) => {
        const severity = incident.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const severityChartData = Object.entries(severityData).map(([severity, count]) => ({
      name: severity,
      value: count,
      percentage: ((count / recentIncidents.length) * 100).toFixed(1)
    }));

    // Status distribution
    const statusData = [...recentSOS, ...recentIncidents]
      .reduce((acc, event) => {
        let status = 'active';
        if ('resolved_at' in event && event.resolved_at) {
          status = 'resolved';
        } else if ('status' in event) {
          status = event.status;
        }
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalSOS: recentSOS.length,
      totalIncidents: recentIncidents.length,
      avgResponseTime: Math.round(avgResponseTime),
      activeEmergencies: recentSOS.filter(alert => !alert.resolved_at).length + 
                        recentIncidents.filter(incident => incident.status !== 'resolved').length,
      locationData,
      trendData,
      severityChartData,
      statusData,
      responseTimeData
    };
  }, [data, dateRange]);

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'stable';
    variant?: 'default' | 'danger' | 'warning' | 'success';
  }> = ({ title, value, icon, trend, trendDirection, variant = 'default' }) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'danger':
          return 'border-red-200 bg-red-50';
        case 'warning':
          return 'border-orange-200 bg-orange-50';
        case 'success':
          return 'border-green-200 bg-green-50';
        default:
          return 'border-border bg-background';
      }
    };

    return (
      <Card className={`shadow-soft ${getVariantClasses()}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <div className={`flex items-center text-xs ${
                  trendDirection === 'up' ? 'text-red-500' : 
                  trendDirection === 'down' ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {trend}
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${
              variant === 'danger' ? 'bg-red-100 text-red-600' :
              variant === 'warning' ? 'bg-orange-100 text-orange-600' :
              variant === 'success' ? 'bg-green-100 text-green-600' :
              'bg-muted text-muted-foreground'
            }`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="pt-6">
                <div className="animate-pulse h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Select value={dateRange} onValueChange={onDateRangeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={viewType} onValueChange={(value: 'overview' | 'incidents' | 'response') => setViewType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="incidents">Incidents</SelectItem>
                  <SelectItem value="response">Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="text-xs">
              Analytics for {dateRange}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total SOS Alerts"
          value={analyticsMetrics.totalSOS}
          icon={<AlertOctagon className="h-5 w-5" />}
          variant={analyticsMetrics.totalSOS > 5 ? 'danger' : 'default'}
          trend={analyticsMetrics.totalSOS > 10 ? '+15% from last period' : undefined}
          trendDirection={analyticsMetrics.totalSOS > 10 ? 'up' : 'stable'}
        />

        <StatCard
          title="Total Incidents"
          value={analyticsMetrics.totalIncidents}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={analyticsMetrics.totalIncidents > 10 ? 'warning' : 'default'}
        />

        <StatCard
          title="Avg Response Time"
          value={`${analyticsMetrics.avgResponseTime} min`}
          icon={<Timer className="h-5 w-5" />}
          variant={analyticsMetrics.avgResponseTime > 30 ? 'warning' : 'success'}
        />

        <StatCard
          title="Active Emergencies"
          value={analyticsMetrics.activeEmergencies}
          icon={<Activity className="h-5 w-5" />}
          variant={analyticsMetrics.activeEmergencies > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Trends */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Daily Emergency Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsMetrics.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sos" 
                  stackId="1"
                  stroke={COLORS.danger} 
                  fill={COLORS.danger}
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="incidents" 
                  stackId="1"
                  stroke={COLORS.warning} 
                  fill={COLORS.warning}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Location Hotspots */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Hotspots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsMetrics.locationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Incident Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsMetrics.severityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsMetrics.severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Trends */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Response Time Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsMetrics.responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke={COLORS.secondary} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.secondary }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;