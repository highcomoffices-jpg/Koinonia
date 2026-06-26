import { createService } from './baseService';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Continent = Database['public']['Tables']['continents']['Row'];
type Country = Database['public']['Tables']['countries']['Row'];
type City = Database['public']['Tables']['cities']['Row'];
type Confession = Database['public']['Tables']['confessions']['Row'];
type Parish = Database['public']['Tables']['parishes']['Row'];

export class GeoService {
  private continentsService = createService('continents');
  private countriesService = createService('countries');
  private citiesService = createService('cities');
  private confessionsService = createService('confessions');
  private parishesService = createService('parishes');

  // Continents
  async getContinents(): Promise<Continent[]> {
    try {
      return await this.continentsService.findAll({
        order: { column: 'name', ascending: true },
      });
    } catch (error) {
      console.error('Error fetching continents:', error);
      throw error;
    }
  }

  // Countries
  async getCountries(continentId?: string): Promise<Country[]> {
    try {
      const filters = continentId ? { continent_id: continentId } : undefined;
      return await this.countriesService.findAll({
        filters,
        order: { column: 'name', ascending: true },
      });
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  async getCountryById(id: string): Promise<Country | null> {
    try {
      return await this.countriesService.findById(id);
    } catch (error) {
      console.error(`Error fetching country ${id}:`, error);
      throw error;
    }
  }

  // Cities
  async getCities(countryId?: string): Promise<City[]> {
    try {
      const filters = countryId ? { country_id: countryId } : undefined;
      return await this.citiesService.findAll({
        filters,
        order: { column: 'name', ascending: true },
      });
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  }

  async getCityById(id: string): Promise<City | null> {
    try {
      return await this.citiesService.findById(id);
    } catch (error) {
      console.error(`Error fetching city ${id}:`, error);
      throw error;
    }
  }

  // Confessions
  async getConfessions(): Promise<Confession[]> {
    try {
      return await this.confessionsService.findAll({
        order: { column: 'name', ascending: true },
      });
    } catch (error) {
      console.error('Error fetching confessions:', error);
      throw error;
    }
  }

  async getConfessionById(id: string): Promise<Confession | null> {
    try {
      return await this.confessionsService.findById(id);
    } catch (error) {
      console.error(`Error fetching confession ${id}:`, error);
      throw error;
    }
  }

  // Parishes
  async getParishes(cityId?: string, confessionId?: string): Promise<Parish[]> {
    try {
      const filters: Record<string, any> = {};
      if (cityId) filters.city_id = cityId;
      if (confessionId) filters.confession_id = confessionId;

      return await this.parishesService.findAll({
        filters,
        order: { column: 'name', ascending: true },
      });
    } catch (error) {
      console.error('Error fetching parishes:', error);
      throw error;
    }
  }

  async getParishById(id: string): Promise<Parish | null> {
    try {
      return await this.parishesService.findById(id);
    } catch (error) {
      console.error(`Error fetching parish ${id}:`, error);
      throw error;
    }
  }

  // Complex queries with joins
  async getCountriesWithDetails(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select(`
          *,
          continent:continents(*),
          sub_region:sub_regions(*),
          cities(*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching countries with details:', error);
      throw error;
    }
  }

  async getCitiesWithCountry(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          country:countries(*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cities with country:', error);
      throw error;
    }
  }

  async getParishesWithDetails(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('parishes')
        .select(`
          *,
          confession:confessions(*),
          city:cities(
            *,
            country:countries(*)
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching parishes with details:', error);
      throw error;
    }
  }

  // Search functionality
  async searchCities(query: string, limit = 10): Promise<City[]> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(limit)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching cities:', error);
      throw error;
    }
  }

  async searchParishes(query: string, limit = 10): Promise<Parish[]> {
    try {
      const { data, error } = await supabase
        .from('parishes')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(limit)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching parishes:', error);
      throw error;
    }
  }

  // Get validated parishes only
  async getValidatedParishes(): Promise<Parish[]> {
    try {
      return await this.parishesService.findAll({
        filters: { validated: true },
        order: { column: 'name', ascending: true },
      });
    } catch (error) {
      console.error('Error fetching validated parishes:', error);
      throw error;
    }
  }

  // Get cities by country code
  async getCitiesByCountryCode(countryCode: string): Promise<City[]> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          country:countries(*)
        `)
        .eq('countries.code', countryCode)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching cities for country ${countryCode}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const geoService = new GeoService();

// Utility function to get full location info
export const getFullLocationInfo = async (cityId: string) => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select(`
        *,
        country:countries(
          *,
          continent:continents(*),
          sub_region:sub_regions(*)
        )
      `)
      .eq('id', cityId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error getting full location info for city ${cityId}:`, error);
    return null;
  }
};