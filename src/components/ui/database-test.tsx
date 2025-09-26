import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Generate a proper UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface DbRecord {
  [key: string]: unknown;
}

const DatabaseTest: React.FC = () => {
  const [incidents, setIncidents] = useState<DbRecord[]>([]);
  const [alerts, setAlerts] = useState<DbRecord[]>([]);
  const [tourists, setTourists] = useState<DbRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testDatabase = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Test incidents table
      console.log('Testing incidents table...');
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('app_a857ad95a4_incidents')
        .select('*')
        .limit(5);
      
      if (incidentsError) {
        console.error('Incidents error:', incidentsError);
        throw incidentsError;
      }
      
      console.log('Incidents data:', incidentsData);
      setIncidents(incidentsData || []);

      // Test alerts table
      console.log('Testing alerts table...');
      const { data: alertsData, error: alertsError } = await supabase
        .from('app_a857ad95a4_alerts')
        .select('*')
        .limit(5);
      
      if (alertsError) {
        console.error('Alerts error:', alertsError);
        throw alertsError;
      }
      
      console.log('Alerts data:', alertsData);
      setAlerts(alertsData || []);

      // Test tourists table
      console.log('Testing tourists table...');
      const { data: touristsData, error: touristsError } = await supabase
        .from('app_a857ad95a4_tourists')
        .select('*')
        .limit(5);
      
      if (touristsError) {
        console.error('Tourists error:', touristsError);
        throw touristsError;
      }
      
      console.log('Tourists data:', touristsData);
      setTourists(touristsData || []);

    } catch (err: unknown) {
      console.error('Database test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTestIncident = async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      // Use current user ID or generate a proper UUID
      const userId = user?.id || generateUUID();
      
      console.log('Using user ID:', userId);
      
      // Create test tourist
      console.log('Creating test tourist...');
      const { data: newTourist, error: createTouristError } = await supabase
        .from('app_a857ad95a4_tourists')
        .insert({
          name: 'Test Tourist',
          nationality: 'Test Country',
          emergency_contact: '+1234567890',
          tourist_id: 'test-tourist-' + Date.now(),
          doc_id: 'DOC123',
          doc_type: 'passport',
          user_id: userId
        })
        .select()
        .single();

      if (createTouristError) throw createTouristError;

      // Create test incident
      console.log('Creating test incident...');
      const { data: incident, error: incidentError } = await supabase
        .from('app_a857ad95a4_incidents')
        .insert({
          description: 'Test incident created at ' + new Date().toLocaleString(),
          status: 'active',
          latitude: 40.7128,
          longitude: -74.0060,
          tourist_id: newTourist.tourist_id,
          incident_id: 'INC-' + Date.now(),
          user_id: userId
        })
        .select()
        .single();

      if (incidentError) throw incidentError;
      
      console.log('Test incident created:', incident);
      
      // Refresh data
      await testDatabase();
      
    } catch (err: unknown) {
      console.error('Create test incident error:', err);
      setError(err instanceof Error ? err.message : 'Error creating test incident');
    } finally {
      setLoading(false);
    }
  };

  const createTestSosAlert = async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      // Use current user ID or generate a proper UUID
      const userId = user?.id || generateUUID();
      
      console.log('Using user ID for SOS:', userId);
      
      // Get or create a test tourist
      let { data: existingTourist } = await supabase
        .from('app_a857ad95a4_tourists')
        .select('*')
        .limit(1)
        .single();

      if (!existingTourist) {
        // Create test tourist if none exists
        const { data: newTourist, error: createTouristError } = await supabase
          .from('app_a857ad95a4_tourists')
          .insert({
            name: 'Emergency Tourist',
            nationality: 'Test Country',
            emergency_contact: '+1234567890',
            tourist_id: 'sos-tourist-' + Date.now(),
            doc_id: 'SOS123',
            doc_type: 'passport',
            user_id: userId
          })
          .select()
          .single();

        if (createTouristError) throw createTouristError;
        existingTourist = newTourist;
      }

      // Create test SOS alert
      console.log('Creating test SOS alert...');
      const { data: alert, error: alertError } = await supabase
        .from('app_a857ad95a4_alerts')
        .insert({
          type: 'SOS',
          message: 'EMERGENCY: Test SOS alert created at ' + new Date().toLocaleString(),
          severity: 'high',
          latitude: 40.7589,
          longitude: -73.9851,
          tourist_id: existingTourist.tourist_id,
          user_id: userId,
          is_read: false
        })
        .select()
        .single();

      if (alertError) throw alertError;
      
      console.log('Test SOS alert created:', alert);
      
      // Refresh data
      await testDatabase();
      
    } catch (err: unknown) {
      console.error('Create test SOS alert error:', err);
      setError(err instanceof Error ? err.message : 'Error creating test SOS alert');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDatabase();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Test Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testDatabase} disabled={loading}>
              {loading ? 'Testing...' : 'Test Database'}
            </Button>
            <Button onClick={createTestIncident} disabled={loading} variant="outline">
              Create Test Incident
            </Button>
            <Button onClick={createTestSosAlert} disabled={loading} variant="destructive">
              Create Test SOS Alert
            </Button>
          </div>
          
          {error && (
            <div className="text-red-600 bg-red-50 p-2 rounded">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Incidents ({incidents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(incidents, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Alerts ({alerts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(alerts, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tourists ({tourists.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(tourists, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;