import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { EnrichedMessage } from '../services/chatService';

interface UseChatRealtimeProps {
  conversationId: string | null;
  onNewMessage: (message: EnrichedMessage) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onReaction?: (reaction: any) => void;
}

export const useChatRealtime = ({
  conversationId,
  onNewMessage,
  onTyping,
  onReaction,
}: UseChatRealtimeProps) => {
  const messagesChannelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const reactionsChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Canal pour les messages
    messagesChannelRef.current = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role, level')
            .eq('id', payload.new.sender_id)
            .single();

          onNewMessage({
            ...payload.new,
            sender: sender,
            reactions: [],
            isRead: false,
          } as EnrichedMessage);
        }
      )
      .subscribe();

    // Canal pour les réactions
    if (onReaction) {
      reactionsChannelRef.current = supabase
        .channel(`reactions:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message_reactions',
          },
          (payload) => {
            onReaction(payload.new);
          }
        )
        .subscribe();
    }

    // Canal pour l'indicateur "en train d'écrire"
    if (onTyping) {
      typingChannelRef.current = supabase
        .channel(`typing:${conversationId}`)
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          onTyping(payload.userId, payload.isTyping);
        })
        .subscribe();
    }

    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
      }
      if (reactionsChannelRef.current) {
        supabase.removeChannel(reactionsChannelRef.current);
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
    };
  }, [conversationId, onNewMessage, onTyping, onReaction]);

  // Fonction pour envoyer un indicateur "en train d'écrire"
  const sendTyping = async (isTyping: boolean) => {
    if (!conversationId || !typingChannelRef.current) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping },
    });
  };

  return { sendTyping };
};