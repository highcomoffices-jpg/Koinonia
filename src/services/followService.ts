import { supabase } from '../lib/supabase';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ProfileWithFollowStatus {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  email: string;
  is_following: boolean;
}

class FollowService {
  // S'abonner à un utilisateur
  async follow(followingId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: followingId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  // Se désabonner d'un utilisateur
  async unfollow(followingId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  // Vérifier si l'utilisateur courant suit un autre utilisateur
  async isFollowing(targetUserId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Obtenir le nombre d'abonnés d'un utilisateur
  async getFollowersCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting followers count:', error);
      return 0;
    }
  }

  // Obtenir le nombre d'abonnements d'un utilisateur
  async getFollowingCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  }

  // Obtenir la liste des abonnés d'un utilisateur
  async getFollowers(userId: string): Promise<ProfileWithFollowStatus[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:profiles!follows_follower_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        `)
        .eq('following_id', userId);

      if (error) throw error;

      const followers = data?.map(item => item.follower) || [];
      
      // Ajouter le statut "is_following" pour chaque abonné
      const followersWithStatus: ProfileWithFollowStatus[] = [];
      for (const follower of followers) {
        const isFollowing = currentUser ? await this.isFollowing(follower.id) : false;
        followersWithStatus.push({
          ...follower,
          is_following: isFollowing
        });
      }

      return followersWithStatus;
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  // Obtenir la liste des abonnements d'un utilisateur
  async getFollowing(userId: string): Promise<ProfileWithFollowStatus[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        `)
        .eq('follower_id', userId);

      if (error) throw error;

      const following = data?.map(item => item.following) || [];
      
      // Ajouter le statut "is_following" pour chaque abonnement
      const followingWithStatus: ProfileWithFollowStatus[] = [];
      for (const followed of following) {
        const isFollowing = currentUser ? await this.isFollowing(followed.id) : false;
        followingWithStatus.push({
          ...followed,
          is_following: isFollowing
        });
      }

      return followingWithStatus;
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }
}

export const followService = new FollowService();