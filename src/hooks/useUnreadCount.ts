import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { supabase } from '../lib/supabase';

interface UseUnreadCountProps {
  conversationId: string;
  enabled?: boolean;
}

export const useUnreadCount = ({ conversationId, enabled = true }: UseUnreadCountProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled || !conversationId) return;
    try {
      const count = await chatService.getUnreadCount(conversationId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, enabled]);

  const markAsRead = useCallback(async () => {
    if (!enabled || !conversationId) return;
    await chatService.markConversationAsRead(conversationId);
    setUnreadCount(0);
  }, [conversationId, enabled]);

  // 🔄 AJOUT : Souscription temps réel aux nouveaux messages
  useEffect(() => {
    if (!enabled || !conversationId) return;

    const channel = supabase
      .channel(`unread:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchUnreadCount(); // Met à jour automatiquement
        }
      )
      .subscribe();

    fetchUnreadCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, enabled, fetchUnreadCount]);

  return { unreadCount, isLoading, markAsRead, refetch: fetchUnreadCount };
};