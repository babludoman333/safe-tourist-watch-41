import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', badge: null },
    { icon: MapPin, label: 'Tourist Monitoring', path: '/dashboard/monitoring', badge: null },
    { icon: Users, label: 'Tourist Records', path: '/dashboard/tourists', badge: null },
    { icon: Shield, label: 'SOS Incidents', path: '/dashboard/sos', badge: '3' },
    { icon: FileText, label: 'E-FIR Management', path: '/dashboard/efir', badge: '2' },
    { icon: AlertTriangle, label: 'Hazard Management', path: '/dashboard/hazards', badge: null },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out z-50`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sidebar-foreground font-bold text-lg">SafeTravel</h1>
              <p className="text-sidebar-foreground/70 text-sm">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-soft' 
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 mr-3 transition-colors ${
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="destructive" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 shadow-soft">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {menuItems.find(item => item.path === currentPath)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Real-time tourism safety monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;