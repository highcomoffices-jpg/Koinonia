import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✓ Set' : '✗ Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓ Set' : '✗ Missing'
  });
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'koinonia-supabase-auth',
  },
  global: {
    headers: {
      'x-application-name': 'koinonia',
      'x-app-version': '1.0.0',
    },
  },
});

// 🔧 DEBUG TEMPORAIRE : Exposer supabase dans la console pour diagnostic
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('🔧 DEBUG: supabase exposé globalement pour diagnostic');
}

// Helper functions
export const getSupabase = () => supabase;

// Error handling utility
export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.code) {
    switch (error.code) {
      case '23505':
        return 'Cette valeur existe déjà';
      case '23503':
        return 'Référence introuvable';
      case '42501':
        return 'Accès non autorisé';
      default:
        return `Erreur (${error.code}): ${error.message || 'Une erreur est survenue'}`;
    }
  }
  
  return 'Une erreur est survenue lors de l\'opération';
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// Get user profile with error handling
export const getCurrentUserProfile = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Type guards
export const isSupabaseError = (error: any): error is { message: string; code?: string } => {
  return error && typeof error === 'object' && 'message' in error;
};
