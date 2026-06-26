import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';

interface DataCache {
  countries: any[];
  cities: any[];
  confessions: any[];
  parishes: any[];
  posts: any[];
  marketItems: any[];
  services: any[];
  formations: any[];
  groups: any[];
  activities: any[];
  challenges: any[];
  prayerWall: any[];
  biblicalPaths: any[];
  locationMeditations: any[];
  liveCelebrations: any[];
}

interface UseSupabaseDataReturn {
  data: DataCache;
  isLoading: boolean;
  error: string | null;
  refetch: (key?: keyof DataCache) => Promise<void>;
}

// Global cache
let globalDataCache: Partial<DataCache> = {};
let cacheTimestamps: Record<string, number> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSupabaseData = (): UseSupabaseDataReturn => {
  const [data, setData] = useState<DataCache>({
    countries: [],
    cities: [],
    confessions: [],
    parishes: [],
    posts: [],
    marketItems: [],
    services: [],
    formations: [],
    groups: [],
    activities: [],
    challenges: [],
    prayerWall: [],
    biblicalPaths: [],
    locationMeditations: [],
    liveCelebrations: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCacheValid = (key: keyof DataCache): boolean => {
    const timestamp = cacheTimestamps[key];
    return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
  };

  const fetchData = useCallback(async (key?: keyof DataCache) => {
    try {
      const keysToFetch = key ? [key] : (Object.keys(globalDataCache) as (keyof DataCache)[]);

      for (const dataKey of keysToFetch) {
        // Check cache validity
        if (isCacheValid(dataKey) && globalDataCache[dataKey]) {
          setData(prev => ({
            ...prev,
            [dataKey]: globalDataCache[dataKey]
          }));
          continue;
        }

        let fetchedData: any[] = [];

        switch (dataKey) {
          case 'countries':
            fetchedData = await dataService.getCountries();
            break;
          case 'cities':
            fetchedData = await dataService.getCities();
            break;
          case 'confessions':
            fetchedData = await dataService.getConfessions();
            break;
          case 'parishes':
            fetchedData = await dataService.getParishes();
            break;
          case 'posts':
            fetchedData = await dataService.getPosts();
            break;
          case 'marketItems':
            fetchedData = await dataService.getMarketItems();
            break;
          case 'services':
            fetchedData = await dataService.getServices();
            break;
          case 'formations':
            fetchedData = await dataService.getFormations();
            break;
          case 'groups':
            fetchedData = await dataService.getGroups();
            break;
          case 'activities':
            fetchedData = await dataService.getActivities();
            break;
          case 'challenges':
            fetchedData = await dataService.getChallenges();
            break;
          case 'prayerWall':
            fetchedData = await dataService.getPrayerWallEntries();
            break;
          case 'biblicalPaths':
            fetchedData = await dataService.getBiblicalPaths();
            break;
          case 'locationMeditations':
            fetchedData = await dataService.getLocationMeditations();
            break;
          case 'liveCelebrations':
            fetchedData = await dataService.getLiveCelebrations();
            break;
        }

        // Update global cache
        globalDataCache[dataKey] = fetchedData;
        cacheTimestamps[dataKey] = Date.now();

        setData(prev => ({
          ...prev,
          [dataKey]: fetchedData
        }));
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Error fetching Supabase data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};

// Helper hook to get specific data
export const useSupabaseCountries = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { countries: data.countries, isLoading, error, refetch: () => refetch('countries') };
};

export const useSupabaseConfessions = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { confessions: data.confessions, isLoading, error, refetch: () => refetch('confessions') };
};

export const useSupabaseParishes = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { parishes: data.parishes, isLoading, error, refetch: () => refetch('parishes') };
};

export const useSupabaseMarketItems = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { marketItems: data.marketItems, isLoading, error, refetch: () => refetch('marketItems') };
};

export const useSupabaseFormations = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { formations: data.formations, isLoading, error, refetch: () => refetch('formations') };
};

export const useSupabaseGroups = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { groups: data.groups, isLoading, error, refetch: () => refetch('groups') };
};

export const useSupabaseActivities = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { activities: data.activities, isLoading, error, refetch: () => refetch('activities') };
};

export const useSupabasePosts = () => {
  const { data, isLoading, error, refetch } = useSupabaseData();
  return { posts: data.posts, isLoading, error, refetch: () => refetch('posts') };
};
