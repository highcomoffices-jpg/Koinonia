import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ActivityRow = Database['public']['Tables']['activities']['Row'];
type ActivityParticipantRow = Database['public']['Tables']['activity_participants']['Row'];

export interface EnrichedActivity extends ActivityRow {
  parish: {
    id: string;
    name: string;
    confession_id: string;
    city_id: string;
  };
  organizer: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  isRegistered?: boolean;
}

class ActivityService {
  // Récupérer toutes les activités actives (à venir)
  async getActivities(options?: {
    type?: string;
    parishId?: string;
    search?: string;
    dateFilter?: 'all' | 'today' | 'week' | 'month';
    limit?: number;
    offset?: number;
  }): Promise<EnrichedActivity[]> {
    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          parish:parishes(
            id,
            name,
            confession_id,
            city_id
          ),
          organizer:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('date_start', { ascending: true });

      if (options?.type) {
        query = query.eq('activity_type', options.type);
      }

      if (options?.parishId) {
        query = query.eq('parish_id', options.parishId);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Filtre par date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const monthEnd = new Date(today);
      monthEnd.setDate(monthEnd.getDate() + 30);

      switch (options?.dateFilter) {
        case 'today':
          query = query.gte('date_start', today.toISOString())
                       .lt('date_start', tomorrow.toISOString());
          break;
        case 'week':
          query = query.gte('date_start', today.toISOString())
                       .lt('date_start', weekEnd.toISOString());
          break;
        case 'month':
          query = query.gte('date_start', today.toISOString())
                       .lt('date_start', monthEnd.toISOString());
          break;
        default:
          // 'all' ou undefined : uniquement les activités à venir
          query = query.gte('date_start', today.toISOString());
          break;
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EnrichedActivity[];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  // Récupérer une activité par son ID
  async getActivityById(activityId: string): Promise<EnrichedActivity | null> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          parish:parishes(
            id,
            name,
            confession_id,
            city_id
          ),
          organizer:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          participants:activity_participants(
            *,
            user:profiles(
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('id', activityId)
        .single();

      if (error) throw error;
      return data as EnrichedActivity;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return null;
    }
  }

  // Récupérer les activités d'une paroisse
  async getActivitiesByParish(parishId: string): Promise<EnrichedActivity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          parish:parishes(
            id,
            name,
            confession_id,
            city_id
          ),
          organizer:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('parish_id', parishId)
        .eq('is_active', true)
        .gte('date_start', new Date().toISOString())
        .order('date_start', { ascending: true });

      if (error) throw error;
      return data as EnrichedActivity[];
    } catch (error) {
      console.error('Error fetching activities by parish:', error);
      return [];
    }
  }

  // Récupérer les activités auxquelles l'utilisateur est inscrit
  async getUserActivities(userId: string): Promise<EnrichedActivity[]> {
    try {
      // Récupérer les IDs des activités où l'utilisateur est inscrit
      const { data: registrations, error: regError } = await supabase
        .from('activity_participants')
        .select('activity_id')
        .eq('user_id', userId)
        .eq('status', 'registered');

      if (regError) throw regError;
      if (!registrations?.length) return [];

      const activityIds = registrations.map(r => r.activity_id);

      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          parish:parishes(
            id,
            name,
            confession_id,
            city_id
          ),
          organizer:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .in('id', activityIds)
        .eq('is_active', true)
        .order('date_start', { ascending: true });

      if (error) throw error;
      return (data as EnrichedActivity[]).map(a => ({ ...a, isRegistered: true }));
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  // Vérifier si l'utilisateur est inscrit à une activité
  async isUserRegistered(activityId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('activity_participants')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  }

  // S'inscrire à une activité
  async registerForActivity(activityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si déjà inscrit
      const isRegistered = await this.isUserRegistered(activityId, user.id);
      if (isRegistered) return true;

      // Vérifier s'il reste des places
      const { data: activity } = await supabase
        .from('activities')
        .select('max_participants, current_participants')
        .eq('id', activityId)
        .single();

      if (activity?.max_participants && activity.current_participants >= activity.max_participants) {
        throw new Error('Activity is full');
      }

      // Ajouter l'inscription
      const { error: registerError } = await supabase
        .from('activity_participants')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          status: 'registered',
          joined_at: new Date().toISOString(),
        });

      if (registerError) throw registerError;

      // Incrémenter le compteur de participants
      await supabase.rpc('increment_activity_participants', { activity_id: activityId });

      return true;
    } catch (error) {
      console.error('Error registering for activity:', error);
      return false;
    }
  }

  // Se désinscrire d'une activité
  async unregisterFromActivity(activityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('activity_participants')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Décrémenter le compteur de participants
      await supabase.rpc('decrement_activity_participants', { activity_id: activityId });

      return true;
    } catch (error) {
      console.error('Error unregistering from activity:', error);
      return false;
    }
  }

  // Créer une activité (pour les responsables paroissiaux)
  async createActivity(activityData: Omit<ActivityRow, 'id' | 'created_at' | 'updated_at' | 'organizer_id' | 'current_participants'>): Promise<EnrichedActivity | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...activityData,
          organizer_id: user.id,
          current_participants: 0,
          status: 'upcoming',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          parish:parishes(
            id,
            name,
            confession_id,
            city_id
          ),
          organizer:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data as EnrichedActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  // Obtenir les statistiques des activités
  async getActivityStats(): Promise<{
    totalUpcoming: number;
    totalMasses: number;
    totalCharity: number;
    totalParticipants: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('activities')
        .select('activity_type, current_participants')
        .eq('is_active', true)
        .gte('date_start', today.toISOString());

      if (error) throw error;

      const totalUpcoming = data?.length || 0;
      const totalMasses = data?.filter(a => a.activity_type === 'mass').length || 0;
      const totalCharity = data?.filter(a => a.activity_type === 'charity_event').length || 0;
      const totalParticipants = data?.reduce((sum, a) => sum + (a.current_participants || 0), 0) || 0;

      return { totalUpcoming, totalMasses, totalCharity, totalParticipants };
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return { totalUpcoming: 0, totalMasses: 0, totalCharity: 0, totalParticipants: 0 };
    }
  }
}

// Fonctions SQL auxiliaires (à exécuter dans Supabase)
/*
CREATE OR REPLACE FUNCTION increment_activity_participants(activity_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE activities SET current_participants = COALESCE(current_participants, 0) + 1 WHERE id = activity_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_activity_participants(activity_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE activities SET current_participants = GREATEST(COALESCE(current_participants, 0) - 1, 0) WHERE id = activity_id;
END;
$$ LANGUAGE plpgsql;
*/

export const activityService = new ActivityService();