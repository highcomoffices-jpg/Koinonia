import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

// Types pour les réponses enrichies
type BiblicalPathRow = Database['public']['Tables']['biblical_paths']['Row'];
type LocationMeditationRow = Database['public']['Tables']['location_meditations']['Row'];
type PrayerWallRow = Database['public']['Tables']['prayer_wall']['Row'];
type ChallengeRow = Database['public']['Tables']['challenges']['Row'];
type ChallengeParticipantRow = Database['public']['Tables']['challenge_participants']['Row'];
type SpiritualBadgeRow = Database['public']['Tables']['spiritual_badges']['Row'];
type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];

export interface EnrichedBiblicalPath extends BiblicalPathRow {
  author?: { id: string; first_name: string; last_name: string; avatar_url: string | null };
}

export interface EnrichedLocationMeditation extends LocationMeditationRow {
  city?: { id: string; name: string; country_id: string };
  author?: { id: string; first_name: string; last_name: string };
}

export interface EnrichedPrayerWall extends PrayerWallRow {
  author?: { id: string; first_name: string; last_name: string; avatar_url: string | null };
}

export interface EnrichedChallenge extends ChallengeRow {
  participants?: ChallengeParticipantRow[];
  currentCount?: number;
}

export interface SpiritualRanking {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_points: number;
  badges_count: number;
  rank: number;
  spiritual_level: string;
}

class SpiritualityService {
  // ============================================
  // BIBLICAL PATHS
  // ============================================

  async getBiblicalPaths(options?: {
    category?: string;
    difficulty?: string;
    isPremium?: boolean;
    limit?: number;
  }): Promise<EnrichedBiblicalPath[]> {
    try {
      let query = supabase
        .from('biblical_paths')
        .select(`
          *,
          author:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.difficulty) {
        query = query.eq('difficulty', options.difficulty);
      }
      if (options?.isPremium !== undefined) {
        query = query.eq('is_premium', options.isPremium);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EnrichedBiblicalPath[];
    } catch (error) {
      console.error('Error fetching biblical paths:', error);
      return [];
    }
  }

  async getBiblicalPathById(id: string): Promise<EnrichedBiblicalPath | null> {
    try {
      const { data, error } = await supabase
        .from('biblical_paths')
        .select(`
          *,
          author:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EnrichedBiblicalPath;
    } catch (error) {
      console.error('Error fetching biblical path:', error);
      return null;
    }
  }

  async createBiblicalPath(data: Partial<BiblicalPathRow>): Promise<EnrichedBiblicalPath | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: created, error } = await supabase
        .from('biblical_paths')
        .insert({
          ...data,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          author:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return created as EnrichedBiblicalPath;
    } catch (error) {
      console.error('Error creating biblical path:', error);
      return null;
    }
  }

  async updateBiblicalPathProgress(pathId: string, completionRate: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('biblical_paths')
        .update({ completion_rate: completionRate })
        .eq('id', pathId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating biblical path progress:', error);
    }
  }

  // ============================================
  // LOCATION MEDITATIONS
  // ============================================

  async getLocationMeditations(options?: {
    locationType?: string;
    language?: string;
    isPremium?: boolean;
    near?: { lat: number; lng: number; radiusKm?: number };
  }): Promise<EnrichedLocationMeditation[]> {
    try {
      let query = supabase
        .from('location_meditations')
        .select(`
          *,
          city:cities(
            id,
            name,
            country_id
          ),
          author:profiles(
            id,
            first_name,
            last_name
          )
        `);

      if (options?.locationType) {
        query = query.eq('location_type', options.locationType);
      }
      if (options?.language) {
        query = query.eq('language', options.language);
      }
      if (options?.isPremium !== undefined) {
        query = query.eq('is_premium', options.isPremium);
      }

      const { data, error } = await query;
      if (error) throw error;

      let meditations = data as EnrichedLocationMeditation[];

      // Filtrage par proximité (côté client pour l'instant)
      if (options?.near && meditations.length > 0) {
        meditations = meditations.filter(m => {
          if (!m.latitude || !m.longitude) return false;
          const distance = this.calculateDistance(
            options.near!.lat,
            options.near!.lng,
            m.latitude,
            m.longitude
          );
          const radiusKm = options.near?.radiusKm || 10;
          return distance <= radiusKm;
        });
      }

      return meditations;
    } catch (error) {
      console.error('Error fetching location meditations:', error);
      return [];
    }
  }

  async getLocationMeditationById(id: string): Promise<EnrichedLocationMeditation | null> {
    try {
      const { data, error } = await supabase
        .from('location_meditations')
        .select(`
          *,
          city:cities(
            id,
            name,
            country_id
          ),
          author:profiles(
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EnrichedLocationMeditation;
    } catch (error) {
      console.error('Error fetching location meditation:', error);
      return null;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ============================================
  // PRAYER WALL
  // ============================================

  async getPrayerWall(options?: {
    category?: string;
    isAnswered?: boolean;
    isPremium?: boolean;
    limit?: number;
  }): Promise<EnrichedPrayerWall[]> {
    try {
      let query = supabase
        .from('prayer_wall')
        .select(`
          *,
          author:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.isAnswered !== undefined) {
        query = query.eq('is_answered', options.isAnswered);
      }
      if (options?.isPremium !== undefined) {
        query = query.eq('is_premium', options.isPremium);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EnrichedPrayerWall[];
    } catch (error) {
      console.error('Error fetching prayer wall:', error);
      return [];
    }
  }

  async getMyPrayerRequests(): Promise<EnrichedPrayerWall[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('prayer_wall')
        .select(`
          *,
          author:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EnrichedPrayerWall[];
    } catch (error) {
      console.error('Error fetching my prayer requests:', error);
      return [];
    }
  }

  async createPrayerRequest(data: {
    title: string;
    content: string;
    category: string;
    is_anonymous?: boolean;
    target_prayer_count?: number;
  }): Promise<EnrichedPrayerWall | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: created, error } = await supabase
        .from('prayer_wall')
        .insert({
          author_id: user.id,
          title: data.title,
          content: data.content,
          category: data.category,
          is_anonymous: data.is_anonymous || false,
          is_public: true,
          target_prayer_count: data.target_prayer_count || null,
          prayer_count: 0,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          author:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return created as EnrichedPrayerWall;
    } catch (error) {
      console.error('Error creating prayer request:', error);
      return null;
    }
  }

  async prayForRequest(prayerId: string): Promise<void> {
    try {
      // Incrémenter le compteur de prières
      const { error: updateError } = await supabase.rpc('increment_prayer_count', {
        prayer_id: prayerId
      });

      if (updateError) {
        // Fallback si la fonction RPC n'existe pas
        const { data: prayer } = await supabase
          .from('prayer_wall')
          .select('prayer_count')
          .eq('id', prayerId)
          .single();

        if (prayer) {
          await supabase
            .from('prayer_wall')
            .update({ prayer_count: (prayer.prayer_count || 0) + 1 })
            .eq('id', prayerId);
        }
      }
    } catch (error) {
      console.error('Error praying for request:', error);
    }
  }

  // ============================================
  // CHALLENGES
  // ============================================

  async getChallenges(options?: {
    type?: string;
    isActive?: boolean;
    isCompleted?: boolean;
  }): Promise<ChallengeRow[]> {
    try {
      let query = supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }
      if (options?.isCompleted !== undefined) {
        query = query.eq('is_completed', options.isCompleted);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
  }

  async getChallengeById(id: string): Promise<ChallengeRow | null> {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      return null;
    }
  }

  async participateInChallenge(challengeId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si déjà participant
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) return true;

      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Incrémenter le compteur de participants
      await supabase.rpc('increment_challenge_participants', {
        challenge_id: challengeId
      });

      return true;
    } catch (error) {
      console.error('Error participating in challenge:', error);
      return false;
    }
  }

  async getUserChallenges(): Promise<ChallengeParticipantRow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      return [];
    }
  }

  // ============================================
  // BADGES & RANKING
  // ============================================

  async getSpiritualBadges(): Promise<SpiritualBadgeRow[]> {
    try {
      const { data, error } = await supabase
        .from('spiritual_badges')
        .select('*')
        .order('points_value', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching spiritual badges:', error);
      return [];
    }
  }

  async getUserBadges(): Promise<UserBadgeRow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:spiritual_badges(*)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  }

  async getSpiritualRanking(limit: number = 100): Promise<SpiritualRanking[]> {
    try {
      const { data, error } = await supabase
        .from('spiritual_ranking')
        .select('*')
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching spiritual ranking:', error);
      return [];
    }
  }

  async getMyRanking(): Promise<SpiritualRanking | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('spiritual_ranking')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SpiritualRanking || null;
    } catch (error) {
      console.error('Error fetching my ranking:', error);
      return null;
    }
  }
}

// Fonctions SQL auxiliaires (à exécuter dans Supabase)
/*
CREATE OR REPLACE FUNCTION increment_prayer_count(prayer_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE prayer_wall SET prayer_count = prayer_count + 1 WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_challenge_participants(challenge_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE challenges SET participants_count = participants_count + 1 WHERE id = challenge_id;
END;
$$ LANGUAGE plpgsql;
*/

export const spiritualityService = new SpiritualityService();