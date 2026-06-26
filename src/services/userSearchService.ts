import { supabase } from '../lib/supabase';
import { userPresenceService, UserStatus } from './userPresenceService';

export interface SearchUserResult {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: string;
  level: string;
  parish_name?: string;
  status?: UserStatus | null;
}

class UserSearchService {
  async searchUsers(query: string, excludeUserId?: string): Promise<SearchUserResult[]> {
    if (!query.trim() || query.length < 2) return [];

    console.log('🔍 Searching users with query:', query);
    console.log('🔍 Excluding user:', excludeUserId);

    try {
      let sql = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          role,
          level,
          parish:parishes!profiles_parish_id_fkey(name)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);

      if (excludeUserId) {
        sql = sql.neq('id', excludeUserId);
      }

      console.log('🔍 SQL query built');

      const { data, error } = await sql;
      
      console.log('🔍 Query response data length:', data?.length);
      console.log('🔍 Query response error:', error);
      
      if (error) throw error;

      const mappedResults = (data || []).map((user) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        role: user.role,
        level: user.level,
        parish_name: user.parish?.name || undefined,
        status: 'offline' as UserStatus, // Valeur par défaut, sera remplacée
      }));

      // Récupérer les statuts en temps réel
      if (mappedResults.length > 0) {
        const userIds = mappedResults.map(u => u.id);
        const statuses = await userPresenceService.getUsersStatuses(userIds);
        
        mappedResults.forEach(user => {
          user.status = statuses[user.id] || 'offline';
        });
      }

      console.log('🔍 Mapped results count:', mappedResults.length);
      
      return mappedResults;
    } catch (error) {
      console.error('❌ Error searching users:', error);
      return [];
    }
  }

  async getRecentUsers(userId: string, limit: number = 10): Promise<SearchUserResult[]> {
    console.log('🔍 Getting recent users for:', userId);
    
    try {
      const { data: convos, error: convError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (convError) throw convError;
      if (!convos?.length) return [];

      console.log('🔍 Found conversations:', convos.length);

      const conversationIds = convos.map(c => c.conversation_id);

      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          user:profiles!conversation_participants_user_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level,
            parish:parishes!profiles_parish_id_fkey(name)
          )
        `)
        .in('conversation_id', conversationIds)
        .neq('user_id', userId)
        .limit(limit);

      if (partError) throw partError;

      console.log('🔍 Recent users found:', participants?.length || 0);

      const mappedResults = (participants || []).map(p => ({
        id: p.user.id,
        first_name: p.user.first_name,
        last_name: p.user.last_name,
        avatar_url: p.user.avatar_url,
        role: p.user.role,
        level: p.user.level,
        parish_name: p.user.parish?.name || undefined,
        status: 'offline' as UserStatus,
      }));

      // Récupérer les statuts en temps réel
      if (mappedResults.length > 0) {
        const userIds = mappedResults.map(u => u.id);
        const statuses = await userPresenceService.getUsersStatuses(userIds);
        
        mappedResults.forEach(user => {
          user.status = statuses[user.id] || 'offline';
        });
      }

      return mappedResults;
    } catch (error) {
      console.error('❌ Error fetching recent users:', error);
      return [];
    }
  }
}

export const userSearchService = new UserSearchService();