import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type GroupRow = Database['public']['Tables']['groups']['Row'];
type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];

export interface EnrichedGroup extends GroupRow {
  creator: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  members?: GroupMemberRow[];
  isMember?: boolean;
  isCreator?: boolean;
  isModerator?: boolean;
}

class GroupService {
  // Récupérer tous les groupes actifs
  async getGroups(options?: {
    type?: string;
    visibility?: string;
    search?: string;
    confessionId?: string;
    limit?: number;
    offset?: number;
  }): Promise<EnrichedGroup[]> {
    try {
      let query = supabase
        .from('groups')
        .select(`
          *,
          creator:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('member_count', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let groups = data as EnrichedGroup[];

      // Filtrer par confession (côté client car c'est un tableau)
      if (options?.confessionId) {
        groups = groups.filter(g => 
          !g.confession_ids || g.confession_ids.length === 0 || 
          g.confession_ids.includes(options.confessionId)
        );
      }

      return groups;
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  // Récupérer un groupe par son ID
  async getGroupById(groupId: string): Promise<EnrichedGroup | null> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          creator:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          members:group_members(
            *,
            user:profiles(
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data as EnrichedGroup;
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  }

  // Récupérer les groupes d'un utilisateur (dont il est membre)
  async getUserGroups(userId: string): Promise<EnrichedGroup[]> {
    try {
      // Récupérer les IDs des groupes dont l'utilisateur est membre
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;
      if (!memberships?.length) return [];

      const groupIds = memberships.map(m => m.group_id);

      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          creator:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .in('id', groupIds)
        .eq('is_active', true);

      if (error) throw error;
      return (data as EnrichedGroup[]).map(g => ({ ...g, isMember: true }));
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  }

  // Vérifier si l'utilisateur est membre d'un groupe
  async isUserMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  // Rejoindre un groupe
  async joinGroup(groupId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si déjà membre
      const isMember = await this.isUserMember(groupId, user.id);
      if (isMember) return true;

      // Vérifier si le groupe n'est pas plein
      const { data: group } = await supabase
        .from('groups')
        .select('max_members, member_count')
        .eq('id', groupId)
        .single();

      if (group?.max_members && group.member_count >= group.max_members) {
        throw new Error('Group is full');
      }

      // Ajouter le membre
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (joinError) throw joinError;

      // Incrémenter le compteur de membres
      await supabase.rpc('increment_group_members', { group_id: groupId });

      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  }

  // Quitter un groupe
  async leaveGroup(groupId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Décrémenter le compteur de membres
      await supabase.rpc('decrement_group_members', { group_id: groupId });

      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  }

  // Créer un groupe
  async createGroup(groupData: {
    name: string;
    description: string;
    type: string;
    visibility: string;
    confession_ids?: string[];
    max_members?: number;
    image_url?: string;
    rules?: string[];
  }): Promise<EnrichedGroup | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('groups')
        .insert({
          ...groupData,
          creator_id: user.id,
          member_count: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          creator:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Ajouter le créateur comme membre
      await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin',
          joined_at: new Date().toISOString(),
        });

      return data as EnrichedGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }

  // Obtenir les statistiques des groupes (CORRIGÉ : mots réservés renommés)
  async getGroupStats(): Promise<{
    total: number;
    publicCount: number;
    privateCount: number;
    secretCount: number;
    totalMembers: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('visibility, member_count')
        .eq('is_active', true);

      if (error) throw error;

      const total = data?.length || 0;
      const publicCount = data?.filter(g => g.visibility === 'public').length || 0;
      const privateCount = data?.filter(g => g.visibility === 'private').length || 0;
      const secretCount = data?.filter(g => g.visibility === 'secret').length || 0;
      const totalMembers = data?.reduce((sum, g) => sum + (g.member_count || 0), 0) || 0;

      return { total, publicCount, privateCount, secretCount, totalMembers };
    } catch (error) {
      console.error('Error getting group stats:', error);
      return { total: 0, publicCount: 0, privateCount: 0, secretCount: 0, totalMembers: 0 };
    }
  }
}

// Fonctions SQL auxiliaires (à exécuter dans Supabase)
/*
CREATE OR REPLACE FUNCTION increment_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups SET member_count = COALESCE(member_count, 0) + 1 WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0) WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;
*/

export const groupService = new GroupService();