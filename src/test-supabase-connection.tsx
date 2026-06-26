import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { geoService } from './services/geoService';

export const TestSupabaseConnection: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Basic Supabase connection
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        
        console.log('Auth session:', authData);

        // Test 2: Fetch some data
        const continents = await geoService.getContinents();
        const countries = await geoService.getCountries();
        const confessions = await geoService.getConfessions();

        setData({
          continents: continents.length,
          countries: countries.length,
          confessions: confessions.length,
          hasSession: !!authData.session,
        });

        setStatus('connected');
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Unknown error');
        console.error('Connection test failed:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Supabase Connection Test</h2>
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong>{' '}
        <span style={{
          color: status === 'connected' ? 'green' : status === 'error' ? 'red' : 'orange',
          fontWeight: 'bold'
        }}>
          {status.toUpperCase()}
        </span>
      </div>

      {status === 'error' && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {status === 'connected' && data && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Data from Supabase:</h3>
          <ul>
            <li>Continents: {data.continents}</li>
            <li>Countries: {data.countries}</li>
            <li>Confessions: {data.confessions}</li>
            <li>Has active session: {data.hasSession ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <strong>Environment Variables:</strong>
        <ul>
          <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}</li>
          <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set (first 20 chars)' : '✗ Missing'} {import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20)}...</li>
        </ul>
      </div>
    </div>
  );
};