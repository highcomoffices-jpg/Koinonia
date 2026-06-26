import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type ConversationParticipantRow = Database['public']['Tables']['conversation_participants']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

export interface EnrichedConversation extends ConversationRow {
  participants: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    role: string;
    level: string;
  }[];
  lastMessage?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    type: string;
  };
  unreadCount?: number;
  isPinned?: boolean;
}

export interface EnrichedMessage extends MessageRow {
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    role: string;
    level: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: { id: string; name: string }[];
  }[];
  isRead?: boolean;
}

class ChatService {
  // ============================================
  // CRÉATION DE CONVERSATION DIRECTE
  // ============================================

  async createDirectConversation(otherUserId: string): Promise<EnrichedConversation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si une conversation existe déjà entre ces deux utilisateurs
      const { data: userConversations, error: userConvError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (userConvError) throw userConvError;

      if (userConversations && userConversations.length > 0) {
        const conversationIds = userConversations.map(c => c.conversation_id);
        
        const { data: existingMatch, error: matchError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .eq('user_id', otherUserId)
          .limit(1)
          .maybeSingle();

        if (matchError) throw matchError;
        
        if (existingMatch) {
          // Conversation existante trouvée
          return this.getConversationById(existingMatch.conversation_id);
        }
      }

      // Créer une nouvelle conversation avec created_by
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          is_active: true,
          created_by: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;

      // Ajouter les participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id, joined_at: new Date().toISOString() },
          { conversation_id: conversation.id, user_id: otherUserId, joined_at: new Date().toISOString() },
        ]);

      if (partError) throw partError;

      return this.getConversationById(conversation.id);
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      return null;
    }
  }

  // ============================================
  // CONVERSATIONS UTILISATEUR
  // ============================================

  async getUserConversations(): Promise<EnrichedConversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partError) throw partError;
      if (!participants?.length) return [];

      const conversationIds = participants.map(p => p.conversation_id);

      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      const enrichedConversations: EnrichedConversation[] = [];

      for (const conv of conversations || []) {
        const { data: convParticipants, error: partConvError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            user:profiles(
              id,
              first_name,
              last_name,
              avatar_url,
              role,
              level
            )
          `)
          .eq('conversation_id', conv.id);

        if (partConvError) throw partConvError;

        const { data: lastMsg, error: msgError } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at, type')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (msgError) throw msgError;

        // Compter les messages non lus
        let unreadData = 0;
        try {
          const { data, error: unreadError } = await supabase.rpc('get_unread_count', { 
            p_conversation_id: conv.id, 
            p_user_id: user.id 
          });
          if (!unreadError) unreadData = data || 0;
        } catch (e) {
          console.warn('Error getting unread count:', e);
        }

        enrichedConversations.push({
          ...conv,
          isPinned: conv.is_pinned || false,
          participants: convParticipants?.map(p => p.user) || [],
          lastMessage: lastMsg || undefined,
          unreadCount: unreadData,
        });
      }

      // Trier : épinglés en premier
      enrichedConversations.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });

      return enrichedConversations;
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      return [];
    }
  }

  // ============================================
  // MESSAGES
  // ============================================

  async getMessages(conversationId: string): Promise<EnrichedMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const enrichedMessages: EnrichedMessage[] = [];
      
      for (const msg of data || []) {
        // Récupérer les réactions
        let reactions = [];
        try {
          const { data: reactionsData } = await supabase
            .rpc('get_message_reactions', { message_id: msg.id });
          reactions = reactionsData || [];
        } catch (e) {
          console.warn('Error fetching reactions:', e);
        }

        // Vérifier si le message est lu
        const { data: { user } } = await supabase.auth.getUser();
        let isRead = false;
        if (user) {
          try {
            const { data: readData, error: readError } = await supabase
              .from('message_reads')
              .select('id')
              .eq('message_id', msg.id)
              .eq('user_id', user.id)
              .maybeSingle();
            if (!readError) isRead = !!readData;
          } catch (e) {
            console.warn('Error checking message read:', e);
          }
        }

        enrichedMessages.push({
          ...msg,
          reactions: reactions,
          isRead,
        });
      }

      return enrichedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // ============================================
  // STATUT EN LIGNE
  // ============================================

  async updateUserStatus(status: 'online' | 'offline' | 'away'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.rpc('update_user_status', { p_user_id: user.id, p_new_status: status });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  async getUserStatus(userId: string): Promise<{ status: string; last_seen: string } | null> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('status, last_seen')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  async getUsersStatus(userIds: string[]): Promise<Map<string, { status: string; last_seen: string }>> {
    try {
      if (!userIds.length) return new Map();
      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen')
        .in('user_id', userIds);
      if (error) throw error;
      const map = new Map();
      data?.forEach(item => map.set(item.user_id, { status: item.status, last_seen: item.last_seen }));
      return map;
    } catch (error) {
      console.error('Error fetching users status:', error);
      return new Map();
    }
  }

  // ============================================
  // MESSAGES NON LUS
  // ============================================

  async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      try {
        const { data, error } = await supabase.rpc('get_unread_count', { 
          p_conversation_id: conversationId, 
          p_user_id: user.id 
        });
        if (error) throw error;
        return data || 0;
      } catch (e) {
        console.warn('Error in getUnreadCount RPC:', e);
        return 0;
      }
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.rpc('mark_message_as_read', { message_id: messageId, user_id: user.id });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
      if (messages) {
        for (const msg of messages) {
          await this.markMessageAsRead(msg.id);
        }
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  // ============================================
  // GROUPES
  // ============================================

  async createGroupConversation(name: string, participantIds: string[], imageUrl?: string): Promise<EnrichedConversation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer la conversation avec created_by
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: name,
          is_active: true,
          is_pinned: false,
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }

      const allParticipants = [...new Set([user.id, ...participantIds])];
      
      // Insérer chaque participant un par un
      for (const pid of allParticipants) {
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversation.id,
            user_id: pid,
            joined_at: new Date().toISOString(),
            notifications_enabled: true
          });

        if (partError) {
          console.error('Error adding participant:', pid, partError);
          throw partError;
        }
      }

      return this.getConversationById(conversation.id);
    } catch (error) {
      console.error('Error creating group conversation:', error);
      return null;
    }
  }

  async addParticipantsToGroup(conversationId: string, participantIds: string[]): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const pid of participantIds) {
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversationId,
            user_id: pid,
            joined_at: new Date().toISOString(),
            notifications_enabled: true
          });

        if (partError) {
          console.error('Error adding participant:', pid, partError);
          throw partError;
        }
      }

      return true;
    } catch (error) {
      console.error('Error adding participants:', error);
      return false;
    }
  }

  async getGroupParticipants(conversationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('user_id, user:profiles(id, first_name, last_name, avatar_url)')
        .eq('conversation_id', conversationId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting group participants:', error);
      return [];
    }
  }

  // ============================================
  // ACTIONS SUR LES CONVERSATIONS
  // ============================================

  // Épingler / Désépingler une conversation
  async togglePinConversation(conversationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Récupérer l'état actuel
      const { data: conv, error: getError } = await supabase
        .from('conversations')
        .select('is_pinned')
        .eq('id', conversationId)
        .single();

      if (getError) throw getError;

      const newPinnedState = !conv.is_pinned;

      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: newPinnedState })
        .eq('id', conversationId);

      if (error) throw error;
      return newPinnedState;
    } catch (error) {
      console.error('Error toggling pin conversation:', error);
      return false;
    }
  }

  // Désactiver / Activer les notifications
  async toggleNotifications(conversationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Récupérer l'état actuel
      const { data: participant, error: getError } = await supabase
        .from('conversation_participants')
        .select('notifications_enabled')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (getError) throw getError;

      const newState = !participant.notifications_enabled;

      const { error } = await supabase
        .from('conversation_participants')
        .update({ notifications_enabled: newState })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      return newState;
    } catch (error) {
      console.error('Error toggling notifications:', error);
      return false;
    }
  }

  // Supprimer une conversation (soft delete)
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Signaler une conversation
  async reportConversation(conversationId: string, reason: string, details?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_id: conversationId,
          target_type: 'conversation',
          reason: reason,
          details: details || null,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error reporting conversation:', error);
      return false;
    }
  }

  // ============================================
  // PRIVÉ
  // ============================================

  private async getConversationById(conversationId: string): Promise<EnrichedConversation | null> {
    try {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          user:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .eq('conversation_id', conversationId);

      if (partError) throw partError;

      const { data: lastMsg, error: msgError } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (msgError) throw msgError;

      const { data: { user } } = await supabase.auth.getUser();
      
      let unreadData = 0;
      if (user) {
        try {
          const { data, error: unreadError } = await supabase.rpc('get_unread_count', { 
            p_conversation_id: conversationId, 
            p_user_id: user.id 
          });
          if (!unreadError) unreadData = data || 0;
        } catch (e) {
          console.warn('Error getting unread count in getConversationById:', e);
        }
      }

      return {
        ...conv,
        isPinned: conv.is_pinned || false,
        participants: participants?.map(p => p.user) || [],
        lastMessage: lastMsg || undefined,
        unreadCount: unreadData,
      };
    } catch (error) {
      console.error('Error getting conversation by id:', error);
      return null;
    }
  }

  // ============================================
  // RÉACTIONS
  // ============================================

  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.rpc('add_message_reaction', { message_id: messageId, user_id: user.id, emoji_text: emoji });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.rpc('remove_message_reaction', { message_id: messageId, user_id: user.id, emoji_text: emoji });
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  }

  // ============================================
  // ABONNEMENTS EN TEMPS RÉEL
  // ============================================

  subscribeToPresence(conversationId: string, onPresenceChange: (presence: any) => void) {
    const channel = supabase.channel(`presence:${conversationId}`);
    channel.on('presence', { event: 'sync' }, () => onPresenceChange(channel.presenceState()));
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await channel.track({ user_id: user.id, online_at: new Date() });
      }
    });
    return channel;
  }

  subscribeToReactions(conversationId: string, onReaction: (reaction: any) => void) {
    return supabase
      .channel(`reactions:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, (payload) => onReaction(payload.new))
      .subscribe();
  }

  subscribeToMessages(conversationId: string, onNewMessage: (message: EnrichedMessage) => void) {
    return supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
        const { data: sender } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, role, level').eq('id', payload.new.sender_id).single();
        onNewMessage({ ...payload.new, sender, reactions: [], isRead: false } as EnrichedMessage);
      })
      .subscribe();
  }

  // ============================================
  // ENVOI DE MESSAGES
  // ============================================

  async sendMessage(conversationId: string, content: string, type: string = 'text', mediaUrl?: string): Promise<EnrichedMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
  
      const now = new Date();
      const dateStr = now.toISOString();
  
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          topic: content.substring(0, 100),
          sender_id: user.id,
          content: content,
          type: type,
          media_url: mediaUrl,
          is_edited: false,
          private: false,
          created_at: dateStr,
          // updated_at: NE PAS ENVOYER - la base utilise DEFAULT now()
          // inserted_at: NE PAS ENVOYER - la base utilise DEFAULT now()
        })
        .select(`
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .single();
  
      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }
      
      await this.markMessageAsRead(data.id);
      return data as EnrichedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async sendFileMessage(conversationId: string, file: File, type: string): Promise<EnrichedMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `chat/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('chat-files').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(filePath);
      return this.sendMessage(conversationId, file.name, type, publicUrl);
    } catch (error) {
      console.error('Error sending file message:', error);
      return null;
    }
  }

  async markAsRead(conversationId: string): Promise<void> {
    await this.markConversationAsRead(conversationId);
  }
}

export const chatService = new ChatService();