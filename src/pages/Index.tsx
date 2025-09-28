import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Lazy load components for better code splitting
const LoginPage = lazy(() => import('@/components/auth/LoginPage'));
const DashboardLayout = lazy(() => import('@/components/dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('@/components/dashboard/DashboardHome'));
const TouristMonitoring = lazy(() => import('@/components/dashboard/TouristMonitoring'));
const SosIncidentsPage = lazy(() => import('@/components/dashboard/SosIncidentsPage'));

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "Successfully signed in to the admin dashboard",
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleAuthSuccess = () => {
    // Auth state change will handle the user update
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />;
      case 'monitoring':
        return <TouristMonitoring />;
      case 'tourists':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Tourist Records</h2>
            <p className="text-muted-foreground">Tourist records management coming soon...</p>
          </div>
        );
      case 'incidents':
        return <SosIncidentsPage />;
      case 'efirs':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">E-FIR Management</h2>
            <p className="text-muted-foreground">E-FIR management system coming soon...</p>
          </div>
        );
      case 'hazards':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Hazard Management</h2>
            <p className="text-muted-foreground">Hazard management system coming soon...</p>
          </div>
        );
      default:
        return <DashboardHome />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage onAuthSuccess={handleAuthSuccess} />
      </Suspense>
    );
  }

  return (
    <div className="dark min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <DashboardLayout
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        >
          <Suspense fallback={<LoadingFallback />}>
            {renderCurrentView()}
          </Suspense>
        </DashboardLayout>
      </Suspense>
    </div>
  );
};

export default Index;
