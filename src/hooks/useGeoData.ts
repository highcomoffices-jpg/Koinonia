import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Country {
  id: string;
  name: string;
  code: string;
  continent_id: string;
}

interface City {
  id: string;
  name: string;
  country_id: string;
}

interface Continent {
  id: string;
  name: string;
  code: string;
}

interface Confession {
  id: string;
  name: string;
  description: string;
  validated: boolean;
}

interface Parish {
  id: string;
  name: string;
  confession_id: string;
  city_id: string;
  address: string;
  validated: boolean;
}

export const useGeoData = () => {
  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [isLoading, setIsLoading] = useState({
    continents: true,
    countries: true,
    cities: false,
    confessions: true,
    parishes: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Load continents
  useEffect(() => {
    const loadContinents = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('continents')
          .select('*')
          .order('name');

        if (supabaseError) throw supabaseError;
        setContinents(data || []);
      } catch (err: any) {
        console.error('Error loading continents:', err);
        setError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, continents: false }));
      }
    };
    loadContinents();
  }, []);

  // Load all countries
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('countries')
          .select('*')
          .order('name');

        if (supabaseError) throw supabaseError;
        setCountries(data || []);
        setFilteredCountries(data || []);
      } catch (err: any) {
        console.error('Error loading countries:', err);
        setError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, countries: false }));
      }
    };
    loadCountries();
  }, []);

  // Load confessions
  useEffect(() => {
    const loadConfessions = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('confessions')
          .select('*')
          .eq('validated', true)
          .order('name');

        if (supabaseError) throw supabaseError;
        setConfessions(data || []);
      } catch (err: any) {
        console.error('Error loading confessions:', err);
        setError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, confessions: false }));
      }
    };
    loadConfessions();
  }, []);

  // Load all parishes initially
  useEffect(() => {
    const loadParishes = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('parishes')
          .select('*')
          .eq('validated', true)
          .order('name');

        if (supabaseError) throw supabaseError;
        setParishes(data || []);
      } catch (err: any) {
        console.error('Error loading parishes:', err);
        setError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, parishes: false }));
      }
    };
    loadParishes();
  }, []);

  // Filtrer les pays par continent
  const loadCountriesByContinent = useCallback((continentId: string) => {
    if (!continentId) {
      setFilteredCountries(countries);
      return;
    }
    const filtered = countries.filter(c => c.continent_id === continentId);
    setFilteredCountries(filtered);
    // Reset cities when continent changes
    setCities([]);
    setFilteredCities([]);
  }, [countries]);

  // Load cities by country
  const loadCitiesByCountry = useCallback(async (countryId: string) => {
    if (!countryId) {
      setCities([]);
      setFilteredCities([]);
      return;
    }
    
    try {
      setIsLoading(prev => ({ ...prev, cities: true }));
      const { data, error: supabaseError } = await supabase
        .from('cities')
        .select('*')
        .eq('country_id', countryId)
        .order('name');

      if (supabaseError) throw supabaseError;
      setCities(data || []);
      setFilteredCities(data || []);
    } catch (err: any) {
      console.error('Error loading cities:', err);
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, cities: false }));
    }
  }, []);

  // Rechercher des pays par nom (autocomplétion)
  const searchCountries = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setFilteredCountries(countries);
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('countries')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(20);

      if (supabaseError) throw supabaseError;
      setFilteredCountries(data || []);
    } catch (err: any) {
      console.error('Error searching countries:', err);
      setError(err.message);
    }
  }, [countries]);

  // Rechercher une ville par nom (autocomplétion)
  const searchCities = useCallback(async (searchTerm: string, countryId?: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      if (countryId) {
        await loadCitiesByCountry(countryId);
      } else {
        setFilteredCities(cities);
      }
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, cities: true }));
      let query = supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(20);

      if (countryId) {
        query = query.eq('country_id', countryId);
      }

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;
      setFilteredCities(data || []);
    } catch (err: any) {
      console.error('Error searching cities:', err);
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, cities: false }));
    }
  }, [cities, loadCitiesByCountry]);

  // Rechercher des confessions par nom (autocomplétion)
  const searchConfessions = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('confessions')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('validated', true)
        .order('name')
        .limit(20);

      if (supabaseError) throw supabaseError;
      setConfessions(data || []);
    } catch (err: any) {
      console.error('Error searching confessions:', err);
      setError(err.message);
    }
  }, []);

  // Load parishes filtered by city and confession
  const loadParishesByCityAndConfession = useCallback(async (cityId?: string, confessionId?: string) => {
    try {
      setIsLoading(prev => ({ ...prev, parishes: true }));
      
      let query = supabase.from('parishes').select('*');
      
      if (cityId) {
        query = query.eq('city_id', cityId);
      }
      if (confessionId) {
        query = query.eq('confession_id', confessionId);
      }
      
      const { data, error: supabaseError } = await query.eq('validated', true).order('name');

      if (supabaseError) throw supabaseError;
      setParishes(data || []);
    } catch (err: any) {
      console.error('Error loading parishes:', err);
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, parishes: false }));
    }
  }, []);

  // Rechercher des paroisses par nom (autocomplétion)
  const searchParishes = useCallback(async (searchTerm: string, cityId?: string, confessionId?: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      await loadParishesByCityAndConfession(cityId, confessionId);
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, parishes: true }));
      
      let query = supabase
        .from('parishes')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('validated', true)
        .order('name')
        .limit(20);
      
      if (cityId) {
        query = query.eq('city_id', cityId);
      }
      if (confessionId) {
        query = query.eq('confession_id', confessionId);
      }

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;
      setParishes(data || []);
    } catch (err: any) {
      console.error('Error searching parishes:', err);
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, parishes: false }));
    }
  }, [loadParishesByCityAndConfession]);

  const allLoading = Object.values(isLoading).some(value => value);

  return {
    continents,
    countries: filteredCountries,
    allCountries: countries,
    cities: filteredCities,
    allCities: cities,
    confessions,
    parishes,
    isLoading: allLoading,
    isLoadingContinents: isLoading.continents,
    isLoadingCountries: isLoading.countries,
    isLoadingCities: isLoading.cities,
    isLoadingConfessions: isLoading.confessions,
    isLoadingParishes: isLoading.parishes,
    error,
    loadCountriesByContinent,
    loadCitiesByCountry,
    searchCountries,
    searchCities,
    searchConfessions,
    searchParishes,
    loadParishesByCityAndConfession,
    getCountryById: (id: string) => countries.find(c => c.id === id),
    getCityById: (id: string) => cities.find(c => c.id === id),
    getConfessionById: (id: string) => confessions.find(c => c.id === id),
    getParishById: (id: string) => parishes.find(p => p.id === id),
  };
};