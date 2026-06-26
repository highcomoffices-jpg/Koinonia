import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  Post, Country, Confession, Parish, MarketItem,
  Service, Formation, Group, ParishActivity
} from '../types';

export class DataService {
  // Geographic data
  static async getCountries(): Promise<Country[]> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*');

      if (error) throw error;

      return (data || []).map(country => ({
        id: country.id,
        name: country.name,
        code: country.code,
        continent: { id: country.continent_id, name: '', code: '' },
        cities: []
      }));
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw new Error(`Failed to fetch countries: ${handleSupabaseError(error)}`);
    }
  }

  static async getCities(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw new Error(`Failed to fetch cities: ${handleSupabaseError(error)}`);
    }
  }

  static async getConfessions(): Promise<Confession[]> {
    try {
      const { data, error } = await supabase
        .from('confessions')
        .select('*')
        .eq('validated', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(confession => ({
        id: confession.id,
        name: confession.name,
        description: confession.description || '',
        validated: confession.validated || false
      }));
    } catch (error) {
      console.error('Error fetching confessions:', error);
      throw new Error(`Failed to fetch confessions: ${handleSupabaseError(error)}`);
    }
  }

  static async getParishes(): Promise<Parish[]> {
    try {
      const { data, error } = await supabase
        .from('parishes')
        .select('*')
        .eq('validated', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(parish => ({
        id: parish.id,
        name: parish.name,
        confessionId: parish.confession_id,
        cityId: parish.city_id,
        address: parish.address || '',
        validated: parish.validated || false
      }));
    } catch (error) {
      console.error('Error fetching parishes:', error);
      throw new Error(`Failed to fetch parishes: ${handleSupabaseError(error)}`);
    }
  }

  // Social data
  static async getPosts(limit: number = 20): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error(`Failed to fetch posts: ${handleSupabaseError(error)}`);
    }
  }

  // Market data
  static async getMarketItems(limit: number = 50): Promise<MarketItem[]> {
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: Number(item.price) || 0,
        category: item.category,
        condition: item.condition || '',
        imageUrl: item.image_url || '',
        seller: {
          id: item.seller_id,
          firstName: '',
          lastName: '',
          avatar: ''
        },
        location: item.location,
        likes: item.likes || 0,
        isAvailable: item.is_active || false,
        createdAt: new Date(item.created_at || new Date()),
        updatedAt: new Date(item.updated_at || new Date())
      }));
    } catch (error) {
      console.error('Error fetching market items:', error);
      throw new Error(`Failed to fetch market items: ${handleSupabaseError(error)}`);
    }
  }

  // Services data
  static async getServices(limit: number = 20): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw new Error(`Failed to fetch services: ${handleSupabaseError(error)}`);
    }
  }

  // Formations data
  static async getFormations(limit: number = 20): Promise<Formation[]> {
    try {
      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(formation => ({
        id: formation.id,
        title: formation.title,
        description: formation.description,
        category: formation.category,
        price: Number(formation.price) || 0,
        duration: formation.duration,
        maxStudents: formation.max_students || 0,
        currentStudents: formation.current_students || 0,
        rating: Number(formation.rating) || 0,
        reviewsCount: formation.reviews_count || 0,
        imageUrl: formation.image_url || '',
        isActive: formation.is_active,
        createdAt: new Date(formation.created_at),
        updatedAt: new Date(formation.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching formations:', error);
      throw new Error(`Failed to fetch formations: ${handleSupabaseError(error)}`);
    }
  }

  // Groups data
  static async getGroups(limit: number = 20): Promise<Group[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw new Error(`Failed to fetch groups: ${handleSupabaseError(error)}`);
    }
  }

  // Activities data
  static async getActivities(limit: number = 20): Promise<ParishActivity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('is_active', true)
        .order('date_start', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error(`Failed to fetch activities: ${handleSupabaseError(error)}`);
    }
  }

  // Challenges data
  static async getChallenges(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw new Error(`Failed to fetch challenges: ${handleSupabaseError(error)}`);
    }
  }

  // Prayer wall data
  static async getPrayerWallEntries(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('prayer_wall')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching prayer wall entries:', error);
      throw new Error(`Failed to fetch prayer wall entries: ${handleSupabaseError(error)}`);
    }
  }

  // Biblical paths data
  static async getBiblicalPaths(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('biblical_paths')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching biblical paths:', error);
      throw new Error(`Failed to fetch biblical paths: ${handleSupabaseError(error)}`);
    }
  }

  // Location meditations data
  static async getLocationMeditations(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('location_meditations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location meditations:', error);
      throw new Error(`Failed to fetch location meditations: ${handleSupabaseError(error)}`);
    }
  }

  // Live celebrations data
  static async getLiveCelebrations(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('live_celebrations')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching live celebrations:', error);
      throw new Error(`Failed to fetch live celebrations: ${handleSupabaseError(error)}`);
    }
  }
}

export const dataService = new DataService();
