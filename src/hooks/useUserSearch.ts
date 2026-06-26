import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SearchUserResult } from '../services/userSearchService';

interface UseUserSearchOptions {
  debounceMs?: number;
  minChars?: number;
  maxResults?: number;
}

export const useUserSearch = (options: UseUserSearchOptions = {}) => {
  const { debounceMs = 300, minChars = 2, maxResults = 20 } = options;
  
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (query: string, excludeUserId?: string) => {
    // Nettoyer le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < minChars) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Debounce : attendre que l'utilisateur arrête de taper
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      
      // Créer un nouveau controller pour cette requête
      abortControllerRef.current = new AbortController();
      
      try {
        let sql = supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, level')
          .or(`first_name.ilike.%${trimmedQuery}%,last_name.ilike.%${trimmedQuery}%,email.ilike.%${trimmedQuery}%`)
          .limit(maxResults);

        if (excludeUserId) {
          sql = sql.neq('id', excludeUserId);
        }

        const { data, error: fetchError } = await sql;
        
        if (fetchError) throw fetchError;
        
        // Typage explicite des résultats
        setResults((data || []) as SearchUserResult[]);
      } catch (err: any) {
        // Ignorer les erreurs d'abandon (normales)
        if (err.name !== 'AbortError') {
          setError(err.message);
          setResults([]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }, debounceMs);
  }, [debounceMs, minChars, maxResults]);

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return { results, isLoading, error, search, clear };
};