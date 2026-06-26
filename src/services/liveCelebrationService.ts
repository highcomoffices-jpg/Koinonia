import { supabase } from '../lib/supabase';

export interface LiveCelebration {
  id: string;
  title: string;
  description: string | null;
  stream_url: string;
  organizer_id: string;
  organizer?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  parish_ids: string[];
  parishes?: { id: string; name: string }[];
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  ended_at: string | null;
  live_status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  visibility: 'public' | 'subscribers' | 'parish';
  image_url: string | null;
  viewer_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class LiveCelebrationService {
  // Récupérer tous les lives (en direct, à venir, terminés)
  async getLives(options?: {
    status?: 'scheduled' | 'live' | 'ended';
    limit?: number;
  }): Promise<LiveCelebration[]> {
    try {
      let query = supabase
        .from('live_celebrations')
        .select(`
          *,
          organizer:profiles!organizer_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('scheduled_start', { ascending: true, nullsFirst: false });

      if (options?.status) {
        query = query.eq('live_status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lives:', error);
      return [];
    }
  }

  // Récupérer les lives en direct
  async getLiveNow(): Promise<LiveCelebration[]> {
    return this.getLives({ status: 'live' });
  }

  // Récupérer les lives à venir
  async getUpcomingLives(): Promise<LiveCelebration[]> {
    return this.getLives({ status: 'scheduled' });
  }

  // Récupérer un live par son ID
  async getLiveById(liveId: string): Promise<LiveCelebration | null> {
    try {
      const { data, error } = await supabase
        .from('live_celebrations')
        .select(`
          *,
          organizer:profiles!organizer_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', liveId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching live:', error);
      return null;
    }
  }

  // Créer un live (immédiat ou programmé)
  async createLive(data: {
    title: string;
    description?: string;
    stream_url: string;
    scheduled_start?: Date;
    scheduled_end?: Date;
    visibility?: 'public' | 'subscribers' | 'parish';
    parish_ids?: string[];
    image_url?: string;
  }): Promise<LiveCelebration | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const isImmediate = !data.scheduled_start || new Date(data.scheduled_start) <= now;
      const liveStatus = isImmediate ? 'live' : 'scheduled';
      const startedAt = isImmediate ? now.toISOString() : null;

      const { data: live, error } = await supabase
        .from('live_celebrations')
        .insert({
          title: data.title,
          description: data.description || null,
          stream_url: data.stream_url,
          organizer_id: user.id,
          scheduled_start: data.scheduled_start?.toISOString() || null,
          scheduled_end: data.scheduled_end?.toISOString() || null,
          started_at: startedAt,
          live_status: liveStatus,
          visibility: data.visibility || 'public',
          parish_ids: data.parish_ids || [],
          image_url: data.image_url || null,
          is_active: true,
          viewer_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return live;
    } catch (error) {
      console.error('Error creating live:', error);
      return null;
    }
  }

  // Mettre à jour un live
  async updateLive(liveId: string, updates: Partial<LiveCelebration>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('live_celebrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', liveId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating live:', error);
      return false;
    }
  }

  // Démarrer un live programmé
  async startLive(liveId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('start_live_celebration', { live_id: liveId });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting live:', error);
      return false;
    }
  }

  // Terminer un live
  async endLive(liveId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('end_live_celebration', { live_id: liveId });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ending live:', error);
      return false;
    }
  }

  // Supprimer un live (soft delete)
  async deleteLive(liveId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('live_celebrations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', liveId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting live:', error);
      return false;
    }
  }

  // Incrémenter le compteur de vues
  async incrementViewCount(liveId: string): Promise<void> {
    try {
      await supabase.rpc('increment_live_view_count', { live_id: liveId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }
}

export const liveCelebrationService = new LiveCelebrationService();