import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ServiceRow = Database['public']['Tables']['services']['Row'];
type ServiceScheduleRow = Database['public']['Tables']['service_schedules']['Row'];

export interface EnrichedService extends ServiceRow {
  provider: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  schedules: ServiceScheduleRow[];
}

class ServiceService {
  // Récupérer tous les services actifs
  async getServices(options?: {
    type?: string;
    confessionId?: string;
    parishId?: string;
    limit?: number;
    search?: string;
  }): Promise<EnrichedService[]> {
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          provider:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          schedules:service_schedules(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.parishId) {
        query = query.eq('parish_id', options.parishId);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filtrer par confession (côté client car c'est un tableau)
      let services = data as EnrichedService[];
      
      if (options?.confessionId) {
        services = services.filter(s => 
          s.confession_ids?.includes(options.confessionId)
        );
      }

      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  // Récupérer un service par son ID
  async getServiceById(serviceId: string): Promise<EnrichedService | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          schedules:service_schedules(*)
        `)
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return data as EnrichedService;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }

  // Récupérer les services par fournisseur
  async getServicesByProvider(providerId: string): Promise<EnrichedService[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          schedules:service_schedules(*)
        `)
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EnrichedService[];
    } catch (error) {
      console.error('Error fetching services by provider:', error);
      return [];
    }
  }

  // Récupérer les disponibilités (horaires) d'un service
  async getServiceSchedules(serviceId: string): Promise<ServiceScheduleRow[]> {
    try {
      const { data, error } = await supabase
        .from('service_schedules')
        .select('*')
        .eq('service_id', serviceId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching service schedules:', error);
      return [];
    }
  }

  // Créer un service (pour les vignerons/bergers)
  async createService(serviceData: Omit<ServiceRow, 'id' | 'created_at' | 'updated_at' | 'provider_id'>): Promise<EnrichedService | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          provider_id: user.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          provider:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          schedules:service_schedules(*)
        `)
        .single();

      if (error) throw error;
      return data as EnrichedService;
    } catch (error) {
      console.error('Error creating service:', error);
      return null;
    }
  }

  // Ajouter un horaire à un service
  async addServiceSchedule(serviceId: string, scheduleData: Omit<ServiceScheduleRow, 'id' | 'created_at' | 'service_id'>): Promise<ServiceScheduleRow | null> {
    try {
      const { data, error } = await supabase
        .from('service_schedules')
        .insert({
          ...scheduleData,
          service_id: serviceId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding service schedule:', error);
      return null;
    }
  }

  // Mettre à jour un service
  async updateService(serviceId: string, updates: Partial<ServiceRow>): Promise<EnrichedService | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceId)
        .select(`
          *,
          provider:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          schedules:service_schedules(*)
        `)
        .single();

      if (error) throw error;
      return data as EnrichedService;
    } catch (error) {
      console.error('Error updating service:', error);
      return null;
    }
  }

  // Supprimer un service (soft delete)
  async deleteService(serviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', serviceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      return false;
    }
  }

  // Compter le nombre de services par type
  async getServicesCountByType(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('type')
        .eq('is_active', true);

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(service => {
        counts[service.type] = (counts[service.type] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error('Error counting services by type:', error);
      return {};
    }
  }
}

export const serviceService = new ServiceService();