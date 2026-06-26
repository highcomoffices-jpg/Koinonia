import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ParishRow = Database['public']['Tables']['parishes']['Row'];
type ParishInsert = Database['public']['Tables']['parishes']['Insert'];
type ParishUpdate = Database['public']['Tables']['parishes']['Update'];

export interface EnrichedParish extends ParishRow {
  city_name?: string;
  confession_name?: string;
  member_count?: number;
  isUserParish?: boolean;
}

class ParishService {
  // Récupérer toutes les paroisses avec leurs relations
  async getParishes(options?: {
    cityId?: string;
    confessionId?: string;
    search?: string;
    validated?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<EnrichedParish[]> {
    try {
      let query = supabase
        .from('parishes')
        .select(`
          *,
          city:cities(name),
          confession:confessions(name)
        `)
        .order('name', { ascending: true });

      if (options?.cityId) {
        query = query.eq('city_id', options.cityId);
      }

      if (options?.confessionId) {
        query = query.eq('confession_id', options.confessionId);
      }

      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,address.ilike.%${options.search}%`);
      }

      if (options?.validated !== undefined) {
        query = query.eq('validated', options.validated);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Enrichir avec les noms des relations
      const parishes = await Promise.all((data || []).map(async p => {
        // Compter les membres réels
        const { count: memberCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('parish_id', p.id);
        
        return {
          ...p,
          city_name: (p.city as any)?.name,
          confession_name: (p.confession as any)?.name,
          member_count: memberCount || 0
        } as EnrichedParish;
      }));

      return parishes;
    } catch (error) {
      console.error('Error fetching parishes:', error);
      return [];
    }
  }

  // Récupérer une paroisse par son ID
  async getParishById(parishId: string): Promise<EnrichedParish | null> {
    try {
      const { data, error } = await supabase
        .from('parishes')
        .select(`
          *,
          city:cities(name),
          confession:confessions(name)
        `)
        .eq('id', parishId)
        .single();

      if (error) throw error;
      
      // Compter les membres réels
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('parish_id', parishId);
      
      // Compter les événements réels
      const { count: eventsCount } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('parish_id', parishId);
      
      return {
        ...data,
        city_name: (data.city as any)?.name,
        confession_name: (data.confession as any)?.name,
        member_count: memberCount || 0,
        events_count: eventsCount || 0
      } as EnrichedParish;
    } catch (error) {
      console.error('Error fetching parish:', error);
      return null;
    }
  }

  // Récupérer la paroisse de l'utilisateur connecté
  async getUserParish(): Promise<EnrichedParish | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('parish_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.parish_id) return null;

      return this.getParishById(profile.parish_id);
    } catch (error) {
      console.error('Error fetching user parish:', error);
      return null;
    }
  }

  // Proposer une nouvelle paroisse
  async proposeParish(parishData: {
    name: string;
    confession_id: string;
    city_id: string;
    address?: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
  }): Promise<ParishRow | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('parishes')
        .insert({
          name: parishData.name,
          confession_id: parishData.confession_id,
          city_id: parishData.city_id,
          address: parishData.address || null,
          description: parishData.description || null,
          phone: parishData.phone || null,
          email: parishData.email || null,
          website: parishData.website || null,
          validated: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error proposing parish:', error);
      return null;
    }
  }

  // Mettre à jour une paroisse existante
  async updateParish(parishId: string, updates: {
    name?: string;
    address?: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
  }): Promise<ParishRow | null> {
    try {
      const { data, error } = await supabase
        .from('parishes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', parishId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating parish:', error);
      return null;
    }
  }

  // Rejoindre une paroisse (mettre à jour le profil utilisateur)
  async joinParish(parishId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ parish_id: parishId, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error joining parish:', error);
      return false;
    }
  }

  // Quitter sa paroisse
  async leaveParish(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ parish_id: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving parish:', error);
      return false;
    }
  }

  // Obtenir les statistiques des paroisses
  async getParishStats(): Promise<{
    total: number;
    byConfession: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('parishes')
        .select('confession_id')
        .eq('validated', true);

      if (error) throw error;

      const byConfession: Record<string, number> = {};
      data?.forEach(p => {
        byConfession[p.confession_id] = (byConfession[p.confession_id] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        byConfession
      };
    } catch (error) {
      console.error('Error getting parish stats:', error);
      return { total: 0, byConfession: {} };
    }
  }
}

export const parishService = new ParishService();